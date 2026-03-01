"use client";

import { useCart } from "@/components/CartProvider";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CheckoutGateCartSummary() {
  const { items, subtotal, isHydrated } = useCart();

  if (!isHydrated) {
    return (
      <section className="border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-500">Carregando itens do carrinho...</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-500">Seu carrinho esta vazio.</p>
      </section>
    );
  }

  return (
    <section className="border border-zinc-200 bg-white p-4 md:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_72px_120px] gap-4 bg-zinc-100 px-3 py-3 text-sm font-semibold text-zinc-900">
        <div>Produtos</div>
        <div className="text-center">Qtd.</div>
        <div className="text-center">Preço</div>
      </div>

      <div className="divide-y divide-zinc-200 px-3 py-1">
        {items.map((item) => (
          <div
            key={item.variantId}
            className="grid grid-cols-[minmax(0,1fr)_72px_120px] items-start gap-4 py-4 text-sm"
          >
            <div className="grid grid-cols-[118px_minmax(0,1fr)] gap-3">
              <div className="grid h-[118px] w-[118px] place-items-center border border-zinc-200 bg-zinc-100 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Imagem
              </div>

              <div className="min-w-0">
                <p className="font-medium text-zinc-900">{item.productName}</p>
                <p className="text-xs text-zinc-500">
                  Cod: <strong>{item.sku}</strong>
                </p>
                <p className="text-xs text-zinc-500">
                  {item.color} / {item.size}
                </p>
              </div>
            </div>

            <p className="pt-1 text-center text-zinc-700">{item.quantity}</p>

            <p className="pt-1 text-center font-semibold text-zinc-900">
              {formatBRL(item.unitPrice * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 px-3 pb-3">
        <div className="bg-zinc-50 px-4 py-4">
          <div className="ml-auto w-full max-w-[320px]">
            <div className="mb-2 flex items-center justify-between text-sm text-zinc-900">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatBRL(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[16px] font-semibold text-zinc-900">
              <span>Total:</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
