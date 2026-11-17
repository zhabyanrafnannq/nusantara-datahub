"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { POPULAR_TOPICS, catalogUrl } from "@/lib/topics";

/**
 * Kotak pencarian katalog untuk halaman Ringkasan.
 *
 * Mengirim pengguna LANGSUNG ke /katalog?q=... (bukan sekadar memuat ulang
 * halaman ini), sehingga hasil pencarian topik seperti "pangan" atau
 * "kemiskinan" bisa dibuka, dibagikan, dan di-bookmark lewat URL.
 */
export function QuickSearch({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    router.push(catalogUrl(value));
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Cari topik dataset — mis. 'pangan', 'kemiskinan', 'stunting'…"
            aria-label="Cari topik dataset di katalog Satu Data Indonesia"
            className="w-full rounded-2xl border border-zinc-200/80 bg-white/80 py-3 pl-9 pr-3 text-sm shadow-soft backdrop-blur outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700/70 dark:bg-zinc-900/70"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Cari <ArrowRight size={15} />
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">topik populer:</span>
        {POPULAR_TOPICS.slice(0, 8).map((topic) => (
          <button
            key={topic.query}
            type="button"
            onClick={() => router.push(catalogUrl(topic.query))}
            className="rounded-full bg-zinc-100/80 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-emerald-100 hover:text-emerald-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300"
          >
            {topic.label}
          </button>
        ))}
      </div>
    </div>
  );
}
