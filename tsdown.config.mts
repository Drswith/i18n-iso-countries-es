import { defineConfig } from "tsdown";

const bundledRuntime = {
  alwaysBundle: ["diacritics"],
  onlyBundle: false as const,
};

export default defineConfig([
  {
    clean: true,
    deps: bundledRuntime,
    dts: true,
    entry: ["src/index.ts", "src/entry-node.ts"],
    format: "cjs",
    outDir: "dist",
    platform: "node",
    sourcemap: true,
    target: "es2018",
  },
  {
    clean: false,
    deps: bundledRuntime,
    dts: true,
    entry: "src/index.ts",
    format: "esm",
    fixedExtension: true,
    outDir: "dist",
    platform: "neutral",
    sourcemap: true,
    target: "es2018",
  },
  {
    clean: false,
    deps: bundledRuntime,
    dts: false,
    entry: { browser: "src/index.ts" },
    format: ["iife", "umd"],
    globalName: "I18nIsoCountries",
    outDir: "dist",
    platform: "browser",
    sourcemap: true,
    target: "es2018",
  },
]);
