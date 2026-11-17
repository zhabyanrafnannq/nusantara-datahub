/**
 * Tipe domain Nusantara DataHub.
 * Semua data mentah dari upstream (BMKG, CKAN Satu Data, BPS) dinormalisasi
 * ke tipe-tipe ini sebelum dikonsumsi UI.
 */

/** Sumber data sebuah respons: live (upstream) atau fixture (data contoh). */
export type DataSource = "live" | "fixture";

export interface ApiResponse<T> {
  source: DataSource;
  /** ISO timestamp kapan data ini diambil/disajikan. */
  fetchedAt: string;
  data: T;
}

/* ---------------------------------- Gempa --------------------------------- */

export interface Quake {
  /** Waktu kejadian gempa dalam ISO 8601 (UTC+7 disimpan apa adanya dari BMKG). */
  datetime: string;
  magnitude: number;
  /** Kedalaman dalam km. */
  depthKm: number;
  /** Koordinat desimal: lintang selatan bernilai negatif, bujur barat negatif. */
  latitude: number;
  longitude: number;
  /** Teks lokasi humanis, mis. "Pusat gempa berada di darat 12 km BaratLaut Sukabumi". */
  wilayah: string;
  /** Deskripsi potensi tsunami (biasanya "Tidak berpotensi tsunami"). */
  potensi?: string;
  /** Nama kota/daerah yang merasakan gempa (untuk gempa dirasakan). */
  dirasakan?: string;
  /** URL gambar shakemap dari BMKG. */
  shakemap?: string;
  /** Skala MMI gempa dirasakan, mis. "III-IV". */
  mmiScale?: string;
  /** Wilayah Indonesia hasil klasifikasi kotak batas (khusus katalog analitik). */
  region?: string;
}

/* ------------------------------- Satu Data -------------------------------- */

export interface DatasetSummary {
  name: string;
  title: string;
  /** Deskripsi singkat dataset (boleh kosong). */
  notes: string;
  /** Nama organisasi penerbit, mis. "Kementerian Kesehatan". */
  organization: string;
  tags: string[];
  /** Jumlah resource/unduhan yang tercatat (jika tersedia dari sumber). */
  numResources?: number;
  /** ISO timestamp pembaruan terakhir. */
  lastModified?: string;
  url: string;
}

/** Satu nilai facet (kategori, tahun, format file, atau instansi). */
export interface Facet {
  /** Nilai mentah yang dikirim balik ke portal sebagai parameter filter. */
  value: string;
  /** Label manusiawi untuk ditampilkan. */
  label: string;
  count: number;
}

/** Facet yang menyertai hasil pencarian katalog. */
export interface CatalogFacets {
  kategori: Facet[];
  tahun: Facet[];
  format: Facet[];
  organisasi: Facet[];
}

/** Filter aktif pada pencarian katalog. */
export interface CatalogFilters {
  kategori?: string;
  tahun?: string;
  format?: string;
  organisasi?: string;
  tag?: string;
}

export interface CatalogResult {
  /** Jumlah "Dataset Ditemukan" yang ditampilkan portal untuk pencarian ini. */
  total: number;
  datasets: DatasetSummary[];
  /** Topik (tag) populer dari payload halaman, untuk chart + filter. */
  tagFacets: Array<{ tag: string; count: number }>;
  /** Facet tambahan untuk menyaring hasil. */
  facets: CatalogFacets;
}

/** Satu berkas unduhan pada halaman detail dataset. */
export interface DatasetResource {
  name: string;
  format: string;
  url: string;
  description?: string;
  /** Ukuran berkas dalam byte (bila dilaporkan sumber). */
  size?: number;
  lastModified?: string;
  /** Status pemeriksaan tautan terakhir dari portal. */
  ok?: boolean;
}

/** Detail satu dataset dari halaman /dataset/dataset/<slug>. */
export interface DatasetDetail {
  name: string;
  title: string;
  notes: string;
  organization: string;
  organizationImage?: string;
  tags: string[];
  /** Topik/kategori yang dilaporkan portal. */
  kategori?: string;
  /** Tahun prioritas dataset. */
  prioritasTahun?: string;
  lastModified?: string;
  created?: string;
  resources: DatasetResource[];
  url: string;
}

/* --------------------------------- Lainnya -------------------------------- */

/** Status kesehatan salah satu sumber data untuk halaman overview. */
export interface SourceStatus {
  id: "bmkg" | "satudata" | "openmeteo" | "usgs";
  name: string;
  description: string;
  source: DataSource;
  ok: boolean;
  detail: string;
}

/* ---------------------------------- Cuaca --------------------------------- */

/** Tempat hasil geocoding (kota/kabupaten/kota di seluruh Indonesia). */
export interface GeoPlace {
  id: number;
  name: string;
  /** Nama provinsi, mis. "Jawa Barat". */
  admin1?: string;
  /** Nama kabupaten/kota induk, mis. "Kabupaten Ogan Komering Ulu Selatan". */
  admin2?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  population?: number;
}

/** Referensi tempat generik untuk meminta prakiraan cuaca. */
export interface PlaceRef {
  name: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

/** Kode cuaca WMO (dipakai Open-Meteo) yang sudah dipetakan ke label ID + nama ikon. */
export interface WeatherCodeInfo {
  label: string;
  /** Nama ikon lucide: sun | cloud-sun | cloud | fog | drizzle | rain | rain-wind | snow | lightning */
  icon: string;
}

export interface HourlyForecastPoint {
  /** ISO lokal per kota, mis. "2026-11-13T08:00". */
  time: string;
  temperature: number;
  precipitationProbability: number;
  humidity: number;
  weatherCode: number;
}

export interface DailyForecastPoint {
  date: string;
  tMin: number;
  tMax: number;
  precipitationSum: number;
  weatherCode: number;
}

export interface WeatherForecast {
  placeName: string;
  /** Nama provinsi tempat lokasi berada (bila diketahui dari geocoder). */
  admin1?: string;
  /** Objek cuaca saat ini dari Open-Meteo. */
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeedKmh: number;
    weatherCode: number;
  };
  hourly: HourlyForecastPoint[];
  daily: DailyForecastPoint[];
}

/* ------------------------- Analitik gempa (USGS) --------------------------- */

export interface QuakeAnalytics {
  /** Rentang data dalam hari. */
  windowDays: number;
  totalEvents: number;
  /** Periode data (ISO) untuk label. */
  periodStart: string;
  periodEnd: string;
  biggest: Quake | null;
  /** Histogram magnitude berbin. */
  magnitudeBins: Array<{ label: string; count: number }>;
  /** Jumlah kejadian per wilayah Indonesia (kotak batas perkiraan). */
  byRegion: Array<{ region: string; count: number }>;
  /** Jumlah kejadian per hari (30 hari terakhir). */
  dailyCounts: Array<{ date: string; count: number }>;
}

/* -------------------------------- Glosarium -------------------------------- */

export interface GlossaryTerm {
  term: string;
  /** Terjemahan/istilah Indonesia. */
  id: string;
  category: "deskriptif" | "inferensia" | "probabilitas" | "regresi" | "kualitas-data";
  /** Penjelasan bahasa awam satu-dua kalimat. */
  plain: string;
  /** Rumus dalam notasi teks (opsional). */
  formula?: string;
  /** Contoh penggunaan singkat (opsional). */
  example?: string;
  /** Istilah Inggris padanan. */
  en: string;
}
