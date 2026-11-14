import type { Quake, QuakeAnalytics } from "./types";

/**
 * Analitik gempa membutuhkan katalog bersejarah (90 hari) yang tidak disediakan
 * feed realtime BMKG (hanya 15 kejadian terakhir). Katalog global USGS
 * (earthquake.usgs.gov FDSN) keyless dan mencakup seluruh wilayah Indonesia,
 * sehingga dipakai untuk agregasi; kejadian realtime tetap dari BMKG.
 */
export const USGS_QUERY_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";

/** Bangun URL katalog USGS (CSV) untuk wilayah Indonesia, M≥4,5. */
export function buildUsgsUrl(days: number, endDate = new Date()): string {
  const end = new Date(endDate);
  const start = new Date(end);
  start.setDate(start.getDate() - Math.min(Math.max(days, 1), 365));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const search = new URLSearchParams({
    format: "csv",
    starttime: fmt(start),
    endtime: fmt(end),
    minmagnitude: "4.5",
    minlatitude: "-11.5",
    maxlatitude: "7.5",
    minlongitude: "93",
    maxlongitude: "141.5",
    orderby: "time-asc",
  });
  return `${USGS_QUERY_URL}?${search.toString()}`;
}

/** Kotak batas perkiraan wilayah Indonesia; urutan pengecekan penting. */
export const REGION_BOXES: Array<{ region: string; minLat: number; maxLat: number; minLon: number; maxLon: number }> = [
  { region: "Papua", minLat: -10.0, maxLat: 0.8, minLon: 130.5, maxLon: 141.5 },
  { region: "Bali & Nusa Tenggara", minLat: -11.5, maxLat: -7.8, minLon: 113.0, maxLon: 127.0 },
  { region: "Jawa", minLat: -9.2, maxLat: -5.0, minLon: 103.0, maxLon: 115.0 },
  { region: "Sulawesi", minLat: -7.8, maxLat: 5.5, minLon: 117.0, maxLon: 125.5 },
  { region: "Maluku", minLat: -9.0, maxLat: 4.5, minLon: 123.0, maxLon: 130.5 },
  { region: "Kalimantan", minLat: -5.5, maxLat: 5.5, minLon: 107.0, maxLon: 119.5 },
  { region: "Sumatera", minLat: -7.0, maxLat: 7.5, minLon: 93.0, maxLon: 107.0 },
];

/** Klasifikasi koordinat ke nama wilayah (kotak batas perkiraan). */
export function classifyRegion(latitude: number, longitude: number): string {
  for (const box of REGION_BOXES) {
    if (latitude >= box.minLat && latitude <= box.maxLat && longitude >= box.minLon && longitude <= box.maxLon) {
      return box.region;
    }
  }
  return "Perairan lain";
}

/**
 * Parse satu baris CSV dengan dukungan field berkutip (USGS membungkus
 * kolom place yang mengandung koma dengan tanda kutip ganda).
 */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

/** Parse seluruh CSV USGS menjadi daftar Quake dalam window waktu. */
export function parseUsgsCsv(csv: string, windowDays = 90): Quake[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const iTime = col("time");
  const iLat = col("latitude");
  const iLon = col("longitude");
  const iDepth = col("depth");
  const iMag = col("mag");
  const iPlace = col("place");

  const quakes: Quake[] = [];
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const timeMs = Date.parse(cells[iTime] ?? "");
    if (Number.isNaN(timeMs) || timeMs < cutoff) continue;
    const latitude = parseFloat(cells[iLat] ?? "");
    const longitude = parseFloat(cells[iLon] ?? "");
    const mag = parseFloat(cells[iMag] ?? "");
    if (![latitude, longitude, mag].every(Number.isFinite)) continue;
    quakes.push({
      datetime: new Date(timeMs).toISOString(),
      magnitude: mag,
      depthKm: parseFloat(cells[iDepth] ?? "") || 0,
      latitude,
      longitude,
      wilayah: (cells[iPlace] ?? "").trim(),
      region: classifyRegion(latitude, longitude),
    });
  }
  return quakes;
}

/** Bin histogram magnitude M4,5+. */
const MAG_BINS: Array<{ label: string; min: number; max: number }> = [
  { label: "4,5–4,9", min: 4.5, max: 5.0 },
  { label: "5,0–5,4", min: 5.0, max: 5.5 },
  { label: "5,5–5,9", min: 5.5, max: 6.0 },
  { label: "6,0–6,4", min: 6.0, max: 6.5 },
  { label: "≥6,5", min: 6.5, max: Infinity },
];

/** Agregasi kejadian menjadi statistik analitik. */
export function computeQuakeAnalytics(quakes: Quake[], windowDays = 90): QuakeAnalytics {
  const sorted = [...quakes].sort((a, b) => a.datetime.localeCompare(b.datetime));

  const magnitudeBins = MAG_BINS.map((bin) => ({
    label: bin.label,
    count: sorted.filter((q) => q.magnitude >= bin.min && q.magnitude < bin.max).length,
  }));

  const regionCounts = new Map<string, number>();
  for (const quake of sorted) {
    const region = quake.region ?? classifyRegion(quake.latitude, quake.longitude);
    regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
  }
  const byRegion = [...regionCounts.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  // Jumlah kejadian per hari untuk windowDays terakhir
  const daily = new Map<string, number>();
  for (const quake of sorted) {
    const date = quake.datetime.slice(0, 10);
    daily.set(date, (daily.get(date) ?? 0) + 1);
  }
  const dailyCounts: Array<{ date: string; count: number }> = [];
  const today = new Date();
  for (let i = windowDays - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyCounts.push({ date: key, count: daily.get(key) ?? 0 });
  }

  const biggest = sorted.length > 0 ? sorted.reduce((best, q) => (q.magnitude > best.magnitude ? q : best)) : null;

  return {
    windowDays,
    totalEvents: sorted.length,
    periodStart: sorted[0]?.datetime ?? "",
    periodEnd: sorted[sorted.length - 1]?.datetime ?? "",
    biggest: biggest
      ? { ...biggest, datetime: biggest.datetime, wilayah: biggest.wilayah || classifyRegion(biggest.latitude, biggest.longitude) }
      : null,
    magnitudeBins,
    byRegion,
    dailyCounts,
  };
}
