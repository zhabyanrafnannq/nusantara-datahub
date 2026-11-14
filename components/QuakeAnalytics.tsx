"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info } from "lucide-react";
import type { QuakeAnalytics } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui";

/**
 * Analitik katalog gempa 90 hari (katalog USGS FDSN, wilayah Indonesia).
 * Pengelompokan wilayah memakai kotak batas perkiraan — lihat lib/usgs.ts.
 */
export function QuakeAnalyticsView({ analytics, source }: { analytics: QuakeAnalytics; source: "live" | "fixture" }) {
  const dailyChart = analytics.dailyCounts.slice(-30).map((d) => ({
    tanggal: d.date.slice(5),
    kejadian: d.count,
  }));

  return (
    <Card>
      <CardHeader
        title={`Analitik katalog gempa ${analytics.windowDays} hari (M≥4,5)`}
        subtitle="Katalog bersejarah dari USGS FDSN — melengkapi feed realtime BMKG yang hanya memuat 15 kejadian terakhir."
        right={
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Info size={13} />
            {source === "live" ? "USGS langsung" : "data contoh (fallback)"}
          </span>
        }
      />

      <div className="grid gap-4 border-b border-zinc-100 px-5 py-4 sm:grid-cols-3 dark:border-zinc-800">
        <SummaryStat label="Total kejadian" value={formatNumber(analytics.totalEvents)} />
        <SummaryStat
          label="Gempa terbesar"
          value={analytics.biggest ? `M${analytics.biggest.magnitude.toFixed(1)}` : "—"}
          detail={analytics.biggest?.wilayah}
        />
        <SummaryStat
          label="Periode data"
          value={analytics.periodStart ? `${analytics.periodStart.slice(0, 10)} → ${analytics.periodEnd.slice(0, 10)}` : "—"}
        />
      </div>

      <div className="grid gap-6 px-5 py-5 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Kejadian per hari (30 hari terakhir)
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChart} margin={{ top: 4, right: 8, bottom: 4, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(161 161 170 / 0.3)" vertical={false} />
                <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} interval={6} stroke="currentColor" className="text-zinc-500" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke="currentColor" className="text-zinc-500" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="kejadian" stroke="#059669" fill="#10b981" fillOpacity={0.18} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Histogram magnitude
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.magnitudeBins} margin={{ top: 4, right: 8, bottom: 4, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(161 161 170 / 0.3)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-zinc-500" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke="currentColor" className="text-zinc-500" />
                <Tooltip cursor={{ fill: "rgb(16 185 129 / 0.08)" }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" name="kejadian" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Sebaran per wilayah (kotak batas perkiraan)
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byRegion} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(161 161 170 / 0.3)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} stroke="currentColor" className="text-zinc-500" />
                <YAxis type="category" dataKey="region" tick={{ fontSize: 11 }} width={150} stroke="currentColor" className="text-zinc-500" />
                <Tooltip cursor={{ fill: "rgb(16 185 129 / 0.08)" }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" name="kejadian" fill="#0d9488" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SummaryStat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
      {detail ? <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500 dark:text-zinc-400">{detail}</p> : null}
    </div>
  );
}

/** Tombol salin ringkasan gempa (untuk laporan/WhatsApp). */
export function CopyQuakeSummary({
  text,
  className = "",
}: {
  /** Teks ringkasan siap-salin — dibangun di server lewat formatQuakeSummary(). */
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard bisa ditolak browser — abaikan dengan halus
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 ${className}`}
    >
      {copied ? "Tersalin ✓" : "Salin ringkasan"}
    </button>
  );
}
