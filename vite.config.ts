import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type ViteDevServer } from "vite";
import { GeminiClient } from "./src/GeminiClient";
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

function readDevVars(): { tmdb: string; gemini: string } {
  const filePath = path.join(__dirname, ".dev.vars");
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const o = parseDevVarsFile(raw);
    return {
      tmdb: o.TMDB_API_KEY ?? "",
      gemini: o.GEMINI_API_KEY ?? "",
    };
  } catch {
    return { tmdb: "", gemini: "" };
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
            const { tmdb: tmdbKey, gemini: geminiKey } = readDevVars();
            if (!tmdbKey.trim()) {
              res.statusCode = 503;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(
                JSON.stringify({
                  error: "Missing TMDB_API_KEY. Add it to .dev.vars for local dev.",
                }),
              );
              return;
            }
            const base = await fetchRandomBollywoodMovie(tmdbKey);

            if (geminiKey.trim()) {
              const [hindiVerbatim, urduVerbatim] = await Promise.all([
                GeminiClient.convertToHindi(geminiKey, base.title),
                GeminiClient.convertToUrdu(geminiKey, base.title),
              ]);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ ...base, hindiVerbatim, urduVerbatim }));
              return;
            }

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(base));
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
