import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUserOrdersPaginated } from "@/lib/storefront";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parsePageParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/orders");
  }

  const params = searchParams ? await searchParams : undefined;
  const page = parsePageParam(params?.page);

  const result = await getUserOrdersPaginated(Number(session.user.id), {
    page,
    pageSize: 8,
  });

  const orders = result.orders;
  const pagination = result.pagination;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Minha conta
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight">
            Meus pedidos
          </h1>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-500">
              Nenhum pedido encontrado para este usuario.
            </div>
          ) : (
            <>
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-xl border border-zinc-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Pedido #{order.id}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-zinc-900">
                        {order.status}
                      </h2>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-zinc-900">
                        {formatBRL(order.totalAmount)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {order.itemsCount} item(ns)
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    Criado em {new Date(order.createdAt).toLocaleString("pt-BR")}
                  </p>
                </article>
              ))}

              <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
                <Link
                  href={`/orders?page=${pagination.page - 1}`}
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
                  href={`/orders?page=${pagination.page + 1}`}
                  className={`text-sm font-medium ${
                    pagination.hasNext
                      ? "text-zinc-900 underline underline-offset-2"
                      : "pointer-events-none text-zinc-400 no-underline"
                  }`}
                >
                  Proximo
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
