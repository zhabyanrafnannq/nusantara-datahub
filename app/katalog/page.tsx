"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bookmark,
  CalendarDays,
  Database,
  ExternalLink,
  FileDown,
  FileSpreadsheet,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  Tag,
  X,
} from "lucide-react";
import { Badge, Card, CardHeader, EmptyState, PageHeader, SourceBadge } from "@/components/ui";
import type { ApiResponse, CatalogFacets, CatalogFilters, CatalogResult, DatasetSummary, Facet } from "@/lib/types";
import { formatNumber, truncate } from "@/lib/format";
import { POPULAR_TOPICS, catalogUrl } from "@/lib/topics";
import { datasetsToCsv, exportFilename, filtersToQuery, readFilters } from "@/lib/katalog-params";
import { loadHistory, pushHistory, rememberTags, suggestQueries } from "@/lib/katalog-history";
import { loadSaved, subscribeSaved } from "@/lib/koleksi";
import { SaveButton } from "@/components/SaveButton";
import { CATALOG_MAX_PAGE, CATALOG_PAGE_SIZE, clampCatalogPage } from "@/lib/katalog-limits";

const PAGE_SIZE = CATALOG_PAGE_SIZE;
/** Halaman yang diambil saat "unduh banyak" (20 dataset/halaman). */
const BULK_EXPORT_PAGES = 10;

const EMPTY_FACETS: CatalogFacets = { kategori: [], tahun: [], format: [], organisasi: [] };
const EMPTY_RESULT: CatalogResult = { total: 0, datasets: [], tagFacets: [], facets: EMPTY_FACETS };

/** Bangun URL halaman katalog lengkap (kueri + filter + halaman). */
function katalogHref(query: string, page: number, filters: CatalogFilters): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (page > 1) params.set("page", String(page));
  const filterQuery = filtersToQuery(filters);
  const target = params.toString();
  return `/katalog${target || filterQuery ? `?${[target, filterQuery].filter(Boolean).join("&")}` : ""}`;
}

