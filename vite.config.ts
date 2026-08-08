import vinext from "vinext";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import { sites } from "./build/sites-vite-plugin";

export default defineConfig({
  plugins: [
    vinext(),
    sites(),
    nitro(),
  ],
});
