import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getLogger } from "@/lib/logger";

type Payload = {
  role?: string;
};

const ALLOWED_ROLES = new Set(["customer", "manager", "admin"]);

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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Acesso negado" }, requestId },
        { status: 403 }
      );
    }

    const { id } = await params;
    const targetUserId = Number.parseInt(id, 10);
    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
      return NextResponse.json(
        { error: { code: "INVALID_USER_ID", message: "Usuario invalido" }, requestId },
        { status: 400 }
      );
    }

    const payload = (await req.json()) as Payload;
    const nextRole = payload.role?.trim().toLowerCase() ?? "";
    if (!ALLOWED_ROLES.has(nextRole)) {
      return NextResponse.json(
        { error: { code: "INVALID_ROLE", message: "Role invalida" }, requestId },
        { status: 400 }
      );
    }

    const requesterId = Number(session.user.id);
    if (requesterId === targetUserId && nextRole !== "admin") {
      return NextResponse.json(
        {
          error: {
            code: "SELF_ROLE_CHANGE_BLOCKED",
            message: "Voce nao pode remover seu proprio acesso admin",
          },
          requestId,
        },
        { status: 409 }
      );
    }

    const result = await query<{ id: number; role: string }>(
      `
        UPDATE users
        SET role = $1
        WHERE id = $2
        RETURNING id, role
      `,
      [nextRole, targetUserId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "Usuario nao encontrado" }, requestId },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, requestId, data: result.rows[0] });
  } catch (error) {
    log.error({ err: error }, "Erro ao atualizar role de usuario");
    return NextResponse.json(
      {
        error: { code: "UPDATE_USER_ROLE_FAILED", message: "Erro ao atualizar role" },
        requestId,
      },
      { status: 500 }
    );
  }
}

