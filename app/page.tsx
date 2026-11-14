import Link from "next/link";
import { ArrowRight, CloudSun, Database, Globe2, Waves } from "lucide-react";
import { Badge, Card, CardHeader, SourceBadge, ACCENTS } from "@/components/ui";
import { CountUp } from "@/components/CountUp";
import { getOverviewSummary } from "@/lib/sources";
import { describeWeatherCode } from "@/lib/weather";
import { formatRelative } from "@/lib/format";

export const revalidate = 300;

export default async function OverviewPage() {
  const summary = await getOverviewSummary();
  const quake = summary.latestQuake;
  const weather = summary.currentWeather;

  return (
    <div className="space-y-6">
      {/* Hero dengan blobs dekoratif */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 px-6 py-8 text-white shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-sky-400/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-teal-300/20 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Open Source · MIT License</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">Nusantara DataHub</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/90">
            Dashboard terpadu data publik Indonesia — gabungkan gempa bumi realtime dari BMKG,
            katalog dataset Satu Data Indonesia, dan prakiraan cuaca dalam satu antarmuka. Semua
            data diambil langsung dari sumber resminya dan berfungsi penuh secara offline berkat
            mekanisme data contoh.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/gempa"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-md ring-1 ring-white/25 transition hover:bg-white/25"
            >
              <Waves size={15} /> Pantau gempa <ArrowRight size={14} />
            </Link>
            <Link
              href="/cuaca"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-md ring-1 ring-white/25 transition hover:bg-white/25"
            >
              <CloudSun size={15} /> Cuaca <ArrowRight size={14} />
            </Link>
            <Link
              href="/katalog"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-md ring-1 ring-white/25 transition hover:bg-white/25"
            >
              <Database size={15} /> Jelajahi dataset <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Tiga kartu statistik beraksen */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          href="/gempa"
          label="Gempa terakhir"
          accent="rose"
          icon={<Waves size={18} />}
        >
          {quake ? (
            <>
              <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight">M{quake.magnitude.toFixed(1)}</p>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{quake.wilayah}</p>
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">{formatRelative(quake.datetime)}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">Tidak ada data gempa.</p>
          )}
        </StatCard>

        <StatCard
          href="/katalog"
          label="Dataset Satu Data"
          accent="emerald"
          icon={<Database size={18} />}
          linkLabel="Jelajahi katalog"
        >
          <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight">
            <CountUp value={summary.catalogCount} />
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">terindeks dari data.go.id</p>
        </StatCard>

        <StatCard
          href="/cuaca"
          label={weather ? `Cuaca ${weather.placeName}` : "Cuaca"}
          accent="sky"
          icon={<CloudSun size={18} />}
          linkLabel="Lihat prakiraan"
        >
          {weather ? (
            <>
              <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight">
                <CountUp value={weather.current.temperature} decimals={0} />
                <span className="text-2xl font-semibold text-zinc-400">°C</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {describeWeatherCode(weather.current.weatherCode).label} · kelembapan{" "}
                {weather.current.humidity.toFixed(0)}%
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">Data cuaca tidak tersedia.</p>
          )}
        </StatCard>
      </section>

      {/* Status sumber */}
      <section>
        <Card>
          <CardHeader
            title="Status sumber data"
            subtitle="Aplikasi menandai dengan jujur apakah data diambil langsung dari upstream atau memakai data contoh."
          />
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {summary.sourceStatuses.map((status) => (
              <div key={status.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${status.ok ? "bg-emerald-500" : "bg-amber-500"}`}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{status.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{status.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{status.detail}</span>
                  <SourceBadge source={status.source} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-sky-200/70 bg-sky-50/80 px-5 py-4 text-sm text-sky-900 backdrop-blur-sm dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200">
        <Globe2 size={18} className="mt-0.5 shrink-0" />
        <p>
          Tanpa koneksi internet, seluruh halaman tetap berfungsi menggunakan <strong>data contoh bawaan</strong> —
          ditandai dengan badge <Badge tone="amber">Data contoh (fallback)</Badge> sehingga Anda selalu tahu apa yang
          sedang dilihat. Update terakhir: {formatRelative(summary.fetchedAt)}.
        </p>
      </section>
    </div>
  );
}

/** Kartu statistik dengan tile ikon beraksen warna modul. */
function StatCard({
  href,
  label,
  accent,
  icon,
  children,
  linkLabel,
}: {
  href: string;
  label: string;
  accent: keyof typeof ACCENTS;
  icon: React.ReactNode;
  children: React.ReactNode;
  linkLabel?: string;
}) {
  const a = ACCENTS[accent];
  return (
    <Card className="group p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-105 ${a.tile} ${a.ring}`}>
          {icon}
        </span>
      </div>
      {children}
      <Link href={href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 transition group-hover:text-emerald-600 dark:text-zinc-400 dark:group-hover:text-emerald-400">
        {linkLabel ?? "Buka modul"} <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Card>
  );
}
