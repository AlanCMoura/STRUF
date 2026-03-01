import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const PAGE_SIZE = 12;
const ALLOWED_SIZES = new Set(["PP", "P", "M", "G", "GG"]);
const ALLOWED_SORTS = new Set([
  "mais_vendido",
  "preco_crescente",
  "preco_decrescente",
]);

type CountRow = {
  total: number;
};

type ProductRow = {
  product_id: number;
  product_name: string;
  product_description: string | null;
  base_price: string | number;
  current_price: string | number;
  sale_price: string | number | null;
  on_sale: boolean;
  sale_ends_at: string | null;
  is_sale_active: boolean;
  category_id: number;
  category_name: string;
  category_slug: string;
  sold_quantity: number;
};

type VariantRow = {
  id: number;
  product_id: number;
  sku: string;
  size: string;
  color: string;
  stock_quantity: number;
};

function parseMultiValues(values: string[]) {
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const category = searchParams.get("category")?.trim().toLowerCase() ?? "";

  const sizes = Array.from(
    new Set(
      parseMultiValues(searchParams.getAll("size"))
        .map((value) => value.toUpperCase())
        .filter((value) => ALLOWED_SIZES.has(value))
    )
  );

  const rawSort = searchParams.get("sort")?.trim().toLowerCase() ?? "";
  const sort = ALLOWED_SORTS.has(rawSort) ? rawSort : "mais_vendido";
  const onlyOnSale = searchParams.get("onSale") === "true";

  const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const requestedPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const whereClauses: string[] = [];
  const filterParams: unknown[] = [];

  if (category) {
    filterParams.push(category);
    whereClauses.push(`c.slug = $${filterParams.length}`);
  }

  if (sizes.length > 0) {
    const variantFilters = ["v_filter.product_id = p.id", "v_filter.stock_quantity > 0"];

    if (sizes.length > 0) {
      filterParams.push(sizes);
      variantFilters.push(`upper(v_filter.size) = ANY($${filterParams.length}::text[])`);
    }

    whereClauses.push(
      `EXISTS (
        SELECT 1
        FROM product_variants v_filter
        WHERE ${variantFilters.join(" AND ")}
      )`
    );
  }

  if (onlyOnSale) {
    whereClauses.push(
      `(
        p.on_sale = true
        AND p.sale_price IS NOT NULL
        AND (p.sale_ends_at IS NULL OR p.sale_ends_at > NOW())
      )`
    );
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countResult = await query<CountRow>(
    `
      SELECT COUNT(*)::int AS total
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ${whereSql}
    `,
    filterParams
  );

  const totalItems = Number(countResult.rows[0]?.total ?? 0);
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / PAGE_SIZE);
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const orderBySql =
    sort === "preco_crescente"
      ? "current_price ASC, p.id ASC"
      : sort === "preco_decrescente"
      ? "current_price DESC, p.id DESC"
      : "sold_quantity DESC, p.id ASC";

  const limitParamIndex = filterParams.length + 1;
  const offsetParamIndex = filterParams.length + 2;

  const productResult = await query<ProductRow>(
    `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.description AS product_description,
        p.base_price,
        CASE
          WHEN p.on_sale = true
           AND p.sale_price IS NOT NULL
           AND (p.sale_ends_at IS NULL OR p.sale_ends_at > NOW())
          THEN p.sale_price
          ELSE p.base_price
        END AS current_price,
        p.sale_price,
        p.on_sale,
        p.sale_ends_at::text AS sale_ends_at,
        (
          p.on_sale = true
          AND p.sale_price IS NOT NULL
          AND (p.sale_ends_at IS NULL OR p.sale_ends_at > NOW())
        ) AS is_sale_active,
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        COALESCE(SUM(oi.quantity), 0)::int AS sold_quantity
      FROM products p
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN product_variants v_sales ON v_sales.product_id = p.id
      LEFT JOIN order_items oi ON oi.variant_id = v_sales.id
      ${whereSql}
      GROUP BY p.id, c.id
      ORDER BY ${orderBySql}
      LIMIT $${limitParamIndex}
      OFFSET $${offsetParamIndex}
    `,
    [...filterParams, PAGE_SIZE, offset]
  );

  const productIds = productResult.rows.map((row) => row.product_id);

  let variantsByProduct = new Map<
    number,
    Array<{
      id: number;
      sku: string;
      size: string;
      color: string;
      stockQuantity: number;
    }>
  >();

  if (productIds.length > 0) {
    const variantResult = await query<VariantRow>(
      `
        SELECT
          v.id,
          v.product_id,
          v.sku,
          v.size,
          v.color,
          v.stock_quantity
        FROM product_variants v
        WHERE v.product_id = ANY($1::int[])
        ORDER BY v.product_id ASC, v.id ASC
      `,
      [productIds]
    );

    variantsByProduct = variantResult.rows.reduce(
      (accumulator, row) => {
        const variants = accumulator.get(row.product_id) ?? [];
        variants.push({
          id: row.id,
          sku: row.sku,
          size: row.size,
          color: row.color,
          stockQuantity: row.stock_quantity,
        });
        accumulator.set(row.product_id, variants);
        return accumulator;
      },
      new Map<
        number,
        Array<{
          id: number;
          sku: string;
          size: string;
          color: string;
          stockQuantity: number;
        }>
      >()
    );
  }

  const items = productResult.rows.map((row) => {
    const variants = variantsByProduct.get(row.product_id) ?? [];
    const totalStock = variants.reduce(
      (accumulator, variant) => accumulator + Math.max(0, variant.stockQuantity),
      0
    );

    return {
      id: row.product_id,
      name: row.product_name,
      description: row.product_description,
      basePrice: Number(row.base_price),
      currentPrice: Number(row.current_price),
      salePrice: row.sale_price !== null ? Number(row.sale_price) : null,
      onSale: row.on_sale,
      saleEndsAt: row.sale_ends_at,
      isSaleActive: row.is_sale_active,
      soldQuantity: row.sold_quantity,
      totalStock,
      category: {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
      },
      variants,
    };
  });

  return NextResponse.json({
    items,
    filters: {
      category,
      size: sizes,
      sort,
      onSale: onlyOnSale,
    },
    pagination: {
      page: currentPage,
      pageSize: PAGE_SIZE,
      totalItems,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    },
  });
}
