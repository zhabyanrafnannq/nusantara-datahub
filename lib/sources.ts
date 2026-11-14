import type {
  ApiResponse,
  CatalogResult,
  GeoPlace,
  Quake,
  QuakeAnalytics,
  SourceStatus,
  WeatherForecast,
} from "./types";
import { normalizeBmkgEnvelope } from "./bmkg";
import { buildSdiSearchUrl, fetchSdiHtml, parseSdiSearchHtml } from "./ckan";
import { buildForecastUrl, buildGeocodeUrl, findCity, normalizeGeocode, normalizeOpenMeteo } from "./weather";
import { buildUsgsUrl, computeQuakeAnalytics, parseUsgsCsv } from "./usgs";

/** Timeout permintaan upstream sebelum jatuh ke data contoh. */
const UPSTREAM_TIMEOUT_MS = 8_000;
/** Durasi cache respons upstream (revalidate Next.js). */
export const REVALIDATE_SECONDS = 300;

export const BMKG_BASE_URL = "https://data.bmkg.go.id/DataMKG/TEWS";

/**
 * Ambil JSON upstream dengan timeout; bila gagal (jaringan mati, upstream error,
 * throttling) kembalikan fixture data contoh dengan flag `source: "fixture"`.
 */
async function fetchUpstreamOrFixture<T>(
  url: string,
  fixturePath: string,
  normalize: (payload: unknown) => T,
): Promise<ApiResponse<T>> {
  const fetchedAt = new Date().toISOString();
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "NusantaraDataHub/0.1 (open-source dashboard)" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      throw new Error(`Upstream ${url} membalas HTTP ${response.status}`);
    }
    const payload = (await response.json()) as unknown;
    return { source: "live", fetchedAt, data: normalize(payload) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "alasan tidak diketahui";
    console.warn(`[sources] fallback ke fixture untuk ${url}: ${reason}`);
    const fixture = await import(`./fixtures/${fixturePath}`);
    return { source: "fixture", fetchedAt, data: normalize(fixture.default) };
  }
}

/* --------------------------------- Gempa ---------------------------------- */

export type QuakeFeedType = "terkini" | "dirasakan" | "autogempa";

export async function getQuakes(type: QuakeFeedType = "terkini"): Promise<ApiResponse<Quake[]>> {
  const file =
    type === "dirasakan" ? "gempa-dirasakan.json" : "gempa-terkini.json";
  const endpoint = type === "autogempa" ? "autogempa.json" : type === "dirasakan" ? "gempadirasakan.json" : "gempaterkini.json";
  return fetchUpstreamOrFixture(`${BMKG_BASE_URL}/${endpoint}`, file, normalizeBmkgEnvelope);
}

/* ------------------------------- Katalog ---------------------------------- */

/**
 * Katalog Satu Data: portal baru (2025/2026) tidak lagi mengekspos CKAN API
 * publik, sehingga pencarian dilakukan lewat parsing SSR halaman
 * /dataset?q=...&page=N (via fetchSdiHtml dengan retry). Halaman per
 * pencarian berisi ±20 dataset.
 */
export const SDI_PAGE_SIZE = 20;

export async function searchCatalog(params: {
  q: string;
  page: number;
}): Promise<ApiResponse<CatalogResult>> {
  const url = buildSdiSearchUrl(params.q, params.page);
  const fetchedAt = new Date().toISOString();
  try {
    const html = await fetchSdiHtml(url);
    return { source: "live", fetchedAt, data: parseSdiSearchHtml(html) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "alasan tidak diketahui";
    console.warn(`[sources] fallback ke fixture untuk ${url}: ${reason}`);
    const fixture = await import("./fixtures/katalog-html");
    return { source: "fixture", fetchedAt, data: parseSdiSearchHtml(fixture.katalogFixtureHtml) };
  }
}

/* --------------------------------- Cuaca ----------------------------------- */

/** Cuaca di-cache lebih lama (30 menit) karena prakiraan berubah per jam. */
const WEATHER_REVALIDATE_SECONDS = 1800;

/** Prakiraan cuaca untuk koordinat mana pun di Indonesia (hasil geocoder). */
export async function getWeatherAt(place: { name: string; admin1?: string; latitude: number; longitude: number }): Promise<ApiResponse<WeatherForecast>> {
  const url = buildForecastUrl(place);
  const fetchedAt = new Date().toISOString();
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "NusantaraDataHub/0.1 (open-source dashboard)" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      next: { revalidate: WEATHER_REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      throw new Error(`Open-Meteo membalas HTTP ${response.status}`);
    }
    const payload = (await response.json()) as unknown;
    return { source: "live", fetchedAt, data: normalizeOpenMeteo(payload, place) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "alasan tidak diketahui";
    console.warn(`[sources] fallback ke fixture cuaca untuk ${place.name}: ${reason}`);
    const fixture = await import("./fixtures/cuaca.json");
    return { source: "fixture", fetchedAt, data: normalizeOpenMeteo(fixture.default, place) };
  }
}

/** Prakiraan cuaca kota favorit (dipakai overview) — id atau nama dari daftar CITIES. */
export async function getWeather(cityId = "jakarta"): Promise<ApiResponse<WeatherForecast> | null> {
  const city = findCity(cityId);
  if (!city) return null;
  return getWeatherAt(city);
}

/**
 * Pencarian tempat via geocoder Open-Meteo — mencakup seluruh kabupaten/kota
 * di Indonesia (respons bahasa Indonesia). Hasil geocoding stabil, cache 1 hari.
 */
export async function searchPlaces(query: string): Promise<ApiResponse<GeoPlace[]>> {
  const url = buildGeocodeUrl(query);
  const fetchedAt = new Date().toISOString();

  // Dua percobaan — geocoder kadang lambat/terputus sesaat.
  let lastError: unknown = new Error("geocoder gagal");
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "NusantaraDataHub/0.1 (open-source dashboard)" },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        next: { revalidate: 3600 },
      });
      if (!response.ok) {
        throw new Error(`Geocoder membalas HTTP ${response.status}`);
      }
      const payload = (await response.json()) as unknown;
      return { source: "live", fetchedAt, data: normalizeGeocode(payload) };
    } catch (error) {
      lastError = error;
    }
  }

  // PENTING: kegagalan geocoding TIDAK memakai fixture — mengembalikan hasil
  // palsu (mis. daftar Sukabumi untuk kueri "demak") lebih berbahaya daripada
  // hasil kosong. UI sudah menampilkan pesan "tidak ada tempat cocok".
  const reason = lastError instanceof Error ? lastError.message : "alasan tidak diketahui";
  console.warn(`[sources] geocoder gagal untuk "${query}", kembalikan kosong: ${reason}`);
  return { source: "fixture", fetchedAt, data: [] };
}

