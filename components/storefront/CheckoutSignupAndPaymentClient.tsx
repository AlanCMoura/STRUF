"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A11.5 11.5 0 0 1 12 6c6.5 0 10 6 10 6a17.8 17.8 0 0 1-4.1 4.5" />
      <path d="M6.3 6.8C3.7 8.5 2 12 2 12s3.5 6 10 6c1.2 0 2.3-.2 3.3-.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export default function CheckoutSignupAndPaymentClient({
  initialEmail,
}: {
  initialEmail?: string;
}) {
  const router = useRouter();
  const { items, subtotal, clearCart, isHydrated } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => subtotal, [subtotal]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isHydrated) {
      setError("Carregando carrinho");
      return;
    }

    if (items.length === 0) {
      setError("Carrinho vazio");
      return;
    }

    if (!name.trim() || !email.trim() || !password || password.length < 6) {
      setError("Preencha nome, email e senha (min 6)");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas nao coincidem");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          password,
        }),
      });

      const registerPayload = await registerResponse.json().catch(() => ({}));
      if (!registerResponse.ok) {
        throw new Error(registerPayload?.error?.message ?? "Falha no cadastro");
      }

      const signInResult = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
        callbackUrl: "/checkout/cadastro",
      });

      if (signInResult?.error) {
        throw new Error("Conta criada, mas nao foi possivel autenticar");
      }

      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const checkoutPayload = await checkoutResponse.json().catch(() => ({}));
      if (!checkoutResponse.ok) {
        throw new Error(
          checkoutPayload?.error?.message ?? "Falha ao finalizar checkout"
        );
      }

      clearCart();
      router.push(
        `/sucesso?pedido=${encodeURIComponent(
          String(checkoutPayload?.orderId ?? "")
        )}&pagamento=${paymentMethod}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao finalizar compra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.25fr_0.8fr]">
      <section className="border border-zinc-200 bg-white p-5 md:p-6">
        <div className="mb-5 border-b border-zinc-200 pb-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            Novo cadastro{" "}
            <Link
              href={
                email.trim()
                  ? `/checkout/identificacao?email=${encodeURIComponent(email.trim())}`
                  : "/checkout/identificacao"
              }
              className="underline underline-offset-4"
            >
              ou faça login
            </Link>
          </h2>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Nome
              </label>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 w-full border border-zinc-300 px-3 text-sm text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full border border-zinc-300 px-3 text-sm text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Criar senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full border border-zinc-300 px-3 pr-24 text-sm text-zinc-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center text-zinc-600 hover:text-zinc-900"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="h-11 w-full border border-zinc-300 px-3 pr-24 text-sm text-zinc-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center text-zinc-600 hover:text-zinc-900"
                  aria-label={
                    showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                  }
                >
                  <EyeIcon open={showConfirmPassword} />
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="border-t border-zinc-200 pt-5 lg:hidden">
            <PaymentBox
              paymentMethod={paymentMethod}
              onChangePayment={setPaymentMethod}
              total={total}
              isSubmitting={isSubmitting}
            />
          </div>

          <div className="lg:hidden">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full cursor-pointer bg-black px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Processando..." : "Finalizar compra"}
            </button>
          </div>
        </div>
      </section>

      <aside className="hidden h-fit border border-zinc-200 bg-white p-5 lg:block">
        <PaymentBox
          paymentMethod={paymentMethod}
          onChangePayment={setPaymentMethod}
          total={total}
          isSubmitting={isSubmitting}
        />

        {error ? (
          <div className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 lg:block hidden">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 hidden w-full cursor-pointer bg-black px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60 lg:block"
        >
          {isSubmitting ? "Processando..." : "Finalizar compra"}
        </button>
      </aside>
    </form>
  );
}

function PaymentBox({
  paymentMethod,
  onChangePayment,
  total,
  isSubmitting,
}: {
  paymentMethod: "pix" | "card";
  onChangePayment: (value: "pix" | "card") => void;
  total: number;
  isSubmitting: boolean;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">Pagamento</h2>
      <div className="mt-4 space-y-3">
        <label className="flex cursor-pointer items-center gap-3 border border-zinc-200 px-4 py-3 text-sm">
          <input
            type="radio"
            name="payment-checkout-signup"
            checked={paymentMethod === "pix"}
            onChange={() => onChangePayment("pix")}
            disabled={isSubmitting}
          />
          Pix
        </label>

        <label className="flex cursor-pointer items-center gap-3 border border-zinc-200 px-4 py-3 text-sm">
          <input
            type="radio"
            name="payment-checkout-signup"
            checked={paymentMethod === "card"}
            onChange={() => onChangePayment("card")}
            disabled={isSubmitting}
          />
          Cartao
        </label>
      </div>

      <div className="mt-5 border-t border-zinc-200 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">Total</span>
          <strong className="text-base text-zinc-900">{formatBRL(total)}</strong>
        </div>
      </div>
    </div>
  );
}
