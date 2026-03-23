import path from "node:path";
import { defineConfig } from "dumi";

export default defineConfig({
  alias: {
    "@squid-design/ui/styles/global.css": path.resolve(
      __dirname,
      "../../packages/ui/src/styles/global.css",
    ),
    "@squid-design/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
  },
  themeConfig: {
    name: "squid-design-docs",
  },
});
