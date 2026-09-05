import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWA from "@/components/PWA";
import { getSeoConfig, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  ...(getSeoConfig().siteUrl ? { metadataBase: new URL(getSeoConfig().siteUrl!) } : {}),
  robots: { index: getSeoConfig().indexable, follow: true },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#6d2440",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        {children}
        <PWA />
      </body>
    </html>
  );
}
