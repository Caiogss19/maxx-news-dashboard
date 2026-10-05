"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

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
      <label className="nw-busca">
        <Search size={14} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar por e-mail…"
          aria-label="Filtrar leads por e-mail"
        />
      </label>
      <button type="submit" className="spk-btn spk-btn--primario">
        Buscar
      </button>
    </form>
  );
}
