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
  sassOptions: {
    includePaths: ["./src/styles"],
  },
};

module.exports = nextConfig;
