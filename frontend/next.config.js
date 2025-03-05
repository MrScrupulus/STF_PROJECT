/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://127.0.0.1:8000/:path*",
      },
      {
        source: "/reset-password/:token",
        destination: "/reset-password/:token",
      },
    ];
  },
  sassOptions: {
    includePaths: ["./src/styles"],
  },
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
};

module.exports = nextConfig;
