import Link from "next/link";
import { query } from "@/lib/db";
import AdminOrderStatusControl from "@/components/admin/AdminOrderStatusControl";

const PAGE_SIZE = 15;

type SearchParams = {
  page?: string;
};

type CountRow = {
  total: number;
};

type OrderRow = {
  id: number;
  status: string;
  total_amount: string | number;
  created_at: string;
  customer_name: string;
  customer_email: string;
  items_count: number;
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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = searchParams ? await searchParams : {};
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const totalResult = await query<CountRow>(`SELECT COUNT(*)::int AS total FROM orders`);
  const totalItems = totalResult.rows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const ordersResult = await query<OrderRow>(
    `
      SELECT
        o.id,
        o.status,
        o.total_amount,
        o.created_at::text,
        COALESCE(u.name, 'Usuario') AS customer_name,
        COALESCE(u.email, '-') AS customer_email,
        COALESCE(SUM(oi.quantity), 0)::int AS items_count
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id, u.id
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `,
    [PAGE_SIZE, offset]
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Pedidos</h2>
        <p className="text-sm text-zinc-600">Acompanhe e atualize o status dos pedidos.</p>
      </div>

      <section className="overflow-hidden border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Itens</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-900">
              {ordersResult.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                ordersResult.rows.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-4 font-semibold">#{order.id}</td>
                    <td className="px-4 py-4">
                      <p>{order.customer_name}</p>
                      <p className="text-xs text-zinc-500">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-4">{order.items_count}</td>
                    <td className="px-4 py-4 font-semibold">
                      {formatBRL(Number(order.total_amount))}
                    </td>
                    <td className="px-4 py-4 text-zinc-500">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-4">
                      <AdminOrderStatusControl orderId={order.id} currentStatus={order.status} />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-semibold uppercase tracking-wide text-zinc-700 hover:text-black"
                      >
                        Ver pedido
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <Link
          href={`/admin/orders?page=${Math.max(1, currentPage - 1)}`}
          className={`border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
            currentPage > 1
              ? "text-zinc-800 hover:bg-zinc-100"
              : "pointer-events-none text-zinc-400"
          }`}
        >
          Anterior
        </Link>

        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Pagina {currentPage} de {totalPages}
        </p>

        <Link
          href={`/admin/orders?page=${Math.min(totalPages, currentPage + 1)}`}
          className={`border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
            currentPage < totalPages
              ? "text-zinc-800 hover:bg-zinc-100"
              : "pointer-events-none text-zinc-400"
          }`}
        >
          Proxima
        </Link>
      </div>
    </div>
  );
}
