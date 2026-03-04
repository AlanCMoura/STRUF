"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/CartProvider";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CartPageClient() {
  const { status } = useSession();
  const { items, subtotal, updateQuantity, removeItem, isHydrated } = useCart();
  const checkoutHref =
    status === "authenticated" ? "/checkout" : "/login?callbackUrl=/checkout";

  if (!isHydrated) {
    return (
      <div className="border border-zinc-200 bg-white p-8 text-sm text-zinc-500">
        Carregando carrinho...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-zinc-300 bg-white p-10 text-center">
        <h2 className="text-xl font-bold uppercase tracking-tight text-zinc-900">
          Seu carrinho esta vazio
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Explore os drops e adicione variacoes para continuar.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Voltar para a vitrine
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <section className="space-y-4">
        {items.map((item) => (
          <article
            key={item.variantId}
            className="grid gap-4 border border-zinc-200 bg-white p-4 sm:grid-cols-[160px_1fr]"
          >
            <div className="grid aspect-square place-items-center bg-[radial-gradient(circle_at_30%_20%,#fff,#f0f0f0_55%,#e5e5e5)] p-4">
              <div className="flex h-full w-full items-center justify-center bg-black text-center text-xs font-bold uppercase tracking-[0.18em] text-white">
                {item.productName}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">
                  {item.productName}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                  SKU {item.sku} • {item.color} • {item.size}
                </p>
                <p className="mt-3 text-sm font-medium text-zinc-800">
                  {formatBRL(item.unitPrice)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    updateQuantity(item.variantId, Math.max(1, next));
                  }}
                  className="w-20 border border-zinc-300 px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  className="text-sm font-medium text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline"
                >
                  Remover
                </button>
                <span className="ml-auto text-sm font-semibold text-zinc-900">
                  {formatBRL(item.unitPrice * item.quantity)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </section>

      <aside className="h-fit border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-900">
          Resumo
        </h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Subtotal</span>
            <span className="font-medium">{formatBRL(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Frete</span>
            <span className="font-medium">Calculado no checkout</span>
          </div>
        </div>

        <div className="mt-4 border-t border-zinc-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-900">Total</span>
            <span className="text-lg font-bold text-zinc-900">
              {formatBRL(subtotal)}
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <Link
            href={checkoutHref}
            className="block bg-black px-4 py-3 text-center text-sm font-semibold tracking-wide text-white hover:bg-zinc-800"
          >
            Finalizar compra
          </Link>
          <Link
            href="/"
            className="block border border-zinc-300 px-4 py-3 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Continuar comprando
          </Link>
        </div>
      </aside>
    </div>
  );
}
