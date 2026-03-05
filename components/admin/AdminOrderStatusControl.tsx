"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
] as const;

type OrderStatus = (typeof STATUS_OPTIONS)[number];

export default function AdminOrderStatusControl({
  orderId,
  currentStatus,
}: {
  orderId: number;
  currentStatus: string;
}) {
  const [status, setStatus] = useState<OrderStatus | string>(currentStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    setHasError(false);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Falha ao atualizar status");
      }

      setFeedback("Status atualizado");
    } catch (error) {
      setHasError(true);
      setFeedback(error instanceof Error ? error.message : "Erro ao atualizar status");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-9 min-w-[140px] border border-zinc-300 bg-white px-2 text-xs text-zinc-900 outline-none"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSave}
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
