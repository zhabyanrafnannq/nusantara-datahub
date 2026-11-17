/**
 * Topik populer lintas modul — dipakai chip pencarian di halaman Ringkasan dan
 * Katalog. Setiap entri sudah diverifikasi punya ribuan dataset di data.go.id,
 * jadi klik chip selalu mendarat di hasil yang berisi.
 */
export interface PopularTopic {
  /** Label yang tampil di chip. */
  label: string;
  /** Kueri yang dikirim ke katalog (huruf kecil agar cocok dengan facet). */
  query: string;
}

export const POPULAR_TOPICS: PopularTopic[] = [
  { label: "Pangan", query: "pangan" },
  { label: "Kemiskinan", query: "kemiskinan" },
  { label: "Kesehatan", query: "kesehatan" },
  { label: "Pendidikan", query: "pendidikan" },
  { label: "Pertanian", query: "pertanian" },
  { label: "Kependudukan", query: "kependudukan" },
  { label: "Ekonomi", query: "ekonomi" },
  { label: "Tenaga kerja", query: "tenaga kerja" },
  { label: "Stunting", query: "stunting" },
  { label: "Iklim", query: "iklim" },
  { label: "Energi", query: "energi" },
  { label: "Inflasi", query: "inflasi" },
];

/** URL halaman katalog untuk sebuah topik/kueri. */
export function catalogUrl(query: string, page = 1): string {
  const search = new URLSearchParams();
  if (query.trim()) search.set("q", query.trim());
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `/katalog?${qs}` : "/katalog";
}
