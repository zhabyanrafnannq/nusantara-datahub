"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Activity, BookOpen, Bookmark, CloudSun, Database, ExternalLink, Moon, Sun, Waves } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { CommandPalette } from "@/components/CommandPalette";

const NAV_ITEMS = [
  { href: "/", label: "Ringkasan", icon: Activity, accent: "emerald" },
  { href: "/gempa", label: "Gempa Bumi", icon: Waves, accent: "rose" },
  { href: "/cuaca", label: "Cuaca & Prakiraan", icon: CloudSun, accent: "sky" },
  { href: "/katalog", label: "Katalog Satu Data", icon: Database, accent: "teal" },
  { href: "/glosarium", label: "Glosarium Statistik", icon: BookOpen, accent: "violet" },
  { href: "/koleksi", label: "Koleksi Saya", icon: Bookmark, accent: "amber" },
] as const;

const ACTIVE_ACCENT: Record<(typeof NAV_ITEMS)[number]["accent"], string> = {
  emerald: "from-emerald-500/15 to-teal-500/5 text-emerald-700 dark:text-emerald-400 before:bg-emerald-500",
  rose: "from-rose-500/15 to-rose-500/5 text-rose-700 dark:text-rose-400 before:bg-rose-500",
  sky: "from-sky-500/15 to-sky-500/5 text-sky-700 dark:text-sky-400 before:bg-sky-500",
  teal: "from-teal-500/15 to-emerald-500/5 text-teal-700 dark:text-teal-400 before:bg-teal-500",
  violet: "from-violet-500/15 to-violet-500/5 text-violet-700 dark:text-violet-400 before:bg-violet-500",
  amber: "from-amber-500/15 to-orange-500/5 text-amber-700 dark:text-amber-400 before:bg-amber-500",
};

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      aria-label="Ubah tema terang/gelap"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/60 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700/70 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {mounted && resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:content-[''] ${
              active
                ? `bg-gradient-to-r font-semibold ${ACTIVE_ACCENT[item.accent]}`
                : "text-zinc-600 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
            }`}
          >
            <Icon size={17} className="shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-zinc-200/70 bg-white/70 px-4 py-5 backdrop-blur-xl md:flex dark:border-zinc-800/70 dark:bg-zinc-950/70">
      <Link href="/" className="mb-7 flex items-center gap-2.5 px-2">
        <LogoMark size={40} />
        <span>
          <span className="block text-sm font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">Nusantara DataHub</span>
          <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">Dashboard Data Publik</span>
        </span>
      </Link>
      <NavLinks />
      <div className="mt-auto space-y-3 px-2">
        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          Data bersumber dari BMKG, USGS, Open-Meteo, dan Satu Data Indonesia. Seluruh pemrosesan terbuka dan dapat direproduksi.
        </p>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ExternalLink size={14} /> Proyek open source
        </a>
      </div>
    </aside>
  );
}

/** Topbar untuk layar sempit + tombol tema di semua ukuran. */
export function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/70 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between px-4 py-2.5 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size={28} />
          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">Nusantara DataHub</span>
        </Link>
        <ThemeToggle />
      </div>
      <div className="hidden items-center justify-end gap-2 px-6 py-3 md:flex">
        <CommandPalette />
        <ThemeToggle />
      </div>
      {/* Navigasi gulir horizontal di layar sempit */}
      <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 md:hidden">
        {NAV_ITEMS.map((item) => (
          <MobileLink key={item.href} href={item.href} label={item.label} />
        ))}
      </div>
    </header>
  );
}

function MobileLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
          : "bg-zinc-100/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {label}
    </Link>
  );
}

/**
 * Navigasi bawah untuk layar sempit (<md): lima modul utama selalu terjangkau
 * ibu jari tanpa harus menggulir chip di topbar.
 */
export function BottomNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.href !== "/koleksi");

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-zinc-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden dark:border-zinc-800/80 dark:bg-zinc-950/90"
    >
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
              active ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <Icon size={18} />
            {item.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
