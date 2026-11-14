"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animasi angka naik 0 → nilai saat komponen pertama terlihat (900 ms,
 * ease-out). Menghormati prefers-reduced-motion: langsung tampilkan nilai.
 */
export function CountUp({
  value,
  decimals = 0,
  locale = "id-ID",
  className = "",
}: {
  value: number;
  decimals?: number;
  locale?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }

    const duration = 900;
    const startTime = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(value * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={`tabular-nums ${className}`}>
      {new Intl.NumberFormat(locale, { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(display)}
    </span>
  );
}
