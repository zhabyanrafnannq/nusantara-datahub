import { NextRequest, NextResponse } from "next/server";
import { getWeather, getWeatherAt } from "@/lib/sources";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number.parseFloat(params.get("lat") ?? "");
  const lon = Number.parseFloat(params.get("lon") ?? "");
  const name = params.get("name")?.trim() || "Lokasi tanpa nama";

  // Mode 1: koordinat eksplisit dari hasil geocoder (seluruh kabupaten/kota).
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    const admin1 = params.get("admin1")?.trim() || undefined;
    const response = await getWeatherAt({ name, admin1, latitude: lat, longitude: lon });
    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  }

  // Mode 2: kota favorit dari daftar bawaan.
  const cityId = params.get("city") ?? "jakarta";
  const response = await getWeather(cityId);
  if (!response) {
    return NextResponse.json(
      { error: `Kota '${cityId}' tidak dikenal. Gunakan parameter lat/lon dari /api/geocoding.` },
      { status: 400 },
    );
  }
  return NextResponse.json(response, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
