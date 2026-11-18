import { NextRequest, NextResponse } from "next/server";
import { getQuakes, type QuakeFeedType } from "@/lib/sources";
import { dynamicApiHeaders } from "@/lib/api-cache";

const VALID_TYPES: QuakeFeedType[] = ["terkini", "dirasakan", "autogempa"];

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("type") ?? "terkini";
  const type = VALID_TYPES.includes(requested as QuakeFeedType) ? (requested as QuakeFeedType) : "terkini";
  const response = await getQuakes(type);
  // `type` WAJIB masuk cache key: tanpa itu `?type=dirasakan` menyajikan cache
  // `?type=terkini` (Netlify meng-cache per path).
  const headers = dynamicApiHeaders({
    vary: ["type"],
    ttlSeconds: 300,
    cacheable: response.source === "live",
  });
  return NextResponse.json(response, { headers });
}
