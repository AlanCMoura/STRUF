"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type ProductItem = {
  product_id: number;
  product_name: string;
  base_price: number;
  variant_id: number;
  sku: string;
  color: string;
  size: string;
  stock_quantity: number;
};

type CartItem = {
  variantId: number;
  quantity: number;
};

type CheckoutResult = {
  orderId: number;
  totalAmount: string;
};

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function ProductsClient({ items }: { items: ProductItem[] }) {
  const { status } = useSession();
  const byId = useMemo(
    () => new Map(items.map((item) => [item.variant_id, item])),
    [items]
  );
  const [cart, setCart] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const cartStorageKey = "struf_cart";

  useEffect(() => {
    const stored = window.localStorage.getItem(cartStorageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<number, number>;
        setCart(parsed ?? {});
      } catch {
        window.localStorage.removeItem(cartStorageKey);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart]);

  const cartItems = useMemo<CartItem[]>(
    () =>
      Object.entries(cart)
        .map(([variantId, quantity]) => ({
          variantId: Number(variantId),
          quantity,
        }))
        .filter((item) => item.quantity > 0),
    [cart]
  );

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const product = byId.get(item.variantId);
      if (!product) {
        return sum;
      }
      return sum + product.base_price * item.quantity;
    }, 0);
  }, [cartItems, byId]);

  const clampQty = (variantId: number, qty: number) => {
    const product = byId.get(variantId);
    if (!product) {
      return 0;
    }
    return Math.min(Math.max(qty, 0), product.stock_quantity);
  };

  const setQty = (variantId: number, qty: number) => {
    setCart((prev) => ({
      ...prev,
      [variantId]: clampQty(variantId, qty),
    }));
  };

  const clearCart = () => {
    setCart({});
    setResult(null);
    setError(null);
    window.localStorage.removeItem(cartStorageKey);
  };

  const handleCheckout = async () => {
    if (status === "unauthenticated") {
      const callbackUrl =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      window.location.href = `/login?callbackUrl=${encodeURIComponent(
        callbackUrl
      )}`;
      return;
    }

    if (cartItems.length === 0) {
      setError("Carrinho vazio");
      console.warn("[checkout] Carrinho vazio");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);
    setRequestId(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        let apiMessage =
          payload?.error?.message ?? payload?.error ?? `Erro ${response.status}`;
        const apiDetails = payload?.error?.details;
        if (payload?.error?.code === "OUT_OF_STOCK" && apiDetails?.sku) {
          apiMessage = `${apiMessage} (SKU ${apiDetails.sku})`;
        }
        const apiRequestId = payload?.requestId;
        console.error("[checkout] Erro na resposta", {
          status: response.status,
          payload,
        });
        if (apiRequestId) {
          setRequestId(apiRequestId);
        }
        if (
          response.status === 401 ||
          payload?.error?.code === "UNAUTHORIZED"
        ) {
          const callbackUrl =
            window.location.pathname +
            window.location.search +
            window.location.hash;
          window.location.href = `/login?callbackUrl=${encodeURIComponent(
            callbackUrl
          )}`;
          return;
        }
        throw new Error(apiMessage);
      }

      setResult({
        orderId: payload.orderId,
        totalAmount: payload.totalAmount,
      });
      setRequestId(payload.requestId ?? null);
      setCart({});
      window.localStorage.removeItem(cartStorageKey);
    } catch (err) {
      console.error("[checkout] Falha ao finalizar", err);
      const message =
        err instanceof Error ? err.message : "Erro ao finalizar checkout";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Produtos</h2>
        <ul className="space-y-4">
          {items.map((item) => {
            const qty = cart[item.variant_id] ?? 0;
            return (
              <li
                key={item.variant_id}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">
                      {item.product_name}
                    </div>
                    <div className="text-sm text-zinc-600">
                      SKU: {item.sku} - Cor: {item.color} - Tamanho: {item.size}{" "}
                      - Estoque: {item.stock_quantity}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-zinc-800">
                    {formatBRL(item.base_price)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded border border-zinc-300 px-3 py-1 text-sm"
                    onClick={() => setQty(item.variant_id, qty - 1)}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={item.stock_quantity}
                    value={qty}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setQty(item.variant_id, Number.isNaN(next) ? 0 : next);
                    }}
                    className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    className="rounded border border-zinc-300 px-3 py-1 text-sm"
                    onClick={() => setQty(item.variant_id, qty + 1)}
                  >
                    +
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">Carrinho</h2>

        {cartItems.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Sem itens no carrinho.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {cartItems.map((item) => {
              const product = byId.get(item.variantId);
              if (!product) {
                return null;
              }
              return (
                <li
                  key={item.variantId}
                  className="flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-medium">{product.product_name}</div>
                    <div className="text-xs text-zinc-500">
                      SKU {product.sku} - {product.color} - {product.size} (x
                      {item.quantity})
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium text-zinc-800">
                    {formatBRL(product.base_price * item.quantity)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 text-sm">
          <span>Total</span>
          <strong>{formatBRL(total)}</strong>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleCheckout}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processando..." : "Finalizar checkout"}
          </button>
          <button
            type="button"
            className="rounded border border-zinc-300 px-4 py-2 text-sm"
            onClick={clearCart}
          >
            Limpar
          </button>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Para finalizar o checkout, faca login em /api/auth/signin
        </p>

        {error ? (
          <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <div>{error}</div>
            {requestId ? (
              <div className="mt-1 text-xs text-red-600">
                Request ID: {requestId}
              </div>
            ) : null}
          </div>
        ) : null}

        {result ? (
          <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <div>
              Pedido criado: #{result.orderId} - Total: {result.totalAmount}
            </div>
            {requestId ? (
              <div className="mt-1 text-xs text-emerald-700">
                Request ID: {requestId}
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
