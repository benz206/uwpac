import type { Metadata } from "next";

export const SITE_NAME = "UW PAC";

export const OG_BASE = {
  siteName: SITE_NAME,
  type: "website",
  locale: "en_CA",
} satisfies Metadata["openGraph"];

export function ogImage(url: string, alt: string) {
  return { url, alt, width: 1200, height: 630 };
}
