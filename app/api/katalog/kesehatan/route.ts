import { NextResponse } from "next/server";
import { getSdiHealth } from "@/lib/ckan";
import { cacheStats } from "@/lib/cache";

/**
 * Status kesehatan scraper katalog.
 * Dipakai untuk memantau apakah tampilan "0 hasil" berasal dari portal yang
 * berubah struktur (bukan dari kueri yang memang kosong).
 */
export async function GET() {
  const health = getSdiHealth();
  return NextResponse.json(
    {
      ...health,
      cache: cacheStats(),
      checkedAt: new Date().toISOString(),
    },
    {
      status: health.ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
