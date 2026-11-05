import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: {
    resolve: [
      "@open-draw/contracts",
      "@open-draw/document",
      "@open-draw/input",
      "@open-draw/renderer-svg",
      "@open-draw/shapes",
    ],
  },
  clean: true,
  sourcemap: true,
  splitting: false,
  noExternal: [
    "@open-draw/contracts",
    "@open-draw/document",
    "@open-draw/input",
    "@open-draw/renderer-svg",
    "@open-draw/shapes",
  ],
});
