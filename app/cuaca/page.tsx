"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Droplets,
  Loader2,
  MapPin,
  Search,
  Sun,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { Badge, Card, CardHeader, EmptyState, PageHeader, SourceBadge } from "@/components/ui";
import type { ApiResponse, GeoPlace, WeatherForecast } from "@/lib/types";
import { CITIES, describeWeatherCode } from "@/lib/weather";

const ICONS: Record<string, LucideIcon> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  "rain-wind": CloudRainWind,
  snow: CloudSnow,
  lightning: CloudLightning,
};

function WeatherIcon({ code, size = 22 }: { code: number; size?: number }) {
  const info = describeWeatherCode(code);
  const Icon = ICONS[info.icon] ?? Cloud;
  return <Icon size={size} className="shrink-0 text-sky-600 dark:text-sky-400" aria-label={info.label} />;
}

function hourLabel(time: string): string {
  const hhmm = time.slice(11, 16);
  return hhmm ? hhmm.replace(":", ".") : time;
}

function dayLabel(date: string): string {
  const d = new Date(`${date}T00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short" }).format(d);
}

/* --------------------------- Riwayat tempat (lokal) ------------------------ */

const RECENT_KEY = "ndh-cuaca-terakhir";
const MAX_RECENT = 6;

function loadRecent(): GeoPlace[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as GeoPlace[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(place: GeoPlace): GeoPlace[] {
  const next = [place, ...loadRecent().filter((p) => p.id !== place.id)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // penyimpanan lokal bisa ditolak (mode privat) — abaikan dengan halus
  }
  return next;
}

/* --------------------------------- Halaman -------------------------------- */

export default function CuacaPage() {
  const [place, setPlace] = useState<GeoPlace>({ id: 0, name: "Jakarta", admin1: "DKI Jakarta", latitude: -6.2, longitude: 106.85 });
  const [state, setState] = useState<{
    loading: boolean;
    source: "live" | "fixture";
    forecast: WeatherForecast | null;
  }>({ loading: true, source: "live", forecast: null });

  // Pencarian tempat
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recent, setRecent] = useState<GeoPlace[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setRecent(loadRecent()), []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const loadWeather = useCallback(async (target: GeoPlace) => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const params = new URLSearchParams({
        lat: String(target.latitude),
        lon: String(target.longitude),
        name: target.name,
      });
      if (target.admin1) params.set("admin1", target.admin1);
      const response = await fetch(`/api/cuaca?${params.toString()}`);
      const payload = (await response.json()) as ApiResponse<WeatherForecast>;
      setState({ loading: false, source: payload.source, forecast: payload.data });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    void loadWeather(place);
  }, [loadWeather, place]);

  // Debounce pencarian geocoder
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/geocoding?q=${encodeURIComponent(q)}`);
        const payload = (await response.json()) as ApiResponse<GeoPlace[]>;
        setResults(payload.data);
        setSearchOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function choosePlace(target: GeoPlace) {
    setPlace(target);
    setRecent(saveRecent(target));
    setQuery("");
    setResults([]);
    setSearchOpen(false);
  }

  const hourlyChart = useMemo(
    () =>
      (state.forecast?.hourly ?? []).map((point) => ({
        jam: hourLabel(point.time),
        suhu: point.temperature,
        hujan: point.precipitationProbability,
      })),
    [state.forecast],
  );

  const subtitle = state.forecast
    ? `Prakiraan jam-an dan 7 hari untuk ${state.forecast.placeName}${state.forecast.admin1 ? `, ${state.forecast.admin1}` : ""} — sumber Open-Meteo (keyless).`
    : "Prakiraan jam-an dan 7 hari untuk seluruh kabupaten/kota di Indonesia — sumber Open-Meteo (keyless).";

  return (
    <div className="space-y-6">
      <PageHeader
        accent="sky"
        icon={CloudSun}
        title="Cuaca & Prakiraan"
        description={subtitle}
        right={<SourceBadge source={state.source} />}
      />

      {/* Pencarian tempat (seluruh kabupaten/kota Indonesia) */}
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="relative" ref={searchBoxRef}>
          <Search size={16} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => results.length > 0 && setSearchOpen(true)}
            placeholder="Cari kota/kabupaten — mis. 'Sukabumi', 'Kotawaringin Barat', 'Waingapu'…"
            className="w-full rounded-2xl border border-zinc-200/80 bg-white/80 py-3 pl-9 pr-10 text-sm shadow-soft backdrop-blur outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700/70 dark:bg-zinc-900/70"
          />
          {searching ? <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" /> : null}

          {searchOpen && results.length > 0 ? (
            <ul className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-80 overflow-y-auto rounded-2xl border border-zinc-200/80 bg-white/95 p-1.5 shadow-soft backdrop-blur-xl dark:border-zinc-700/70 dark:bg-zinc-900/95">
              {results.map((result) => (
                <li key={`${result.id}`}>
                  <button
                    type="button"
                    onClick={() => choosePlace(result)}
                    className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-sky-50 dark:hover:bg-sky-950/40"
                  >
                    <MapPin size={15} className="mt-0.5 shrink-0 text-sky-500" />
                    <span>
                      <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{result.name}</span>
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                        {[result.admin2, result.admin1].filter(Boolean).join(" · ") || "Indonesia"}
                        {result.population ? ` · ${(result.population / 1000).toFixed(0)} rb jiwa` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {searchOpen && !searching && query.trim().length >= 2 && results.length === 0 ? (
            <div className="absolute inset-x-0 top-full z-20 mt-1.5 rounded-2xl border border-zinc-200/80 bg-white/95 px-4 py-3 text-xs text-zinc-500 shadow-soft backdrop-blur-xl dark:border-zinc-700/70 dark:bg-zinc-900/95">
              Tidak ada tempat di Indonesia yang cocok dengan &quot;{query.trim()}&quot;.
            </div>
          ) : null}
        </div>
      </div>

      {/* Chip kota besar + riwayat pencarian */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          <CloudSun size={12} /> kota besar:
        </span>
        {CITIES.map((city) => (
          <button
            key={city.name}
            type="button"
            onClick={() => choosePlace({ id: 0, name: city.name, latitude: city.latitude, longitude: city.longitude })}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              place.name === city.name
                ? "bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-sm"
                : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {city.name}
          </button>
        ))}
        {recent.length > 0 ? (
          <>
            <span className="ml-3 mr-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">terakhir:</span>
            {recent.map((item) => (
              <button
                key={`recent-${item.id}-${item.name}`}
                type="button"
                onClick={() => choosePlace(item)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  place.id !== 0 && place.id === item.id
                    ? "bg-sky-600 text-white shadow-sm"
                    : "border border-dashed border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {item.name}
              </button>
            ))}
          </>
        ) : null}
      </div>

      {state.loading || !state.forecast ? (
        <div className="grid place-items-center rounded-2xl border border-zinc-200/70 py-28 dark:border-zinc-800">
          <Loader2 className="animate-spin text-zinc-400" size={26} />
        </div>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-6 p-6">
              <div className="flex items-center gap-4">
                <WeatherIcon code={state.forecast.current.weatherCode} size={52} />
                <div>
                  <p className="text-5xl font-extrabold tabular-nums leading-none tracking-tight">
                    {state.forecast.current.temperature.toFixed(0)}
                    <span className="text-2xl text-zinc-400">°C</span>
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {describeWeatherCode(state.forecast.current.weatherCode).label} · {state.forecast.placeName}
                    {state.forecast.admin1 ? `, ${state.forecast.admin1}` : ""}
                  </p>
                </div>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                <Metric icon={Thermometer} label="Terasa seperti" value={`${state.forecast.current.apparentTemperature.toFixed(0)}°C`} />
                <Metric icon={Droplets} label="Kelembapan" value={`${state.forecast.current.humidity.toFixed(0)}%`} />
                <Metric icon={Wind} label="Angin" value={`${state.forecast.current.windSpeedKmh.toFixed(0)} km/j`} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Prakiraan 24 jam ke depan"
              subtitle="Garis = suhu (°C, sumbu kiri) · Batang = peluang hujan (%, sumbu kanan)."
            />
            <div className="h-72 px-4 py-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={hourlyChart} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(161 161 170 / 0.3)" vertical={false} />
                  <XAxis dataKey="jam" tick={{ fontSize: 10 }} interval={2} stroke="currentColor" className="text-zinc-500" />
                  <YAxis yAxisId="temp" tick={{ fontSize: 11 }} stroke="currentColor" className="text-zinc-500" width={38} domain={["dataMin - 2", "dataMax + 2"]} />
                  <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 11 }} stroke="currentColor" className="text-zinc-500" width={38} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="rain" dataKey="hujan" name="Peluang hujan (%)" fill="#38bdf8" radius={[4, 4, 0, 0]} opacity={0.85} />
                  <Line yAxisId="temp" type="monotone" dataKey="suhu" name="Suhu (°C)" stroke="#059669" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader title="Prakiraan 7 hari" subtitle="Suhu maksimum–minimum dan total curah hujan harian." />
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 lg:grid-cols-7">
              {state.forecast.daily.map((day) => (
                <div
                  key={day.date}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-100 px-2 py-3 text-center dark:border-zinc-800"
                >
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{dayLabel(day.date)}</p>
                  <WeatherIcon code={day.weatherCode} size={24} />
                  <p className="text-sm font-semibold tabular-nums">
                    {day.tMax.toFixed(0)}° <span className="text-xs font-normal text-zinc-400">{day.tMin.toFixed(0)}°</span>
                  </p>
                  {day.precipitationSum > 0 ? (
                    <Badge tone="blue" className="gap-1">
                      <Droplets size={10} /> {day.precipitationSum.toFixed(1)} mm
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-zinc-400">tanpa hujan</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {!state.loading && state.forecast && state.forecast.hourly.length === 0 ? (
        <Card>
          <EmptyState
            title="Prakiraan tidak tersedia untuk lokasi ini"
            description="Koordinat terpilih mungkin berada di luar cakupan grid model cuaca. Coba tempat lain yang lebih dekat dengan pemukiman."
          />
        </Card>
      ) : null}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        <Icon size={17} />
      </span>
      <div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
