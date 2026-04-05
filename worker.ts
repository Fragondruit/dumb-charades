import type { ExportedHandler } from "@cloudflare/workers-types";
import { fetchRandomBollywoodMovie } from "./src/tmdbBollywood";

interface Env {
  ASSETS: Fetcher;
  TMDB_API_KEY: string;
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

const handler: ExportedHandler<Env> = {
  async fetch(request, env): Promise<Response> {
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
        const movie = await fetchRandomBollywoodMovie(env.TMDB_API_KEY);
        return json(movie, 200);
      } catch (e) {
        return json(
          { error: e instanceof Error ? e.message : "Server error." },
          500,
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
};

export default handler;
