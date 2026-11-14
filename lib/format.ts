/** Util pemformatan tampilan (bahasa Indonesia). */

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function formatRelative(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.round(months / 12)} tahun lalu`;
}

export function formatNumber(value: number | null | undefined, locale = "id-ID"): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

export function truncate(text: string, max = 180): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/** Ringkasan teks satu gempa untuk dibagikan (WhatsApp/laporan). */
export function formatQuakeSummary(quake: {
  magnitude: number;
  datetime: string;
  depthKm: number;
  wilayah: string;
  potensi?: string;
}): string {
  return (
    `GEMPA M${quake.magnitude.toFixed(1)} — ${quake.wilayah}\n` +
    `Waktu: ${formatDateTime(quake.datetime)} WIB\n` +
    `Kedalaman: ${quake.depthKm} km\n` +
    `${quake.potensi ?? ""}\n` +
    `Sumber: BMKG (via Nusantara DataHub)`
  ).trim();
}
