import { Waves } from "lucide-react";
import { Card, CardHeader, PageHeader, SourceBadge } from "@/components/ui";
import QuakeMap from "@/components/QuakeMapClient";
import { QuakeTables } from "@/components/QuakeTables";
import { ShakemapImage } from "@/components/ShakemapImage";
import { CopyQuakeSummary, QuakeAnalyticsView } from "@/components/QuakeAnalytics";
import { getQuakeAnalytics, getQuakes } from "@/lib/sources";
import { formatDateTime, formatQuakeSummary } from "@/lib/format";

export const revalidate = 300;

export const metadata = {
  title: "Gempa Bumi",
  description: "Gempa bumi terkini dan gempa dirasakan dari BMKG, dengan peta sebaran interaktif.",
};

export default async function GempaPage() {
  const [terkini, dirasakan, analitik] = await Promise.all([
    getQuakes("terkini"),
    getQuakes("dirasakan"),
    getQuakeAnalytics(90),
  ]);
  const latest = terkini.data[0];

  return (
    <div className="space-y-6">
      <PageHeader
        accent="rose"
        icon={Waves}
        title="Pemantauan Gempa Bumi"
        description="Data realtime dari BMKG (data.bmkg.go.id), disegarkan setiap 5 menit."
        right={<SourceBadge source={terkini.source} />}
      />

      {latest ? (
        <Card className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <Waves size={20} />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Gempa terkini</p>
                    <p className="text-2xl font-bold tabular-nums">M{latest.magnitude.toFixed(1)}</p>
                  </div>
                </div>
                <CopyQuakeSummary text={formatQuakeSummary(latest)} />
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Waktu (WIB)</dt>
                  <dd className="font-medium">{formatDateTime(latest.datetime)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Kedalaman</dt>
                  <dd className="font-medium tabular-nums">{latest.depthKm} km</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Koordinat</dt>
                  <dd className="font-medium tabular-nums">
                    {latest.latitude.toFixed(2)}, {latest.longitude.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Potensi tsunami</dt>
                  <dd className="font-medium">{latest.potensi ?? "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Lokasi</dt>
                  <dd className="font-medium">{latest.wilayah}</dd>
                </div>
              </dl>
            </div>
            <div className="border-t border-zinc-100 p-4 lg:border-l lg:border-t-0 dark:border-zinc-800">
              <ShakemapImage src={latest.shakemap} alt={`Peta guncangan gempa M${latest.magnitude}`} />
              <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
                Peta intensitas guncangan (shakemap) © BMKG
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Peta sebaran gempa" subtitle="Klik marker untuk detail kejadian." />
        <div className="p-4">
          <QuakeMap quakes={[...terkini.data, ...dirasakan.data]} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Rincian kejadian" subtitle="Tabel lengkap gempa signifikan dan gempa yang dirasakan penduduk." />
        <QuakeTables recent={terkini.data} felt={dirasakan.data} />
      </Card>

      <QuakeAnalyticsView analytics={analitik.data} source={analitik.source} />
    </div>
  );
}
