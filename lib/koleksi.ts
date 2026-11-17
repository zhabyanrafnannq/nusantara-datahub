/**
 * Koleksi dataset yang disimpan pengguna (bookmark) — disimpan di localStorage.
 * Aman dipakai di klien saja; semua akses dibungkus try/catch agar mode privat
 * atau kuota penuh tidak merusak halaman.
 */

export interface SavedDataset {
  name: string;
  title: string;
  organization: string;
  url: string;
  tags: string[];
  savedAt: string;
}

const KEY = "ndh-katalog-koleksi";
const EVENT = "ndh-koleksi-changed";

function read(): SavedDataset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedDataset[]) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.name === "string") : [];
  } catch {
    return [];
  }
}

function write(items: SavedDataset[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // penyimpanan ditolak (mode privat / kuota) — abaikan dengan halus
  }
  window.dispatchEvent(new Event(EVENT));
}

export function loadSaved(): SavedDataset[] {
  return read();
}

export function isSaved(name: string): boolean {
  return read().some((item) => item.name === name);
}

export function toggleSaved(item: Omit<SavedDataset, "savedAt">): SavedDataset[] {
  const current = read();
  const exists = current.some((entry) => entry.name === item.name);
  const next = exists
    ? current.filter((entry) => entry.name !== item.name)
    : [{ ...item, savedAt: new Date().toISOString() }, ...current];
  write(next);
  return next;
}

export function removeSaved(name: string): SavedDataset[] {
  const next = read().filter((entry) => entry.name !== name);
  write(next);
  return next;
}

export function clearSaved(): SavedDataset[] {
  write([]);
  return [];
}

/** Berlangganan perubahan koleksi (termasuk dari tab lain). */
export function subscribeSaved(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
