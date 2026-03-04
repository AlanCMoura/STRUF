import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getUserOrderById } from "@/lib/storefront";
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

export default async function AccountPedidoDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/pedidos");
  }

  const userId = Number(session.user.id);
  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    notFound();
  }

  const [profileResult, order] = await Promise.all([
    query<UserBasicRow>(
      `
        SELECT id, name, email
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId]
    ),
    getUserOrderById(userId, orderId),
  ]);

  if (!order) {
    notFound();
  }

  const profile = profileResult.rows[0] ?? null;

  return (
    <AccountShell
      activeTab="pedidos"
      userName={profile?.name ?? session.user.name ?? "cliente"}
      userEmail={profile?.email ?? session.user.email ?? ""}
    >
      <article className="border border-zinc-200 bg-white">
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Pedido #{order.id}</h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{order.status}</p>
          </div>
          <Link href="/account/pedidos" className="text-sm underline underline-offset-2">
            Voltar para pedidos
          </Link>
        </header>

        <div className="border-b border-zinc-200 px-4 py-3 text-sm text-zinc-700">
          <p>Data: {formatDate(order.createdAt)}</p>
          <p className="mt-1">
            Total de itens: {order.itemsCount} item(ns)
          </p>
        </div>

        {order.items.length === 0 ? (
          <div className="grid min-h-[240px] place-items-center px-6 text-center text-sm text-zinc-500">
            Este pedido nao possui itens.
          </div>
        ) : (
          <ul className="space-y-3 p-4">
            {order.items.map((item) => (
              <li key={item.id} className="border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900">{item.productName}</p>
                    <p className="text-xs text-zinc-500">
                      SKU: {item.sku} | {item.color} | {item.size}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">Qtd: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-900">{formatBRL(item.lineTotal)}</p>
                    <p className="text-xs text-zinc-500">
                      {formatBRL(item.priceAtPurchase)} cada
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <footer className="border-t border-zinc-200 px-4 py-4">
          <div className="ml-auto flex w-full max-w-[280px] items-center justify-between text-lg font-bold text-zinc-900">
            <span>Total:</span>
            <span>{formatBRL(order.totalAmount)}</span>
          </div>
        </footer>
      </article>
    </AccountShell>
  );
}
