import https from "node:https";
import type {
  CatalogFacets,
  CatalogFilters,
  CatalogResult,
  DatasetDetail,
  DatasetResource,
  DatasetSummary,
  Facet,
} from "./types";
import { cached, peekCache } from "./cache";

const SDI_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";

export const SDI_BASE_URL = "https://data.go.id";

/** Cache hasil pencarian: portal mahal (≈300 KB HTML + retry), hasil stabil. */
const SEARCH_TTL_MS = 5 * 60_000;
/** Cache detail dataset: isi halaman jarang berubah. */
const DETAIL_TTL_MS = 60 * 60_000;

/* --------------------------- Kesehatan scraper ---------------------------- */

interface SdiHealth {
  requests: number;
  retries: number;
  incompletePages: number;
  failures: number;
  lastIncompleteAt?: string;
  lastError?: string;
  lastErrorAt?: string;
}

const health: SdiHealth = { requests: 0, retries: 0, incompletePages: 0, failures: 0 };

/** Potret kesehatan scraper — dipakai /api/katalog/kesehatan untuk pemantauan. */
export function getSdiHealth(): SdiHealth & { ok: boolean; note: string } {
  const ok = health.failures === 0 || health.incompletePages / Math.max(health.requests, 1) < 0.5;
  return {
    ...health,
    ok,
    note: ok
      ? "Scraper portal berjalan normal."
      : "Banyak halaman tanpa payload — markup portal mungkin berubah, periksa parser.",
  };
}

/* ------------------------------ HTTP upstream ----------------------------- */

/**
 * Ambil HTML halaman portal data.go.id dengan node:https.
 * Server portal terobservasi sering menghentikan stream di tengah respons
 * (terutama via undici/fetch), sehingga percobaan ulang wajib agar andal.
 */
export function fetchSdiHtml(url: string, timeoutMs = 15_000, maxAttempts = 3): Promise<string> {
  let lastError: unknown = new Error("upstream gagal");

  const singleAttempt = () =>
    new Promise<string>((resolve, reject) => {
      const req = https.get(
        url,
        {
          headers: {
            "User-Agent": SDI_USER_AGENT,
            Accept: "text/html,application/xhtml+xml",
            "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
          },
          timeout: timeoutMs,
        },
        (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(chunk as Buffer));
          res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
          res.on("error", reject);
        },
      );
      req.on("timeout", () => req.destroy(new Error("socket timeout")));
      req.on("error", reject);
    });

  return (async () => {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await singleAttempt();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  })();
}

/* --------------------------------- URL ------------------------------------ */

/** Filter yang didukung portal (nama parameter persis seperti di portal). */
const FILTER_PARAMS: Array<[keyof CatalogFilters, string]> = [
  ["kategori", "kategori"],
  ["tahun", "prioritas_tahun"],
  ["format", "res_format"],
  ["organisasi", "organization"],
  ["tag", "tags"],
];

/** Bangun URL halaman pencarian portal, termasuk filter facet. */
export function buildSdiSearchUrl(query: string, page: number, filters: CatalogFilters = {}): string {
  const search = new URLSearchParams();
  const q = query.trim();
  if (q && q !== "*:*") {
    search.set("q", q);
  }
  for (const [key, param] of FILTER_PARAMS) {
    const value = filters[key];
    if (value && value.trim()) search.set(param, value.trim());
  }
  if (page > 1) {
    search.set("page", String(page));
  }
  const qs = search.toString();
  return `${SDI_BASE_URL}/dataset${qs ? `?${qs}` : ""}`;
}

/** URL halaman detail dataset. */
export function buildSdiDatasetUrl(slug: string): string {
  return `${SDI_BASE_URL}/dataset/dataset/${slug}`;
}

/* --------------------------- Ekstraksi payload ---------------------------- */

