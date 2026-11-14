/**
 * Logo mark Nusantara DataHub — vektor tangan, bukan aset AI.
 *
 * Konsep (disarikan dari rancangan PNG pemilik):
 *   cincin orbit gradien biru→hijau dengan celah dinamis,
 *   siluet kepulauan Nusantara (navy), konstelasi node jaringan,
 *   dua gelembung aksen (grafik & iklim) — flat, 2 hue + navy.
 *
 * Tema: elemen navy otomatis menjadi terang di dark mode lewat class.
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
        <linearGradient id="ndRing" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="0.55" stopColor="#0EA5E9" />
          <stop offset="1" stopColor="#22C55E" />
        </linearGradient>
      </defs>

      {/* Konstelasi jaringan (di belakang) */}
      <g className="stroke-[#1D4E89] dark:stroke-sky-100" opacity={0.35} strokeWidth={1.3}>
        <path d="M30 26 L52 38 L62 54" />
        <path d="M62 54 L92 30" />
        <path d="M62 54 L92 74" />
        <path d="M62 54 L32 86" />
      </g>
      <g className="fill-[#1D4E89] dark:fill-sky-100" opacity={0.45}>
        <circle cx="30" cy="26" r="2.4" />
        <circle cx="52" cy="38" r="1.7" />
        <circle cx="92" cy="74" r="2.2" />
        <circle cx="32" cy="86" r="2" />
      </g>

      {/* Cincin orbit: busur utama + aksen kecil di celah */}
      <path
        d="M 16.7 85 A 50 50 0 1 1 47.1 108.3"
        stroke="url(#ndRing)"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d="M 39.3 98.9 A 44 44 0 0 0 23.5 84.6"
        stroke="url(#ndRing)"
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.45}
      />

      {/* Siluet kepulauan Nusantara (gaya sederhana, bukan kartografi) */}
      <g className="fill-[#1D4E89] dark:fill-sky-100/95">
        {/* Sumatera */}
        <path d="M24 34 C30 30 36 36 40 44 C43 50 46 54 44 56 C41 58 35 54 31 48 C27 42 22 38 24 34 Z" />
        {/* Jawa */}
        <path d="M38 63 C44 61 52 62 58 63 C63 64 68 65 72 66 L70 69 C64 68 56 68 48 67 C44 66.5 40 66 38 63 Z" />
        {/* Kalimantan */}
        <path d="M50 30 C55 26 62 27 66 32 C69 36 69 42 65 46 C61 50 55 50 51 46 C47 42 46 34 50 30 Z" />
        {/* Sulawesi (badan + lengan) */}
        <path d="M76 34 C79 33 81 36 80 40 C79 44 78 47 79 50 L76 52 C74 49 74 45 75 41 C76 37 74 36 76 34 Z" />
        <path d="M82 38 C85 37 88 39 89 42 L86 44 C85 41 83 40 82 38 Z" />
        {/* Papua + kepala */}
        <path d="M92 52 C96 50 101 52 103 56 C105 60 103 64 98 65 C94 66 90 63 90 59 C90 55 90 53 92 52 Z" />
        <path d="M97 47 C100 46 103 48 104 51 L100 52 C99 50 98 48 97 47 Z" />
        {/* Kepulauan kecil: Nusa Tenggara, Maluku, Bangka */}
        <circle cx="74" cy="72" r="1.6" />
        <circle cx="79" cy="74" r="1.8" />
        <circle cx="84" cy="73" r="1.5" />
        <circle cx="88" cy="76" r="1.6" />
        <circle cx="84" cy="52" r="1.4" />
        <circle cx="86" cy="58" r="1.6" />
        <circle cx="83" cy="62" r="1.2" />
        <circle cx="40" cy="52" r="1.4" />
        <circle cx="44" cy="50" r="1.2" />
      </g>

      {/* Gelembung aksen: iklim */}
      <g>
        <circle cx="33" cy="24" r="9.5" className="fill-white dark:fill-zinc-900" stroke="url(#ndRing)" strokeWidth={2.5} />
        <path
          className="fill-[#2563EB] dark:fill-sky-400"
          d="M28.5 27.5 c -1.8 0 -3.3 -1.4 -3.3 -3.1 c 0 -1.6 1.2 -2.9 2.8 -3.1 c 0.5 -1.9 2.2 -3.3 4.3 -3.3 c 2.3 0 4.2 1.8 4.4 4.1 c 1.6 0.2 2.8 1.5 2.8 3.2 c 0 1.7 -1.4 2.2 -3.1 2.2 z"
        />
      </g>

      {/* Gelembung aksen: grafik data */}
      <g>
        <circle cx="92" cy="28" r="10" className="fill-white dark:fill-zinc-900" stroke="url(#ndRing)" strokeWidth={2.5} />
        <rect x="87.6" y="27" width="2.6" height="6" rx="1" className="fill-[#2563EB] dark:fill-sky-400" />
        <rect x="91.2" y="24.5" width="2.6" height="8.5" rx="1" className="fill-[#0EA5E9] dark:fill-sky-400" />
        <rect x="94.8" y="22" width="2.6" height="11" rx="1" className="fill-[#22C55E]" />
      </g>
    </svg>
  );
}

/**
 * Lockup horizontal untuk pemakaian lebar (footer/halaman): mark + dua baris teks.
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
