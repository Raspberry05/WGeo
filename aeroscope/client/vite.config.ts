import { createRequire } from "node:module";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const require = createRequire(import.meta.url);
const cesium = require("vite-plugin-cesium-build") as (
  options?: {
    css?: boolean;
    iife?: boolean;
  },
) => import("vite").PluginOption;

export default defineConfig({
  plugins: [
    react(),
    cesium({
      css: true,
      iife: false,
    }),
  ],
});
