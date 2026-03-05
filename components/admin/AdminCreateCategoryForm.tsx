"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminCreateCategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setHasError(false);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao criar categoria");
      }

      setFeedback("Categoria criada");
      setName("");
      setSlug("");
      router.refresh();
    } catch (error) {
      setHasError(true);
      setFeedback(error instanceof Error ? error.message : "Erro ao criar categoria");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-800">
        Nova categoria
      </h2>

      <input
        required
        placeholder="Nome"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="h-10 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
      />

      <input
        required
        placeholder="Slug (ex: camisetas)"
        value={slug}
        onChange={(event) => setSlug(event.target.value.toLowerCase())}
        className="h-10 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none"
      />

      <button
        type="submit"
        disabled={isSaving}
        className="h-10 bg-black px-4 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Criar categoria
      </button>

      {feedback ? (
        <p className={`text-xs ${hasError ? "text-red-400" : "text-emerald-400"}`}>{feedback}</p>
      ) : null}
    </form>
  );
}
