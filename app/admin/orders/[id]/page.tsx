import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";

type OrderRow = {
  id: number;
  status: string;
  total_amount: string | number;
  created_at: string;
  customer_name: string;
  customer_email: string;
};

type OrderItemRow = {
  id: number;
  product_name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  price_at_purchase: string | number;
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

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number.parseInt(id, 10);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    notFound();
  }

  const orderResult = await query<OrderRow>(
    `
      SELECT
        o.id,
        o.status,
        o.total_amount,
        o.created_at::text,
        COALESCE(u.name, 'Usuario') AS customer_name,
        COALESCE(u.email, '-') AS customer_email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.id = $1
      LIMIT 1
    `,
    [orderId]
  );

  const order = orderResult.rows[0];
  if (!order) {
    notFound();
  }

  const itemsResult = await query<OrderItemRow>(
    `
      SELECT
        oi.id,
        p.name AS product_name,
        v.sku,
        v.size,
        v.color,
        oi.quantity,
        oi.price_at_purchase
      FROM order_items oi
      JOIN product_variants v ON v.id = oi.variant_id
      JOIN products p ON p.id = v.product_id
      WHERE oi.order_id = $1
      ORDER BY oi.id ASC
    `,
    [orderId]
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Pedido #{order.id}</h2>
          <p className="text-sm text-zinc-600">Detalhes completos do pedido.</p>
        </div>
        <Link
          href="/admin/orders"
          className="border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-800 hover:bg-zinc-100"
        >
          Voltar
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Status</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">{order.status}</p>
        </article>
        <article className="border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Valor total</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            {formatBRL(Number(order.total_amount))}
          </p>
        </article>
        <article className="border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Criado em</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            {formatDateTime(order.created_at)}
          </p>
        </article>
      </section>

      <section className="border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Cliente</h3>
        <p className="mt-3 text-zinc-900">{order.customer_name}</p>
        <p className="text-sm text-zinc-500">{order.customer_email}</p>
      </section>

      <section className="border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
            Itens do pedido
          </h3>
        </div>

        <div className="divide-y divide-zinc-200">
          {itemsResult.rows.map((item) => (
            <article key={item.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-zinc-900">{item.product_name}</p>
                  <p className="text-xs text-zinc-500">
                    {item.sku} · {item.color} · {item.size}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-600">Qtd: {item.quantity}</p>
                  <p className="font-semibold text-zinc-900">
                    {formatBRL(Number(item.price_at_purchase) * item.quantity)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