/* ---------------------------- Analitik gempa -------------------------------- */

/**
 * Katalog bersejarah dari USGS FDSN (keyless) untuk agregasi statistik 90 hari.
 * Cache 1 jam — katalog tidak berubah cepat.
 */
export async function getQuakeAnalytics(windowDays = 90): Promise<ApiResponse<QuakeAnalytics>> {
  const url = buildUsgsUrl(windowDays);
  const fetchedAt = new Date().toISOString();
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "NusantaraDataHub/0.1 (open-source dashboard)" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      throw new Error(`USGS membalas HTTP ${response.status}`);
    }
    const csv = await response.text();
    return { source: "live", fetchedAt, data: computeQuakeAnalytics(parseUsgsCsv(csv, windowDays), windowDays) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "alasan tidak diketahui";
    console.warn(`[sources] fallback ke fixture analitik gempa: ${reason}`);
    const fixture = await import("./fixtures/usgs-csv");
    return { source: "fixture", fetchedAt, data: computeQuakeAnalytics(parseUsgsCsv(fixture.usgsFixtureCsv, windowDays), windowDays) };
  }
}

/* ---------------------------- Status sumber -------------------------------- */

export interface SourceSummary {
  latestQuake?: Quake;
  catalogCount: number;
  currentWeather?: WeatherForecast;
  weatherSource: "live" | "fixture";
  sourceStatuses: SourceStatus[];
  fetchedAt: string;
}

/** Gabungan ringkas semua sumber untuk halaman overview. */
export async function getOverviewSummary(): Promise<SourceSummary> {
  const [gempa, katalog, cuaca] = await Promise.all([
    getQuakes("terkini"),
    searchCatalog({ q: "", page: 1 }),
    getWeather("jakarta"),
  ]);
  const weather = cuaca && cuaca.data.current.temperature;
  return {
    latestQuake: gempa.data[0],
    catalogCount: katalog.data.total,
    currentWeather: weather ? cuaca!.data : undefined,
    weatherSource: cuaca?.source ?? "fixture",
    fetchedAt: gempa.fetchedAt,
    sourceStatuses: [
      {
        id: "bmkg",
        name: "BMKG — Gempa bumi",
        description: "Gempa terkini M≥5,0 dan gempa dirasakan, realtime dari data.bmkg.go.id.",
        source: gempa.source,
        ok: gempa.data.length > 0,
        detail: gempa.data.length > 0 ? `${gempa.data.length} gempa dimuat` : "Tidak ada data",
      },
      {
        id: "satudata",
        name: "Satu Data Indonesia",
        description: "Katalog dataset lintas instansi dari data.go.id (parser SSR portal).",
        source: katalog.source,
        ok: katalog.data.total > 0,
        detail: katalog.data.total > 0 ? `${katalog.data.total.toLocaleString("id-ID")} dataset terindeks` : "Tidak ada data",
      },
      {
        id: "openmeteo",
        name: "Open-Meteo — Cuaca",
        description: "Prakiraan cuaca jam-an 10 kota besar, keyless dari api.open-meteo.com.",
        source: cuaca?.source ?? "fixture",
        ok: Boolean(weather),
        detail: weather ? "Prakiraan 7 hari siap" : "Tidak ada data",
      },
    ],
  };
}
