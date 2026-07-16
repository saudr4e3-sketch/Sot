import type { Metadata } from 'next'
// تم تعديل المسار لاستخدام Alias الموجه لـ src مباشرةً
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'OSM FUT Dual Battle - 1v1 Football Auction Game',
  description: 'Real-time tactical 1v1 football auction game with live match simulation. Build your team, bid strategically, and compete.',
  icons: {
    icon: '⚽',
  },
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="theme-color" content="#0F1419" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-dark-bg text-text-primary">
        {children}
      </body>
    </html>
  )
}
