import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/sources";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ source: "live", fetchedAt: new Date().toISOString(), data: [] });
  }
  const response = await searchPlaces(query);
  return NextResponse.json(response, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
  });
}
