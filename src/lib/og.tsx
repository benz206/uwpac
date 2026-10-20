import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import type { Crowd } from "./analysis";

export const INK = "#1a1a19";
export const PAPER = "#f4f2ee";
export const MUTED = "#6b6862";
export const RULE = "#e2ded6";
export const ACCENT = "#e4f222";

export const TONE_HEX: Record<Crowd["tone"], string> = {
  quiet: "#059669",
  light: "#65a30d",
  moderate: "#d97706",
  busy: "#ea580c",
  packed: "#e11d48",
};

export function ogResponse({ tag, title, subtitle, children }: { tag: string; title: string; subtitle?: string; children: ReactNode }) {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: PAPER, color: INK, padding: "56px 64px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, letterSpacing: -0.5 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, width: 44, height: 44, borderRadius: 9, background: INK, padding: "0 9px 9px" }}>
              <div style={{ width: 6, height: 10, borderRadius: 2, background: ACCENT, opacity: 0.45 }} />
              <div style={{ width: 6, height: 17, borderRadius: 2, background: ACCENT, opacity: 0.7 }} />
              <div style={{ width: 6, height: 24, borderRadius: 2, background: ACCENT }} />
            </div>
            UW PAC
          </div>
          <div style={{ display: "flex", background: ACCENT, borderRadius: 8, padding: "8px 16px", fontSize: 24 }}>{tag}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
          <div style={{ fontSize: 64, letterSpacing: -2.5, lineHeight: 1 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 26, color: MUTED, marginTop: 14 }}>{subtitle}</div> : null}
        </div>
        <div style={{ display: "flex", flex: 1, marginTop: 36 }}>{children}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
