import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getLogger } from "@/lib/logger";

type UpdateVariantPayload = {
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

async function validateAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false as const, status: 401, code: "UNAUTHORIZED", message: "Usuario nao autenticado" };
  }
  if (session.user.role !== "admin" && session.user.role !== "manager") {
    return { ok: false as const, status: 403, code: "FORBIDDEN", message: "Acesso negado" };
  }
  return { ok: true as const };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = randomUUID();
  const log = getLogger(requestId);

  try {
    const access = await validateAccess();
    if (!access.ok) {
      return NextResponse.json(
        { error: { code: access.code, message: access.message }, requestId },
        { status: access.status }
      );
    }

    const { id } = await params;
    const variantId = Number.parseInt(id, 10);
    if (!Number.isFinite(variantId) || variantId <= 0) {
      return NextResponse.json(
        { error: { code: "INVALID_VARIANT_ID", message: "Variacao invalida" }, requestId },
        { status: 400 }
      );
    }

    const body = (await req.json()) as UpdateVariantPayload;
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

    const result = await query<{
      id: number;
      product_id: number;
      sku: string;
      size: string;
      color: string;
      stock_quantity: number;
    }>(
      `
        UPDATE product_variants
        SET sku = $1, size = $2, color = $3, stock_quantity = $4
        WHERE id = $5
        RETURNING id, product_id, sku, size, color, stock_quantity
      `,
      [sku, size, color, stockQuantity, variantId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: "VARIANT_NOT_FOUND", message: "Variacao nao encontrada" }, requestId },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    log.error({ err: error }, "Erro ao atualizar variacao");
    return NextResponse.json(
      {
        error: { code: "UPDATE_VARIANT_FAILED", message: "Erro ao atualizar variacao" },
        requestId,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = randomUUID();
  const log = getLogger(requestId);

  try {
    const access = await validateAccess();
    if (!access.ok) {
      return NextResponse.json(
        { error: { code: access.code, message: access.message }, requestId },
        { status: access.status }
      );
    }

    const { id } = await params;
    const variantId = Number.parseInt(id, 10);
    if (!Number.isFinite(variantId) || variantId <= 0) {
      return NextResponse.json(
        { error: { code: "INVALID_VARIANT_ID", message: "Variacao invalida" }, requestId },
        { status: 400 }
      );
    }

    const result = await query<{ id: number }>(
      `DELETE FROM product_variants WHERE id = $1 RETURNING id`,
      [variantId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: "VARIANT_NOT_FOUND", message: "Variacao nao encontrada" }, requestId },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    log.error({ err: error }, "Erro ao excluir variacao");
    return NextResponse.json(
      {
        error: { code: "DELETE_VARIANT_FAILED", message: "Erro ao excluir variacao" },
        requestId,
      },
      { status: 500 }
    );
  }
}

