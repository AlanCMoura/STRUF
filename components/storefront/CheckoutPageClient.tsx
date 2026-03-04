"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type CheckoutAddress = {
  id: number;
  label: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  isDefault: boolean;
};

type CheckoutPageClientProps = {
  initialAddresses: CheckoutAddress[];
};

export default function CheckoutPageClient({
  initialAddresses,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const { items, subtotal, clearCart, isHydrated } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(() => {
    const defaultAddress = initialAddresses.find((address) => address.isDefault);
    return defaultAddress?.id ?? initialAddresses[0]?.id ?? null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAddress =
    initialAddresses.find((address) => address.id === selectedAddressId) ?? null;

  const total = subtotal;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      setError("Carrinho vazio");
      return;
    }

    if (!selectedAddressId) {
      setError("Selecione um endereco de entrega");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
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
      <div className="border border-zinc-200 bg-white p-8 text-sm text-zinc-500">
        Carregando checkout...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-zinc-300 bg-white p-10 text-center">
        <h2 className="text-xl font-bold uppercase tracking-tight text-zinc-900">
          Nada para finalizar
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Adicione produtos ao carrinho antes de ir para o checkout.
        </p>
        <button
          type="button"
          onClick={() => router.push("/carrinho")}
          className="mt-4 bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Ir para o carrinho
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <section className="border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-900">
                Entrega
              </h2>
              <Link
                href="/account/endereco"
                className="text-xs font-semibold uppercase tracking-wide text-zinc-600 underline underline-offset-2"
              >
                Gerenciar enderecos
              </Link>
            </div>

            {initialAddresses.length === 0 ? (
              <div className="mt-4 border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-700">
                <p>Voce precisa cadastrar um endereco para finalizar o pedido.</p>
                <Link
                  href="/account/endereco?edit=1"
                  className="mt-3 inline-flex bg-black px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                >
                  Cadastrar endereco
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {initialAddresses.map((address) => (
                  <label
                    key={address.id}
                    className={`flex cursor-pointer items-start gap-3 border px-4 py-3 text-sm transition ${
                      selectedAddressId === address.id
                        ? "border-zinc-900 bg-zinc-100"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="checkout-address"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-zinc-900">{address.label}</p>
                      <p className="text-xs text-zinc-600">
                        {address.street}, {address.number}
                        {address.complement ? `, ${address.complement}` : ""}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {address.district} - {address.city}/{address.state}
                      </p>
                      <p className="text-xs text-zinc-600">CEP {address.zipCode}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-900">
              Pagamento
            </h2>
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center gap-3 border border-zinc-200 px-4 py-3 text-sm">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "pix"}
                  onChange={() => setPaymentMethod("pix")}
                />
                Pix (confirmacao rapida)
              </label>
              <label className="flex cursor-pointer items-center gap-3 border border-zinc-200 px-4 py-3 text-sm">
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

        <aside className="h-fit border border-zinc-200 bg-white p-6">
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
            <div className="flex items-center justify-between pt-2 text-base font-bold text-zinc-900">
              <span>Total</span>
              <span>{formatBRL(total)}</span>
            </div>
          </div>

          {selectedAddress ? (
            <div className="mt-4 border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs text-zinc-600">
              Entrega em: {selectedAddress.street}, {selectedAddress.number} - {selectedAddress.city}/{selectedAddress.state}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 w-full cursor-pointer bg-black px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Finalizar pagamento
          </button>
        </aside>
      </div>
    </form>
  );
}

