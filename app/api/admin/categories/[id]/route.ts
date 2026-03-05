import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getLogger } from "@/lib/logger";

export async function DELETE(
  _req: Request,
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Acesso negado" }, requestId },
        { status: 403 }
      );
    }

    const { id } = await params;
    const categoryId = Number.parseInt(id, 10);
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { error: { code: "INVALID_CATEGORY_ID", message: "Categoria invalida" }, requestId },
        { status: 400 }
      );
    }

    const usageResult = await query<{ total: number }>(
      `
        SELECT COUNT(*)::int AS total
        FROM products
        WHERE category_id = $1
      `,
      [categoryId]
    );

    if ((usageResult.rows[0]?.total ?? 0) > 0) {
      return NextResponse.json(
        {
          error: {
            code: "CATEGORY_IN_USE",
            message: "Nao e possivel excluir categoria com produtos vinculados",
          },
          requestId,
        },
        { status: 409 }
      );
    }

    const result = await query<{ id: number }>(
      `DELETE FROM categories WHERE id = $1 RETURNING id`,
      [categoryId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: "CATEGORY_NOT_FOUND", message: "Categoria nao encontrada" }, requestId },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    log.error({ err: error }, "Erro ao excluir categoria");
    return NextResponse.json(
      {
        error: { code: "DELETE_CATEGORY_FAILED", message: "Erro ao excluir categoria" },
        requestId,
      },
      { status: 500 }
    );
  }
}

