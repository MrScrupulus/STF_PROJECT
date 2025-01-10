/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://127.0.0.1:8000/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
