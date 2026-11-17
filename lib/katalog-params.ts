import type { CatalogFilters, DatasetSummary } from "./types";

/** Nama parameter URL ↔ kunci filter internal. */
const FILTER_KEYS: Array<[keyof CatalogFilters, string]> = [
  ["kategori", "kategori"],
  ["tahun", "tahun"],
  ["format", "format"],
  ["organisasi", "organisasi"],
  ["tag", "tag"],
];

/** Baca filter katalog dari query string (dipakai API & halaman). */
export function readFilters(params: URLSearchParams): CatalogFilters {
  const filters: CatalogFilters = {};
  for (const [key, param] of FILTER_KEYS) {
    const value = params.get(param)?.trim();
    if (value) filters[key] = value;
  }
  return filters;
}

/** Serialisasi filter ke query string (tanpa kueri & halaman). */
export function filtersToQuery(filters: CatalogFilters): string {
  const search = new URLSearchParams();
  for (const [key, param] of FILTER_KEYS) {
    const value = filters[key];
    if (value) search.set(param, value);
  }
  return search.toString();
}

/** Berapa filter yang sedang aktif — untuk badge "filter aktif". */
export function countFilters(filters: CatalogFilters): number {
  return FILTER_KEYS.reduce((total, [key]) => (filters[key] ? total + 1 : total), 0);
}

/** Nama filter yang aktif, untuk ditampilkan di ringkasan hasil. */
export function activeFilterLabels(filters: CatalogFilters): string[] {
  const labels: string[] = [];
  if (filters.kategori) labels.push(`kategori ${filters.kategori}`);
  if (filters.tahun) labels.push(`tahun ${filters.tahun}`);
  if (filters.format) labels.push(`format ${filters.format}`);
  if (filters.organisasi) labels.push(`instansi ${filters.organisasi}`);
  if (filters.tag) labels.push(`topik ${filters.tag}`);
  return labels;
}

/** Escape satu sel CSV (RFC 4180). */
export function csvCell(value: string | number | undefined): string {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/** Bangun CSV dataset (dengan BOM agar Excel membaca UTF-8). */
export function datasetsToCsv(datasets: DatasetSummary[]): string {
  const header = ["judul", "organisasi", "tag", "slug", "url", "deskripsi"].map(csvCell).join(",");
  const rows = datasets.map((dataset) =>
    [
      csvCell(dataset.title),
      csvCell(dataset.organization),
      csvCell((dataset.tags ?? []).join("; ")),
      csvCell(dataset.name),
      csvCell(dataset.url),
      csvCell(dataset.notes.slice(0, 500)),
    ].join(","),
  );
  return `\uFEFF${[header, ...rows].join("\r\n")}`;
}

/** Nama berkas ekspor yang ramah (berdasarkan kueri/aktif filter). */
export function exportFilename(query: string, suffix = ""): string {
  const slug = query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const stamp = new Date().toISOString().slice(0, 10);
  return `satu-data-${slug || "semua"}${suffix}-${stamp}.csv`;
}
