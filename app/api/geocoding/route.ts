import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/sources";
import { dynamicApiHeaders } from "@/lib/api-cache";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json(
      { source: "live", fetchedAt: new Date().toISOString(), data: [] },
      { headers: dynamicApiHeaders({ vary: ["q"], ttlSeconds: 0 }) },
    );
  }
  const response = await searchPlaces(query);
  // `q` WAJIB di cache key — tanpa ini semua pencarian mengembalikan kota yang
  // sama di Netlify (CDN meng-cache per path). Hasil kosong tidak di-cache.
  const headers = dynamicApiHeaders({
    vary: ["q"],
    ttlSeconds: 3600,
    cacheable: response.data.length > 0,
  });
  return NextResponse.json(response, { headers });
}
