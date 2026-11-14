import { NextRequest, NextResponse } from "next/server";
import { searchCatalog } from "@/lib/sources";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.min(Math.max(Number.parseInt(params.get("page") ?? "1", 10) || 1, 1), 200);
  const response = await searchCatalog({
    q: params.get("q")?.trim() || "",
    page,
  });
  const cacheControl =
    response.source === "live" ? "public, s-maxage=300, stale-while-revalidate=600" : "no-store";
  return NextResponse.json(response, { headers: { "Cache-Control": cacheControl } });
}
