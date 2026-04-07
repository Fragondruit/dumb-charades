import type { ExportedHandler, Fetcher } from "@cloudflare/workers-types";
import { GeminiClient } from "./src/GeminiClient";
import { fetchRandomBollywoodMovie } from "./src/tmdbBollywood";

interface Env {
  ASSETS: Fetcher;
  TMDB_API_KEY: string;
  GEMINI_API_KEY?: string;
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

const handler = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/movie/random" && request.method === "GET") {
      try {
        if (!env.TMDB_API_KEY?.trim()) {
          return json(
            {
              error:
                "Missing TMDB_API_KEY. Set the secret in the dashboard or .dev.vars for local dev.",
            },
            503,
          );
        }
        const base = await fetchRandomBollywoodMovie(env.TMDB_API_KEY);
        const geminiKey = env.GEMINI_API_KEY?.trim() ?? "";

        if (geminiKey) {
          const [hindiVerbatim, urduVerbatim] = await Promise.all([
            GeminiClient.convertToHindi(geminiKey, base.title),
            GeminiClient.convertToUrdu(geminiKey, base.title),
          ]);
          return json({ ...base, hindiVerbatim, urduVerbatim }, 200);
        }

        return json(base, 200);
      } catch (e) {
        return json({ error: e instanceof Error ? e.message : "Server error." }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
} as ExportedHandler<Env>;

export default handler;
