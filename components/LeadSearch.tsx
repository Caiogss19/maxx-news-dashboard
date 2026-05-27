"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeadSearch({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = q.trim();
        router.push(v ? `/leads?q=${encodeURIComponent(v)}` : "/leads");
      }}
      className="flex gap-2"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filtrar por email…"
        className="flex-1 bg-bg-paper border border-rule rounded-sm px-4 py-2.5 text-sm outline-none focus:border-rule-strong transition"
      />
      <button
        type="submit"
        className="px-5 py-2.5 rounded-sm bg-ink text-bg-paper text-sm font-mono uppercase tracking-wider hover:opacity-90 transition"
      >
        Buscar
      </button>
    </form>
  );
}
