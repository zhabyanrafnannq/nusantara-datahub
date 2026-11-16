# Nusantara DataHub — Folder Deploy Netlify

Folder ini adalah **versi bersih khusus deployment**: hanya berisi kode aplikasi dan konfigurasi yang dibutuhkan Netlify. Pengembangan penuh (test, CI, dokumentasi, screenshot) tetap berada di folder proyek utama.

## Isi folder

| Item | Fungsi |
|---|---|
| `app/`, `components/`, `lib/` | Kode aplikasi (termasuk `lib/fixtures/` — data contoh untuk fallback, **wajib ada**) |
| `netlify.toml` | Konfigurasi Netlify: build command, Node 22, plugin `@netlify/plugin-nextjs` |
| `package.json` + `package-lock.json` | Dependensi (eslint/vitest sudah dibuang karena tidak dibutuhkan deploy) |
| `next.config.ts`, `tsconfig.json`, `postcss.config.mjs` | Konfigurasi build |
| `.gitignore`, `.env.example` | Kebersihan repo & referensi env (tidak ada env wajib) |

**Yang sengaja tidak dibawa:** `tests/`, `.github/`, `docs/` (screenshot), `CONTRIBUTING.md`, `LICENSE`, `eslint.config.mjs`, `vitest.config.ts` — tidak diperlukan agar aplikasi jalan di Netlify.

## Cara deploy ke Netlify

> Aplikasi ini menggunakan **server-side API routes** (proxy BMKG/Satu Data/USGS/Open-Meteo), jadi deploy harus lewat **koneksi repositori Git** — bukan drag-and-drop Netlify Drop.

### Langkah (± 5 menit)

1. Push folder ini ke sebuah repositori GitHub:
   ```bash
   git remote add origin https://github.com/<username>/nusantara-datahub.git
   git push -u origin main
   ```
2. Buka [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → pilih repositorinya.
3. Biarkan semua pengaturan default — `netlify.toml` sudah mengatur: build `npm run build`, publish `.next`, Node 22, dan plugin `@netlify/plugin-nextjs` (dipasang otomatis).
4. Klik **Deploy**. Tidak ada environment variable yang wajib diisi.

Netlify akan memberi URL seperti `https://nusantara-datahub.netlify.app`.

### Alternatif: Netlify CLI

```bash
npm install -g netlify-cli
netlify deploy --build --prod
```

## Menjalankan lokal (opsional)

```bash
npm install
npm run dev    # http://localhost:3000
```

---

Aplikasi ini **bukan** produk resmi BMKG, Satu Data Indonesia, USGS, atau Open-Meteo. Data tetap tunduk pada ketentuan lembaga penerbit. 
