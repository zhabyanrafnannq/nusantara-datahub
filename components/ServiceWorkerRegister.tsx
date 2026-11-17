"use client";

import { useEffect } from "react";

/**
 * Daftarkan service worker (public/sw.js) untuk dukungan offline dasar:
 * halaman inti & aset statis tersimpan, glosarium/ringkasan tetap terbaca
 * saat jaringan mati. Dinonaktifkan di mode dev agar tidak mengganggu HMR.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // pendaftaran gagal (mis. mode privat) — aplikasi tetap jalan normal
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
