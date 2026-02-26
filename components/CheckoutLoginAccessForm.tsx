"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";

type CheckoutLoginAccessFormProps = {
  callbackUrl?: string;
};

type Step = "email" | "password";

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

export default function CheckoutLoginAccessForm({
  callbackUrl,
}: CheckoutLoginAccessFormProps) {
  const router = useRouter();
  const safeCallback = useMemo(
    () => (callbackUrl?.startsWith("/") ? callbackUrl : "/checkout"),
    [callbackUrl]
  );

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();

  const handleEmailContinue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!normalizedEmail) {
      setError("Informe um email valido");
      return;
    }

    setIsCheckingEmail(true);

    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao verificar email");
      }

      if (!payload?.exists) {
        router.push(
          `/checkout/cadastro?email=${encodeURIComponent(normalizedEmail)}`
        );
        return;
      }

      setStep("password");
      setPassword("");
      setShowPassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao verificar email");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
        callbackUrl: safeCallback,
      });

      if (result?.error) {
        setError("Senha invalida");
        return;
      }

      window.location.href = result?.url ?? safeCallback;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === "email" ? (
        <form onSubmit={handleEmailContinue} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="meu@email.com.br"
              className="h-11 flex-1 border border-zinc-300 px-4 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isCheckingEmail}
              className="h-11 min-w-32 bg-black px-5 text-base font-semibold text-white disabled:opacity-60"
            >
              {isCheckingEmail ? "..." : "Continuar"}
            </button>
          </div>

          {error ? (
            <div className="space-y-2 text-sm">
              <p className="text-red-700">{error}</p>
            </div>
          ) : null}
        </form>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            <div className="font-medium text-zinc-900">{normalizedEmail}</div>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setPassword("");
                setError(null);
                setShowPassword(false);
              }}
              className="mt-1 text-xs uppercase tracking-wide underline underline-offset-2"
            >
              Trocar email
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full border border-zinc-300 px-4 pr-24 text-base text-zinc-900 focus:outline-none"
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

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full bg-black px-5 text-base font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Entrando..." : "Entrar e continuar"}
          </button>
        </form>
      )}
    </div>
  );
}