/** Unduh CSV hasil pencarian di sisi klien (halaman aktif). */
function downloadCsv(datasets: DatasetSummary[], query: string) {
  const blob = new Blob([datasetsToCsv(datasets)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = exportFilename(query);
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function KatalogPage() {
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CatalogFilters>({});
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [source, setSource] = useState<"live" | "fixture">("live");
  const [result, setResult] = useState<CatalogResult>(EMPTY_RESULT);
  const [savedCount, setSavedCount] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [showAllFacets, setShowAllFacets] = useState<Record<string, boolean>>({});
  /** Isian "lompat ke halaman" (kosong = tidak sedang mengetik). */
  const [pageJump, setPageJump] = useState("");
  /**
   * Pilihan facet dari kueri terakhir yang TANPA filter. Portal mengirim facet
   * yang sudah menyempit saat filter aktif, sehingga tanpa ini pilihan lain
   * "hilang" begitu satu filter dipakai.
   */
  const [facetOptions, setFacetOptions] = useState<CatalogFacets>(EMPTY_FACETS);

  const requestRef = useRef(0);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  /** Cermin ref untuk `facetOptions` supaya `load` tidak perlu jadi dependensi state ini. */
  const facetOptionsRef = useRef<CatalogFacets>(EMPTY_FACETS);

  // Sinkron dari URL sekali saat halaman dibuka (deep link yang bisa dibagikan).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = (params.get("q") ?? "").trim();
    const p = clampCatalogPage(params.get("page"));
    setQuery(q);
    setAppliedQuery(q);
    setPage(p);
    setFilters(readFilters(params));
    setReady(true);
  }, []);

  useEffect(() => {
    setSavedCount(loadSaved().length);
    return subscribeSaved(() => setSavedCount(loadSaved().length));
  }, []);

  // Tutup dropdown saran saat klik di luar.
  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setSuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const load = useCallback(async (q: string, pageNum: number, activeFilters: CatalogFilters) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    setFailed(false);
    try {
      const params = new URLSearchParams({ q, page: String(pageNum) });
      const filterQuery = filtersToQuery(activeFilters);
      if (filterQuery) new URLSearchParams(filterQuery).forEach((value, key) => params.set(key, value));
      const response = await fetch(`/api/katalog?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as ApiResponse<CatalogResult>;
      if (requestRef.current !== requestId) return;
      setSource(payload.source);
      const incomingFacets = payload.data.facets ?? EMPTY_FACETS;
      setResult({ ...payload.data, facets: incomingFacets });
      // Simpan pilihan facet dari kueri tanpa filter (atau saat belum ada pilihan).
      const noFilters = Object.keys(activeFilters).length === 0;
      const isEmpty = facetOptionsRef.current.kategori.length === 0 &&
        facetOptionsRef.current.organisasi.length === 0 &&
        facetOptionsRef.current.tahun.length === 0 &&
        facetOptionsRef.current.format.length === 0;
      if (noFilters || isEmpty) {
        facetOptionsRef.current = incomingFacets;
        setFacetOptions(incomingFacets);
      }
      if (q.trim()) {
        pushHistory(q);
        rememberTags(payload.data.tagFacets.map((facet) => facet.tag));
      }
    } catch {
      if (requestRef.current !== requestId) return;
      setFailed(true);
      setResult(EMPTY_RESULT);
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) void load(appliedQuery, page, filters);
  }, [load, ready, appliedQuery, page, filters]);

  // Tulis keadaan pencarian ke URL agar bisa dibagikan / di-bookmark.
  useEffect(() => {
    if (!ready) return;
    const target = katalogHref(appliedQuery, page, filters);
    if (`${window.location.pathname}${window.location.search}` !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [ready, appliedQuery, page, filters]);

  function scrollToResults() {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      document.getElementById("hasil-katalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function runSearch(rawQuery: string, nextFilters: CatalogFilters = filters) {
    setQuery(rawQuery.trim());
    setAppliedQuery(rawQuery.trim());
    setFilters(nextFilters);
    setPage(1);
    setSuggestOpen(false);
    scrollToResults();
  }

  function submitSearch(event?: React.FormEvent) {
    event?.preventDefault();
    runSearch(query);
  }

  /** Aktifkan/nonaktifkan satu nilai filter. */
  function toggleFilter(key: keyof CatalogFilters, value: string) {
    const isActive = filters[key] === value;
    const next: CatalogFilters = { ...filters };
    if (isActive) delete next[key];
    else next[key] = value;
    setFilters(next);
    setPage(1);
    scrollToResults();
  }

  function clearFilters() {
    setFilters({});
    setPage(1);
  }

  const estimatedPages = Math.min(Math.max(Math.ceil(result.total / PAGE_SIZE), 1), CATALOG_MAX_PAGE);
  const activeTopic = useMemo(
    () => POPULAR_TOPICS.find((topic) => topic.query.toLowerCase() === appliedQuery.toLowerCase()),
    [appliedQuery],
  );
  const relatedTopics = result.tagFacets.filter(
    (facet) => facet.tag.toLowerCase() !== appliedQuery.toLowerCase(),
  );
  const filterChips = useMemo(() => {
    const chips: Array<{ key: keyof CatalogFilters; value: string; label: string }> = [];
    if (filters.kategori) chips.push({ key: "kategori", value: filters.kategori, label: `Kategori: ${filters.kategori}` });
    if (filters.tahun) chips.push({ key: "tahun", value: filters.tahun, label: `Tahun: ${filters.tahun}` });
    if (filters.format) chips.push({ key: "format", value: filters.format, label: `Format: ${filters.format}` });
    if (filters.organisasi) chips.push({ key: "organisasi", value: filters.organisasi, label: `Instansi: ${filters.organisasi}` });
    if (filters.tag) chips.push({ key: "tag", value: filters.tag, label: `Topik: ${filters.tag}` });
    return chips;
  }, [filters]);

  const bulkExportUrl = useMemo(() => {
    const params = new URLSearchParams({ q: appliedQuery, pages: String(BULK_EXPORT_PAGES) });
    const filterQuery = filtersToQuery(filters);
    if (filterQuery) new URLSearchParams(filterQuery).forEach((value, key) => params.set(key, value));
    return `/api/katalog/ekspor?${params.toString()}`;
  }, [appliedQuery, filters]);

  function updateSuggestions(value: string) {
    setQuery(value);
    const next = suggestQueries(value, POPULAR_TOPICS.map((topic) => topic.label));
    setSuggestions(next);
    setSuggestOpen(next.length > 0);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        accent="emerald"
        icon={Database}
        title="Katalog Satu Data Indonesia"
        description="Telusuri dataset resmi lintas instansi dari data.go.id — cari topik, lalu saring per kategori, tahun, format, atau instansi."
        right={
          <div className="flex items-center gap-2">
            <Link
              href="/koleksi"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Bookmark size={12} /> Koleksi ({savedCount})
            </Link>
            <SourceBadge source={source} />
          </div>
        }
      />

      {/* ---------------- Pencarian ---------------- */}
      <Card className="p-4">
        <form onSubmit={submitSearch} className="flex gap-2">
          <div className="relative flex-1" ref={searchBoxRef}>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => updateSuggestions(event.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setSuggestOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSuggestOpen(false);
              }}
              placeholder="Cari topik dataset — mis. 'pangan', 'kemiskinan', 'stunting'…"
              aria-label="Kata kunci pencarian dataset"
              aria-autocomplete="list"
              aria-expanded={suggestOpen}
              className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900"
            />
            {query ? (
              <button
                type="button"
                aria-label="Hapus kata kunci"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setSuggestOpen(false);
                  if (appliedQuery || filterChips.length > 0) runSearch("", {});
                }}
                className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <X size={14} />
              </button>
            ) : null}

            {suggestOpen && suggestions.length > 0 ? (
              <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-1 shadow-soft dark:border-zinc-700/70 dark:bg-zinc-900">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => runSearch(suggestion)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-emerald-50 dark:text-zinc-200 dark:hover:bg-emerald-500/10"
                    >
                      <Search size={12} className="text-zinc-400" />
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            disabled={loading}
          >
            Cari
          </button>
        </form>

        {/* Chip topik: satu klik = langsung mencari topik tersebut */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">topik cepat:</span>
          {POPULAR_TOPICS.map((topic) => {
            const active = activeTopic?.query === topic.query;
            return (
              <button
                key={topic.query}
                type="button"
                onClick={() => runSearch(topic.query, {})}
                aria-pressed={active}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-zinc-100/80 text-zinc-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300"
                }`}
              >
                {topic.label}
              </button>
            );
          })}
          {appliedQuery || filterChips.length > 0 ? (
            <>
              <span className="mx-1 text-zinc-300 dark:text-zinc-600">|</span>
              <button
                type="button"
                onClick={() => runSearch("", {})}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <RotateCcw size={11} /> semua dataset
              </button>
            </>
          ) : null}
        </div>

        {loadHistory().length > 0 && !appliedQuery ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">terakhir:</span>
            {loadHistory()
              .slice(0, 5)
              .map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => runSearch(item, filters)}
                  className="rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-[11px] text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {item}
                </button>
              ))}
          </div>
        ) : null}
      </Card>

      {/* ---------------- Filter facet ---------------- */}
      {!loading && (facetOptions.kategori.length > 0 || facetOptions.tahun.length > 0 || facetOptions.format.length > 0 || facetOptions.organisasi.length > 0) ? (
        <Card>
          <CardHeader
            title="Saring hasil"
            subtitle="Filter dikirim langsung ke portal Satu Data, jadi totalnya ikut menyesuaikan."
            right={
              filterChips.length > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-emerald-700 dark:text-zinc-400"
                >
                  <RotateCcw size={11} /> hapus {filterChips.length} filter
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                  <Filter size={11} /> {filterChips.length} aktif
                </span>
              )
            }
          />
          <div className="space-y-3 px-5 py-4">
            <FacetRow
              label="Kategori"
              icon={Tag}
              facets={facetOptions.kategori}
              activeValue={filters.kategori}
              expanded={Boolean(showAllFacets.kategori)}
              onToggleExpand={() => setShowAllFacets((prev) => ({ ...prev, kategori: !prev.kategori }))}
              onPick={(value) => toggleFilter("kategori", value)}
            />
            <FacetRow
              label="Tahun"
              icon={CalendarDays}
              facets={facetOptions.tahun}
              activeValue={filters.tahun}
              expanded={Boolean(showAllFacets.tahun)}
              onToggleExpand={() => setShowAllFacets((prev) => ({ ...prev, tahun: !prev.tahun }))}
              onPick={(value) => toggleFilter("tahun", value)}
            />
            <FacetRow
              label="Format"
              icon={FileSpreadsheet}
              facets={facetOptions.format}
              activeValue={filters.format}
              expanded={Boolean(showAllFacets.format)}
              onToggleExpand={() => setShowAllFacets((prev) => ({ ...prev, format: !prev.format }))}
              onPick={(value) => toggleFilter("format", value)}
            />
            <FacetRow
              label="Instansi"
              icon={Database}
              facets={facetOptions.organisasi}
              activeValue={filters.organisasi}
              expanded={Boolean(showAllFacets.organisasi)}
              onToggleExpand={() => setShowAllFacets((prev) => ({ ...prev, organisasi: !prev.organisasi }))}
              onPick={(value) => toggleFilter("organisasi", value)}
            />
          </div>
        </Card>
      ) : null}

      {/* ---------------- Topik terkait ---------------- */}
      {!loading && relatedTopics.length > 0 ? (
        <Card>
          <CardHeader
            title="Topik terkait hasil pencarian"
            subtitle="Klik topik untuk mempersempit pencarian ke topik tersebut."
          />
          <div className="flex flex-wrap gap-1.5 px-5 py-4">
            {relatedTopics.map((facet) => (
              <button
                key={facet.tag}
                type="button"
                onClick={() => runSearch(facet.tag, filters)}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
              >
                <Tag size={11} />
                {facet.tag}
                <span className="tabular-nums text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
                  {formatNumber(facet.count)}
                </span>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {/* ---------------- Hasil ---------------- */}
      <div id="hasil-katalog" className="scroll-mt-24" />
      <Card>
        <CardHeader
          title={
            loading
              ? "Memuat…"
              : failed
                ? "Pencarian gagal"
                : result.total > 0
                  ? `${formatNumber(result.total)} dataset ditemukan`
                  : "Hasil pencarian"
          }
          subtitle={`halaman ${page} · ±${PAGE_SIZE} dataset per halaman${appliedQuery ? ` · kueri "${appliedQuery}"` : " · semua dataset"}${
            filterChips.length > 0 ? ` · ${filterChips.length} filter` : ""
          }`}
          right={
            !loading && !failed && result.datasets.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadCsv(result.datasets, appliedQuery)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  title="Unduh 20 dataset halaman ini"
                >
                  <FileDown size={13} /> CSV halaman ini
                </button>
                <a
                  href={bulkExportUrl}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  title={`Unduh ±${BULK_EXPORT_PAGES * PAGE_SIZE} dataset pertama`}
                >
                  <FileDown size={13} /> CSV ±{BULK_EXPORT_PAGES * PAGE_SIZE} dataset
                </a>
              </div>
            ) : undefined
          }
        />

        {filterChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <Filter size={11} /> filter aktif:
            </span>
            {filterChips.map((chip) => (
              <button
                key={`${chip.key}-${chip.value}`}
                type="button"
                onClick={() => toggleFilter(chip.key, chip.value)}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
              >
                {chip.label}
                <X size={10} />
              </button>
            ))}
          </div>
        ) : null}

        <div className={`divide-y divide-zinc-100 dark:divide-zinc-800 ${loading ? "hidden" : ""}`}>
          {result.datasets.map((dataset) => (
            <article key={dataset.name} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link
                  href={`/katalog/${dataset.name}`}
                  className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {dataset.title}
                </Link>
                {dataset.organization ? <Badge tone="blue">{dataset.organization}</Badge> : null}
              </div>
              {dataset.notes ? (
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {truncate(dataset.notes)}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
                {dataset.tags && dataset.tags.length > 0 ? (
                  <span className="flex flex-wrap gap-1">
                    {dataset.tags.slice(0, 5).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => runSearch(tag, filters)}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 transition hover:bg-emerald-100 hover:text-emerald-700 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {tag}
                      </button>
                    ))}
                  </span>
                ) : null}
                {typeof dataset.numResources === "number" ? <span>{dataset.numResources} resource</span> : null}
                <Link href={`/katalog/${dataset.name}`} className="hover:text-emerald-600">
                  Detail dataset
                </Link>
                <a
                  href={dataset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-emerald-600"
                >
                  data.go.id <ExternalLink size={11} />
                </a>
                <span className="ml-auto">
                  <SaveButton
                    item={{
                      name: dataset.name,
                      title: dataset.title,
                      organization: dataset.organization,
                      url: dataset.url,
                      tags: dataset.tags ?? [],
                    }}
                  />
                </span>
              </div>
            </article>
          ))}
        </div>

        {!loading && !failed && result.datasets.length === 0 ? (
          <EmptyState
            title={appliedQuery ? `Tidak ada dataset untuk "${appliedQuery}"` : "Belum ada dataset yang ditampilkan"}
            description={
              appliedQuery
                ? "Coba kata kunci lain, longgarkan filter, atau pilih salah satu topik di bawah ini."
                : "Ketik topik yang ingin ditelusuri, misalnya 'pangan' atau 'kemiskinan'."
            }
          >
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {filterChips.length > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Hapus filter
                </button>
              ) : null}
              {POPULAR_TOPICS.slice(0, 6).map((topic) => (
                <button
                  key={topic.query}
                  type="button"
                  onClick={() => runSearch(topic.query, {})}
                  className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </EmptyState>
        ) : null}

        {failed ? (
          <EmptyState
            title="Gagal menghubungi data.go.id"
            description="Portal Satu Data Indonesia tidak merespons dengan lengkap. Coba lagi — permintaan akan diulang otomatis."
          >
            <button
              type="button"
              onClick={() => void load(appliedQuery, page, filters)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <RotateCcw size={13} /> Coba lagi
            </button>
          </EmptyState>
        ) : null}

        {loading ? (
          <div className="space-y-3 px-5 py-6">
            <p className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <Loader2 className="animate-spin" size={14} /> Mengambil hasil dari data.go.id…
            </p>
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-3.5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
                style={{ width: `${92 - row * 9}%` }}
              />
            ))}
          </div>
        ) : null}

        {source === "fixture" && !loading ? (
          <p className="flex items-start gap-2 border-t border-amber-100 bg-amber-50/70 px-5 py-3 text-[11px] text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            Sumber resmi tidak dapat dijangkau — menampilkan data contoh bawaan aplikasi.
          </p>
        ) : null}

        {!loading && result.datasets.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 text-sm dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              ← Sebelumnya
            </button>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span aria-live="polite" aria-atomic="true">
                halaman {page} dari ±{estimatedPages.toLocaleString("id-ID")}
              </span>
              {estimatedPages > 3 ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const target = Number.parseInt(pageJump, 10);
                    if (!Number.isFinite(target)) return;
                    setPage(Math.min(Math.max(target, 1), estimatedPages));
                    setPageJump("");
                  }}
                  className="flex items-center gap-1"
                >
                  <label htmlFor="lompat-halaman" className="sr-only">
                    Lompat ke halaman
                  </label>
                  <input
                    id="lompat-halaman"
                    type="number"
                    min={1}
                    max={estimatedPages}
                    inputMode="numeric"
                    value={pageJump}
                    onChange={(event) => setPageJump(event.target.value)}
                    placeholder="ke-…"
                    className="w-16 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] tabular-nums outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Lompat
                  </button>
                </form>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, estimatedPages))}
              disabled={loading || page >= estimatedPages}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Berikutnya →
            </button>
          </div>
        ) : null}

        {!loading && result.datasets.length === 0 && result.total > 0 && page > 1 ? (
          <div className="border-t border-zinc-100 px-5 py-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Halaman {page} kosong walau total {formatNumber(result.total)} dataset. Portal kadang membalas halaman dalam
            tanpa isi —{" "}
            <button type="button" onClick={() => setPage(1)} className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              kembali ke halaman 1
            </button>{" "}
            atau persempit kueri.
          </div>
        ) : null}
      </Card>

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
        Tip: pencarian mengikuti indeks portal data.go.id. Kalau hasilnya kosong padahal topiknya umum, coba kata yang
        lebih pendek (mis. <em>pangan</em> bukan <em>ketahanan pangan nasional</em>) atau lepaskan filter.
      </p>
    </div>
  );
}

