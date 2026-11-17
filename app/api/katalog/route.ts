import { NextRequest, NextResponse } from "next/server";
import { searchCatalog } from "@/lib/sources";
import { readFilters } from "@/lib/katalog-params";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.min(Math.max(Number.parseInt(params.get("page") ?? "1", 10) || 1, 1), 200);
  const q = params.get("q")?.trim() || "";
  const filters = readFilters(params);

  const response = await searchCatalog({ q, page, filters });
  // Hasil kosong tidak boleh ikut ter-cache di edge: kueri bisa gagal sesaat
  // karena upstream mengirim halaman tanpa payload.
  const cacheable = response.source === "live" && (response.data.total > 0 || q === "");
  const cacheControl = cacheable
    ? "public, s-maxage=300, stale-while-revalidate=600"
    : "no-store";
  return NextResponse.json(response, { headers: { "Cache-Control": cacheControl } });
}
