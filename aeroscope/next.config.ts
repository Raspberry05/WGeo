import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import webpack from "webpack";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["cesium"],
  transpilePackages: ["resium"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          CESIUM_BASE_URL: JSON.stringify("/cesium"),
        }),
      );
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      cesium: path.resolve(__dirname, "node_modules/cesium"),
    };

    return config;
  },
};

export default nextConfig;
