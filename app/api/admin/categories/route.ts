import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getLogger } from "@/lib/logger";

type CreateCategoryPayload = {
  name?: string;
  slug?: string;
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function POST(req: Request) {
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

    const body = (await req.json()) as CreateCategoryPayload;
    const name = body.name?.trim() ?? "";
    const slug = normalizeSlug(body.slug ?? "");

    if (name.length < 2 || slug.length < 2) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Nome e slug sao obrigatorios" }, requestId },
        { status: 400 }
      );
    }

    const result = await query<{ id: number; name: string; slug: string }>(
      `
        INSERT INTO categories (name, slug)
        VALUES ($1, $2)
        RETURNING id, name, slug
      `,
      [name, slug]
    );

    return NextResponse.json({ ok: true, requestId, data: result.rows[0] }, { status: 201 });
  } catch (error) {
    log.error({ err: error }, "Erro ao criar categoria");
    return NextResponse.json(
      {
        error: { code: "CREATE_CATEGORY_FAILED", message: "Erro ao criar categoria" },
        requestId,
      },
      { status: 500 }
    );
  }
}

