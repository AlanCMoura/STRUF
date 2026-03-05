import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getLogger } from "@/lib/logger";

type CreateVariantPayload = {
  sku?: string;
  size?: string;
  color?: string;
  stockQuantity?: number;
};

const ALLOWED_SIZES = new Set(["PP", "P", "M", "G", "GG"]);

function parseStockQuantity(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  const parsed = Math.trunc(value);
  if (parsed < 0) {
    return null;
  }
  return parsed;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = randomUUID();
  const log = getLogger(requestId);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Usuario nao autenticado" }, requestId },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Acesso negado" }, requestId },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = Number.parseInt(id, 10);
    if (!Number.isFinite(productId) || productId <= 0) {
      return NextResponse.json(
        { error: { code: "INVALID_PRODUCT_ID", message: "Produto invalido" }, requestId },
        { status: 400 }
      );
    }

    const body = (await req.json()) as CreateVariantPayload;
    const sku = body.sku?.trim().toUpperCase() ?? "";
    const size = body.size?.trim().toUpperCase() ?? "";
    const color = body.color?.trim() ?? "";
    const stockQuantity = parseStockQuantity(body.stockQuantity);

    if (!sku || !size || !color || stockQuantity === null) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "SKU, tamanho, cor e estoque sao obrigatorios",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_SIZES.has(size)) {
      return NextResponse.json(
        { error: { code: "INVALID_SIZE", message: "Tamanho invalido" }, requestId },
        { status: 400 }
      );
    }

    const productExists = await query<{ id: number }>(
      `SELECT id FROM products WHERE id = $1 LIMIT 1`,
      [productId]
    );

    if (productExists.rows.length === 0) {
      return NextResponse.json(
        { error: { code: "PRODUCT_NOT_FOUND", message: "Produto nao encontrado" }, requestId },
        { status: 404 }
      );
    }

    const result = await query<{
      id: number;
      product_id: number;
      sku: string;
      size: string;
      color: string;
      stock_quantity: number;
    }>(
      `
        INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, product_id, sku, size, color, stock_quantity
      `,
      [productId, sku, size, color, stockQuantity]
    );

    return NextResponse.json(
      {
        ok: true,
        requestId,
        variant: {
          id: result.rows[0].id,
          productId: result.rows[0].product_id,
          sku: result.rows[0].sku,
          size: result.rows[0].size,
          color: result.rows[0].color,
          stockQuantity: result.rows[0].stock_quantity,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    log.error({ err: error }, "Erro ao criar variacao");
    return NextResponse.json(
      {
        error: { code: "CREATE_VARIANT_FAILED", message: "Erro ao criar variacao" },
        requestId,
      },
      { status: 500 }
    );
  }
}

