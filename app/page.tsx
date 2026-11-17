import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CloudSun,
  Database,
  DatabaseZap,
  Gauge,
  ShieldCheck,
  Waves,
} from "lucide-react";
import { Badge, Card, CardHeader, PageHeader, SourceBadge } from "@/components/ui";
import { CountUp } from "@/components/CountUp";
import { QuickSearch } from "@/components/QuickSearch";
import { getOverviewSummary, getQuakeAnalytics } from "@/lib/sources";
import { GLOSSARY, GLOSSARY_CATEGORIES } from "@/lib/glossary";
import { CITIES, describeWeatherCode } from "@/lib/weather";
import { formatDateTime, formatNumber, formatRelative, truncate } from "@/lib/format";
import { POPULAR_TOPICS, catalogUrl } from "@/lib/topics";

export const revalidate = 300;

export const metadata = {
  title: "Ringkasan",
  description:
    "Ringkasan seluruh modul Nusantara DataHub: gempa bumi BMKG, katalog dataset Satu Data Indonesia, prakiraan cuaca, dan glosarium statistik.",
};

/** Halaman ringkasan: satu layar untuk seluruh isi dashboard. */
export default async function RingkasanPage() {
  const [summary, analyticsResponse] = await Promise.all([getOverviewSummary(), getQuakeAnalytics(90)]);
  const analytics = analyticsResponse.data;
  const latest = summary.latestQuake;
  const weather = summary.currentWeather;
  const weatherLabel = weather ? describeWeatherCode(weather.current.weatherCode).label : "—";
  const liveSources = summary.sourceStatuses.filter((status) => status.source === "live").length;
  const sampleTerms = GLOSSARY.slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        accent="emerald"
        icon={Activity}
        title="Ringkasan Data Publik Indonesia"
        description="Satu halaman untuk seluruh modul: gempa bumi BMKG, katalog Satu Data, cuaca Open-Meteo, dan glosarium statistik."
        right={<SourceBadge source={summary.sourceStatuses.every((s) => s.source === "live") ? "live" : "fixture"} />}
      />

      {/* Pencarian topik langsung ke katalog */}
      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Mulai dari topik</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Pilih topik atau ketik kata kunci — hasilnya langsung terbuka di Katalog Satu Data.
            </p>
          </div>
          <Link
            href="/katalog"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Buka katalog <ArrowRight size={13} />
          </Link>
        </div>
        <QuickSearch />
      </Card>

      {/* KPI lintas modul */}
      <section aria-label="Indikator utama" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          accent="rose"
          icon={Waves}
          label="Gempa terkini"
          value={latest ? `M${latest.magnitude.toFixed(1)}` : "—"}
          detail={latest ? truncate(latest.wilayah, 46) : "Tidak ada data BMKG"}
          footnote={latest ? formatRelative(latest.datetime) : undefined}
          href="/gempa"
        />
        <KpiCard
          accent="violet"
          icon={Gauge}
          label={`Kejadian gempa ${analytics.windowDays} hari`}
          value={<CountUp value={analytics.totalEvents} />}
          detail={
            analytics.biggest
              ? `Terbesar M${analytics.biggest.magnitude.toFixed(1)} · ${truncate(analytics.biggest.wilayah, 34)}`
              : "Katalog USGS"
          }
          footnote={`${analytics.periodStart.slice(0, 10)} → ${analytics.periodEnd.slice(0, 10)}`}
          href="/gempa"
        />
        <KpiCard
          accent="emerald"
          icon={Database}
          label="Dataset terindeks"
          value={<CountUp value={summary.catalogCount} />}
          detail="Portal data.go.id (Satu Data Indonesia)"
          footnote="Diperbarui tiap 5 menit"
          href="/katalog"
        />
        <KpiCard
          accent="sky"
          icon={CloudSun}
          label="Cuaca Jakarta"
          value={weather ? `${weather.current.temperature.toFixed(0)}°C` : "—"}
          detail={`${weatherLabel}${weather ? ` · lembap ${weather.current.humidity.toFixed(0)}%` : ""}`}
          footnote={weather ? `Diperbarui ${formatDateTime(weather.current.time)}` : undefined}
          href="/cuaca"
        />
      </section>

      {/* Detail per modul */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Gempa */}
        <Card className="flex flex-col">
          <CardHeader
            title="Gempa bumi (BMKG)"
            subtitle="Gempa terkini M≥5,0 dan gempa yang dirasakan, disegarkan tiap 5 menit."
            right={<SourceBadge source={summary.sourceStatuses.find((s) => s.id === "bmkg")?.source ?? "fixture"} />}
          />
          <div className="flex-1 space-y-3 px-5 py-4">
            {latest ? (
              <>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-extrabold tabular-nums leading-none">M{latest.magnitude.toFixed(1)}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(latest.datetime)} WIB</p>
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{latest.wilayah}</p>
                <dl className="grid grid-cols-3 gap-3 text-xs">
                  <Detail label="Kedalaman" value={`${latest.depthKm} km`} />
                  <Detail label="Koordinat" value={`${latest.latitude.toFixed(2)}, ${latest.longitude.toFixed(2)}`} />
                  <Detail label="Tsunami" value={latest.potensi ?? "—"} />
                </dl>
              </>
            ) : (
              <p className="text-xs text-zinc-500">Tidak ada data gempa yang bisa ditampilkan.</p>
            )}
          </div>
          <CardFooter href="/gempa" label="Peta sebaran, tabel lengkap, dan analitik 90 hari" />
        </Card>

        {/* Cuaca */}
        <Card className="flex flex-col">
          <CardHeader
            title="Cuaca & prakiraan (Open-Meteo)"
            subtitle="Prakiraan jam-an dan 7 hari untuk seluruh kabupaten/kota di Indonesia."
            right={<SourceBadge source={summary.weatherSource} />}
          />
          <div className="flex-1 space-y-3 px-5 py-4">
            {weather ? (
              <>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-extrabold tabular-nums leading-none">
                    {weather.current.temperature.toFixed(0)}
                    <span className="text-lg text-zinc-400">°C</span>
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {weatherLabel} · {weather.placeName}
                    {weather.admin1 ? `, ${weather.admin1}` : ""}
                  </p>
                </div>
                <dl className="grid grid-cols-3 gap-3 text-xs">
                  <Detail label="Terasa" value={`${weather.current.apparentTemperature.toFixed(0)}°C`} />
                  <Detail label="Kelembapan" value={`${weather.current.humidity.toFixed(0)}%`} />
                  <Detail label="Angin" value={`${weather.current.windSpeedKmh.toFixed(0)} km/j`} />
                </dl>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CITIES.slice(1, 6).map((city) => (
                    <Link
                      key={city.name}
                      href="/cuaca"
                      className="rounded-full bg-zinc-100/80 px-2.5 py-1 text-[11px] text-zinc-600 transition hover:bg-sky-100 hover:text-sky-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {city.name}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-zinc-500">Prakiraan tidak tersedia saat ini.</p>
            )}
          </div>
          <CardFooter href="/cuaca" label="Pencarian kota, grafik 24 jam, dan prakiraan 7 hari" />
        </Card>

        {/* Katalog */}
        <Card className="flex flex-col">
          <CardHeader
            title="Katalog Satu Data Indonesia"
            subtitle="Dataset resmi lintas instansi pemerintah dari data.go.id."
            right={<SourceBadge source={summary.sourceStatuses.find((s) => s.id === "satudata")?.source ?? "fixture"} />}
          />
          <div className="flex-1 space-y-3 px-5 py-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              <span className="text-2xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatNumber(summary.catalogCount)}
              </span>{" "}
              dataset terindeks. Telusuri lewat topik:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TOPICS.slice(0, 8).map((topic) => (
                <Link
                  key={topic.query}
                  href={catalogUrl(topic.query)}
                  className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                >
                  {topic.label}
                </Link>
              ))}
            </div>
          </div>
          <CardFooter href="/katalog" label="Pencarian topik, filter tag, ekspor CSV, dan penelusuran halaman" />
        </Card>

        {/* Glosarium */}
        <Card className="flex flex-col">
          <CardHeader
            title="Glosarium statistik"
            subtitle={`${GLOSSARY.length} istilah EN↔ID dengan penjelasan bahasa awam, rumus, dan contoh.`}
            right={<Badge tone="amber">offline</Badge>}
          />
          <div className="flex-1 space-y-3 px-5 py-4">
            <div className="flex flex-wrap gap-1.5">
              {GLOSSARY_CATEGORIES.map((category) => (
                <span
                  key={category.id}
                  className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                >
                  {category.label}
                </span>
              ))}
            </div>
            <ul className="space-y-2">
              {sampleTerms.map((term) => (
                <li key={term.term} className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">{term.term}</span>
                  <span className="text-zinc-400"> = {term.id} · </span>
                  {truncate(term.plain, 96)}
                </li>
              ))}
            </ul>
          </div>
          <CardFooter href="/glosarium" label="Cari istilah, filter kategori, dan lihat rumus lengkap" />
        </Card>
      </section>

      {/* Status sumber */}
      <Card>
        <CardHeader
          title="Status sumber data"
          subtitle={`${liveSources} dari ${summary.sourceStatuses.length} sumber aktif saat halaman ini dirender (${formatDateTime(summary.fetchedAt)}).`}
          right={
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <ShieldCheck size={13} /> transparan
            </span>
          }
        />
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {summary.sourceStatuses.map((status) => (
            <li key={status.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{status.name}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{status.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{status.detail}</span>
                <SourceBadge source={status.source} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <p className="flex items-start gap-2 rounded-2xl border border-zinc-200/70 bg-white/60 px-4 py-3 text-[11px] leading-relaxed text-zinc-500 dark:border-zinc-700/60 dark:bg-zinc-900/60 dark:text-zinc-400">
        <DatabaseZap size={13} className="mt-0.5 shrink-0" />
        Seluruh angka dihitung ulang dari sumber resmi setiap 5 menit (BMKG, USGS, Open-Meteo, data.go.id). Jika salah satu
        sumber tidak terjangkau, dashboard menandainya sebagai data contoh — tidak ada angka yang dikarang.
      </p>
    </div>
  );
}

/* ------------------------------- Sub-komponen ------------------------------ */

const ACCENT = {
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
} as const;

function KpiCard({
  accent,
  icon: Icon,
  label,
  value,
  detail,
  footnote,
  href,
}: {
  accent: keyof typeof ACCENT;
  icon: typeof Waves;
  label: string;
  value: React.ReactNode;
  detail: string;
  footnote?: string;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full p-4 transition group-hover:-translate-y-0.5 group-hover:border-emerald-300/70">
        <div className="flex items-center gap-2">
          <span className={`grid h-8 w-8 place-items-center rounded-xl ${ACCENT[accent]}`}>
            <Icon size={16} />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
        </div>
        <p className="mt-2.5 text-2xl font-extrabold leading-none text-zinc-900 dark:text-zinc-50">{value}</p>
        <p className="mt-1.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{detail}</p>
        {footnote ? <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">{footnote}</p> : null}
      </Card>
    </Link>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="font-medium text-zinc-800 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

function CardFooter({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 border-t border-zinc-100 px-5 py-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50/60 dark:border-zinc-800 dark:text-emerald-400 dark:hover:bg-emerald-500/5"
    >
      <span className="inline-flex items-center gap-1.5">
        <BookOpen size={12} /> {label}
      </span>
      <ArrowRight size={14} />
    </Link>
  );
}
