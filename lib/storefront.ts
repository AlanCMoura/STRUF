import "server-only";
import { query } from "@/lib/db";

export type CategoryItem = {
  id: number;
  name: string;
  slug: string;
};

export type VariantItem = {
  id: number;
  sku: string;
  size: string;
  color: string;
  stockQuantity: number;
};

export type ProductCardItem = {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  category: CategoryItem;
  totalStock: number;
  variants: VariantItem[];
};

export type ProductDetailItem = ProductCardItem;

type ProductVariantRow = {
  product_id: number;
  product_name: string;
  product_description: string | null;
  base_price: string | number;
  category_id: number;
  category_name: string;
  category_slug: string;
  variant_id: number;
  sku: string;
  size: string;
  color: string;
  stock_quantity: number;
};

function groupProducts(rows: ProductVariantRow[]): ProductCardItem[] {
  const map = new Map<number, ProductCardItem>();

  for (const row of rows) {
    const existing = map.get(row.product_id);
    const variant: VariantItem = {
      id: row.variant_id,
      sku: row.sku,
      size: row.size,
      color: row.color,
      stockQuantity: row.stock_quantity,
    };

    if (!existing) {
      map.set(row.product_id, {
        id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        basePrice: Number(row.base_price),
        category: {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        },
        totalStock: Math.max(0, row.stock_quantity),
        variants: [variant],
      });
      continue;
    }

    existing.variants.push(variant);
    existing.totalStock += Math.max(0, row.stock_quantity);
  }

  return Array.from(map.values());
}

export async function getCategories(): Promise<CategoryItem[]> {
  const result = await query<CategoryItem>(
    `
      SELECT id, name, slug
      FROM categories
      ORDER BY name ASC
    `
  );

  return result.rows;
}

export async function getStoreProducts(filters?: {
  categorySlug?: string;
}): Promise<ProductCardItem[]> {
  const params: Array<string> = [];
  const where: string[] = [];

  if (filters?.categorySlug) {
    params.push(filters.categorySlug);
    where.push(`c.slug = $${params.length}`);
  }

  const result = await query<ProductVariantRow>(
    `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.description AS product_description,
        p.base_price,
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        v.id AS variant_id,
        v.sku,
        v.size,
        v.color,
        v.stock_quantity
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN product_variants v ON v.product_id = p.id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY p.id ASC, v.id ASC
    `,
    params
  );

  return groupProducts(result.rows);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardItem[]> {
  const products = await getStoreProducts();
  return products.slice(0, limit);
}

export async function getProductById(
  productId: number
): Promise<ProductDetailItem | null> {
  const result = await query<ProductVariantRow>(
    `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.description AS product_description,
        p.base_price,
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        v.id AS variant_id,
        v.sku,
        v.size,
        v.color,
        v.stock_quantity
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN product_variants v ON v.product_id = p.id
      WHERE p.id = $1
      ORDER BY v.id ASC
    `,
    [productId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return groupProducts(result.rows)[0] ?? null;
}

export async function getUserOrders(userId: number) {
  const result = await query<{
    id: number;
    total_amount: string | number;
    status: string;
    created_at: string;
    items_count: number;
  }>(
    `
      SELECT
        o.id,
        o.total_amount,
        o.status,
        o.created_at::text AS created_at,
        COALESCE(SUM(oi.quantity), 0)::int AS items_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    totalAmount: Number(row.total_amount),
    status: row.status,
    createdAt: row.created_at,
    itemsCount: row.items_count,
  }));
}
