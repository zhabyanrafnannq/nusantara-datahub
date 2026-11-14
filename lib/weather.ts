import type {
  DailyForecastPoint,
  GeoPlace,
  HourlyForecastPoint,
  PlaceRef,
  WeatherCodeInfo,
  WeatherForecast,
} from "./types";

/**
 * Modul cuaca via Open-Meteo (https://open-meteo.com) — keyless dan gratis.
 * Prakiraan: api.open-meteo.com · Pencarian tempat: geocoding-api.open-meteo.com
 * (mencakup seluruh kabupaten/kota di Indonesia, respons berbahasa Indonesia).
 * Catatan: cuaca resmi BMKG (api.bmkg.go.id) kini wajib API key, sehingga
 * Open-Meteo dipakai sebagai sumber default; modul BMKG bisa ditambahkan
 * nanti bila pemilik instance menyediakan key.
 */
export const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
export const GEOCODE_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";

/** Kota besar sebagai akses cepat (chip favorit di halaman cuaca). */
export const CITIES: PlaceRef[] = [
  { name: "Jakarta", latitude: -6.2, longitude: 106.85 },
  { name: "Bandung", latitude: -6.92, longitude: 107.61 },
  { name: "Surabaya", latitude: -7.25, longitude: 112.75 },
  { name: "Yogyakarta", latitude: -7.8, longitude: 110.37 },
  { name: "Semarang", latitude: -6.97, longitude: 110.42 },
  { name: "Medan", latitude: 3.59, longitude: 98.67 },
  { name: "Palembang", latitude: -2.98, longitude: 104.75 },
  { name: "Makassar", latitude: -5.15, longitude: 119.43 },
  { name: "Denpasar", latitude: -8.65, longitude: 115.22 },
  { name: "Jayapura", latitude: -2.53, longitude: 140.72 },
];

export function findCity(cityIdOrName: string): PlaceRef | undefined {
  const needle = cityIdOrName.toLowerCase().trim();
  return CITIES.find((c) => c.name.toLowerCase() === needle);
}

/** Bangun URL forecast Open-Meteo untuk satu tempat. */
export function buildForecastUrl(place: PlaceRef): string {
  const search = new URLSearchParams({
    latitude: place.latitude.toFixed(4),
    longitude: place.longitude.toFixed(4),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,relative_humidity_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: "auto",
    forecast_days: "7",
  });
  return `${OPEN_METEO_BASE_URL}?${search.toString()}`;
}

/** Bangun URL pencarian tempat (geocoder) — mencakup seluruh kabupaten/kota Indonesia. */
export function buildGeocodeUrl(query: string, count = 8): string {
  const search = new URLSearchParams({
    name: query.trim(),
    count: String(count),
    language: "id",
    format: "json",
  });
  return `${GEOCODE_BASE_URL}?${search.toString()}`;
}

/** Pemetaan kode cuaca WMO → label Indonesia + nama ikon lucide. */
export function describeWeatherCode(code: number): WeatherCodeInfo {
  if (code === 0) return { label: "Cerah", icon: "sun" };
  if (code === 1) return { label: "Cerah berawan", icon: "cloud-sun" };
  if (code === 2) return { label: "Berawan sebagian", icon: "cloud-sun" };
  if (code === 3) return { label: "Berawan", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Berkabut", icon: "fog" };
  if (code >= 51 && code <= 57) return { label: "Gerimis", icon: "drizzle" };
  if (code >= 61 && code <= 67) return { label: "Hujan", icon: "rain" };
  if (code >= 71 && code <= 77) return { label: "Salju", icon: "snow" };
  if (code >= 80 && code <= 82) return { label: "Hujan lokal", icon: "rain-wind" };
  if (code === 85 || code === 86) return { label: "Hujan salju", icon: "snow" };
  if (code >= 95 && code <= 99) return { label: "Badai petir", icon: "lightning" };
  return { label: "Tidak diketahui", icon: "cloud" };
}

/* ------------------------------ Geocoding --------------------------------- */

interface GeocodeResponse {
  results?: Array<{
    id?: number;
    name?: string;
    latitude?: number;
    longitude?: number;
    admin1?: string;
    admin2?: string;
    timezone?: string;
    population?: number;
    country?: string;
    country_code?: string;
  }>;
}

/** Normalisasi respons geocoder; hanya tempat di Indonesia yang disimpan. */
export function normalizeGeocode(payload: unknown): GeoPlace[] {
  const data = (payload ?? {}) as GeocodeResponse;
  return (data.results ?? [])
    .filter((r) => r.country_code === "ID" && r.name && Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .map((r) => ({
      id: r.id ?? 0,
      name: (r.name ?? "").trim(),
      admin1: r.admin1 || undefined,
      admin2: r.admin2 || undefined,
      latitude: r.latitude!,
      longitude: r.longitude!,
      timezone: r.timezone || undefined,
      population: r.population,
    }));
}

/** Label ramah untuk hasil pencarian: "Kota Sukabumi · Jawa Barat". */
export function geocodePlaceLabel(place: GeoPlace): string {
  return [place.name, place.admin1].filter(Boolean).join(" · ");
}

/* ------------------------------ Prakiraan --------------------------------- */

interface OpenMeteoResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    relative_humidity_2m?: number[];
    weather_code?: number[];
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
  };
}

/**
 * Normalisasi respons Open-Meteo. Hourly dipangkas ke ±24 jam dari "sekarang"
 * agar chart tetap terbaca (bukan 168 titik).
 */
export function normalizeOpenMeteo(payload: unknown, place: PlaceRef): WeatherForecast {
  const data = payload as OpenMeteoResponse;

  const hourlyTimes = data.hourly?.time ?? [];
  const temps = data.hourly?.temperature_2m ?? [];
  const precs = data.hourly?.precipitation_probability ?? [];
  const hums = data.hourly?.relative_humidity_2m ?? [];
  const codes = data.hourly?.weather_code ?? [];

  const nowPrefix = (data.current?.time ?? "").slice(0, 13);
  const allHourly: HourlyForecastPoint[] = hourlyTimes.map((time, index) => ({
    time,
    temperature: temps[index] ?? NaN,
    precipitationProbability: precs[index] ?? 0,
    humidity: hums[index] ?? NaN,
    weatherCode: codes[index] ?? -1,
  }));
  const startIndex = Math.max(
    allHourly.findIndex((point) => point.time.slice(0, 13) >= nowPrefix),
    0,
  );
  const hourly = allHourly.slice(startIndex, startIndex + 24);

  const daily: DailyForecastPoint[] = (data.daily?.time ?? []).map((date, index) => ({
    date,
    tMax: data.daily?.temperature_2m_max?.[index] ?? NaN,
    tMin: data.daily?.temperature_2m_min?.[index] ?? NaN,
    precipitationSum: data.daily?.precipitation_sum?.[index] ?? 0,
    weatherCode: data.daily?.weather_code?.[index] ?? -1,
  }));

  return {
    placeName: place.name,
    admin1: place.admin1,
    current: {
      time: data.current?.time ?? "",
      temperature: data.current?.temperature_2m ?? NaN,
      apparentTemperature: data.current?.apparent_temperature ?? NaN,
      humidity: data.current?.relative_humidity_2m ?? NaN,
      windSpeedKmh: data.current?.wind_speed_10m ?? NaN,
      weatherCode: data.current?.weather_code ?? -1,
    },
    hourly,
    daily,
  };
}
