import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactiver les stack traces en développement pour éviter l'erreur 431
  reactStrictMode: true,
  swcMinify: true,
  
  async rewrites() {
    // En développement Docker, utiliser le nom du service
    // En développement local, utiliser localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
                   (process.env.NODE_ENV === 'production' ? 'http://backend:80' : 'http://127.0.0.1:8001');
    
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "./src"),
    };
    config.resolve.extensions = [
      ...config.resolve.extensions,
      ".scss",
      ".css",
    ];
    
    // Configuration pour react-leaflet et recharts
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
      config.optimization = {
        ...config.optimization,
        minimize: false,
      };
    }
    
    return config;
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
