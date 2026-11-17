"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, BookOpen, CloudSun, Database, Search, Waves, type LucideIcon } from "lucide-react";
import { POPULAR_TOPICS, catalogUrl } from "@/lib/topics";

interface CommandItem {
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

/**
 * Command palette (⌘K / Ctrl+K): lompat ke halaman mana pun atau langsung
 * mencari topik di katalog — satu pintu masuk untuk seluruh dashboard.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const go = (href: string) => () => {
      close();
      router.push(href);
    };
    const pages: CommandItem[] = [
      { label: "Ringkasan", hint: "halaman", icon: Activity, run: go("/") },
      { label: "Gempa Bumi", hint: "halaman", icon: Waves, run: go("/gempa") },
      { label: "Cuaca & Prakiraan", hint: "halaman", icon: CloudSun, run: go("/cuaca") },
      { label: "Katalog Satu Data", hint: "halaman", icon: Database, run: go("/katalog") },
      { label: "Glosarium Statistik", hint: "halaman", icon: BookOpen, run: go("/glosarium") },
    ];
    const topics: CommandItem[] = POPULAR_TOPICS.map((topic) => ({
      label: `Cari "${topic.label}" di katalog`,
      hint: "topik",
      icon: Search,
      run: go(catalogUrl(topic.query)),
    }));

    const needle = query.trim().toLowerCase();
    const all = [...pages, ...topics];
    const filtered = needle
      ? all.filter((item) => item.label.toLowerCase().includes(needle))
      : all;

    if (needle) {
      filtered.unshift({
        label: `Cari "${query.trim()}" di katalog`,
        hint: "kueri bebas",
        icon: Search,
        run: go(catalogUrl(query)),
      });
    }
    return filtered.slice(0, 10);
  }, [query, router, close]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/60 px-3 py-1.5 text-xs text-zinc-500 transition hover:bg-zinc-100 md:inline-flex dark:border-zinc-700/70 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
        aria-label="Buka pencarian cepat (Ctrl+K)"
      >
        <Search size={13} />
        Cari…
        <kbd className="rounded border border-zinc-300 px-1 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-600">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/40 px-4 pt-24 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian cepat"
      onClick={close}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xl dark:border-zinc-700/70 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <Search size={16} className="text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setCursor((prev) => Math.min(prev + 1, items.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setCursor((prev) => Math.max(prev - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                items[cursor]?.run();
              }
            }}
            placeholder="Cari halaman atau topik — mis. 'pangan', 'gempa'…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            aria-label="Kata kunci pencarian cepat"
          />
          <kbd className="rounded border border-zinc-300 px-1 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-600">esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {items.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-zinc-500">Tidak ada hasil.</li>
          ) : (
            items.map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(index)}
                    onClick={item.run}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
                      index === cursor
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon size={15} className="shrink-0 text-zinc-400" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hint ? (
                      <span className="text-[10px] uppercase tracking-wide text-zinc-400">{item.hint}</span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
