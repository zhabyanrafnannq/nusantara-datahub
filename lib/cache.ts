/**
 * Cache in-memory ber-TTL + deduplikasi permintaan yang berjalan bersamaan
 * (single-flight).
 *
 * Dipakai untuk memotong biaya scraper katalog (±300 KB HTML per permintaan
 * portal) dan untuk menghormati interval penyegaran per sumber data walau
 * halaman dirender sebagai ISR.
 *
 * Catatan: cache hidup per proses server. Di Netlify Functions proses bisa
 * berbeda tiap permintaan, jadi cache ini adalah optimasi, bukan jaminan.
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
/** Batas entri agar memori tidak tumbuh tanpa batas pada server panjang-umur. */
const MAX_ENTRIES = 300;

function sweep() {
  if (store.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
  // Masih terlalu besar: buang yang paling tua (Map menjaga urutan insert).
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next();
    if (oldest.done) break;
    store.delete(oldest.value);
  }
}

/** Ambil dari cache bila masih segar (tanpa memicu loader). */
export function peekCache<T>(key: string): T | undefined {
  const entry = store.get(key) as Entry<T> | undefined;
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Jalankan `loader` sekali per `key` selama `ttlMs`, dan satukan permintaan
 * paralel untuk kunci yang sama.
 */
export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = peekCache<T>(key);
  if (hit !== undefined) return hit;

  const running = inflight.get(key) as Promise<T> | undefined;
  if (running) return running;

  const promise = (async () => {
    try {
      const value = await loader();
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      sweep();
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/** Kosongkan cache (dipakai pengujian). */
export function clearCache() {
  store.clear();
  inflight.clear();
}

/** Statistik ringkas untuk debugging. */
export function cacheStats() {
  return { entries: store.size, inflight: inflight.size };
}