/* ------------------------------- Sub-komponen ------------------------------ */

function FacetRow({
  label,
  icon: Icon,
  facets,
  activeValue,
  expanded,
  onToggleExpand,
  onPick,
}: {
  label: string;
  icon: typeof Tag;
  facets: Facet[];
  activeValue?: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onPick: (value: string) => void;
}) {
  if (facets.length === 0) return null;
  const visible = expanded ? facets : facets.slice(0, 8);
  const hiddenCount = facets.length - visible.length;

  return (
    <div className="flex flex-wrap items-start gap-2">
      <span className="mt-1 inline-flex w-24 shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        <Icon size={11} /> {label}
      </span>
      <div className="flex flex-1 flex-wrap gap-1.5">
        {visible.map((facet) => {
          const active = activeValue === facet.value;
          return (
            <button
              key={facet.value}
              type="button"
              onClick={() => onPick(facet.value)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                active
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-emerald-900/40"
              }`}
            >
              <span className="max-w-[16rem] truncate">{facet.label}</span>
              <span className={`tabular-nums ${active ? "text-white/80" : "text-zinc-400"}`}>
                {formatNumber(facet.count)}
              </span>
            </button>
          );
        })}
        {hiddenCount > 0 || expanded ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-[11px] text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {expanded ? "lebih sedikit" : `+${hiddenCount} lagi`}
          </button>
        ) : null}
      </div>
    </div>
  );
}
