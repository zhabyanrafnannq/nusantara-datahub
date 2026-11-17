/**
 * Riwayat & saran pencarian katalog (localStorage).
 *
 * - `riwayat`: kueri terakhir yang dijalankan pengguna (maks. 8).
 * - `tag`: kata kunci yang pernah muncul sebagai facet — menjadi sumber
 *   autocomplete tanpa perlu memanggil portal lagi.
 */

const HISTORY_KEY = "ndh-katalog-riwayat";
const TAGS_KEY = "ndh-katalog-tag";
const MAX_HISTORY = 8;
const MAX_TAGS = 60;

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, items: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // abaikan: penyimpanan lokal bisa ditolak
  }
}

export function loadHistory(): string[] {
  return readList(HISTORY_KEY);
}

export function pushHistory(query: string): string[] {
  const clean = query.trim();
  if (!clean) return loadHistory();
  const next = [clean, ...loadHistory().filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, MAX_HISTORY);
  writeList(HISTORY_KEY, next);
  return next;
}

export function clearHistory(): string[] {
  writeList(HISTORY_KEY, []);
  return [];
}

/** Simpan tag hasil pencarian agar bisa disarankan lagi nanti. */
export function rememberTags(tags: string[]): void {
  const cleanTags = tags.map((tag) => tag.trim()).filter(Boolean);
  if (cleanTags.length === 0) return;
  const existing = readList(TAGS_KEY);
  const seen = new Set(existing.map((tag) => tag.toLowerCase()));
  const merged = [...existing];
  for (const tag of cleanTags) {
    if (!seen.has(tag.toLowerCase())) {
      merged.push(tag);
      seen.add(tag.toLowerCase());
    }
  }
  writeList(TAGS_KEY, merged.slice(0, MAX_TAGS));
}

export function loadTags(): string[] {
  return readList(TAGS_KEY);
}

/** Saran autocomplete: cocokkan awalan/substring dengan topik populer + riwayat + tag. */
export function suggestQueries(input: string, popular: string[], limit = 8): string[] {
  const needle = input.trim().toLowerCase();
  if (!needle) return [];
  const pool = [...loadHistory(), ...popular, ...loadTags()];
  const seen = new Set<string>();
  const starts: string[] = [];
  const contains: string[] = [];

  for (const candidate of pool) {
    const key = candidate.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (key === needle) continue;
    if (key.startsWith(needle)) starts.push(candidate);
    else if (key.includes(needle)) contains.push(candidate);
  }

  return [...starts, ...contains].slice(0, limit);
}
