import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { pool } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getLogger } from "@/lib/logger";

export const runtime = "nodejs";

type CartItem = {
  variantId: number;
  quantity: number;
};

type CheckoutPayload = {
  items: CartItem[];
};

type ErrorDetails = Record<string, unknown> | undefined;
type LoggableError = { code: string; message: string; details?: ErrorDetails };

function respondError(params: {
  requestId: string;
  status: number;
  code: string;
  message: string;
  details?: ErrorDetails;
  log: ReturnType<typeof getLogger>;
}) {
  const { requestId, status, code, message, details, log } = params;
  const payload = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    requestId,
  };

  const logPayload: LoggableError = { code, message, details };
  if (status >= 500) {
    log.error(logPayload, message);
  } else {
    log.warn(logPayload, message);
  }

  return NextResponse.json(payload, { status });
}

export async function POST(req: Request) {
  const requestId = randomUUID();
  const log = getLogger(requestId);
  const includeStack =
    process.env.NODE_ENV === "development" &&
    process.env.LOG_STACK === "true";

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : NaN;

    if (!session || Number.isNaN(userId)) {
      return respondError({
        requestId,
        status: 401,
        code: "UNAUTHORIZED",
        message: "Usuario nao autenticado",
        log,
      });
    }

    const body = (await req.json()) as CheckoutPayload;
    const { items } = body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return respondError({
        requestId,
        status: 400,
        code: "INVALID_INPUT",
        message: "items sao obrigatorios",
        log,
      });
    }

    const quantityByVariant = new Map<number, number>();
    for (const item of items) {
      if (!item?.variantId || !item?.quantity || item.quantity <= 0) {
        return respondError({
          requestId,
          status: 400,
          code: "INVALID_INPUT",
          message: "Itens invalidos",
          log,
        });
      }

      const current = quantityByVariant.get(item.variantId) ?? 0;
      quantityByVariant.set(item.variantId, current + item.quantity);
    }

    const variantIds = Array.from(quantityByVariant.keys());

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userCheck = await client.query<{ id: number }>(
        `SELECT id FROM users WHERE id = $1`,
        [userId]
      );

      if (userCheck.rowCount === 0) {
        return respondError({
          requestId,
          status: 404,
          code: "USER_NOT_FOUND",
          message: "Usuario nao encontrado",
          log,
        });
      }

      type VariantRow = {
        variant_id: number;
        stock_quantity: number;
        base_price: string;
        sku: string;
      };

      const rows: VariantRow[] = (
        await client.query<VariantRow>(
        `
          SELECT
            v.id AS variant_id,
            v.stock_quantity,
            p.base_price,
            v.sku
          FROM product_variants v
          JOIN products p ON p.id = v.product_id
          WHERE v.id = ANY($1::int[])
          FOR UPDATE
        `,
        [variantIds]
        )
      ).rows;

      if (rows.length !== variantIds.length) {
        const found = new Set(rows.map((row) => row.variant_id));
        const missingVariantIds = variantIds.filter((id) => !found.has(id));

        return respondError({
          requestId,
          status: 404,
          code: "VARIANTS_NOT_FOUND",
          message: "Algumas variacoes nao existem",
          details: { missingVariantIds },
          log,
        });
      }

      let totalCents = 0;
      const itemsToInsert: Array<{
        variantId: number;
        quantity: number;
        priceAtPurchase: string;
        sku: string;
      }> = [];

      for (const row of rows) {
        const quantity = quantityByVariant.get(row.variant_id) ?? 0;
        const priceNumber = Number(row.base_price);
        const priceCents = Math.round(priceNumber * 100);

        if (row.stock_quantity < quantity) {
          return respondError({
            requestId,
            status: 409,
            code: "OUT_OF_STOCK",
            message: "Estoque insuficiente",
            details: {
              variantId: row.variant_id,
              sku: row.sku,
              available: row.stock_quantity,
              requested: quantity,
            },
            log,
          });
        }

        totalCents += priceCents * quantity;
        itemsToInsert.push({
          variantId: row.variant_id,
          quantity,
          priceAtPurchase: priceNumber.toFixed(2),
          sku: row.sku,
        });
      }

      const totalAmount = (totalCents / 100).toFixed(2);

      const orderRes = await client.query<{ id: number }>(
        `
          INSERT INTO orders (user_id, total_amount, status, created_at)
          VALUES ($1, $2, $3, NOW())
          RETURNING id
        `,
        [userId, totalAmount, "pending"]
      );

      const orderId = orderRes.rows[0].id;

      const values: string[] = [];
      const params: Array<number | string> = [];
      let paramIndex = 1;

      for (const item of itemsToInsert) {
        values.push(
          `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
        );
        params.push(orderId, item.variantId, item.quantity, item.priceAtPurchase);
      }

      await client.query(
        `
          INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase)
          VALUES ${values.join(", ")}
        `,
        params
      );

      for (const item of itemsToInsert) {
        await client.query(
          `UPDATE product_variants
           SET stock_quantity = stock_quantity - $1
           WHERE id = $2`,
          [item.quantity, item.variantId]
        );
      }

      // Integracao futura com gateway (ex: Mercado Pago)
      // - Criar preferencia de pagamento
      // - Retornar link/QR para o frontend
      // - Atualizar status do pedido apos confirmacao

      await client.query("COMMIT");

      log.info(
        {
          orderId,
          totalAmount,
          items: itemsToInsert.length,
        },
        "Checkout criado"
      );

      return NextResponse.json({
        ok: true,
        orderId,
        totalAmount,
        requestId,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    log.error(
      includeStack ? { err: error, stack: error.stack } : { err: error.message },
      "Erro ao processar checkout"
    );
    return respondError({
      requestId,
      status: 500,
      code: "CHECKOUT_FAILED",
      message: "Erro ao processar checkout",
      log,
      details: includeStack ? { stack: error.stack } : undefined,
    });
  }
}
