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
