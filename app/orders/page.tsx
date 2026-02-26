import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUserOrders } from "@/lib/storefront";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/orders");
  }

  const orders = await getUserOrders(Number(session.user.id));

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
            orders.map((order) => (
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
            ))
          )}
        </div>
      </div>
    </main>
  );
}
