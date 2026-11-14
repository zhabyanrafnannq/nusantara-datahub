import { useId } from "react";
import { INDONESIA_MAP_PATH } from "@/lib/indonesia-map";

/**
 * Logo mark Nusantara DataHub — v4.
 *
 * Dua ide eksplisit: siluet kepulauan Indonesia ASLI (data Natural Earth
 * 110m, domain publik — bukan gambar tangan) di paruh bawah, dan bar
 * chart statistik yang menanjak di atasnya. Komposisi: "statistik tumbuh
 * dari kepulauan". Putih di atas pias gradien biru→hijau.
 */

export function LogoMark({
  size = 40,
  className = "",
  title = "Logo Nusantara DataHub",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  // id unik per instance — sidebar & topbar dirender bersamaan di dokumen yang sama.
  const clipId = useId().replace(/[:]/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient id={`ndDisc-${clipId}`} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="0.5" stopColor="#0EA5E9" />
          <stop offset="1" stopColor="#22C55E" />
        </linearGradient>
        <clipPath id={`ndClip-${clipId}`}>
          <circle cx="60" cy="60" r="56" />
        </clipPath>
      </defs>

      {/* Pias gradien */}
      <circle cx="60" cy="60" r="56" fill={`url(#ndDisc-${clipId})`} />

      <g fill="#FFFFFF">
        {/* Bar chart statistik (paruh atas, menanjak) */}
        <rect x="58" y="30" width="8" height="16" rx="4" />
        <rect x="70.5" y="22" width="8" height="24" rx="4" />
        <rect x="83" y="14" width="8" height="32" rx="4" />

        {/* Siluet kepulauan Indonesia asli (Natural Earth, dipotong ke pias) */}
        <g clipPath={`url(#ndClip-${clipId})`}>
          <path d={INDONESIA_MAP_PATH} />
        </g>
      </g>
    </svg>
  );
}

/**
 * Lockup horizontal untuk pemakaian lebar (footer/halaman): mark + teks bertumpuk.
 * Warna teks mengikuti tema lewat class di elemen pemanggil.
 */
export function LogoLockup({ size = 44 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark size={size} />
      <span className="leading-tight">
        <span className="block text-lg font-extrabold tracking-tight text-[#1D4E89] dark:text-sky-100">
          NUSANTARA
        </span>
        <span className="block bg-gradient-to-r from-blue-600 via-sky-500 to-green-500 bg-clip-text text-base font-extrabold tracking-wide text-transparent">
          DATAHUB
        </span>
      </span>
    </span>
  );
}
