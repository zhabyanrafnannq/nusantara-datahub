"use client";

import dynamic from "next/dynamic";

/**
 * Wrapper client untuk peta: Leaflet membutuhkan window, sehingga komponen
 * QuakeMap harus dikecualikan dari SSR. `ssr: false` dengan next/dynamic hanya
 * sah di dalam Client Component, jadi pemisahan ini wajib.
 */
const QuakeMap = dynamic(() => import("@/components/QuakeMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[420px] w-full place-items-center rounded-xl border border-zinc-200 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
      Memuat peta…
    </div>
  ),
});

export default QuakeMap;
