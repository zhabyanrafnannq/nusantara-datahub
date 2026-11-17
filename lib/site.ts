/** Identitas situs — dipakai metadata, sitemap, robots, dan JSON-LD. */
export const SITE_URL = "https://nusantara-datahub.netlify.app";
export const SITE_NAME = "Nusantara DataHub";
export const SITE_TAGLINE = "Dashboard Data Publik Indonesia";

/** Halaman publik yang diindeks mesin pencari. */
export const PUBLIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: "hourly" | "daily" | "weekly" }> = [
  { path: "/", priority: 1, changeFrequency: "hourly" },
  { path: "/gempa", priority: 0.9, changeFrequency: "hourly" },
  { path: "/cuaca", priority: 0.8, changeFrequency: "daily" },
  { path: "/katalog", priority: 0.9, changeFrequency: "daily" },
  { path: "/glosarium", priority: 0.6, changeFrequency: "weekly" },
  { path: "/koleksi", priority: 0.3, changeFrequency: "weekly" },
];
