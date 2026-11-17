import type { MetadataRoute } from "next";

/** Manifest PWA: dashboard bisa dipasang di homescreen dan dibuka tanpa UI browser. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nusantara DataHub — Dashboard Data Publik Indonesia",
    short_name: "Nusantara",
    description:
      "Gempa bumi BMKG, katalog dataset Satu Data Indonesia, prakiraan cuaca, dan glosarium statistik dalam satu dashboard.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    lang: "id",
    categories: ["news", "weather", "education", "government"],
    background_color: "#ffffff",
    theme_color: "#059669",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
