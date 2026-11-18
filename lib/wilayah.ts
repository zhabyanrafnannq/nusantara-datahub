import type { GeoPlace } from "./types";
import { WILAYAH_ROWS } from "./wilayah-data";

/**
 * Pencarian kabupaten/kota Indonesia dari direktori lokal (514 wilayah).
 *
 * Direktori ini dibundel di repo, jadi pencarian "demak", "sukabumi", atau
 * kabupaten/kota mana pun tidak bergantung pada geocoder pihak ketiga. Dipakai
 * sebagai hasil utama, lalu digabung dengan hasil geocoder Open-Meteo untuk
 * nama yang lebih rinci (kecamatan/kelurahan, nama populer).
 */

/** Normalisasi untuk pencocokan: huruf kecil, tanpa diakritik, tanpa tanda baca. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

interface WilayahEntry {
  id: number;
  /** Nama lengkap, mis. "Kabupaten Demak". */
  nama: string;
  provinsi: string;
  latitude: number;
  longitude: number;
  tipe: "kabupaten" | "kota";
  normalizedNama: string;
  /** Nama tanpa prefiks "Kabupaten"/"Kota", mis. "demak". */
  normalizedBare: string;
  haystack: string;
}

const ENTRIES: WilayahEntry[] = WILAYAH_ROWS.map((row) => {
  const [kode, nama, provinsi, , latitude, longitude, tipe] = row;
  const bare = nama.replace(/^(Kabupaten|Kota)\s+/i, "");
  return {
    id: Number.parseInt(kode, 10) || 0,
    nama,
    provinsi,
    latitude,
    longitude,
    tipe,
    normalizedNama: normalize(nama),
    normalizedBare: normalize(bare),
    haystack: normalize(`${nama} ${provinsi}`),
  };
});

const PREFIX_RE = /^(kabupaten|kota)\s+/;

function scoreOf(entry: WilayahEntry, query: string, bareQuery: string, wantsKota: boolean, wantsKabupaten: boolean): number {
  let score = 0;
  if (entry.normalizedNama === query || entry.normalizedBare === bareQuery) score = 100;
  else if (entry.normalizedBare.startsWith(bareQuery) || entry.normalizedNama.startsWith(query)) score = 80;
  else if (entry.normalizedBare.includes(bareQuery) || entry.normalizedNama.includes(query)) score = 60;
  else if (entry.haystack.includes(query)) score = 40;
  else {
    const tokens = bareQuery.split(" ").filter((token) => token.length > 2);
    if (tokens.length > 0 && tokens.every((token) => entry.haystack.includes(token))) score = 25;
  }
  if (score === 0) return 0;
  // Prefiks eksplisit ("kota …"/"kabupaten …") menang atas tipe lain.
  if (wantsKota && entry.tipe === "kota") score += 6;
  if (wantsKabupaten && entry.tipe === "kabupaten") score += 6;
  return score;
}

/** Cari kabupaten/kota berdasarkan nama wilayah atau provinsi. */
export function searchWilayah(rawQuery: string, limit = 6): GeoPlace[] {
  const query = normalize(rawQuery);
  if (query.length < 2) return [];

  const wantsKota = query.startsWith("kota ");
  const wantsKabupaten = query.startsWith("kabupaten ");
  const bareQuery = query.replace(PREFIX_RE, "");

  const hits = ENTRIES.map((entry) => ({ entry, score: scoreOf(entry, query, bareQuery, wantsKota, wantsKabupaten) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.nama.localeCompare(b.entry.nama, "id"))
    .slice(0, limit);

  return hits.map(({ entry }) => ({
    id: entry.id,
    // Nama sudah lengkap ("Kabupaten Demak"), jadi admin2 dikosongkan agar UI
    // tidak menampilkan "Kabupaten Demak — Kabupaten · Jawa Tengah".
    name: entry.nama,
    admin1: entry.provinsi,
    latitude: entry.latitude,
    longitude: entry.longitude,
    timezone: "Asia/Jakarta",
  }));
}

/** Jumlah wilayah yang terindeks (dipakai UI/tes sebagai dokumentasi). */
export const WILAYAH_COUNT = ENTRIES.length;
