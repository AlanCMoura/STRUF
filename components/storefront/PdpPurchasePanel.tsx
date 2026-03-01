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
    description: string | null;
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
  const [shippingZip, setShippingZip] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.id === selectedVariantId),
    [product.variants, selectedVariantId]
  );

  const maxQuantity = Math.max(selectedVariant?.stockQuantity ?? 0, 0);
  const hasVariants = product.variants.length > 0;

  const handleAddToCart = () => {
    if (!selectedVariant) {
      setFeedback("Selecione uma variacao");
      return false;
    }

    if (selectedVariant.stockQuantity <= 0) {
      setFeedback("Variacao sem estoque");
      return false;
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
    return true;
  };

  const handleBuyNow = () => {
    const added = handleAddToCart();
    if (!added) {
      return;
    }

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
      return;
    }

    router.push("/checkout");
  };

  return (
    <div className="space-y-6 bg-white">
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-lg font-black uppercase leading-tight tracking-tight text-zinc-900 md:text-2xl">
          {product.name}
        </h1>
      </div>

      {hasVariants ? (
        <div className="space-y-2 border-b border-zinc-200 pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-700">
            Selecione a opcao de tamanho:{" "}
            <span className="font-black text-zinc-900">
              {selectedVariant?.size ?? "-"}
            </span>
          </p>

          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const isActive = variant.id === selectedVariantId;
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
                  className={`relative h-9 min-w-[46px] border px-2 text-[11px] font-semibold uppercase ${
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-zinc-300 bg-white text-zinc-800"
                  } ${soldOut ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:border-zinc-500"}`}
                  title={soldOut ? "Sem estoque" : `${variant.color} / ${variant.size}`}
                  aria-label={`${variant.size} ${variant.color}`}
                >
                  {variant.size}
                  {isActive ? (
                    <span className="absolute right-1 top-0 text-[9px] leading-none">
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-1 border-b border-zinc-200 pb-5">
        <p className="text-xl font-black leading-none text-zinc-950 md:text-2xl">
          {formatBRL(product.basePrice)}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex h-12 w-[126px] items-center border border-zinc-300 bg-zinc-50 text-lg font-semibold text-zinc-700">
          <button
            type="button"
            onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
            className="grid h-full w-full cursor-pointer place-items-center hover:bg-zinc-100"
            aria-label="Diminuir quantidade"
          >
            -
          </button>
          <span className="grid h-full min-w-[48px] place-items-center text-zinc-900">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((prev) => Math.min(prev + 1, Math.max(maxQuantity, 1)))}
            className="grid h-full w-full cursor-pointer place-items-center hover:bg-zinc-100"
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleBuyNow}
          className="h-12 flex-1 cursor-pointer bg-black px-4 text-xs font-black uppercase tracking-wide text-white"
        >
          Comprar
        </button>
      </div>

      <div className="border-y border-zinc-200 py-6">
        <p className="text-base font-semibold uppercase tracking-wide text-zinc-900">
          Calcule o frete
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
          <input
            value={shippingZip}
            onChange={(event) => setShippingZip(event.target.value)}
            placeholder="CEP"
            className="h-12 border-b border-zinc-300 px-3 text-sm text-zinc-900 outline-none"
          />
          <button
            type="button"
            className="h-12 cursor-pointer bg-black px-4 text-xs font-black uppercase tracking-wide text-white"
          >
            Calcular
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-b border-zinc-200 pb-3">
          <h2 className="text-2xl font-black text-zinc-900">Descrição</h2>
        </div>

        <p className="text-[13px] leading-6 text-zinc-700">
          {product.description ??
            "Peca desenvolvida para compor a colecao principal. Atualize este texto quando houver descricao editorial completa."}
        </p>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-zinc-900">Detalhes do produto</h3>
          <ul className="list-disc space-y-1 pl-6 text-[13px] text-zinc-700">
            <li>SKU: {selectedVariant?.sku ?? "Nao informado"}</li>
            <li>Cor: {selectedVariant?.color ?? "Nao informado"}</li>
            <li>Tamanho: {selectedVariant?.size ?? "Nao informado"}</li>
            <li>Estoque atual: {selectedVariant?.stockQuantity ?? 0} unidades</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
