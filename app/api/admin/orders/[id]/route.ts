import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getLogger } from "@/lib/logger";

const ALLOWED_STATUS = new Set(["pending", "paid", "failed", "cancelled", "refunded"]);

type Payload = {
  status?: string;
};

export async function PATCH(
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
    const orderId = Number.parseInt(id, 10);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return NextResponse.json(
        { error: { code: "INVALID_ORDER_ID", message: "Pedido invalido" }, requestId },
        { status: 400 }
      );
    }

    const body = (await req.json()) as Payload;
    const status = body.status?.trim().toLowerCase() ?? "";
    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json(
        { error: { code: "INVALID_STATUS", message: "Status invalido" }, requestId },
        { status: 400 }
      );
    }

    const result = await query<{ id: number; status: string }>(
      `
        UPDATE orders
        SET status = $1
        WHERE id = $2
        RETURNING id, status
      `,
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: "ORDER_NOT_FOUND", message: "Pedido nao encontrado" }, requestId },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      requestId,
      data: result.rows[0],
    });
  } catch (error) {
    log.error({ err: error }, "Erro ao atualizar status do pedido");
    return NextResponse.json(
      { error: { code: "UPDATE_ORDER_FAILED", message: "Erro ao atualizar pedido" }, requestId },
      { status: 500 }
    );
  }
}

