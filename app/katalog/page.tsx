"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Database, ExternalLink, FileDown, Loader2, Search } from "lucide-react";
import { Badge, Card, CardHeader, EmptyState, PageHeader, SourceBadge } from "@/components/ui";
import type { ApiResponse, CatalogResult, DatasetSummary } from "@/lib/types";
import { formatNumber, truncate } from "@/lib/format";

const PAGE_SIZE = 20;

/** Bangun CSV dari hasil pencarian dan unduh sebagai file (client-side). */
function exportCsv(datasets: DatasetSummary[]) {
  const rows = [
    ["judul", "organisasi", "slug", "url", "deskripsi"].join(","),
    ...datasets.map((d) =>
      [
        `"${d.title.replace(/"/g, '""')}"`,
        `"${d.organization.replace(/"/g, '""')}"`,
        d.name,
        d.url,
        `"${d.notes.replace(/"/g, '""').slice(0, 300)}"`,
      ].join(","),
    ),
  ];
  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `satu-data-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

interface CatalogState {
  loading: boolean;
  source: "live" | "fixture";
  result: CatalogResult;
}

export default function KatalogPage() {
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState<CatalogState>({
    loading: true,
    source: "live",
    result: { total: 0, datasets: [], tagFacets: [] },
  });

  const load = useCallback(async (q: string, pageNum: number) => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const params = new URLSearchParams({ q, page: String(pageNum) });
      const response = await fetch(`/api/katalog?${params.toString()}`);
      const payload = (await response.json()) as ApiResponse<CatalogResult>;
      setState({ loading: false, source: payload.source, result: payload.data });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    void load(appliedQuery, page);
  }, [load, appliedQuery, page]);

  function submitSearch(event?: React.FormEvent) {
    event?.preventDefault();
    setAppliedQuery(query.trim());
    setPage(1);
  }

  const estimatedPages = Math.max(Math.ceil(state.result.total / PAGE_SIZE), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        accent="emerald"
        icon={Database}
        title="Katalog Satu Data Indonesia"
        description="Telusuri ribuan dataset resmi lintas instansi pemerintah dari data.go.id."
        right={<SourceBadge source={state.source} />}
      />

      <form onSubmit={submitSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari dataset, mis. 'penduduk', 'pangan', 'cuaca'…"
            className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          disabled={state.loading}
        >
          Cari
        </button>
      </form>

      {state.result.tagFacets.length > 0 && !state.loading ? (
        <Card>
          <CardHeader
            title="Topik populer pada pencarian ini"
            subtitle="Klik bar untuk mencari dengan topik tersebut."
          />
          <div className="h-60 px-4 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={state.result.tagFacets} margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(161 161 170 / 0.3)" vertical={false} />
                <XAxis
                  dataKey="tag"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  stroke="currentColor"
                  className="text-zinc-500"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-zinc-500" width={44} />
                <Tooltip
                  cursor={{ fill: "rgb(16 185 129 / 0.08)" }}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => [formatNumber(Number(value)), "dataset"]}
                />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  className="cursor-pointer"
                  onClick={(_entry, index) => {
                    const item = state.result.tagFacets[index];
                    if (item) {
                      setQuery(item.tag);
                      setAppliedQuery(item.tag);
                      setPage(1);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title={
            state.loading
              ? "Memuat…"
              : state.result.total > 0
                ? `${formatNumber(state.result.total)} dataset ditemukan`
                : "Hasil pencarian"
          }
          subtitle={`halaman ${page} · ±${PAGE_SIZE} dataset per halaman${appliedQuery ? ` · kueri "${appliedQuery}"` : ""}`}
          right={
            !state.loading && state.result.datasets.length > 0 ? (
              <button
                type="button"
                onClick={() => exportCsv(state.result.datasets)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <FileDown size={13} /> Unduh CSV
              </button>
            ) : undefined
          }
        />
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {state.result.datasets.map((dataset) => (
            <article key={dataset.name} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <a
                  href={dataset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {dataset.title}
                </a>
                {dataset.organization ? <Badge tone="blue">{dataset.organization}</Badge> : null}
              </div>
              {dataset.notes ? (
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {truncate(dataset.notes)}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-500">
                {typeof dataset.numResources === "number" ? (
                  <span>{dataset.numResources} resource</span>
                ) : null}
                <a
                  href={dataset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-emerald-600"
                >
                  Buka di data.go.id <ExternalLink size={11} />
                </a>
              </div>
            </article>
          ))}
        </div>
        {!state.loading && state.result.datasets.length === 0 ? (
          <EmptyState
            title="Tidak ada dataset cocok"
            description="Coba kata kunci lain — misalnya 'penduduk', 'pangan', 'kesehatan', atau 'iklim'."
          />
        ) : null}
        {state.loading ? (
          <div className="grid place-items-center py-12 text-sm text-zinc-500">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : null}
        {!state.loading && state.result.datasets.length > 0 ? (
          <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-sm dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || state.loading}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              ← Sebelumnya
            </button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              halaman {page} dari ±{estimatedPages.toLocaleString("id-ID")}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={state.loading}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Berikutnya →
            </button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
