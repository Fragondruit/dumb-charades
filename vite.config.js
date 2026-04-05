import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readTmdbKeyFromEnvJson() {
  const filePath = path.join(__dirname, ".env.json");
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    if (typeof data.tmdbApiKey === "string") {
      return data.tmdbApiKey;
    }
    if (typeof data.TMDB_API_KEY === "string") {
      return data.TMDB_API_KEY;
    }
  } catch {
    /* missing or invalid .env.json */
  }
  return "";
}

export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_TMDB_API_KEY": JSON.stringify(readTmdbKeyFromEnvJson()),
  },
});
