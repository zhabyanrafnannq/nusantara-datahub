/**
 * Uji parser katalog terhadap HTML asli portal data.go.id (fixture).
 *
 * Jalankan: npm test
 * (skrip ini mengompilasi lib/ ke CommonJS lalu menjalankan node:test —
 * tanpa dependency tambahan supaya folder deploy tetap ringan.)
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  buildSdiSearchUrl,
  decodeNextFlightPayload,
  hasSearchPayload,
  parseSdiSearchHtml,
  parseSdiPackageHtml,
  hasPackagePayload,
} = require("./.build/ckan.js");
const { cached, clearCache, cacheStats } = require("./.build/cache.js");
const { readFilters, filtersToQuery, datasetsToCsv } = require("./.build/katalog-params.js");

const fixture = (name) => fs.readFileSync(path.join(__dirname, "fixtures", name), "utf-8");
const searchHtml = fixture("sdi-search-pangan.html");
const detailHtml = fixture("sdi-dataset-detail.html");
const shellHtml = "<!DOCTYPE html><html><body><p>Memuat…</p></body></html>";

test("buildSdiSearchUrl meneruskan filter dengan nama parameter portal", () => {
  assert.equal(buildSdiSearchUrl("pangan", 1), "https://data.go.id/dataset?q=pangan");
  assert.equal(buildSdiSearchUrl("", 1), "https://data.go.id/dataset");
  assert.equal(buildSdiSearchUrl("pangan", 3), "https://data.go.id/dataset?q=pangan&page=3");

  const url = buildSdiSearchUrl("pangan", 1, {
    kategori: "Kesehatan",
    tahun: "2026",
    format: "XLSX",
    organisasi: "badan-pangan-nasional",
  });
  const params = new URL(url).searchParams;
  assert.equal(params.get("q"), "pangan");
  assert.equal(params.get("kategori"), "Kesehatan");
  assert.equal(params.get("prioritas_tahun"), "2026");
  assert.equal(params.get("res_format"), "XLSX");
  assert.equal(params.get("organization"), "badan-pangan-nasional");
});

test("readFilters hanya mengambil filter yang dikenal", () => {
  const params = new URLSearchParams("q=void&kategori=Kesehatan&tahun=2026&ngawur=1");
  const filters = readFilters(params);
  assert.deepEqual(filters, { kategori: "Kesehatan", tahun: "2026" });
  assert.equal(filtersToQuery(filters), "kategori=Kesehatan&tahun=2026");
});

test("decodeNextFlightPayload menggabungkan semua chunk", () => {
  const payload = decodeNextFlightPayload(searchHtml);
  assert.ok(payload.length > 5000, "payload harus utuh, bukan satu chunk saja");
  assert.ok(/"results"\s*:\s*\[/.test(payload), "payload harus memuat kunci results");
  assert.equal(hasSearchPayload(searchHtml), true);
});

test("halaman cangkang tidak dianggap punya payload", () => {
  assert.equal(hasSearchPayload(shellHtml), false);
  const parsed = parseSdiSearchHtml(shellHtml);
  assert.equal(parsed.total, 0);
  assert.equal(parsed.datasets.length, 0);
});

test("parser pencarian membaca dataset + facet dari payload", () => {
  const result = parseSdiSearchHtml(searchHtml);

  assert.equal(result.total, 15478);
  assert.equal(result.datasets.length, 3);

  const first = result.datasets[0];
  assert.ok(first.title.toLowerCase().includes("pangan"));
  assert.ok(first.name.length > 0);
  assert.equal(first.url, `https://data.go.id/dataset/dataset/${first.name}`);
  assert.ok(Array.isArray(first.tags));

  // Topik = facet tags, bukan nama organisasi.
  assert.ok(result.tagFacets.length > 0);
  assert.ok(result.tagFacets.some((facet) => facet.tag.toLowerCase() === "pangan"));
  assert.ok(!result.tagFacets.some((facet) => facet.tag === "data"), "stop-tag harus disaring");

  // Facet filter tersedia & terurut menurun.
  assert.ok(result.facets.kategori.length > 0);
  assert.ok(result.facets.tahun.every((facet) => /^\d{4}$/.test(facet.value)));
  assert.ok(result.facets.format.some((facet) => facet.value.toLowerCase() === "xlsx"));
  const counts = result.facets.organisasi.map((facet) => facet.count);
  assert.deepEqual(counts, [...counts].sort((a, b) => b - a));
});

test("parser detail membaca resource unduhan", () => {
  assert.equal(hasPackagePayload(detailHtml), true);
  const detail = parseSdiPackageHtml(detailHtml, "skor-pola-pangan-harapan-konsumsi-nasional-update-tahun-2025");

  assert.ok(detail, "detail harus terparse");
  assert.equal(detail.resources.length, 2);
  assert.ok(detail.organization.toLowerCase().includes("pangan"));
  for (const resource of detail.resources) {
    assert.ok(resource.url.startsWith("http"));
    assert.ok(resource.format.length > 0);
  }
  assert.equal(detail.url, `https://data.go.id/dataset/dataset/${detail.name}`);
});

test("parser detail menolak halaman tanpa payload", () => {
  assert.equal(parseSdiPackageHtml(shellHtml, "apa-saja"), null);
  assert.equal(hasPackagePayload(shellHtml), false);
});

test("cache menyatukan permintaan paralel dan menyimpan hasil", async () => {
  clearCache();
  let calls = 0;
  const loader = async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { value: calls };
  };

  const [a, b] = await Promise.all([cached("kunci", 1000, loader), cached("kunci", 1000, loader)]);
  assert.equal(calls, 1, "loader hanya boleh dipanggil sekali");
  assert.deepEqual(a, b);

  const c = await cached("kunci", 1000, loader);
  assert.deepEqual(c, { value: 1 }, "hasil kedua harus dari cache");
  assert.equal(cacheStats().entries, 1);
});

test("CSV memuat header, BOM, dan escape tanda kutip", () => {
  const csv = datasetsToCsv([
    {
      name: "contoh-dataset",
      title: 'Judul "khusus"',
      notes: "Deskripsi",
      organization: "BPS",
      tags: ["pangan"],
      url: "https://data.go.id/dataset/dataset/contoh-dataset",
    },
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"judul","organisasi","tag","slug","url","deskripsi"'));
  assert.ok(csv.includes('"Judul ""khusus"""'));
  assert.ok(csv.includes("\r\n"));
});

test("clampCatalogPage menjepit nomor halaman ke rentang yang dilayani API", () => {
  const { clampCatalogPage, CATALOG_MAX_PAGE, CATALOG_PAGE_SIZE } = require("./.build/katalog-limits.js");
  assert.equal(CATALOG_PAGE_SIZE, 20);
  assert.equal(clampCatalogPage("1"), 1);
  assert.equal(clampCatalogPage("42"), 42);
  assert.equal(clampCatalogPage("0"), 1, "halaman 0 tidak sah");
  assert.equal(clampCatalogPage("-7"), 1);
  assert.equal(clampCatalogPage("99999"), CATALOG_MAX_PAGE);
  assert.equal(clampCatalogPage("abc"), 1);
  assert.equal(clampCatalogPage(null), 1);
  assert.equal(clampCatalogPage(3.9), 3);
});

test("cached menolak menyimpan hasil yang ditandai tidak layak cache", async () => {
  clearCache();
  let calls = 0;
  const loader = async () => {
    calls += 1;
    return { total: calls === 1 ? 0 : 12 };
  };

  const first = await cached("kunci-kosong", 5000, loader, (value) => value.total > 0);
  assert.equal(first.total, 0);
  assert.equal(cacheStats().entries, 0, "hasil kosong tidak boleh masuk cache");

  const second = await cached("kunci-kosong", 5000, loader, (value) => value.total > 0);
  assert.equal(second.total, 12, "permintaan berikutnya harus memanggil loader lagi");
  assert.equal(cacheStats().entries, 1);
});

test("cangkang ber-payload kosong tidak dianggap halaman lengkap", () => {
  // Cangkang (~59 KB) membawa {"count":0,...,"results":[]} di flight payload,
  // jadi penanda "results":[" saja tidak cukup — harus ada header "Dataset Ditemukan".
  const shell = fixture("sdi-search-shell.html");
  assert.ok(
    decodeNextFlightPayload(shell).includes('"results":[]'),
    "fixture harus memuat payload kosong seperti cangkang asli",
  );
  assert.equal(hasSearchPayload(shell), false, "cangkang tidak boleh lolos validasi");
  assert.equal(hasSearchPayload(searchHtml), true, "halaman penuh harus lolos validasi");
  assert.equal(parseSdiSearchHtml(shell).total, 0);
});

test("direktori wilayah lokal menemukan kabupaten/kota tanpa jaringan", () => {
  const { searchWilayah, WILAYAH_COUNT } = require("./.build/wilayah.js");
  assert.equal(WILAYAH_COUNT, 514, "direktori harus memuat 514 kabupaten/kota");

  const demak = searchWilayah("demak");
  assert.equal(demak[0]?.name, "Kabupaten Demak");
  assert.equal(demak[0]?.admin1, "Jawa Tengah");
  assert.ok(demak[0]?.latitude < 0 && demak[0]?.longitude > 100, "koordinat harus masuk akal");

  const sukabumi = searchWilayah("sukabumi").map((p) => p.name);
  assert.ok(sukabumi.includes("Kabupaten Sukabumi"), "kabupaten harus ketemu");
  assert.ok(sukabumi.includes("Kota Sukabumi"), "kota harus ketemu");

  assert.equal(searchWilayah("kota bandung")[0]?.name, "Kota Bandung", "prefiks 'kota' memprioritaskan kota");
  assert.equal(searchWilayah("kabupaten bandung")[0]?.name, "Kabupaten Bandung");
  assert.deepEqual(searchWilayah("zzzz"), [], "kueri tak dikenal tidak boleh mengarang hasil");
  assert.deepEqual(searchWilayah("d"), [], "kueri <2 huruf diabaikan");

  const byProvince = searchWilayah("jawa tengah").map((p) => p.admin1);
  assert.ok(byProvince.length > 0 && byProvince.every((prov) => prov === "Jawa Tengah"), "bisa dicari lewat provinsi");
});

test("header API memaksa cache key ikut parameter query (bug CDN Netlify)", () => {
  const { dynamicApiHeaders } = require("./.build/api-cache.js");

  const cached = dynamicApiHeaders({ vary: ["q", "page"], ttlSeconds: 300 });
  assert.equal(cached["Netlify-Vary"], "query=q|page", "parameter query wajib masuk cache key");
  assert.match(cached["Netlify-CDN-Cache-Control"], /s-maxage=300/);
  assert.equal(cached["Cache-Control"], "public, max-age=0, must-revalidate", "browser selalu revalidasi");

  const noStore = dynamicApiHeaders({ vary: ["q"], ttlSeconds: 300, cacheable: false });
  assert.equal(noStore["Cache-Control"], "no-store");
  assert.equal(noStore["Netlify-CDN-Cache-Control"], "no-store");
  assert.equal(noStore["Netlify-Vary"], "query=q", "Netlify-Vary harus konsisten untuk URL yang sama");

  const zeroTtl = dynamicApiHeaders({ vary: ["q"], ttlSeconds: 0 });
  assert.equal(zeroTtl["Cache-Control"], "no-store");
});
