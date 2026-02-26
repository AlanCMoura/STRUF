"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/CartProvider";

type Variant = {
  id: number;
  sku: string;
  size: string;
  color: string;
  stockQuantity: number;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function PdpPurchasePanel({
  product,
}: {
  product: {
    id: number;
    name: string;
    basePrice: number;
    variants: Variant[];
  };
}) {
  const router = useRouter();
  const { status } = useSession();
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<number>(
    product.variants[0]?.id ?? 0
  );
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.id === selectedVariantId),
    [product.variants, selectedVariantId]
  );

  const maxQuantity = Math.max(selectedVariant?.stockQuantity ?? 0, 0);

  const handleAddToCart = () => {
    if (!selectedVariant) {
      setFeedback("Selecione uma variacao");
      return;
    }
    if (selectedVariant.stockQuantity <= 0) {
      setFeedback("Variacao sem estoque");
      return;
    }

    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      sku: selectedVariant.sku,
      color: selectedVariant.color,
      size: selectedVariant.size,
      unitPrice: product.basePrice,
      quantity: Math.max(1, Math.min(quantity, selectedVariant.stockQuantity)),
    });
    setFeedback("Adicionado ao carrinho");
  };

  const handleBuyNow = () => {
    handleAddToCart();
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="space-y-6 border border-zinc-200 bg-white p-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-950">
          {product.name}
        </h1>
        <p className="mt-3 text-2xl font-bold text-zinc-950">
          {formatBRL(product.basePrice)}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
          Drop exclusivo • Envio em 24h
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Variacao (cor / tamanho)
        </label>
        <div className="grid gap-2">
          {product.variants.map((variant) => {
            const active = variant.id === selectedVariantId;
            const soldOut = variant.stockQuantity <= 0;
            return (
              <button
                key={variant.id}
                type="button"
                disabled={soldOut}
                onClick={() => {
                  setSelectedVariantId(variant.id);
                  setQuantity(1);
                  setFeedback(null);
                }}
                className={`flex items-center justify-between border px-4 py-3 text-left text-sm transition ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400"
                } ${soldOut ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span>
                  {variant.color} • {variant.size}
                </span>
                <span className="text-xs">
                  {soldOut ? "Sem estoque" : `${variant.stockQuantity} und`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="pdp-qty"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500"
        >
          Quantidade
        </label>
        <input
          id="pdp-qty"
          type="number"
          min={1}
          max={maxQuantity || 1}
          value={quantity}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isNaN(next)) {
              setQuantity(1);
              return;
            }
            const clamped = Math.min(Math.max(next, 1), maxQuantity || 1);
            setQuantity(clamped);
          }}
          className="w-28 border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleBuyNow}
          className="w-full bg-black px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-zinc-800"
        >
          Comprar agora
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full border border-zinc-300 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-900 hover:bg-zinc-50"
        >
          Adicionar ao carrinho
        </button>
        {feedback ? (
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {feedback}
          </p>
        ) : null}
      </div>
    </div>
  );
}
