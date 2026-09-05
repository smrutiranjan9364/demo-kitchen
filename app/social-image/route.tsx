import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

// A native generated sharing card; no external fonts or images are required.
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "#6d2440", color: "#f8efdf", fontFamily: "sans-serif" }}>
      <div style={{ fontSize: 88, fontWeight: 700 }}>{SITE_NAME}</div>
      <div style={{ fontSize: 38, marginTop: 32 }}>Traditional Odisha flavours</div>
      <div style={{ fontSize: 26, marginTop: 32 }}>Snacks · Sweets · Spices · Pitha</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
