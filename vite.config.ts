import { crx, defineManifest } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const manifest = defineManifest({
  manifest_version: 3,
  name: "AtCoder problem copy as markdown",
  version: "0.0.2",
  description:
    "Show copy button on AtCoder problem page which copies problem as markdown format",
  icons: {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
  permissions: ["clipboardWrite"],
  content_scripts: [
    {
      matches: ["https://atcoder.jp/contests/*/tasks/*"],
      js: ["src/content.ts"],
      run_at: "document_end",
    },
  ],
});

export default defineConfig({
  plugins: [react(), crx({ manifest })],
});
