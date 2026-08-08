import vinext from "vinext";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import { sites } from "./build/sites-vite-plugin";

const isCodexSeatbeltSandbox =
  process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig({
  server: isCodexSeatbeltSandbox
    ? {
        watch: {
          useFsEvents: false,
          usePolling: true,
        },
      }
    : undefined,

  plugins: [
    tailwindcss(),
    vinext(),
    sites(),
    nitro(),
  ],
});
