import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getLogger } from "@/lib/logger";

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export async function POST(req: Request) {
  const requestId = randomUUID();
  const log = getLogger(requestId);

  try {
    const body = (await req.json()) as RegisterPayload;
    const name = body?.name?.trim();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password ?? "";

    if (!name || !email || !password || password.length < 6) {
      log.warn({ email }, "Cadastro invalido: dados insuficientes");
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Nome, email e senha (min 6) sao obrigatorios",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    const existing = await query<{ id: number }>(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (existing.rows.length > 0) {
      log.warn({ email }, "Cadastro invalido: email ja cadastrado");
      return NextResponse.json(
        {
          error: {
            code: "EMAIL_IN_USE",
            message: "Email ja cadastrado",
          },
          requestId,
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const result = await query<{ id: number }>(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name, email, passwordHash, "customer"]
    );

    const userId = result.rows[0]?.id;
    log.info({ userId }, "Usuario criado");

    return NextResponse.json({ ok: true, userId, requestId }, { status: 201 });
  } catch (err) {
    log.error({ err }, "Erro ao registrar usuario");
    return NextResponse.json(
      {
        error: {
          code: "REGISTER_FAILED",
          message: "Erro ao registrar usuario",
        },
        requestId,
      },
      { status: 500 }
    );
  }
}
