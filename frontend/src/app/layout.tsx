import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "OSM FUT Dual Battle | مزاد المزايدة التكتيكي",
  description: "تحدّ 1v1 حقيقي في مزاد تكتيكي لبناء تشكيلة الأحلام",
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
