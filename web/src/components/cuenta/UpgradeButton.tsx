"use client";

import { useState } from "react";
import { startFlowSubscription } from "@/lib/actions/startFlowSubscription";

export function UpgradeButton({ planId, label }: { planId: string; label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await startFlowSubscription(planId);
    if (result.ok) {
      window.location.href = result.redirectUrl;
      return;
    }
    setError(result.error);
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-xl bg-accent px-4 py-3 text-center font-semibold text-white transition hover:bg-accent-ink disabled:opacity-60"
      >
        {loading ? "Redirigiendo…" : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
