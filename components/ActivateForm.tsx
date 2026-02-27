"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ActivateForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirm) {
      setError("As senhas nao conferem");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao ativar conta");
      }

      const email = payload?.email as string | undefined;
      const role = payload?.role as "customer" | "admin" | "manager" | undefined;

      if (!email) {
        setSuccess("Senha criada com sucesso. Voce ja pode fazer login.");
        setPassword("");
        setConfirm("");
        return;
      }

      const callbackUrl = role === "customer" ? "/" : "/admin";
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (signInResult?.error) {
        setSuccess("Senha criada com sucesso. Faca login para continuar.");
        setPassword("");
        setConfirm("");
        return;
      }

      setPassword("");
      setConfirm("");
      router.push(signInResult?.url ?? callbackUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao ativar conta";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Nova senha
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Confirmar senha
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <button
        type="submit"
        className="w-full rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Salvando..." : "Criar senha"}
      </button>
    </form>
  );
}
