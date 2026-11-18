import { NextRequest } from "next/server";
import { searchCatalog } from "@/lib/sources";
import { datasetsToCsv, exportFilename, readFilters } from "@/lib/katalog-params";
import type { DatasetSummary } from "@/lib/types";

/** Batas halaman yang diambil sekaligus (20 dataset/halaman → ±500 baris). */
const MAX_PAGES = 25;

export const maxDuration = 30;

/**
 * Ekspor CSV banyak halaman sekaligus.
 *
 * `pages` dibatasi 1..25 karena tiap halaman berarti satu permintaan ke portal
 * (walau sebagian besar sudah tersimpan di cache proses).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim() ?? "";
  const filters = readFilters(params);
  const pages = Math.min(Math.max(Number.parseInt(params.get("pages") ?? "10", 10) || 10, 1), MAX_PAGES);

  const collected = new Map<string, DatasetSummary>();
  let total = 0;
  let fetchedPages = 0;

  for (let page = 1; page <= pages; page += 1) {
    const response = await searchCatalog({ q, page, filters });
    total = response.data.total;
    fetchedPages = page;
    if (response.data.datasets.length === 0) break;
    for (const dataset of response.data.datasets) {
      if (!collected.has(dataset.name)) collected.set(dataset.name, dataset);
    }
    if (collected.size >= total) break;
  }

  const csv = datasetsToCsv([...collected.values()]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(q, `-${fetchedPages}halaman`)}"`,
      "X-Total-Datasets": String(total),
      "X-Exported-Datasets": String(collected.size),
      // Berkas ini dibangun per permintaan: jangan pernah di-cache CDN.
      "Cache-Control": "no-store",
      "Netlify-Vary": "query=q|kategori|tahun|format|organisasi|tag|pages",
    },
  });
}
