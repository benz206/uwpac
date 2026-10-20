import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { CommandMenu } from "@/components/command-menu";
import { Nav } from "@/components/nav";
import { OG_BASE, ogImage, SITE_NAME } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const description = "Live occupancy, weekly trends and heatmaps for the University of Waterloo PAC and CIF gyms.";

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description,
  applicationName: SITE_NAME,
  openGraph: { ...OG_BASE, images: [ogImage("/og", "Live occupancy for every PAC and CIF area")] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ee" },
    { media: "(prefers-color-scheme: dark)", color: "#111110" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
            <div className="flex h-full items-center gap-5 sm:gap-8">
              <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                <span className="flex size-6 items-end justify-center gap-[2px] rounded-[5px] bg-foreground px-[5px] pb-[5px]">
                  <span className="h-1.5 w-[3px] rounded-[1px] bg-accent/45" />
                  <span className="h-2.5 w-[3px] rounded-[1px] bg-accent/70" />
                  <span className="h-3.5 w-[3px] rounded-[1px] bg-accent" />
                </span>
                UW PAC
              </Link>
              <Nav />
            </div>
            <CommandMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
        <footer className="border-t">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-[12.5px] text-muted-foreground">
            <span>Unofficial · Times are Waterloo local</span>
            <span>
              Scraped every 30 minutes from{" "}
              <a
                className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
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
