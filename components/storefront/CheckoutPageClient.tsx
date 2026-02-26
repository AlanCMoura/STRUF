"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CheckoutPageClient() {
  const router = useRouter();
  const { items, subtotal, clearCart, isHydrated } = useCart();
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">(
    "standard"
  );
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingPrice = shippingMethod === "express" ? 29.9 : 14.9;
  const total = subtotal + shippingPrice;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) {
      setError("Carrinho vazio");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao finalizar checkout");
      }

      const orderId = payload?.orderId;
      clearCart();
      router.push(
        `/sucesso?pedido=${encodeURIComponent(String(orderId ?? ""))}&pagamento=${paymentMethod}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao finalizar checkout");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500">
        Carregando checkout...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <h2 className="text-xl font-bold uppercase tracking-tight text-zinc-900">
          Nada para finalizar
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Adicione produtos ao carrinho antes de ir para o checkout.
        </p>
        <button
          type="button"
          onClick={() => router.push("/carrinho")}
          className="mt-4 rounded bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Ir para o carrinho
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-900">
            Entrega
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Nome completo"
              className="rounded border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              required
              placeholder="CEP"
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Cidade"
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Rua"
              className="rounded border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              required
              placeholder="Numero"
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Complemento"
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-900">
            Frete
          </h2>
          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-center justify-between rounded border border-zinc-200 px-4 py-3 text-sm">
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === "standard"}
                  onChange={() => setShippingMethod("standard")}
                />
                Standard (3-6 dias)
              </span>
              <strong>{formatBRL(14.9)}</strong>
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded border border-zinc-200 px-4 py-3 text-sm">
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === "express"}
                  onChange={() => setShippingMethod("express")}
                />
                Expresso (1-2 dias)
              </span>
              <strong>{formatBRL(29.9)}</strong>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-900">
            Pagamento
          </h2>
          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-center gap-3 rounded border border-zinc-200 px-4 py-3 text-sm">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "pix"}
                onChange={() => setPaymentMethod("pix")}
              />
              Pix (confirmacao rapida)
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded border border-zinc-200 px-4 py-3 text-sm">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
              />
              Cartao (simulado)
            </label>
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-900">
          Resumo do pedido
        </h2>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div>
                <div className="font-medium text-zinc-900">{item.productName}</div>
                <div className="text-xs text-zinc-500">
                  {item.color} • {item.size} • x{item.quantity}
                </div>
              </div>
              <span className="font-medium">
                {formatBRL(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2 border-t border-zinc-200 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Frete</span>
            <span>{formatBRL(shippingPrice)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 text-base font-bold text-zinc-900">
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 w-full rounded bg-black px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {isSubmitting ? "Processando..." : "Finalizar pagamento"}
        </button>
      </aside>
    </form>
  );
}
