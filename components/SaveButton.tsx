"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { isSaved, subscribeSaved, toggleSaved } from "@/lib/koleksi";

/**
 * Tombol simpan/hapus dataset dari koleksi lokal (localStorage).
 * Status ikut berubah bila koleksi diubah dari tempat lain (tab/komponen lain).
 */
export function SaveButton({
  item,
  compact = false,
}: {
  item: { name: string; title: string; organization: string; url: string; tags: string[] };
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isSaved(item.name));
    return subscribeSaved(() => setSaved(isSaved(item.name)));
  }, [item.name]);

  return (
    <button
      type="button"
      onClick={() => setSaved(toggleSaved(item).some((entry) => entry.name === item.name))}
      aria-pressed={saved}
      title={saved ? "Hapus dari koleksi" : "Simpan ke koleksi"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
        saved
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }`}
    >
      {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
      {compact ? null : saved ? "Tersimpan" : "Simpan"}
    </button>
  );
}
