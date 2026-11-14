import { NextRequest, NextResponse } from "next/server";
import { getQuakes, type QuakeFeedType } from "@/lib/sources";

const VALID_TYPES: QuakeFeedType[] = ["terkini", "dirasakan", "autogempa"];

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("type") ?? "terkini";
  const type = VALID_TYPES.includes(requested as QuakeFeedType) ? (requested as QuakeFeedType) : "terkini";
  const response = await getQuakes(type);
  // Fallback fixture tidak di-cache agar percobaan berikutnya menyentuh upstream lagi.
  const cacheControl =
    response.source === "live" ? "public, s-maxage=300, stale-while-revalidate=600" : "no-store";
  return NextResponse.json(response, { headers: { "Cache-Control": cacheControl } });
}
