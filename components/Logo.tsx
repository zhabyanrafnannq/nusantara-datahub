/**
 * Logo mark Nusantara DataHub — v2.
 *
 * Satu ide, tegas: pias gradien biru→hijau dengan siluet kepulauan
 * Nusantara putih yang gempal. Dirancang agar terbaca jelas pada ukuran
 * kecil (favicon, 28–40px) — tanpa detail yang berubah jadi noise.
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
        <linearGradient id="ndDisc" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="0.5" stopColor="#0EA5E9" />
          <stop offset="1" stopColor="#22C55E" />
        </linearGradient>
      </defs>

      {/* Pias gradien */}
      <circle cx="60" cy="60" r="56" fill="url(#ndDisc)" />

      {/* Orbit halus — gema dari konsep cincin, tanpa berisik */}
      <circle
        cx="60"
        cy="60"
        r="50"
        stroke="#FFFFFF"
        strokeOpacity={0.3}
        strokeWidth={2.5}
        strokeDasharray="230 84.2"
        strokeLinecap="round"
        transform="rotate(118 60 60)"
        fill="none"
      />

      {/* Kepulauan Nusantara putih — gempal & langsung terbaca */}
      <g fill="#FFFFFF" stroke="#FFFFFF">
        {/* Sumatera */}
        <path d="M30 40 L44 55" strokeWidth={7.5} strokeLinecap="round" fill="none" />
        {/* Jawa */}
        <path d="M41 65 L62 65.5" strokeWidth={4.8} strokeLinecap="round" fill="none" />
        {/* Kalimantan */}
        <ellipse cx="56.5" cy="44" rx="8.2" ry="6.8" transform="rotate(-10 56.5 44)" stroke="none" />
        {/* Sulawesi (badan + dua lengan khas) */}
        <path d="M71.5 39.5 L73 51" strokeWidth={4.2} strokeLinecap="round" fill="none" />
        <path d="M72 44.5 L78.5 47.5" strokeWidth={3.4} strokeLinecap="round" fill="none" />
        <path d="M72.6 49 L78 53.5" strokeWidth={3.2} strokeLinecap="round" fill="none" />
        {/* Papua */}
        <ellipse cx="83.5" cy="58.5" rx="7" ry="5.6" transform="rotate(12 83.5 58.5)" stroke="none" />
        <path d="M87.5 53.5 L93 55.5" strokeWidth={3.8} strokeLinecap="round" fill="none" />
        {/* Kepulauan kecil: Bangka, Nusa Tenggara, Maluku */}
        <circle cx="47" cy="57" r="1.9" stroke="none" />
        <circle cx="67.5" cy="70" r="2.1" stroke="none" />
        <circle cx="73.5" cy="72.5" r="2.3" stroke="none" />
        <circle cx="79.5" cy="70.5" r="2" stroke="none" />
        <circle cx="79.5" cy="54" r="1.9" stroke="none" />
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
