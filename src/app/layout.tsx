import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Nav } from "@/components/nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UW PAC — how busy is the gym?",
  description:
    "Live occupancy and weekly heatmaps for the University of Waterloo PAC and CIF gyms.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-10 border-b border-black/5 bg-background/70 backdrop-blur-md dark:border-white/10">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-[15px] font-medium tracking-tight">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-quiet opacity-50" />
                <span className="relative inline-flex size-2.5 rounded-full bg-quiet" />
              </span>
              UW PAC
            </Link>
            <Nav />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[12.5px] text-muted-foreground">
            <span>Unofficial · Times are Waterloo local</span>
            <span>
              Scraped every 15 minutes from{" "}
              <a
                className="text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline"
                href="https://warrior.uwaterloo.ca/FacilityOccupancy"
              >
                warrior.uwaterloo.ca
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
