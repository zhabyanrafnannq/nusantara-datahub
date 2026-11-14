"use client";

import { useState } from "react";
/* eslint-disable @next/next/no-img-element */

/**
 * Gambar shakemap BMKG dengan penanganan gambar tidak tersedia
 * (mis. data contoh yang memakai nama file fiktif).
 */
export function ShakemapImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        Peta guncangan tidak tersedia
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-video w-full rounded-lg object-cover"
    />
  );
}
