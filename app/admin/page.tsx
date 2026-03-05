import Link from "next/link";
import { query } from "@/lib/db";

type SummaryRow = {
  products: number;
  variants: number;
  users: number;
  orders: number;
  gross_revenue: string | number;
};

type RecentOrderRow = {
  id: number;
  status: string;
  total_amount: string | number;
  created_at: string;
  customer_name: string;
};

type LowStockRow = {
  variant_id: number;
  sku: string;
  size: string;
  color: string;
  stock_quantity: number;
  product_id: number;
  product_name: string;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminPage() {
  const [summaryResult, recentOrdersResult, lowStockResult] = await Promise.all([
    query<SummaryRow>(
      `
        SELECT
          (SELECT COUNT(*)::int FROM products) AS products,
          (SELECT COUNT(*)::int FROM product_variants) AS variants,
          (SELECT COUNT(*)::int FROM users) AS users,
          (SELECT COUNT(*)::int FROM orders) AS orders,
          COALESCE((SELECT SUM(total_amount) FROM orders), 0) AS gross_revenue
      `
    ),
    query<RecentOrderRow>(
      `
        SELECT
          o.id,
          o.status,
          o.total_amount,
          o.created_at::text,
          COALESCE(u.name, 'Usuario') AS customer_name
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC
        LIMIT 8
      `
    ),
    query<LowStockRow>(
      `
        SELECT
          v.id AS variant_id,
          v.sku,
          v.size,
          v.color,
          v.stock_quantity,
          p.id AS product_id,
          p.name AS product_name
        FROM product_variants v
        JOIN products p ON p.id = v.product_id
        WHERE v.stock_quantity <= 5
        ORDER BY v.stock_quantity ASC, v.id ASC
        LIMIT 8
      `
    ),
  ]);

  const summary = summaryResult.rows[0];

  const cards = [
    { label: "Produtos", value: String(summary?.products ?? 0) },
    { label: "Variantes (SKU)", value: String(summary?.variants ?? 0) },
    { label: "Usuarios", value: String(summary?.users ?? 0) },
    { label: "Pedidos", value: String(summary?.orders ?? 0) },
    { label: "Faturamento", value: formatBRL(Number(summary?.gross_revenue ?? 0)) },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className="border border-zinc-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-800">
              Pedidos recentes
            </h2>
            <Link href="/admin/orders" className="text-xs text-zinc-500 hover:text-zinc-900">
              Ver todos
            </Link>
          </div>

          <div className="divide-y divide-zinc-200">
            {recentOrdersResult.rows.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-500">Nenhum pedido encontrado.</p>
            ) : (
              recentOrdersResult.rows.map((row) => (
                <div key={row.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-zinc-900">Pedido #{row.id}</p>
                    <p className="font-semibold text-zinc-900">
                      {formatBRL(Number(row.total_amount))}
                    </p>
                  </div>
                  <p className="text-zinc-600">{row.customer_name}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                    <span className="uppercase">{row.status}</span>
                    <span>{formatDateTime(row.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-800">
              Estoque baixo
            </h2>
            <Link href="/admin/products" className="text-xs text-zinc-500 hover:text-zinc-900">
              Gerenciar produtos
            </Link>
          </div>

          <div className="divide-y divide-zinc-200">
            {lowStockResult.rows.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-500">Nenhum SKU com estoque critico.</p>
            ) : (
              lowStockResult.rows.map((row) => (
                <div key={row.variant_id} className="px-4 py-3 text-sm">
                  <p className="font-semibold text-zinc-900">{row.product_name}</p>
                  <p className="text-zinc-600">
                    {row.sku} · {row.color} · {row.size}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-amber-400">
                    {row.stock_quantity} unidade(s)
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
