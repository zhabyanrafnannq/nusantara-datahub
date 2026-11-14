import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Sidebar, Topbar } from "@/components/Navigation";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nusantara DataHub — Dashboard Data Publik Indonesia",
    template: "%s · Nusantara DataHub",
  },
  description:
    "Dashboard terpadu data publik Indonesia: gempa bumi BMKG, katalog Satu Data Indonesia, dan prakiraan cuaca dalam satu aplikasi open source.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={jakarta.variable}>
      <body className="min-h-screen text-zinc-900 antialiased dark:text-zinc-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-h-screen w-full flex-col md:pl-64">
              <Topbar />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">{children}</main>
              <footer className="px-4 py-6 text-center text-xs text-zinc-500 md:px-8 dark:text-zinc-400">
                Nusantara DataHub — open source (MIT). Data © <a className="underline decoration-dotted" href="https://www.bmkg.go.id" target="_blank" rel="noreferrer">BMKG</a>,{" "}
                <a className="underline decoration-dotted" href="https://data.go.id" target="_blank" rel="noreferrer">Satu Data Indonesia</a>,{" "}
                <a className="underline decoration-dotted" href="https://earthquake.usgs.gov" target="_blank" rel="noreferrer">USGS</a>, dan{" "}
                <a className="underline decoration-dotted" href="https://open-meteo.com" target="_blank" rel="noreferrer">Open-Meteo</a>.
              </footer>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
