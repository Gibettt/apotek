import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/utils/**/*.{ts,tsx}",
        "src/store/cartStore.ts",
        "src/services/serviceUtils.ts",
        "src/services/obatService.ts",
        "src/services/penjualanService.ts"
      ],
      exclude: [
        "src/app/**",
        "src/test/**",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}"
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 70,
        lines: 80
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  }
});
