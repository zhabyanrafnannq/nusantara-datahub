import { NextRequest, NextResponse } from "next/server";
import { getQuakeAnalytics } from "@/lib/sources";

export async function GET(request: NextRequest) {
  const rawDays = Number.parseInt(request.nextUrl.searchParams.get("days") ?? "90", 10);
  const days = Math.min(Math.max(Number.isFinite(rawDays) ? rawDays : 90, 7), 365);
  const response = await getQuakeAnalytics(days);
  return NextResponse.json(response, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
  });
}
