import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSM FUT Dual Battle",
  description: "Tactical Football Auction Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
