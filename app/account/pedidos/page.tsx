import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getUserOrdersPaginated } from "@/lib/storefront";
import AccountShell from "@/components/account/AccountShell";

type UserBasicRow = {
  id: number;
  name: string;
  email: string;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export const dynamic = "force-dynamic";

function parsePageParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export default async function AccountPedidosPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/pedidos");
  }

  const params = searchParams ? await searchParams : undefined;
  const page = parsePageParam(params?.page);
  const userId = Number(session.user.id);
  const [profileResult, ordersResult] = await Promise.all([
    query<UserBasicRow>(
      `
        SELECT id, name, email
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId]
    ),
    getUserOrdersPaginated(userId, { page, pageSize: 8 }),
  ]);

  const profile = profileResult.rows[0] ?? null;
  const orders = ordersResult.orders;
  const pagination = ordersResult.pagination;

  return (
    <AccountShell
      activeTab="pedidos"
      userName={profile?.name ?? session.user.name ?? "cliente"}
      userEmail={profile?.email ?? session.user.email ?? ""}
    >
      <article className="border border-zinc-200 bg-white">
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-zinc-900">Meus pedidos</h2>
          <Link href="/account" className="text-sm underline underline-offset-2">
            Voltar para o resumo
          </Link>
        </header>

        {orders.length === 0 ? (
          <div className="grid min-h-[300px] place-items-center px-6 text-center text-sm text-zinc-500">
            Voce ainda nao tem pedidos.
          </div>
        ) : (
          <div className="p-4">
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order.id} className="border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-900">Pedido #{order.id}</p>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">{order.status}</p>
                    </div>
                    <p className="font-semibold text-zinc-900">{formatBRL(order.totalAmount)}</p>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {formatDate(order.createdAt)} - {order.itemsCount} item(ns)
                  </p>
                  <div className="mt-2 flex justify-end">
                    <Link
                      href={`/account/pedidos/${order.id}`}
                      className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-800 underline underline-offset-2 hover:text-black"
                    >
                      Ver pedido
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
              <Link
                href={`/account/pedidos?page=${pagination.page - 1}`}
                className={`text-sm font-medium ${
                  pagination.hasPrevious
                    ? "text-zinc-900 underline underline-offset-2"
                    : "pointer-events-none text-zinc-400 no-underline"
                }`}
              >
                Anterior
              </Link>

              <p className="text-sm text-zinc-600">
                Pagina {pagination.page} de {pagination.totalPages}
              </p>

              <Link
                href={`/account/pedidos?page=${pagination.page + 1}`}
                className={`text-sm font-medium ${
                  pagination.hasNext
                    ? "text-zinc-900 underline underline-offset-2"
                    : "pointer-events-none text-zinc-400 no-underline"
                }`}
              >
                Proximo
              </Link>
            </div>
          </div>
        )}
      </article>
    </AccountShell>
  );
}
