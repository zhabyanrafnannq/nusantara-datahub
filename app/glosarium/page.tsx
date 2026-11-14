"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { GLOSSARY, GLOSSARY_CATEGORIES, searchGlossary } from "@/lib/glossary";
import type { GlossaryTerm } from "@/lib/types";

const CATEGORY_TONES: Record<GlossaryTerm["category"], "green" | "blue" | "amber" | "red" | "neutral"> = {
  deskriptif: "green",
  probabilitas: "blue",
  inferensia: "amber",
  regresi: "red",
  "kualitas-data": "neutral",
};

export default function GlosariumPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GlossaryTerm["category"] | "semua">("semua");

  const results = useMemo(() => searchGlossary(GLOSSARY, query, category), [query, category]);

  return (
    <div className="space-y-6">
      <PageHeader
        accent="violet"
        icon={BookOpen}
        title="Glosarium Statistik"
        description={`${GLOSSARY.length} istilah statistik: terjemahan, penjelasan bahasa awam, rumus, dan contoh.`}
      />

      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari istilah — mis. 'p-value', 'korelasi', 'median'…"
            className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ChipButton active={category === "semua"} onClick={() => setCategory("semua")}>
            Semua
          </ChipButton>
          {GLOSSARY_CATEGORIES.map((cat) => (
            <ChipButton key={cat.id} active={category === cat.id} onClick={() => setCategory(cat.id)}>
              {cat.label}
            </ChipButton>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader
          title={`${results.length} istilah ditemukan`}
          subtitle={query ? `kueri "${query}"` : category !== "semua" ? `kategori ${category}` : undefined}
        />
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {results.map((term) => (
            <article key={term.term} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{term.term}</h2>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">= {term.id}</span>
                <Badge tone={CATEGORY_TONES[term.category]}>{term.category}</Badge>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{term.plain}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {term.formula ? (
                  <pre className="overflow-x-auto rounded-lg bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-emerald-300">
                    {term.formula}
                  </pre>
                ) : null}
                {term.example ? (
                  <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
                    Contoh: {term.example}
                  </p>
                ) : null}
              </div>
              <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                <BookOpen size={11} /> EN: {term.en}
              </p>
            </article>
          ))}
        </div>
        {results.length === 0 ? (
          <EmptyState
            title="Tidak ada istilah cocok"
            description="Coba kata kunci lain — misalnya 'distribusi', 'hipotesis', atau 'regresi'."
          />
        ) : null}
      </Card>
    </div>
  );
}

function ChipButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-emerald-600 text-white shadow-sm"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}
