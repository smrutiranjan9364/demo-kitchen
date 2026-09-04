import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWA from "@/components/PWA";

export const metadata: Metadata = {
  title: "Odia Kitchen — Authentic Odisha Flavours",
  description:
    "Cultural Odisha cuisine, lovingly prepared and delivered from Odia Kitchen.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rosy's Kitchen",
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
