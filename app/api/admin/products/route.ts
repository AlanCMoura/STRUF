import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type ProductRow = {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  base_price: string | number;
  on_sale: boolean;
  sale_price: string | number | null;
  sale_ends_at: string | null;
  images: string[] | null;
};

function parsePositiveNumber(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string") {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseOptionalNumber(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseString(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string") {
    return "";
  }
  return raw.trim();
}

function parseBoolean(raw: FormDataEntryValue | null) {
  return typeof raw === "string" && raw === "true";
}

function sanitizeFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
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

    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Acesso negado" }, requestId },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const name = parseString(formData.get("name"));
    const description = parseString(formData.get("description"));
    const basePrice = parsePositiveNumber(formData.get("basePrice"));
    const categoryId = parsePositiveNumber(formData.get("categoryId"));
    const onSale = parseBoolean(formData.get("onSale"));
    const salePrice = parseOptionalNumber(formData.get("salePrice"));
    const saleEndsAtRaw = parseString(formData.get("saleEndsAt"));

    if (!name || !basePrice || !categoryId) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "Nome, preco e categoria sao obrigatorios" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (onSale && !salePrice) {
      return NextResponse.json(
        {
          error: { code: "INVALID_INPUT", message: "Informe o preco promocional" },
          requestId,
        },
        { status: 400 }
      );
    }

    if (saleEndsAtRaw.length > 0 && Number.isNaN(Date.parse(saleEndsAtRaw))) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Data final da oferta invalida" }, requestId },
        { status: 400 }
      );
    }

    const saleEndsAt =
      saleEndsAtRaw.length > 0 ? new Date(saleEndsAtRaw).toISOString() : null;

    const createdResult = await query<{ id: number }>(
      `
        INSERT INTO products (
          category_id,
          name,
          description,
          base_price,
          on_sale,
          sale_price,
          sale_ends_at,
          images
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::text[])
        RETURNING id
      `,
      [
        categoryId,
        name,
        description.length > 0 ? description : null,
        basePrice,
        onSale,
        onSale ? salePrice : null,
        onSale ? saleEndsAt : null,
        [],
      ]
    );

    const createdProductId = createdResult.rows[0]?.id;
    if (!createdProductId) {
      throw new Error("Falha ao criar produto");
    }

    const fileEntries = formData
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)
      .slice(0, 4);

    let images: string[] = [];

    if (fileEntries.length > 0) {
      const supabase = getSupabaseAdminClient();
      const uploadedUrls: string[] = [];

      for (const [index, file] of fileEntries.entries()) {
        const cleanName = sanitizeFilename(file.name || `image-${index}.jpg`);
        const filePath = `produtos/${createdProductId}/${Date.now()}-${index}-${randomUUID()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadError) {
          log.error({ uploadError }, "Erro ao subir imagem do novo produto");
          return NextResponse.json(
            {
              error: {
                code: "UPLOAD_FAILED",
                message: "Produto criado, mas houve falha no upload das imagens",
              },
              requestId,
            },
            { status: 500 }
          );
        }

        const { data } = supabase.storage.from("products").getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      images = uploadedUrls.slice(0, 4);

      await query(`UPDATE products SET images = $1::text[] WHERE id = $2`, [
        images,
        createdProductId,
      ]);
    }

    const productResult = await query<ProductRow>(
      `
        SELECT
          id,
          category_id,
          name,
          description,
          base_price,
          on_sale,
          sale_price,
          sale_ends_at::text,
          images
        FROM products
        WHERE id = $1
        LIMIT 1
      `,
      [createdProductId]
    );

    const row = productResult.rows[0];

    return NextResponse.json(
      {
        ok: true,
        requestId,
        product: {
          id: row.id,
          categoryId: row.category_id,
          name: row.name,
          description: row.description ?? "",
          basePrice: Number(row.base_price),
          onSale: row.on_sale,
          salePrice: row.sale_price !== null ? Number(row.sale_price) : null,
          saleEndsAt: row.sale_ends_at,
          images: row.images ?? images,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    log.error({ err: error }, "Erro ao criar produto");
    return NextResponse.json(
      { error: { code: "CREATE_PRODUCT_FAILED", message: "Erro ao criar produto" }, requestId },
      { status: 500 }
    );
  }
}

