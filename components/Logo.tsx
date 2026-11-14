import { useId } from "react";

/**
 * Logo mark Nusantara DataHub — v6 (gaya emblem emas–navy).
 *
 * Terinspirasi rancangan PNG pemilik: badge bulat navy pekat, cincin emas
 * ganda, bar chart menanjak seperti puncak gunung dengan panah pertumbuhan.
 * Disederhanakan menjadi vektor flat agar tetap tajam di favicon & sidebar
 * (detail ornamen PNG AI tidak bisa bertahan di ukuran kecil).
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
        <linearGradient id={`ndGold-${clipId}`} x1="0" y1="120" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#B98A22" />
          <stop offset="0.5" stopColor="#E3B341" />
          <stop offset="1" stopColor="#F7DB7D" />
        </linearGradient>
        <clipPath id={`ndClip-${clipId}`}>
          <circle cx="60" cy="60" r="56" />
        </clipPath>
      </defs>

      {/* Disc navy pekat */}
      <circle cx="60" cy="60" r="56" fill="#132A56" />

      {/* Cincin emas ganda */}
      <circle cx="60" cy="60" r="51.5" stroke={`url(#ndGold-${clipId})`} strokeWidth={3} />
      <circle cx="60" cy="60" r="45.5" stroke="#E3B341" strokeWidth={1} opacity={0.7} />

      {/* Bar chart menanjak — emas, seperti puncak gunung */}
      <g fill={`url(#ndGold-${clipId})`}>
        <rect x="35.5" y="60" width="7" height="18" rx="3.5" />
        <rect x="46" y="52" width="7" height="26" rx="3.5" />
        <rect x="56.5" y="44" width="7" height="34" rx="3.5" />
        <rect x="67" y="36" width="7" height="42" rx="3.5" />
        <rect x="77.5" y="28" width="7" height="50" rx="3.5" />
      </g>

      {/* Panah pertumbuhan di atas bar tertinggi */}
      <path
        d="M74 25.5 L81 17.5 L88 25.5"
        stroke={`url(#ndGold-${clipId})`}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Aksen bintik kepulauan di kaki badge (gema peta dari referensi) */}
      <g fill="#E3B341" opacity={0.85}>
        <circle cx="42" cy="84" r="1.6" />
        <circle cx="49" cy="86.5" r="1.9" />
        <circle cx="57" cy="88" r="2.1" />
        <circle cx="65" cy="87.5" r="1.9" />
        <circle cx="72" cy="85" r="1.6" />
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
