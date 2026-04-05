import { createRequire } from "node:module";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const require = createRequire(import.meta.url);

let tmdbKey = "";
try {
  const env = require("./.env.json");
  tmdbKey = env.TMDB_API_KEY; 
} catch {
  console.error("Missing or invalid .env.json");
}

export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_TMDB_API_KEY": JSON.stringify(tmdbKey),
  },
});
