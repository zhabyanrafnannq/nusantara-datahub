import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { BottomNav, Sidebar, Topbar } from "@/components/Navigation";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nusantara-datahub.netlify.app"),
  title: {
    default: "Nusantara DataHub — Dashboard Data Publik Indonesia",
    template: "%s · Nusantara DataHub",
  },
  description:
    "Dashboard terpadu data publik Indonesia: gempa bumi BMKG, katalog Satu Data Indonesia, dan prakiraan cuaca dalam satu aplikasi open source.",
  applicationName: "Nusantara DataHub",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Nusantara DataHub",
    title: "Nusantara DataHub — Dashboard Data Publik Indonesia",
    description:
      "Gempa bumi BMKG, katalog dataset Satu Data Indonesia, prakiraan cuaca, dan glosarium statistik dalam satu dashboard open source.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={jakarta.variable}>
      <body className="min-h-screen text-zinc-900 antialiased dark:text-zinc-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ServiceWorkerRegister />
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-h-screen w-full flex-col md:pl-64">
              <Topbar />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:px-8 md:pb-6">{children}</main>
              {/* pb-20 di mobile: beri ruang untuk BottomNav (52 px + safe-area). */}
              <footer className="px-4 pb-20 pt-6 text-center text-xs text-zinc-500 md:px-8 md:pb-6 dark:text-zinc-400">
                Nusantara DataHub — open source (MIT). Data © <a className="underline decoration-dotted" href="https://www.bmkg.go.id" target="_blank" rel="noreferrer">BMKG</a>,{" "}
                <a className="underline decoration-dotted" href="https://data.go.id" target="_blank" rel="noreferrer">Satu Data Indonesia</a>,{" "}
                <a className="underline decoration-dotted" href="https://earthquake.usgs.gov" target="_blank" rel="noreferrer">USGS</a>, dan{" "}
                <a className="underline decoration-dotted" href="https://open-meteo.com" target="_blank" rel="noreferrer">Open-Meteo</a>.
              </footer>
            </div>
          </div>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
