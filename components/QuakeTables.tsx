"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import type { Quake } from "@/lib/types";
import { formatDateTime, formatRelative } from "@/lib/format";
import { Badge } from "@/components/ui";

function magnitudeTone(magnitude: number): "red" | "amber" | "neutral" {
  if (magnitude >= 6) return "red";
  if (magnitude >= 5) return "amber";
  return "neutral";
}

export function QuakeTables({ recent, felt }: { recent: Quake[]; felt: Quake[] }) {
  const [tab, setTab] = useState<"recent" | "felt">("recent");
  const rows = tab === "recent" ? recent : felt;

  return (
    <div>
      <div className="flex gap-2 px-5 pt-4">
        <TabButton active={tab === "recent"} onClick={() => setTab("recent")}>
          Gempa M≥5,0 ({recent.length})
        </TabButton>
        <TabButton active={tab === "felt"} onClick={() => setTab("felt")}>
          Dirasakan ({felt.length})
        </TabButton>
      </div>
      <div className="table-scroll overflow-x-auto px-5 pb-5 pt-3">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="pb-2 pr-4 font-medium">Waktu (WIB)</th>
              <th className="pb-2 pr-4 font-medium">Mag</th>
              <th className="pb-2 pr-4 font-medium">Kedalaman</th>
              <th className="pb-2 pr-4 font-medium">Lokasi</th>
              {tab === "felt" ? <th className="pb-2 font-medium">Skala MMI</th> : <th className="pb-2 font-medium">Potensi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((quake, index) => (
              <tr key={`${quake.datetime}-${index}`} className="align-top">
                <td className="whitespace-nowrap py-3 pr-4">
                  <span className="block font-medium text-zinc-900 dark:text-zinc-100">{formatDateTime(quake.datetime)}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatRelative(quake.datetime)}</span>
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={magnitudeTone(quake.magnitude)}>M{quake.magnitude.toFixed(1)}</Badge>
                </td>
                <td className="whitespace-nowrap py-3 pr-4 tabular-nums">{quake.depthKm} km</td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-start gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-zinc-400" />
                    {quake.wilayah}
                  </span>
                </td>
                {tab === "felt" ? (
                  <td className="py-3">
                    <Badge tone="blue">{quake.mmiScale ?? "—"}</Badge>
                  </td>
                ) : (
                  <td className="py-3 text-xs text-zinc-500 dark:text-zinc-400">{quake.potensi ?? "—"}</td>
                )}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-zinc-500">
                  Tidak ada data pada kategori ini.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-emerald-600 text-white shadow-sm"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}
