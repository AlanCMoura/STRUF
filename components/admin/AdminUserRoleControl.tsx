"use client";

import { useState } from "react";

const ROLE_OPTIONS = ["customer", "manager", "admin"] as const;

export default function AdminUserRoleControl({
  userId,
  currentRole,
}: {
  userId: number;
  currentRole: string;
}) {
  const [role, setRole] = useState(currentRole);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const saveRole = async () => {
    setIsSaving(true);
    setFeedback(null);
    setHasError(false);

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao atualizar role");
      }

      setFeedback("Role atualizada");
    } catch (error) {
      setHasError(true);
      setFeedback(error instanceof Error ? error.message : "Erro ao atualizar role");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="h-9 min-w-[130px] border border-zinc-300 bg-white px-2 text-xs text-zinc-900 outline-none"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={saveRole}
          disabled={isSaving}
          className="h-9 border border-zinc-300 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Salvar
        </button>
      </div>

      {feedback ? (
        <p className={`text-[11px] ${hasError ? "text-red-400" : "text-emerald-400"}`}>
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
