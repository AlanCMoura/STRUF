"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M12.5 7.5l4 4" />
    </svg>
  );
}

type Props = {
  initialEmail?: string;
  loginCallbackUrl?: string;
  signupPath?: string;
};

export default function CheckoutIdentificationClient({
  initialEmail,
  loginCallbackUrl,
  signupPath,
}: Props) {
  const router = useRouter();
  const safeLoginCallback =
    loginCallbackUrl && loginCallbackUrl.startsWith("/")
      ? loginCallbackUrl
      : "/checkout";
  const safeSignupPath =
    signupPath && signupPath.startsWith("/") ? signupPath : "/checkout/cadastro";
  const [loginEmail, setLoginEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registerEmail, setRegisterEmail] = useState(initialEmail ?? "");
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setIsLoginSubmitting(true);

    try {
      const normalizedEmail = loginEmail.trim().toLowerCase();

      if (!normalizedEmail || !password) {
        setLoginError("Informe email e senha");
        return;
      }

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
        callbackUrl: safeLoginCallback,
      });

      if (result?.error) {
        setLoginError("Email ou senha invalidos");
        return;
      }

      window.location.href = result?.url ?? safeLoginCallback;
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleGoToSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError(null);
    setIsRegisterSubmitting(true);

    try {
      const normalizedEmail = registerEmail.trim().toLowerCase();

      if (!normalizedEmail) {
        setRegisterError("Informe um email valido");
        return;
      }

      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao verificar email");
      }

      if (payload?.exists) {
        setRegisterError("Este email ja possui cadastro. Faca login ao lado.");
        setLoginEmail(normalizedEmail);
        return;
      }

      const hasQuery = safeSignupPath.includes("?");
      const separator = hasQuery ? "&" : "?";
      router.push(
        `${safeSignupPath}${separator}email=${encodeURIComponent(normalizedEmail)}`
      );
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : "Falha ao continuar");
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotError(null);
    setForgotMessage(null);

    const normalizedEmail = loginEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setForgotError("Informe o e-mail acima para receber o link.");
      return;
    }

    setIsForgotSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel enviar o email agora.");
      }

      setForgotMessage(
        "Se o e-mail estiver cadastrado, enviamos um link para redefinir sua senha."
      );
    } catch (err) {
      setForgotError(
        err instanceof Error ? err.message : "Nao foi possivel enviar o email agora."
      );
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Identificação
        </h1>
        <p className="text-sm text-zinc-500">Entre na sua conta ou cadastre-se</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-zinc-200 bg-white p-5 md:p-6">
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-4">
            <UserIcon />
            <h2 className="text-lg font-semibold text-zinc-900">Já sou cadastrado</h2>
          </div>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div className="grid gap-2 md:grid-cols-[72px_1fr] md:items-center">
              <label className="text-sm font-medium text-zinc-700" htmlFor="checkout-login-email">
                E-mail:
              </label>
              <input
                id="checkout-login-email"
                type="email"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="h-11 w-full border border-zinc-300 px-3 text-sm text-zinc-900 outline-none"
              />
            </div>

            <div className="grid gap-2 md:grid-cols-[72px_minmax(0,1fr)_140px] md:items-center">
              <label className="text-sm font-medium text-zinc-700" htmlFor="checkout-login-password">
                Senha:
              </label>

              <div className="relative">
                <input
                  id="checkout-login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full border border-zinc-300 px-3 pr-11 text-sm text-zinc-900 outline-none"
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

              <button
                type="submit"
                disabled={isLoginSubmitting}
                className="h-11 cursor-pointer bg-black px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Prosseguir
              </button>
            </div>

            {loginError ? (
              <p className="text-sm text-red-700 md:pl-[80px]">{loginError}</p>
            ) : null}

            <div className="md:pl-[80px]">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isForgotSubmitting}
                className="cursor-pointer text-xs text-zinc-600 underline underline-offset-2 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Esqueceu a senha?
              </button>
              {forgotError ? (
                <p className="mt-1 text-xs text-red-700">{forgotError}</p>
              ) : null}
              {forgotMessage ? (
                <p className="mt-1 text-xs text-emerald-700">{forgotMessage}</p>
              ) : null}
            </div>
          </form>
        </section>

        <section className="border border-zinc-200 bg-white p-5 md:p-6">
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-4">
            <EditIcon />
            <h2 className="text-lg font-semibold text-zinc-900">
              Ainda não possuo cadastro
            </h2>
          </div>

          <form onSubmit={handleGoToSignup} className="mt-5 space-y-4">
            <p className="text-sm text-zinc-700">
              Digite o email que deseja cadastrar:
            </p>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_128px]">
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                className="h-11 w-full border border-zinc-300 px-3 text-sm text-zinc-900 outline-none"
              />

              <button
                type="submit"
                disabled={isRegisterSubmitting}
                className="h-11 cursor-pointer bg-black px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cadastrar
              </button>
            </div>

            {registerError ? (
              <p className="text-sm text-red-700">{registerError}</p>
            ) : null}
          </form>
        </section>
      </div>
    </div>
  );
}
