import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getLogger } from "@/lib/logger";

type AcceptInvitePayload = {
  token: string;
  password: string;
};

export async function POST(req: Request) {
  const requestId = randomUUID();
  const log = getLogger(requestId);

  try {
    const body = (await req.json()) as AcceptInvitePayload;
    const token = body?.token;
    const password = body?.password ?? "";

    if (!token || !password || password.length < 6) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Token e senha (min 6) sao obrigatorios",
          },
          requestId,
        },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const client = await pool.connect();
    const inviteResult = await client.query<{
      id: number;
      user_id: number;
      expires_at: string;
    }>(
      `SELECT id, user_id, expires_at
       FROM user_invites
       WHERE token_hash = $1`,
      [tokenHash]
    );

    const invite = inviteResult.rows[0];
    if (!invite) {
      return NextResponse.json(
        {
          error: { code: "INVALID_TOKEN", message: "Token invalido" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        {
          error: { code: "TOKEN_EXPIRED", message: "Token expirado" },
          requestId,
        },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await client.query("BEGIN");
    try {
      await client.query(`UPDATE users SET password = $1 WHERE id = $2`, [
        passwordHash,
        invite.user_id,
      ]);
      await client.query(`DELETE FROM user_invites WHERE id = $1`, [invite.id]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    log.info({ userId: invite.user_id }, "Senha definida via convite");
    return NextResponse.json({ ok: true, requestId });
  } catch (err) {
    log.error({ err }, "Erro ao aceitar convite");
    return NextResponse.json(
      {
        error: {
          code: "ACCEPT_INVITE_FAILED",
          message: "Erro ao aceitar convite",
        },
        requestId,
      },
      { status: 500 }
    );
  }
}
