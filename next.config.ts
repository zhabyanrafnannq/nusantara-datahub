import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Impor per-ikon untuk paket besar: memotong bundle klien tanpa mengubah kode.
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  // Aktifkan jika deploy sebagai container standar:
  // output: "standalone",
};

export default nextConfig;
