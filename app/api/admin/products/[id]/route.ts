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

function parseExistingImages(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [] as string[];
    }
    return parsed.filter((item): item is string => typeof item === "string").slice(0, 4);
  } catch {
    return [] as string[];
  }
}

function sanitizeFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
}

export async function PUT(
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
        { error: { code: "FORBIDDEN", message: "Sem permissao para editar produtos" }, requestId },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = Number.parseInt(id, 10);

    if (!Number.isFinite(productId) || productId <= 0) {
      return NextResponse.json(
        { error: { code: "INVALID_PRODUCT_ID", message: "Produto invalido" }, requestId },
        { status: 400 }
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
    const existingImages = parseExistingImages(formData.get("existingImages"));

    if (!name || !basePrice || !categoryId) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Nome, preco e categoria sao obrigatorios" }, requestId },
        { status: 400 }
      );
    }

    if (onSale && !salePrice) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Informe o preco promocional" }, requestId },
        { status: 400 }
      );
    }

    const saleEndsAt =
      saleEndsAtRaw.length > 0 ? new Date(saleEndsAtRaw).toISOString() : null;

    if (saleEndsAtRaw.length > 0 && Number.isNaN(Date.parse(saleEndsAtRaw))) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Data final da oferta invalida" }, requestId },
        { status: 400 }
      );
    }

    const fileEntries = formData
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (fileEntries.length > 4) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Limite de 4 imagens por produto" }, requestId },
        { status: 400 }
      );
    }

    const currentProductResult = await query<{ id: number }>(
      `SELECT id FROM products WHERE id = $1 LIMIT 1`,
      [productId]
    );

    if (currentProductResult.rows.length === 0) {
      return NextResponse.json(
        { error: { code: "PRODUCT_NOT_FOUND", message: "Produto nao encontrado" }, requestId },
        { status: 404 }
      );
    }

    let finalImages = existingImages;

    if (fileEntries.length > 0) {
      const supabase = getSupabaseAdminClient();
      const uploadedUrls: string[] = [];

      for (const [index, file] of fileEntries.entries()) {
        const cleanName = sanitizeFilename(file.name || `image-${index}.jpg`);
        const filePath = `produtos/${productId}/${Date.now()}-${index}-${randomUUID()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadError) {
          log.error({ uploadError }, "Erro ao subir imagem do produto");
          return NextResponse.json(
            { error: { code: "UPLOAD_FAILED", message: "Falha no upload das imagens" }, requestId },
            { status: 500 }
          );
        }

        const { data } = supabase.storage.from("products").getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      // Mantem a primeira imagem selecionada no indice 0 do array.
      finalImages = uploadedUrls.slice(0, 4);
    }

    const updatedResult = await query<ProductRow>(
      `
        UPDATE products
        SET
          category_id = $1,
          name = $2,
          description = $3,
          base_price = $4,
          on_sale = $5,
          sale_price = $6,
          sale_ends_at = $7::timestamptz,
          images = $8::text[]
        WHERE id = $9
        RETURNING
          id,
          category_id,
          name,
          description,
          base_price,
          on_sale,
          sale_price,
          sale_ends_at::text,
          images
      `,
      [
        categoryId,
        name,
        description.length > 0 ? description : null,
        basePrice,
        onSale,
        onSale ? salePrice : null,
        onSale ? saleEndsAt : null,
        finalImages,
        productId,
      ]
    );

    const row = updatedResult.rows[0];

    return NextResponse.json({
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
        images: row.images ?? [],
      },
    });
  } catch (err) {
    log.error({ err }, "Erro ao atualizar produto");
    return NextResponse.json(
      { error: { code: "UPDATE_PRODUCT_FAILED", message: "Erro ao atualizar produto" }, requestId },
      { status: 500 }
    );
  }
}
