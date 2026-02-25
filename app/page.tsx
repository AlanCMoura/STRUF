import { query } from "@/lib/db";
import ProductsClient from "@/components/ProductsClient";

type ProductRow = {
  product_id: number;
  product_name: string;
  base_price: number | string;
  variant_id: number;
  sku: string;
  color: string;
  size: string;
  stock_quantity: number;
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await query<ProductRow>(
    `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.base_price,
        v.id AS variant_id,
        v.sku,
        v.color,
        v.size,
        v.stock_quantity
      FROM products p
      JOIN product_variants v ON v.product_id = p.id
      WHERE v.stock_quantity > 0
      ORDER BY p.id, v.id
    `
  );

  const rows = result.rows as ProductRow[];
  const items = rows.map((row: ProductRow) => ({
    ...row,
    base_price: Number(row.base_price),
  }));

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          Produtos disponiveis
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Listagem simples de produtos com variacoes em estoque.
        </p>

        <div className="mt-8">
          <ProductsClient items={items} />
        </div>
      </div>
    </main>
  );
}
