import { NextRequest, NextResponse } from "next/server";
import { searchCatalog } from "@/lib/sources";
import { readFilters } from "@/lib/katalog-params";
import { clampCatalogPage } from "@/lib/katalog-limits";
import { dynamicApiHeaders } from "@/lib/api-cache";

/** Parameter query yang menentukan isi hasil katalog (wajib masuk cache key). */
const KATALOG_VARY = ["q", "page", "kategori", "tahun", "format", "organisasi", "tag"];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = clampCatalogPage(params.get("page"));
  const q = params.get("q")?.trim() || "";
  const filters = readFilters(params);

  const response = await searchCatalog({ q, page, filters });
  // Hasil kosong tidak boleh ikut ter-cache di edge: kueri bisa gagal sesaat
  // karena upstream mengirim halaman tanpa payload. `q`/filter juga wajib
  // masuk cache key supaya `?q=pangan` tidak menyajikan cache `?q=` (root).
  const headers = dynamicApiHeaders({
    vary: KATALOG_VARY,
    ttlSeconds: 300,
    cacheable: response.source === "live" && (response.data.total > 0 || q === ""),
  });
  return NextResponse.json(response, { headers });
}
