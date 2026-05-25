import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import webpack from "webpack";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["cesium"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          CESIUM_BASE_URL: JSON.stringify("/cesium"),
        }),
      );

      const prevExternals = config.externals;
      config.externals = [
        ...(Array.isArray(prevExternals)
          ? prevExternals
          : prevExternals
            ? [prevExternals]
            : []),
        (
          ctx: { request?: string },
          callback: (err?: Error | null, result?: string) => void,
        ) => {
          if (ctx.request === "cesium") {
            callback(null, "root Cesium");
            return;
          }
          callback();
        },
      ];
    }

    return config;
  },
};

export default nextConfig;