/**
 * Portal data.go.id (rebuild 2025/2026) dikirim sebagai Next.js App Router.
 * Halaman pencarian & detail menyertakan data UTUH di flight payload
 * (`self.__next_f.push([1,"…"])`), bukan di markup. Parsing payload jauh lebih
 * stabil daripada membaca kartu HTML, dan facet-nya benar-benar "topik".
 *
 * Server portal kadang membalas halaman "cangkang" tanpa payload (status 200
 * tapi SSR kosong) — `hasSearchPayload()` mendeteksi itu agar permintaan bisa
 * diulang alih-alih menampilkan 0 hasil.
 */
const NEXT_F_CHUNK_RE = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;

/** Penanda objek yang dicari di payload (pencarian & detail). */
const PAYLOAD_MARKER_RE = /"(?:results|resources)"\s*:\s*\[/;
/** Marker payload pencarian. */
const SEARCH_MARKER_RE = /"results"\s*:\s*\[/;
/** Marker halaman detail dataset. */
const SINGLE_RESOURCES_RE = /"resources"\s*:\s*\[/;

/**
 * Normalisasi level escape payload.
 *
 * Portal mengirim payload dengan escape 1-3 level tergantung versi build-nya
 * (kadang `"results":[`, kadang `\"results\":[`). Fungsi ini menurunkan level
 * escape sampai penanda objek ditemukan, maksimal 3 putaran.
 */
function normalizePayloadEscapes(text: string): string {
  if (!text) return text;
  let current = text;
  for (let level = 0; level < 3; level += 1) {
    if (PAYLOAD_MARKER_RE.test(current)) return current;
    current = current.replace(/\\\\/g, "\\").replace(/\\"/g, '"');
  }
  return current;
}

/** Gabungkan seluruh chunk flight Next.js menjadi satu string payload. */
export function decodeNextFlightPayload(html: string): string {
  const parts: string[] = [];
  NEXT_F_CHUNK_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = NEXT_F_CHUNK_RE.exec(html)) !== null) {
    try {
      parts.push(JSON.parse(match[1]) as string);
    } catch {
      // chunk rusak — lewati; chunk lain biasanya masih valid
    }
  }
  return normalizePayloadEscapes(parts.join(""));
}

/** Baca satu objek JSON mulai dari `start` (kurung kurawal seimbang, sadar string). */
function readJsonObject(text: string, start: number): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

interface RawSdiDataset {
  name?: string;
  title?: string;
  notes?: string;
  organization?: { title?: string; name?: string } | string;
  tags?: Array<{ name?: string }>;
  num_resources?: number;
  metadata_modified?: string;
}

interface RawFacetItem {
  name?: string;
  display_name?: string;
  count?: number;
}

interface RawSdiSearchResponse {
  count?: number;
  facets?: Record<string, unknown>;
  results?: RawSdiDataset[];
  search_facets?: Record<string, { items?: RawFacetItem[] }>;
}

/** True bila HTML memuat payload pencarian utuh (bukan cangkang SSR kosong). */
export function hasSearchPayload(html: string): boolean {
  return /"results"\s*:\s*\[/.test(decodeNextFlightPayload(html));
}

/** Ambil objek respons pencarian dari flight payload halaman. */
export function extractSdiSearchPayload(html: string): RawSdiSearchResponse | null {
  const payload = decodeNextFlightPayload(html);
  if (!SEARCH_MARKER_RE.test(payload)) return null;

  // Kumpulkan posisi kunci yang mungkin menjadi awal objek respons pencarian.
  const starts = new Set<number>();
  for (const marker of [/\{\s*"count"\s*:/g, /\{\s*"results"\s*:\s*\[/g]) {
    let match: RegExpExecArray | null;
    while ((match = marker.exec(payload)) !== null) {
      starts.add(match.index);
      if (starts.size > 60) break;
    }
  }

  for (const start of [...starts].sort((a, b) => a - b)) {
    const slice = readJsonObject(payload, start);
    if (!slice) continue;
    try {
      const parsed = JSON.parse(slice) as RawSdiSearchResponse;
      if (Array.isArray(parsed.results)) return parsed;
    } catch {
      // kandidat bukan JSON valid — coba kandidat berikutnya
    }
  }
  return null;
}

/* ------------------------------ Facet topik ------------------------------- */

/** Facet bertipe format file / tahun / nama sistem bukan "topik" pencarian. */
const FORMAT_TAGS = new Set([
  "xlsx", "csv", "pdf", "xls", "json", "geojson", "zip", "xml", "api", "tar.gz",
  "shapefile", "dxf", "txt", "doc", "docx", "ppt", "pptx", "tif", "png", "jpeg",
  "jpg", "shp", "kml", "ods", "rdf", "html", "xlsm", "parquet", "sql",
]);

/** Tag generik yang tidak informatif sebagai "topik". */
const STOP_TAGS = new Set([
  "data", "dataset", "agregat", "tahun", "indonesia", "kabupaten", "kota",
  "provinsi", "umum", "lainnya", "nasional", "laporan", "statistik",
]);

/** Pilih tampilan tag yang paling enak dibaca (spasi + huruf kapital). */
function preferredVariant(candidate: string, current: string): string {
  const score = (tag: string) => (tag.includes(" ") ? 2 : 0) + (/[A-Z]/.test(tag) ? 1 : 0);
  return score(candidate) > score(current) ? candidate : current;
}

function isTopicTag(tag: string): boolean {
  const clean = tag.trim();
  if (clean.length < 3 || clean.length > 40) return false;
  if (FORMAT_TAGS.has(clean.toLowerCase())) return false;
  if (STOP_TAGS.has(clean.toLowerCase())) return false;
  if (/^\d{1,4}$/.test(clean)) return false; // tahun / id, bukan topik
  if (/^(sipd|wms|sdi|api)$/i.test(clean)) return false; // nama sistem, bukan topik
  return /[a-z]/i.test(clean);
}

function buildTagFacets(raw: RawSdiSearchResponse, limit = 12): Array<{ tag: string; count: number }> {
  const best = new Map<string, { tag: string; count: number }>();

  const add = (name: string | undefined, count: number | undefined) => {
    if (!name || typeof count !== "number" || !Number.isFinite(count)) return;
    const tag = name.trim().replace(/\s+/g, " ");
    if (!isTopicTag(tag)) return;
    // Kunci tanpa spasi: "data agregat", "DataAgregat", dan "dataagregat"
    // adalah topik yang sama di portal — gabungkan, simpan varian terbaik.
    const key = tag.toLowerCase().replace(/\s+/g, "");
    const existing = best.get(key);
    if (!existing) {
      best.set(key, { tag, count });
      return;
    }
    const preferNew = count > existing.count;
    best.set(key, { tag: preferredVariant(tag, existing.tag), count: preferNew ? count : existing.count });
  };

  const items = raw.search_facets?.tags?.items;
  if (Array.isArray(items)) {
    for (const item of items) add(item.display_name ?? item.name, item.count);
  }

  const facetTags = raw.facets?.tags;
  if (facetTags && typeof facetTags === "object" && !Array.isArray(facetTags)) {
    for (const [name, count] of Object.entries(facetTags as Record<string, unknown>)) {
      if (typeof count === "number") add(name, count);
    }
  }

  return [...best.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

/* --------------------------- Facet filter hasil --------------------------- */

/** Ambil daftar facet `{value: count}` dari payload, dengan label manusiawi. */
function readFacet(
  raw: RawSdiSearchResponse,
  key: string,
  options: { limit: number; display?: Map<string, string>; skip?: (value: string) => boolean },
): Facet[] {
  const source = raw.facets?.[key];
  if (!source || typeof source !== "object" || Array.isArray(source)) return [];

  const facets: Facet[] = [];
  for (const [value, count] of Object.entries(source as Record<string, unknown>)) {
    if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) continue;
    const clean = value.trim();
    if (!clean) continue;
    if (options.skip?.(clean)) continue;
    facets.push({ value: clean, label: options.display?.get(clean.toLowerCase()) ?? clean, count });
  }
  return facets.sort((a, b) => b.count - a.count).slice(0, options.limit);
}

function buildFacets(raw: RawSdiSearchResponse): CatalogFacets {
  const display = new Map<string, string>();
  for (const item of raw.search_facets?.organization?.items ?? []) {
    if (item.name && item.display_name) display.set(item.name.toLowerCase(), item.display_name);
  }

  return {
    kategori: readFacet(raw, "kategori", { limit: 12 }),
    tahun: readFacet(raw, "prioritas_tahun", { limit: 8, skip: (value) => !/^\d{4}$/.test(value) }),
    format: readFacet(raw, "res_format", {
      limit: 10,
      display: new Map(
        Array.from(FORMAT_TAGS).map((tag) => [tag, tag.toUpperCase()]) as Array<[string, string]>,
      ),
    }),
    organisasi: readFacet(raw, "organization", { limit: 12, display }),
  };
}

/* ------------------------------ Parser utama ------------------------------ */

function parseStructured(payload: RawSdiSearchResponse): CatalogResult {
  const datasets: DatasetSummary[] = [];
  const seen = new Set<string>();

  for (const raw of payload.results ?? []) {
    const name = (raw.name ?? "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);

    const org =
      typeof raw.organization === "string"
        ? raw.organization
        : (raw.organization?.title ?? raw.organization?.name ?? "");

    datasets.push({
      name,
      title: (raw.title ?? "").trim() || name,
      notes: (raw.notes ?? "").trim(),
      organization: org.trim(),
      tags: (raw.tags ?? []).map((tag) => (tag.name ?? "").trim()).filter(Boolean).slice(0, 6),
      numResources: typeof raw.num_resources === "number" ? raw.num_resources : undefined,
      lastModified: raw.metadata_modified,
      url: buildSdiDatasetUrl(name),
    });
  }

  const total = typeof payload.count === "number" ? payload.count : datasets.length;
  return { total, datasets, tagFacets: buildTagFacets(payload), facets: buildFacets(payload) };
}

/* ---- Fallback: parser markup kartu (bila payload tidak lengkap) ----------- */

const CARD_RE = /<a[^>]*href="\/dataset\/dataset\/([a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/g;
const TITLE_RE = /<h3[^>]*>([\s\S]*?)<\/h3>/i;
const NOTES_RE = /<div[^>]*class="[^"]*text-muted-foreground[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
const ORG_RE = /<span[^>]*class="[^"]*text-blue-400[^"]*"[^>]*>([\s\S]*?)<\/span>/i;

/** "Dataset Ditemukan" counter di header halaman. */
const TOTAL_RE = /(\d[\d.,]*)\s*<\/span>\s*<span[^>]*>\s*Dataset Ditemukan/i;

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

const EMPTY_FACETS: CatalogFacets = { kategori: [], tahun: [], format: [], organisasi: [] };

function parseFromMarkup(html: string): CatalogResult {
  const datasets: DatasetSummary[] = [];
  const seen = new Set<string>();
  CARD_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = CARD_RE.exec(html)) !== null) {
    const [, slug, block] = match;
    if (seen.has(slug)) continue;
    seen.add(slug);

    const titleMatch = block.match(TITLE_RE);
    const notesMatch = block.match(NOTES_RE);
    const orgMatch = block.match(ORG_RE);
    const title = titleMatch ? stripTags(titleMatch[1]) : "";

    datasets.push({
      name: slug,
      title: title || slug,
      notes: notesMatch ? stripTags(notesMatch[1]) : "",
      organization: orgMatch ? stripTags(orgMatch[1]) : "",
      tags: [],
      numResources: undefined,
      url: buildSdiDatasetUrl(slug),
    });
  }

  const totalMatch = html.match(TOTAL_RE);
  const total = totalMatch ? parseInt(totalMatch[1].replace(/[.,]/g, ""), 10) : 0;
  return { total, datasets, tagFacets: [], facets: EMPTY_FACETS };
}

/** Parse HTML halaman pencarian menjadi CatalogResult. */
export function parseSdiSearchHtml(html: string): CatalogResult {
  const payload = extractSdiSearchPayload(html);
  if (payload) return parseStructured(payload);
  return parseFromMarkup(html);
}

/* ------------------------- Pemuatan dengan validasi ----------------------- */

export interface SdiSearchLoad {
  result: CatalogResult;
  /** Jumlah permintaan HTTP yang dipakai (1..maxAttempts). */
  attempts: number;
  /** True bila payload terstruktur ditemukan (bukan cangkang SSR). */
  complete: boolean;
  /** True bila hasil ini datang dari cache in-memory. */
  cached: boolean;
}

/**
 * Ambil hasil pencarian katalog dari portal dengan validasi payload + cache.
 *
 * Halaman "cangkang" (tanpa payload) diulang sampai `maxAttempts` sebelum
 * menyerahkan hasil terakhir — jauh lebih baik daripada menampilkan "0 dataset"
 * untuk kueri yang sebenarnya valid.
 */
export async function loadSdiSearch(
  query: string,
  page: number,
  filters: CatalogFilters = {},
  maxAttempts = 4,
): Promise<SdiSearchLoad> {
  const filterKey = FILTER_PARAMS.map(([key]) => (filters[key] ?? "").trim()).join("|");
  const cacheKey = `sdi:search:${query.trim().toLowerCase()}|${page}|${filterKey}`;

  const hit = peekCache<SdiSearchLoad>(cacheKey);
  if (hit) return { ...hit, cached: true };

  return cached(cacheKey, SEARCH_TTL_MS, async () => {
    health.requests += 1;
    const url = buildSdiSearchUrl(query, page, filters);
    let last: { result: CatalogResult; complete: boolean } | null = null;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const html = await fetchSdiHtml(url, 15_000, 2);
        const complete = hasSearchPayload(html);
        const result = parseSdiSearchHtml(html);
        last = { result, complete };
        if (complete) {
          return { result, attempts: attempt, complete, cached: false };
        }
        // cangkang tanpa payload: ulangi (maks. maxAttempts)
        health.retries += 1;
      } catch (error) {
        lastError = error;
        health.retries += 1;
      }
    }

    health.incompletePages += 1;
    health.lastIncompleteAt = new Date().toISOString();
    console.warn(
      JSON.stringify({
        event: "katalog.parser.incomplete",
        query,
        page,
        filters,
        attempts: maxAttempts,
        datasets: last?.result.datasets.length ?? 0,
      }),
    );

    if (last) return { result: last.result, attempts: maxAttempts, complete: last.complete, cached: false };
    health.failures += 1;
    health.lastError = lastError instanceof Error ? lastError.message : String(lastError);
    health.lastErrorAt = new Date().toISOString();
    throw lastError instanceof Error ? lastError : new Error("pencarian katalog gagal");
  });
}

/* --------------------------- Detail dataset ------------------------------- */

interface RawSdiResource {
  name?: string;
  format?: string;
  url?: string;
  download?: string;
  description?: string;
  size?: number | string;
  last_modified?: string;
  metadata_modified?: string;
  url_status?: { ok?: boolean };
}

interface RawSdiPackage {
  name?: string;
  title?: string;
  notes?: string;
  organization?: { title?: string; image_url?: string };
  tags?: Array<{ name?: string }>;
  resources?: RawSdiResource[];
  extras?: Array<{ key?: string; value?: string }>;
  metadata_modified?: string;
  metadata_created?: string;
}

/** True bila HTML detail memuat objek paket dataset. */
export function hasPackagePayload(html: string): boolean {
  return SINGLE_RESOURCES_RE.test(decodeNextFlightPayload(html));
}

/** Ambil objek paket dataset (beserta daftar resource) dari flight payload. */
export function extractSdiPackagePayload(html: string): RawSdiPackage | null {
  const payload = decodeNextFlightPayload(html);
  const anchor = payload.search(SINGLE_RESOURCES_RE);
  if (anchor < 0) return null;

  // Coba `{` terdekat sebelum kunci "resources"; objek pembungkusnya biasanya
  // langsung di situ. Validasi dengan JSON.parse agar salah tebak tidak fatal.
  const candidates: number[] = [];
  let cursor = payload.lastIndexOf("{", anchor);
  for (let guard = 0; cursor >= 0 && guard < 150; guard += 1) {
    candidates.push(cursor);
    cursor = payload.lastIndexOf("{", cursor - 1);
  }

  for (const start of candidates) {
    const slice = readJsonObject(payload, start);
    if (!slice) continue;
    try {
      const parsed = JSON.parse(slice) as RawSdiPackage;
      if (Array.isArray(parsed.resources)) return parsed;
    } catch {
      // objek terpotong / bukan paket — coba kandidat berikutnya
    }
  }
  return null;
}

function normalizeResource(raw: RawSdiResource): DatasetResource | null {
  const url = (raw.download ?? raw.url ?? "").trim();
  if (!url) return null;
  const size = typeof raw.size === "number" ? raw.size : Number.parseInt(String(raw.size ?? ""), 10);
  return {
    name: (raw.name ?? "").trim() || url.split("/").pop() || "Berkas",
    format: (raw.format ?? "").trim().toUpperCase() || "LINK",
    url,
    description: raw.description?.trim() || undefined,
    size: Number.isFinite(size) && size > 0 ? size : undefined,
    lastModified: raw.last_modified ?? raw.metadata_modified ?? undefined,
    ok: raw.url_status?.ok,
  };
}

/** Parse HTML halaman detail menjadi DatasetDetail. */
export function parseSdiPackageHtml(html: string, slug: string): DatasetDetail | null {
  const raw = extractSdiPackagePayload(html);
  if (!raw) return null;

  const extras = new Map<string, string>();
  for (const extra of raw.extras ?? []) {
    if (extra.key && extra.value) extras.set(extra.key, extra.value);
  }

  return {
    name: (raw.name ?? slug).trim(),
    title: (raw.title ?? "").trim() || slug,
    notes: (raw.notes ?? "").trim(),
    organization: (raw.organization?.title ?? "").trim(),
    organizationImage: raw.organization?.image_url?.trim() || undefined,
    tags: (raw.tags ?? []).map((tag) => (tag.name ?? "").trim()).filter(Boolean),
    kategori: extras.get("kategori") || undefined,
    prioritasTahun: extras.get("prioritas_tahun") || undefined,
    lastModified: raw.metadata_modified,
    created: raw.metadata_created,
    resources: (raw.resources ?? [])
      .map(normalizeResource)
      .filter((resource): resource is DatasetResource => resource !== null),
    url: buildSdiDatasetUrl(raw.name ?? slug),
  };
}

/**
 * Ambil detail satu dataset (dengan validasi payload + cache 1 jam).
 * Mengembalikan `null` bila portal membalas halaman tanpa payload.
 */
export async function loadSdiDataset(slug: string, maxAttempts = 3): Promise<DatasetDetail | null> {
  const clean = slug.trim().toLowerCase();
  if (!/^[a-z0-9-]{2,120}$/.test(clean)) return null;

  return cached(`sdi:dataset:${clean}`, DETAIL_TTL_MS, async () => {
    health.requests += 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const html = await fetchSdiHtml(buildSdiDatasetUrl(clean), 15_000, 2);
        if (!hasPackagePayload(html)) {
          health.retries += 1;
          continue;
        }
        const detail = parseSdiPackageHtml(html, clean);
        if (detail) return detail;
      } catch (error) {
        health.retries += 1;
        health.lastError = error instanceof Error ? error.message : String(error);
        health.lastErrorAt = new Date().toISOString();
      }
    }
    health.incompletePages += 1;
    health.lastIncompleteAt = new Date().toISOString();
    return null;
  });
}
