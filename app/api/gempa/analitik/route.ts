import { NextRequest, NextResponse } from "next/server";
import { getQuakeAnalytics } from "@/lib/sources";
import { dynamicApiHeaders } from "@/lib/api-cache";

export async function GET(request: NextRequest) {
  const rawDays = Number.parseInt(request.nextUrl.searchParams.get("days") ?? "90", 10);
  const days = Math.min(Math.max(Number.isFinite(rawDays) ? rawDays : 90, 7), 365);
  const response = await getQuakeAnalytics(days);
  const headers = dynamicApiHeaders({
    vary: ["days"],
    ttlSeconds: 3600,
    cacheable: response.source === "live",
  });
  return NextResponse.json(response, { headers });
}
