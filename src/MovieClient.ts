import type { BollywoodMoviePick } from "./tmdbBollywood";

export type { BollywoodMoviePick } from "./tmdbBollywood";

/**
 * Fetches a random Bollywood movie via same-origin /api (Worker in prod, Vite middleware in dev).
 * The TMDb API key never ships to the browser.
 */
export class MovieClient {
  async fetchRandomBollywoodMovie(): Promise<BollywoodMoviePick> {
    const res = await fetch("/api/movie/random");
    const data: unknown = await res.json();

    if (!res.ok) {
      const msg =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Request failed.";
      throw new Error(msg);
    }

    return data as BollywoodMoviePick;
  }
}
