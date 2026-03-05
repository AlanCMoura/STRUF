"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDeleteCategoryButton({
  categoryId,
  disabled,
}: {
  categoryId: number;
  disabled: boolean;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const handleDelete = async () => {
    if (disabled || !window.confirm("Deseja excluir esta categoria?")) {
      return;
    }

    setIsDeleting(true);
    setFeedback(null);
    setHasError(false);

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao excluir categoria");
      }

      setFeedback("Categoria excluida");
      router.refresh();
    } catch (error) {
      setHasError(true);
      setFeedback(error instanceof Error ? error.message : "Erro ao excluir categoria");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={disabled || isDeleting}
        className="h-8 border border-zinc-300 px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Excluir
      </button>
      {feedback ? (
        <p className={`text-[11px] ${hasError ? "text-red-400" : "text-emerald-400"}`}>{feedback}</p>
      ) : null}
    </div>
  );
}
