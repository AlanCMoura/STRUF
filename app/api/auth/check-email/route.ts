import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type CheckEmailPayload = {
  email?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckEmailPayload;
    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Email obrigatorio",
          },
        },
        { status: 400 }
      );
    }

    const result = await query<{ id: number }>(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    return NextResponse.json({
      ok: true,
      exists: result.rowCount > 0,
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "CHECK_EMAIL_FAILED",
          message: "Erro ao verificar email",
        },
      },
      { status: 500 }
    );
  }
}
