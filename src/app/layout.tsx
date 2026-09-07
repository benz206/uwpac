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
    "Live occupancy, weekly heatmaps, and best times to go for the University of Waterloo PAC and CIF gyms.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="inline-block size-2.5 rounded-full bg-accent" />
              UW PAC
            </Link>
            <Nav />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-muted">
            Data scraped every 15 minutes from{" "}
            <a
              className="underline hover:text-foreground"
              href="https://warrior.uwaterloo.ca/FacilityOccupancy"
            >
              warrior.uwaterloo.ca
            </a>
            . Times are Waterloo local. Unofficial and for personal use.
          </div>
        </footer>
      </body>
    </html>
  );
}
