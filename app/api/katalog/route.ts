import { NextRequest, NextResponse } from "next/server";
import { searchCatalog } from "@/lib/sources";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.min(Math.max(Number.parseInt(params.get("page") ?? "1", 10) || 1, 1), 200);
  const response = await searchCatalog({
    q: params.get("q")?.trim() || "",
    page,
  });
  return NextResponse.json(response, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
