/**
 * Batas paginasi katalog.
 *
 * Portal data.go.id masih melayani halaman dalam (diuji: `?q=pangan&page=700`
 * tetap mengembalikan 20 dataset), tetapi halaman melewati jumlah hasil akan
 * membalas "count" normal dengan daftar kosong. Karena itu UI membatasi
 * navigasi ke `min(total/halaman, MAX_PAGE)` dan API memakai batas yang sama
 * supaya nomor halaman yang diketik pengguna tidak dipotong diam-diam.
 */
export const CATALOG_PAGE_SIZE = 20;
export const CATALOG_MAX_PAGE = 1000;

/** Ambil nomor halaman dari query string, dijepit ke rentang yang sah. */
export function clampCatalogPage(value: number | string | null | undefined): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? "1"), 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(Math.trunc(parsed), 1), CATALOG_MAX_PAGE);
}
