import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/* Kumpulan primitif UI ringan (tanpa dependency eksternal). */

/** Kartu efek kaca Soft Modern: blur + border transparan + bayangan lembut. */
export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200/70 bg-white/75 shadow-soft backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/70 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

const badgeStyles = {
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  blue: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
} as const;

export function Badge({
  tone = "neutral",
  children,
  className = "",
  title,
}: {
  tone?: keyof typeof badgeStyles;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Badge yang menjelaskan apakah data diambil live dari upstream atau fixture. */
export function SourceBadge({ source }: { source: "live" | "fixture" }) {
  if (source === "live") {
    return (
      <Badge tone="green" title="Data diambil langsung dari sumber resmi saat halaman dimuat.">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
        </span>
        Data langsung
      </Badge>
    );
  }
  return (
    <Badge tone="amber" title="Sumber resmi tidak dapat dijangkau — menampilkan data contoh bawaan aplikasi.">
      Data contoh (fallback)
    </Badge>
  );
}

export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
      <p className="max-w-md text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      {children}
    </div>
  );
}

/* ------------------------- Header halaman beraksen ------------------------ */

/** Peta aksen warna per modul — inti identitas Soft Modern. */
export const ACCENTS = {
  rose: {
    tile: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    ring: "ring-rose-500/20",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
  sky: {
    tile: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    ring: "ring-sky-500/20",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  },
  emerald: {
    tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  violet: {
    tile: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    ring: "ring-violet-500/20",
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  },
} as const;

export type AccentName = keyof typeof ACCENTS;

/** Header halaman seragam: ikon dalam kotak beraksen + judul + deskripsi + slot kanan. */
export function PageHeader({
  accent,
  icon: Icon,
  title,
  description,
  right,
}: {
  accent: AccentName;
  icon: LucideIcon;
  title: string;
  description: string;
  right?: ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3.5">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ring-1 ${a.tile} ${a.ring}`}>
          <Icon size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
      </div>
      {right}
    </div>
  );
}
