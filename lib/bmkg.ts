import type { Quake } from "./types";

/**
 * Bentuk mentah JSON BMKG TEWS (data.bmkg.go.id/DataMKG/TEWS/*.json).
 * Struktur: { Infogempa: { gempa: {...} | [...] } }.
 * Kolom koordinat berformat "6.28 LS" / "102.10 BT" — perlu dikonversi ke desimal bertanda.
 */
export interface BmkgRawQuake {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string;
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi?: string;
  Dirasakan?: string;
  Shakemap?: string;
  Skala?: string;
}

interface BmkgEnvelope {
  Infogempa?: {
    gempa?: BmkgRawQuake | BmkgRawQuake[];
  };
}

/**
 * Konversi "6.28 LS" → -6.28 dan "102.10 BT" → 102.10.
 * Mendukung LS/S (selatan, negatif), LU/N (utara), BT/E (timur), BB/W (barat).
 */
export function parseCoordinate(raw: string): number {
  // Normalisasi koma desimal → titik (BMKG kadang memakai format "5,5").
  const trimmed = (raw ?? "").trim().replace(",", ".");
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*(LS|S|LU|N|BT|E|BB|W)?$/i);
  if (!match) {
    const fallback = parseFloat(trimmed);
    return Number.isFinite(fallback) ? fallback : NaN;
  }
  const value = parseFloat(match[1]);
  const hemisphere = (match[2] ?? "").toUpperCase();
  const isNegative = hemisphere === "LS" || hemisphere === "S" || hemisphere === "BB" || hemisphere === "W";
  return isNegative ? -Math.abs(value) : value;
}

/** "10 km" → 10 */
export function parseDepth(raw: string): number {
  const match = (raw ?? "").match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : NaN;
}

/** Gabungkan Tanggal + Jam menjadi ISO 8601; jika DateTime tersedia, gunakan itu. */
export function parseDatetime(raw: BmkgRawQuake): string {
  if (raw.DateTime && /^\d{4}-\d{2}-\d{2}T/.test(raw.DateTime)) {
    return raw.DateTime;
  }
  // BMKG: Tanggal "13 Nov 2026", Jam "10:15:22 WIB"
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", mei: "05", jun: "06",
    jul: "07", agu: "08", sep: "09", okt: "10", nov: "11", des: "12",
  };
  const dateMatch = (raw.Tanggal ?? "").match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  const timeMatch = (raw.Jam ?? "").match(/(\d{1,2}):(\d{2}):?(\d{2})?/);
  if (dateMatch && timeMatch) {
    const month = months[dateMatch[2].toLowerCase()];
    if (month) {
      const pad = (n: string) => n.padStart(2, "0");
      return `${dateMatch[3]}-${month}-${pad(dateMatch[1])}T${pad(timeMatch[1])}:${pad(timeMatch[2])}:${pad(timeMatch[3] ?? "00")}+07:00`;
    }
  }
  return "";
}

export function normalizeBmkgQuake(raw: BmkgRawQuake): Quake {
  const magnitude = parseFloat((raw.Magnitude ?? "").replace(",", "."));
  return {
    datetime: parseDatetime(raw),
    magnitude: Number.isFinite(magnitude) ? magnitude : NaN,
    depthKm: parseDepth(raw.Kedalaman),
    latitude: parseCoordinate(raw.Lintang),
    longitude: parseCoordinate(raw.Bujur),
    wilayah: (raw.Wilayah ?? "").trim(),
    potensi: raw.Potensi?.trim() || undefined,
    dirasakan: raw.Dirasakan?.trim() || undefined,
    shakemap: raw.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${raw.Shakemap}` : undefined,
    mmiScale: raw.Skala?.trim() || undefined,
  };
}

/** Urutkan gempa terbaru dulu berdasarkan datetime. */
export function sortQuakesByNewest(quakes: Quake[]): Quake[] {
  return [...quakes].sort((a, b) => (b.datetime || "").localeCompare(a.datetime || ""));
}

/**
 * Normalisasi seluruh envelope BMKG. Menangani dua bentuk:
 * autogempa.json (gempa = object) dan gempaterkini/gempadirasakan.json (gempa = array).
 */
export function normalizeBmkgEnvelope(payload: unknown): Quake[] {
  const envelope = payload as BmkgEnvelope;
  const gempa = envelope?.Infogempa?.gempa;
  if (!gempa) {
    return [];
  }
  const raws = Array.isArray(gempa) ? gempa : [gempa];
  return sortQuakesByNewest(raws.map(normalizeBmkgQuake).filter((q) => Number.isFinite(q.latitude) && Number.isFinite(q.longitude)));
}
