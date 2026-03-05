"use client";

import { useState } from "react";

export default function CreateManagerForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao criar manager");
      }

      setSuccess("Convite enviado com sucesso");
      setInviteUrl(payload?.inviteUrl ?? null);
      setName("");
      setEmail("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao enviar convite";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">Nome</label>
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 h-10 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 h-10 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
        />
      </div>
      {error ? (
        <div className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {success}
        </div>
      ) : null}

      {inviteUrl ? (
        <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          SMTP nao configurado. Use este link: {inviteUrl}
        </div>
      ) : null}

      <button
        type="submit"
        className="h-10 w-full bg-black px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        disabled={isSubmitting}
      >
        Enviar convite
      </button>
    </form>
  );
}
