/** @type {import('next').NextConfig} */
const nextConfig = {
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

module.exports = nextConfig;
