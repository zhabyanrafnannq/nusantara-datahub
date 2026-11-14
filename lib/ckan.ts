import https from "node:https";
import type { CatalogResult, DatasetSummary } from "./types";

const SDI_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";

/**
 * Ambil HTML halaman portal data.go.id dengan node:https + retry.
 * Server portal terobservasi sering menghentikan stream di tengah respons
 * (terutama via undici/fetch), sehingga percobaan ulang wajib agar andal.
 */
export function fetchSdiHtml(url: string, timeoutMs = 12_000, maxAttempts = 3): Promise<string> {
  let lastError: unknown = new Error("upstream gagal");

  const singleAttempt = () =>
    new Promise<string>((resolve, reject) => {
      const req = https.get(
        url,
        {
          headers: { "User-Agent": SDI_USER_AGENT, Accept: "text/html,application/xhtml+xml" },
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

/**
 * Katalog Satu Data Indonesia (data.go.id).
 *
 * CATATAN IMPLEMENTASI (penting):
 * Portal data.go.id di-rebuild pada 2025/2026 dari CKAN klasik menjadi aplikasi
 * Next.js. Endpoint CKAN publik (/api/3/action/package_search dst.) mengembalikan
 * 404, dan belum ada API pencarian publik yang didokumentasikan. Namun halaman
 * pencarian https://data.go.id/dataset?q=...&page=N tetap dirender penuh di
 * server (SSR) dengan kartu dataset yang stabil strukturnya, sehingga modul ini
 * mem-parsing SSR tersebut di sisi server aplikasi kita.
 *
 * Parser dibuat toleran: kalau markup berubah, hasil berupa hasil kosong
 * (bukan crash) dan lapisan sources.ts akan jatuh ke fixture.
 */
export const SDI_BASE_URL = "https://data.go.id";

/** Bangun URL halaman pencarian portal. */
export function buildSdiSearchUrl(query: string, page: number): string {
  const search = new URLSearchParams();
  const q = query.trim();
  if (q && q !== "*:*") {
    search.set("q", q);
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

/* ------------------------------ Util dasar -------------------------------- */

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

/* ------------------------------ Parser kartu ------------------------------ */

/** Blok kartu dataset: <a href="/dataset/dataset/<slug>"> ... </a> */
const CARD_RE = /<a[^>]*href="\/dataset\/dataset\/([a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/g;
const TITLE_RE = /<h3[^>]*>([\s\S]*?)<\/h3>/i;
const NOTES_RE = /<div[^>]*class="[^"]*text-muted-foreground[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
const ORG_RE = /<span[^>]*class="[^"]*text-blue-400[^"]*"[^>]*>([\s\S]*?)<\/span>/i;

/** "Dataset Ditemukan" counter di header halaman. */
const TOTAL_RE = /(\d[\d.,]*)\s*<\/span>\s*<span[^>]*>\s*Dataset Ditemukan/i;

/**
 * Topik populer pada flight payload (escape 1-3 level):
 * \"name\":\"<tag>\",\"count\":<n>
 */
const FACET_RE = /\\{1,3}"name\\{1,3}":\\{1,3}"([^"\\]{2,60})\\{1,3}",\\{1,3}"count\\{1,3}":(\d+)/g;

/** Facet bertipe format file bukan "topik" — disaring dari chart topik populer. */
const FORMAT_TAGS = new Set([
  "xlsx", "csv", "pdf", "xls", "json", "geojson", "zip", "xml", "api",
  "shapefile", "dxf", "txt", "doc", "docx", "ppt", "pptx", "tif", "png",
]);

export function parseSdiSearchHtml(html: string): CatalogResult {
  const datasets: DatasetSummary[] = [];
  CARD_RE.lastIndex = 0;
  const seen = new Set<string>();

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

  const facetCounts = new Map<string, number>();
  for (const facet of html.matchAll(FACET_RE)) {
    const tag = facet[1].trim();
    const count = parseInt(facet[2], 10);
    if (!tag || Number.isNaN(count)) continue;
    if (FORMAT_TAGS.has(tag.toLowerCase())) continue;
    facetCounts.set(tag, Math.max(facetCounts.get(tag) ?? 0, count));
  }
  const tagFacets = [...facetCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return { total, datasets, tagFacets };
}
