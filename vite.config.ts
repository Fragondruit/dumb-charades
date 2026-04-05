import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type ViteDevServer } from "vite";
import { fetchRandomBollywoodMovie } from "./src/tmdbBollywood";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Minimal dotenv-style parser for .dev.vars (same format as Cloudflare docs). */
function parseDevVarsFile(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) {
      continue;
    }
    const eq = t.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function readTmdbKeyFromDevVars(): string {
  const filePath = path.join(__dirname, ".dev.vars");
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return parseDevVarsFile(raw).TMDB_API_KEY ?? "";
  } catch {
    return "";
  }
}

function tmdbDevApiPlugin() {
  return {
    name: "tmdb-dev-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? "";
        if (req.method !== "GET" || pathname !== "/api/movie/random") {
          next();
          return;
        }

        void (async () => {
          try {
            const key = readTmdbKeyFromDevVars();
            if (!key.trim()) {
              res.statusCode = 503;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(
                JSON.stringify({
                  error:
                    "Missing TMDB_API_KEY. Add it to .dev.vars (see .dev.vars.example).",
                }),
              );
              return;
            }
            const movie = await fetchRandomBollywoodMovie(key);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(movie));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(
              JSON.stringify({
                error: e instanceof Error ? e.message : "Server error.",
              }),
            );
          }
        })();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tmdbDevApiPlugin()],
});
