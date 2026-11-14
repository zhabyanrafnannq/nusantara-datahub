import type { GlossaryTerm } from "./types";

/**
 * Glosarium istilah statistik EN↔ID — data statis di repo (nol upstream).
 * Pengayaan bertahap: tambah entri baru cukup dengan menambah item di array ini.
 */
export const GLOSSARY: GlossaryTerm[] = [
  // ---------- Statistik Deskriptif ----------
  { term: "Mean", en: "Mean / Average", id: "Rata-rata", category: "deskriptif", plain: "Nilai tengah himpunan data: jumlah semua nilai dibagi banyaknya data. Sensitif terhadap nilai ekstrem (outlier).", formula: "x̄ = Σxᵢ / n", example: "Nilai ujian 70, 80, 90 → mean = 80." },
  { term: "Median", en: "Median", id: "Median / Nilai tengah", category: "deskriptif", plain: "Nilai yang membelah data terurut menjadi dua bagian sama besar. Tidak terpengaruh outlier.", example: "Dari 1, 3, 100 → median = 3, meski mean-nya 34,7." },
  { term: "Mode", en: "Mode", id: "Modus", category: "deskriptif", plain: "Nilai yang paling sering muncul dalam data. Data bisa punya lebih dari satu modus.", example: "Ukuran sepatu terlaris: 40, 41, 41, 42 → modus 41." },
  { term: "Standard deviation", en: "Standard deviation", id: "Deviasi standar (simpangan baku)", category: "deskriptif", plain: "Ukuran seberapa menyebar data dari rata-ratanya. Semakin kecil, semakin homogen.", formula: "s = √( Σ(xᵢ − x̄)² / (n − 1) )" },
  { term: "Variance", en: "Variance", id: "Varians", category: "deskriptif", plain: "Kuadrat dari deviasi standar; ukuran penyebaran dalam satuan kuadrat.", formula: "s² = Σ(xᵢ − x̄)² / (n − 1)" },
  { term: "Range", en: "Range", id: "Rentang (jangkauan)", category: "deskriptif", plain: "Selisih nilai terbesar dan terkecil. Ukuran penyebaran paling sederhana.", example: "Data 12–48 → rentang = 36." },
  { term: "Interquartile range", en: "Interquartile range (IQR)", id: "Rentang antar-kuartil", category: "deskriptif", plain: "Selisih kuartil ke-3 dan ke-1 (Q3−Q1); penyebaran 50% data tengah. Tahan outlier.", formula: "IQR = Q₃ − Q₁" },
  { term: "Skewness", en: "Skewness", id: "Kemiringan (skewness)", category: "deskriptif", plain: "Ukuran ketidaksimetrisan distribusi. Positif = ekor kanan lebih panjang; negatif = ekor kiri." },
  { term: "Kurtosis", en: "Kurtosis", id: "Kurtosis", category: "deskriptif", plain: "Ukuran 'keruncingan' distribusi dibanding distribusi normal. Tinggi = puncak tajam & ekor tebal." },
  { term: "Outlier", en: "Outlier", id: "Pencilan", category: "kualitas-data", plain: "Nilai yang jauh menyimpang dari pola data lain. Perlu diperiksa: kesalahan input atau kejadian nyata?", example: "Skor tes 45, 48, 50, 320 → 320 dicurigai pencilan." },
  { term: "Frequency distribution", en: "Frequency distribution", id: "Distribusi frekuensi", category: "deskriptif", plain: "Tabel yang memetakan nilai/kelas dengan banyaknya kemunculannya." },

  // ---------- Probabilitas & Distribusi ----------
  { term: "Random variable", en: "Random variable", id: "Variabel acak", category: "probabilitas", plain: "Peubah yang nilainya ditentukan oleh hasil suatu percobaan acak (diskrit atau kontinu)." },
  { term: "Probability distribution", en: "Probability distribution", id: "Distribusi probabilitas", category: "probabilitas", plain: "Aturan yang memetakan setiap nilai variabel acak ke peluang kemunculannya." },
  { term: "Normal distribution", en: "Normal distribution", id: "Distribusi normal (Gaussian)", category: "probabilitas", plain: "Distribusi berbentuk lonceng simetris; dasar banyak uji statistik karena teorema limit pusat.", formula: "f(x) = (1/(σ√2π)) · e^(−(x−μ)²/2σ²)" },
  { term: "Central limit theorem", en: "Central limit theorem (CLT)", id: "Teorema limit pusat", category: "probabilitas", plain: "Untuk sampel besar (n≥30), distribusi rata-rata sampel mendekati normal — apa pun bentuk distribusi aslinya." },
  { term: "Z-score", en: "Z-score", id: "Skor-Z (skor baku)", category: "probabilitas", plain: "Jarak sebuah nilai dari mean diukur dalam satuan deviasi standar.", formula: "z = (x − μ) / σ" },
  { term: "Binomial distribution", en: "Binomial distribution", id: "Distribusi binomial", category: "probabilitas", plain: "Distribusi banyaknya 'sukses' dalam n percobaan berpeluang tetap p.", formula: "P(X=k) = C(n,k) · pᵏ · (1−p)ⁿ⁻ᵏ" },
  { term: "Poisson distribution", en: "Poisson distribution", id: "Distribusi Poisson", category: "probabilitas", plain: "Distribusi banyaknya kejadian dalam interval waktu/ruang, untuk kejadian yang jarang dan independen.", example: "Jumlah gempa M≥6 per tahun." },
  { term: "Law of large numbers", en: "Law of large numbers", id: "Hukum bilangan besar", category: "probabilitas", plain: "Semakin banyak percobaan, rata-rata hasil semakin mendekati nilai harapan." },
  { term: "Expected value", en: "Expected value", id: "Nilai harapan", category: "probabilitas", plain: "Rata-rata jangka panjang dari variabel acak: jumlah (nilai × peluang).", formula: "E(X) = Σ xᵢ · P(xᵢ)" },

  // ---------- Inferensia ----------
  { term: "Population", en: "Population", id: "Populasi", category: "inferensia", plain: "Seluruh elemen yang menjadi objek penelitian." },
  { term: "Sample", en: "Sample", id: "Sampel", category: "inferensia", plain: "Bagian populasi yang benar-benar diamati/diukur untuk menarik kesimpulan tentang populasi." },
  { term: "Sampling bias", en: "Sampling bias", id: "Bias sampling", category: "kualitas-data", plain: "Kesalahan sistematis saat pemilihan sampel sehingga sampel tidak mewakili populasi." },
  { term: "Hypothesis", en: "Hypothesis", id: "Hipotesis", category: "inferensia", plain: "Dugaan yang akan diuji. H₀ = tidak ada efek; H₁ = ada efek yang hendak dibuktikan." },
  { term: "P-value", en: "P-value", id: "Nilai-p", category: "inferensia", plain: "Peluang memperoleh data se-ekstrem data sampel bila H₀ benar. p < 0,05 biasanya disebut 'signifikan' — tapi bukan bukti mutlak." },
  { term: "Significance level", en: "Significance level (α)", id: "Taraf signifikansi", category: "inferensia", plain: "Batas kesediaan menolak H₀ saat H₀ sebenarnya benar; umum 0,05 atau 0,01." },
  { term: "Type I error", en: "Type I error", id: "Galat jenis I (α)", category: "inferensia", plain: "Menolak H₀ padahal H₀ benar — 'alarm palsu'." },
  { term: "Type II error", en: "Type II error", id: "Galat jenis II (β)", category: "inferensia", plain: "Gagal menolak H₀ padahal H₁ benar — 'pembunyian terlewat'." },
  { term: "Statistical power", en: "Statistical power", id: "Daya uji (power)", category: "inferensia", plain: "Peluang mendeteksi efek yang sungguh ada (1 − β). Dipakai untuk menentukan ukuran sampel." },
  { term: "Confidence interval", en: "Confidence interval (CI)", id: "Interval kepercayaan", category: "inferensia", plain: "Rentang nilai yang 'sangat mungkin' memuat parameter populasi. CI 95% berarti 95% CI yang dibangun dari sampel berulang memuat nilai sebenarnya.", formula: "x̄ ± z·(σ/√n)" },
  { term: "T-test", en: "T-test", id: "Uji-t", category: "inferensia", plain: "Uji beda rata-rata untuk sampel kecil/varians tidak diketahui: satu sampel, dua sampel independen, atau berpasangan." },
  { term: "ANOVA", en: "ANOVA (F-test)", id: "Analisis varians", category: "inferensia", plain: "Uji beda rata-rata untuk ≥3 kelompok sekaligus dengan membandingkan varians antar- dan dalam-kelompok." },
  { term: "Chi-square test", en: "Chi-square test", id: "Uji chi-kuadrat", category: "inferensia", plain: "Uji hubungan/keterkaitan untuk data kategorik (tabel kontingensi) atau kecocokan distribusi." },
  { term: "Degrees of freedom", en: "Degrees of freedom (df)", id: "Derajat kebebasan", category: "inferensia", plain: "Banyaknya nilai yang bebas bervariasi setelah batasan statistik diperhitungkan; menentukan bentuk distribusi uji." },
  { term: "Nonparametric test", en: "Nonparametric test", id: "Uji nonparametrik", category: "inferensia", plain: "Uji tanpa asumsi distribusi normal — mis. Mann-Whitney, Wilcoxon, Kruskal-Wallis. Cocok untuk data ordinal/sketsa." },
  { term: "Central tendency", en: "Central tendency", id: "Ukuran pemusatan", category: "deskriptif", plain: "Istilah payung untuk mean, median, dan modus — 'di mana data cenderung berkumpul'." },

  // ---------- Regresi & Korelasi ----------
  { term: "Correlation", en: "Correlation coefficient (r)", id: "Koefisien korelasi", category: "regresi", plain: "Kekuatan dan arah hubungan linear antar dua variabel numerik (−1 s.d. +1). Korelasi ≠ kausalitas!", formula: "r = Σ(xᵢ−x̄)(yᵢ−ȳ) / √(Σ(xᵢ−x̄)²·Σ(yᵢ−ȳ)²)" },
  { term: "Simple linear regression", en: "Simple linear regression", id: "Regresi linear sederhana", category: "regresi", plain: "Memodelkan hubungan satu prediktor (X) dengan satu respons (Y) berbentuk garis lurus.", formula: "Y = β₀ + β₁X + ε" },
  { term: "Multiple regression", en: "Multiple linear regression", id: "Regresi linear berganda", category: "regresi", plain: "Regresi dengan lebih dari satu prediktor; mengukur efek tiap prediktor dengan yang lain dikontrol." },
  { term: "R-squared", en: "R-squared (R²)", id: "Koefisien determinasi", category: "regresi", plain: "Proporsi variasi respons yang dijelaskan model (0–1). R² 0,75 = 75% variasi terjelaskan.", formula: "R² = 1 − SS_res / SS_tot" },
  { term: "Multicollinearity", en: "Multicollinearity", id: "Multikolinearitas", category: "regresi", plain: "Prediktor yang saling berkorelasi kuat membuat koefisien regresi tak stabil. Deteksi: VIF > 10." },
  { term: "Heteroscedasticity", en: "Heteroscedasticity", id: "Heteroskedastisitas", category: "regresi", plain: "Varians residual tidak konstan di sepanjang rentang X — melanggar asumsi OLS. Deteksi: uji Breusch-Pagan." },
  { term: "Autocorrelation", en: "Autocorrelation", id: "Autokorelasi", category: "regresi", plain: "Residual saling berkorelasi (umum di data deret waktu). Deteksi: uji Durbin-Watson (nilai ≈2 = aman)." },
  { term: "Residual", en: "Residual", id: "Residual (sisa)", category: "regresi", plain: "Selisih nilai observasi dan nilai prediksi model; pola di residu = ada masalah model.", formula: "eᵢ = yᵢ − ŷᵢ" },
  { term: "Ordinary least squares", en: "Ordinary least squares (OLS)", id: "Metode kuadrat terkecil", category: "regresi", plain: "Estimasi koefisien regresi dengan meminimalkan jumlah kuadrat residual." },
  { term: "Confounding variable", en: "Confounding variable", id: "Variabel perancu", category: "kualitas-data", plain: "Variabel luar yang memengaruhi baik prediktor maupun respons, membuat hubungan tampak palsu." },
];

/** Kategori glosarium untuk filter. */
export const GLOSSARY_CATEGORIES: Array<{ id: GlossaryTerm["category"]; label: string }> = [
  { id: "deskriptif", label: "Deskriptif" },
  { id: "probabilitas", label: "Probabilitas" },
  { id: "inferensia", label: "Inferensia" },
  { id: "regresi", label: "Regresi & Korelasi" },
  { id: "kualitas-data", label: "Kualitas Data" },
];

/** Pencarian teks + filter kategori (pure, teruji). */
export function searchGlossary(terms: GlossaryTerm[], query: string, category: GlossaryTerm["category"] | "semua"): GlossaryTerm[] {
  const needle = query.trim().toLowerCase();
  return terms.filter((term) => {
    if (category !== "semua" && term.category !== category) return false;
    if (!needle) return true;
    return (
      term.term.toLowerCase().includes(needle) ||
      term.id.toLowerCase().includes(needle) ||
      term.en.toLowerCase().includes(needle) ||
      term.plain.toLowerCase().includes(needle)
    );
  });
}
