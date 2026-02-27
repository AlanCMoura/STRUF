import { createHash, randomBytes, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getLogger } from "@/lib/logger";

type ForgotPasswordPayload = {
  email?: string;
};

export async function POST(req: Request) {
  const requestId = randomUUID();
  const log = getLogger(requestId);

  try {
    const body = (await req.json()) as ForgotPasswordPayload;
    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Email obrigatorio",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    const userResult = await query<{ id: number }>(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    // Sempre retornamos sucesso para nao vazar se o email existe.
    if (userResult.rows.length === 0) {
      return NextResponse.json({ ok: true, requestId }, { status: 200 });
    }

    const userId = userResult.rows[0].id;
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await query(`DELETE FROM user_invites WHERE user_id = $1`, [userId]);
    await query(
      `INSERT INTO user_invites (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/redefinir-senha?token=${rawToken}`;

    const emailResult = await sendEmail({
      to: email,
      subject: "Redefinicao de senha",
      text: `Recebemos uma solicitacao para redefinir sua senha. Use este link: ${resetUrl}`,
    });

    if (!emailResult.ok) {
      log.warn({ email, reason: emailResult.reason }, "SMTP nao configurado");
      return NextResponse.json({ ok: true, requestId }, { status: 200 });
    }

    log.info({ email, userId }, "Email de redefinicao enviado");
    return NextResponse.json({ ok: true, requestId }, { status: 200 });
  } catch (err) {
    log.error({ err }, "Erro ao solicitar redefinicao de senha");
    return NextResponse.json(
      {
        error: {
          code: "FORGOT_PASSWORD_FAILED",
          message: "Erro ao solicitar redefinicao de senha",
        },
        requestId,
      },
      { status: 500 }
    );
  }
}
