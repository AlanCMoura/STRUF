import AdminProductsPanel from "@/components/admin/AdminProductsPanel";
import { query } from "@/lib/db";

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

type CategoryRow = {
  id: number;
  name: string;
};

type VariantRow = {
  id: number;
  product_id: number;
  sku: string;
  size: string;
  color: string;
  stock_quantity: number;
};

export default async function AdminProductsPage() {
  const [productsResult, categoriesResult, variantsResult] = await Promise.all([
    query<ProductRow>(
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
        ORDER BY id DESC
      `
    ),
    query<CategoryRow>(
      `
        SELECT id, name
        FROM categories
        ORDER BY name ASC
      `
    ),
    query<VariantRow>(
      `
        SELECT
          id,
          product_id,
          sku,
          size,
          color,
          stock_quantity
        FROM product_variants
        ORDER BY product_id ASC, id ASC
      `
    ),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Produtos</h2>
        <p className="text-sm text-zinc-600">
          Edite dados comerciais, oferta e imagens principais dos produtos.
        </p>
      </div>

      <AdminProductsPanel
        initialProducts={productsResult.rows.map((row) => ({
          id: row.id,
          categoryId: row.category_id,
          name: row.name,
          description: row.description ?? "",
          basePrice: Number(row.base_price),
          onSale: row.on_sale,
          salePrice: row.sale_price !== null ? Number(row.sale_price) : null,
          saleEndsAt: row.sale_ends_at,
          images: row.images ?? [],
        }))}
        categories={categoriesResult.rows}
        initialVariants={variantsResult.rows.map((row) => ({
          id: row.id,
          productId: row.product_id,
          sku: row.sku,
          size: row.size,
          color: row.color,
          stockQuantity: row.stock_quantity,
        }))}
      />
    </div>
  );
}
