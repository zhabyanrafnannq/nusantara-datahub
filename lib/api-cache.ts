/**
 * Header cache untuk route API yang isinya bergantung pada query string.
 *
 * MASALAH YANG DICEGAH (terjadi di Netlify):
 * Respons API kita memakai `Cache-Control: ... s-maxage=...`, dan Netlify
 * menyimpannya di cache CDN. Tanpa `Netlify-Vary`, cache key hanya memakai path
 * (+ parameter internal Next seperti `__nextDataReq`/`_rsc`), sehingga
 * `/api/geocoding?q=sukabumi` bisa disajikan hasil cache `?q=demak` — semua
 * pencarian mengembalikan kota yang sama. Di localhost tidak ada CDN, jadi
 * gejalanya tidak pernah muncul saat `npm run dev`.
 *
 * Solusi: setiap route menyatakan parameter query mana yang menentukan isi
 * respons lewat `Netlify-Vary: query=a|b|c`, sehingga cache key ikut berubah.
 * Respons juga memakai `Netlify-CDN-Cache-Control` (khusus CDN Netlify) dan
 * `Cache-Control: public, max-age=0, must-revalidate` untuk browser.
 */

export interface DynamicCacheOptions {
  /** Nama parameter query yang menentukan isi respons. */
  vary: string[];
  /** Umur cache di CDN (detik). `<= 0` berarti jangan di-cache. */
  ttlSeconds: number;
  /** Set `false` untuk memaksa `no-store` (mis. respons fallback/kosong). */
  cacheable?: boolean;
}

export function dynamicApiHeaders({ vary, ttlSeconds, cacheable = true }: DynamicCacheOptions): Record<string, string> {
  const varyValue = vary.filter(Boolean).join("|");
  const headers: Record<string, string> = {};

  // Selalu konsisten untuk URL yang sama (syarat Netlify-Vary).
  headers["Netlify-Vary"] = varyValue ? `query=${varyValue}` : "query";

  if (!cacheable || ttlSeconds <= 0) {
    headers["Cache-Control"] = "no-store";
    headers["Netlify-CDN-Cache-Control"] = "no-store";
    return headers;
  }

  headers["Cache-Control"] = "public, max-age=0, must-revalidate";
  headers["Netlify-CDN-Cache-Control"] = `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`;
  return headers;
}
