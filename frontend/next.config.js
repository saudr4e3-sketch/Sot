const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // هذا السطر هو الحل الجذري لمنع الـ Hang أثناء البناء
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  images: {
    // نطاقات CDN موثوقة لصور اللاعبين — أضفت نطاقات شائعة وموثوقة
    domains: [
      'cdn.sofifa.net',
      'cdn.sofifa.com',
      'cdn.osm-fut.com',
      'cdn2.osm-fut.com',
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'platform-lookaside.fbsbx.com'
    ],
    // ضبط قواعد remotePatterns لضمان التوافق مع المسارات المحتملة على هذه النطاقات
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sofifa.net', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.sofifa.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.osm-fut.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn2.osm-fut.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60
  },
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  },
  // إضافة إعدادات الـ Webpack لتعريف المسارات المختصرة
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
}

module.exports = nextConfig
