"use client";

import { useState } from "react";
/* eslint-disable @next/next/no-img-element */

/**
 * Panel shakemap BMKG: hanya dirender bila gambar benar-benar berhasil
 * dimuat. Tidak ada URL atau gambar gagal (404/hotlink) → komponen tidak
 * merender apa pun, tanpa kotak kosong.
 */
export function ShakemapImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || failed) return null;

  return (
    <div
      className={`flex w-full shrink-0 flex-col items-center gap-2 p-4 lg:w-[300px] ${
        loaded ? "border-t border-zinc-100 lg:border-l lg:border-t-0 dark:border-zinc-800" : ""
      }`}
      style={loaded ? undefined : { display: "contents" }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={loaded ? undefined : { display: "none" }}
        className="w-full rounded-lg object-cover"
      />
      {loaded ? (
        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
          Peta intensitas guncangan (shakemap) © BMKG
        </p>
      ) : null}
    </div>
  );
}
