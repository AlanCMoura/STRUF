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
      <div className="grid grid-cols-[minmax(0,1fr)_72px_128px] gap-4 border-b border-zinc-200 bg-zinc-100 px-3 py-3 text-sm font-semibold text-zinc-900">
        <div>Produtos</div>
        <div className="text-center">Qtd.</div>
        <div className="text-center">Preço</div>
      </div>

      <div className="divide-y divide-zinc-200">
        {items.map((item) => (
          <div
            key={item.variantId}
            className="grid grid-cols-[minmax(0,1fr)_72px_128px] items-start gap-4 px-3 py-4 text-sm"
          >
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div className="grid h-[120px] w-[120px] place-items-center border border-zinc-200 bg-zinc-100 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Imagem
              </div>

              <div>
                <div className="font-medium text-zinc-900">{item.productName}</div>
                <div className="mt-1 text-xs text-zinc-500">Cod: {item.sku}</div>
                <div className="text-xs text-zinc-500">
                  {item.color} / {item.size}
                </div>
              </div>
            </div>

            <div className="pt-1 text-center text-zinc-700">{item.quantity}</div>

            <div className="pt-1 text-center font-semibold text-zinc-900">
              {formatBRL(item.unitPrice * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 ml-auto w-full max-w-sm border border-zinc-200 bg-zinc-50 p-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-base font-bold">
            <span>Total:</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
