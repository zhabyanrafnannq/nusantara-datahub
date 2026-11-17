"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, ExternalLink, FileDown, Trash2 } from "lucide-react";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { clearSaved, loadSaved, removeSaved, subscribeSaved, type SavedDataset } from "@/lib/koleksi";
import { datasetsToCsv, exportFilename } from "@/lib/katalog-params";
import { formatDateTime } from "@/lib/format";

/**
 * Koleksi dataset yang disimpan pengguna — seluruhnya lokal (localStorage),
 * tidak ada data yang dikirim ke server.
 */
export default function KoleksiPage() {
  const [items, setItems] = useState<SavedDataset[]>([]);

  useEffect(() => {
    setItems(loadSaved());
    return subscribeSaved(() => setItems(loadSaved()));
  }, []);

  const csv = useMemo(() => (items.length > 0 ? datasetsToCsv(items.map((item) => ({
    name: item.name,
    title: item.title,
    notes: "",
    organization: item.organization,
    tags: item.tags,
    url: item.url,
  }))) : ""), [items]);

  function downloadCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = exportFilename("koleksi");
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        accent="violet"
        icon={Bookmark}
        title="Koleksi Saya"
        description="Dataset yang kamu simpan dari katalog. Tersimpan di perangkat ini, bisa diekspor ke CSV kapan saja."
        right={
          items.length > 0 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <FileDown size={13} /> Unduh CSV
              </button>
              <button
                type="button"
                onClick={() => setItems(clearSaved())}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-rose-500/10"
              >
                <Trash2 size={13} /> Kosongkan
              </button>
            </div>
          ) : undefined
        }
      />

      <Card>
        <CardHeader
          title={`${items.length} dataset tersimpan`}
          subtitle={items.length > 0 ? "Klik judul untuk membuka detail dataset." : undefined}
        />
        {items.length === 0 ? (
          <EmptyState
            title="Belum ada dataset yang disimpan"
            description="Buka katalog, cari topik (mis. 'pangan'), lalu tekan tombol Simpan pada dataset yang ingin kamu pakai nanti."
          >
            <Link
              href="/katalog"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              Cari dataset
            </Link>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((item) => (
              <li key={item.name} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <Link
                    href={`/katalog/${item.name}`}
                    className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    {item.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {item.organization ? <Badge tone="blue">{item.organization}</Badge> : null}
                    <span>disimpan {formatDateTime(item.savedAt)}</span>
                    {item.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-emerald-600 dark:text-zinc-400"
                  >
                    data.go.id <ExternalLink size={11} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setItems(removeSaved(item.name))}
                    aria-label={`Hapus ${item.title} dari koleksi`}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-zinc-200 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-700 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
        Koleksi disimpan di localStorage browser ini. Menghapus data situs atau memakai mode privat akan menghilangkan
        daftar ini — unduh CSV bila ingin menyimpannya permanen.
      </p>
    </div>
  );
}
