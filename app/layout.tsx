import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Odia Kitchen — Authentic Odisha Flavours",
  description:
    "Cultural Odisha cuisine, lovingly prepared and delivered from Odia Kitchen.",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
