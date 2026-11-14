import { NextRequest, NextResponse } from "next/server";
import { getQuakes, type QuakeFeedType } from "@/lib/sources";

const VALID_TYPES: QuakeFeedType[] = ["terkini", "dirasakan", "autogempa"];

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("type") ?? "terkini";
  const type = VALID_TYPES.includes(requested as QuakeFeedType) ? (requested as QuakeFeedType) : "terkini";
  const response = await getQuakes(type);
  return NextResponse.json(response, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
