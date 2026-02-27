import { NextResponse } from "next/server";
import { createHash, randomBytes, randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getLogger } from "@/lib/logger";
import { sendEmail } from "@/lib/email";

type CreateManagerPayload = {
  name: string;
  email: string;
};

export async function POST(req: Request) {
  const requestId = randomUUID();
  const log = getLogger(requestId);

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        {
          error: { code: "UNAUTHORIZED", message: "Usuario nao autenticado" },
          requestId,
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          error: { code: "FORBIDDEN", message: "Acesso negado" },
          requestId,
        },
        { status: 403 }
      );
    }

    const body = (await req.json()) as CreateManagerPayload;
    const name = body?.name?.trim();
    const email = body?.email?.trim().toLowerCase();

    if (!name || !email) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Nome e email sao obrigatorios",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    const existing = await query<{ id: number; role: string }>(
      `SELECT id, role FROM users WHERE email = $1`,
      [email]
    );

    let userId: number;
    // CORREÇÃO AQUI: Trocamos rowCount por rows.length para satisfazer o TypeScript
    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0];
      if (existingUser.role !== "manager") {
        return NextResponse.json(
          {
            error: {
              code: "EMAIL_IN_USE",
              message: "Email ja cadastrado com outro perfil",
            },
            requestId,
          },
          { status: 409 }
        );
      }
      userId = existingUser.id;
    } else {
      const tempPassword = randomBytes(24).toString("hex");
      const tempHash = await hashPassword(tempPassword);
      const result = await query<{ id: number }>(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [name, email, tempHash, "manager"]
      );
      userId = result.rows[0]?.id;
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await query(
      `INSERT INTO user_invites (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const inviteUrl = `${baseUrl}/activate?token=${rawToken}`;
    const emailResult = await sendEmail({
      to: email,
      subject: "Convite para criar senha",
      text: `Voce foi convidado para acessar o painel. Crie sua senha aqui: ${inviteUrl}`,
    });

    if (!emailResult.ok) {
      log.warn({ userId }, "SMTP nao configurado, link gerado");
      return NextResponse.json(
        { ok: true, userId, inviteUrl, requestId },
        { status: 201 }
      );
    }

    log.info({ userId }, "Convite enviado");
    return NextResponse.json({ ok: true, userId, requestId }, { status: 201 });
  } catch (err) {
    log.error({ err }, "Erro ao criar manager");
    return NextResponse.json(
      {
        error: { code: "CREATE_MANAGER_FAILED", message: "Erro ao criar manager" },
        requestId,
      },
      { status: 500 }
    );
  }
}