import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/sources";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ source: "live", fetchedAt: new Date().toISOString(), data: [] });
  }
  const response = await searchPlaces(query);
  // Respons fallback (upstream gagal) TIDAK di-cache — percobaan berikutnya
  // harus mencoba upstream lagi, bukan menyajikan hasil kosong sehari penuh.
  const cacheControl = response.source === "live" ? "public, s-maxage=3600, stale-while-revalidate=86400" : "no-store";
  return NextResponse.json(response, { headers: { "Cache-Control": cacheControl } });
}
