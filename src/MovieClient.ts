const TMDB_BASE = "https://api.themoviedb.org/3";

type DiscoverMovieResult = {
  id: number;
  title: string;
  release_date?: string;
};

type DiscoverResponse = {
  results?: DiscoverMovieResult[];
};

type CastMember = {
  name: string;
  order: number;
};

type CreditsResponse = {
  cast?: CastMember[];
};

export type BollywoodMoviePick = {
  id: number;
  title: string;
  releaseYear: string | null;
  castNames: string[];
  tmdbUrl: string;
};

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  return items[randomInt(0, items.length - 1)];
}

export class MovieClient {
  constructor(private readonly apiKey: string) {}

  private assertApiKey(): void {
    if (!this.apiKey.trim()) {
      throw new Error(
        "Missing TMDb API key. Add tmdbApiKey to .env.json (see .env.json.example).",
      );
    }
  }

  private buildUrl(path: string, params: Record<string, string>): string {
    const u = new URL(`${TMDB_BASE}${path}`);
    u.searchParams.set("api_key", this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      u.searchParams.set(k, v);
    }
    return u.toString();
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TMDb request failed (${res.status}). Try again later.`);
    }
    return res.json() as Promise<T>;
  }

  /**
   * Mirrors the WordPress shortcode: discover Hindi-original movies by popularity,
   * random page 1–100, then one random title from that page.
   */
  async fetchRandomBollywoodMovie(): Promise<BollywoodMoviePick> {
    this.assertApiKey();

    const page = randomInt(1, 100);
    const discoverUrl = this.buildUrl("/discover/movie", {
      language: "en-US",
      with_original_language: "hi",
      sort_by: "popularity.desc",
      include_adult: "false",
      page: String(page),
    });

    const data = await this.fetchJson<DiscoverResponse>(discoverUrl);
    const results = data.results ?? [];
    const movie = pickRandom(results);

    if (!movie) {
      throw new Error("No Bollywood movies found for that request.");
    }

    const creditsUrl = this.buildUrl(`/movie/${movie.id}/credits`, {});
    const credits = await this.fetchJson<CreditsResponse>(creditsUrl);
    const castNames = topCastNames(credits.cast ?? [], 3);

    const releaseYear = movie.release_date?.slice(0, 4) ?? null;

    return {
      id: movie.id,
      title: movie.title,
      releaseYear,
      castNames,
      tmdbUrl: `https://www.themoviedb.org/movie/${movie.id}`,
    };
  }
}

function topCastNames(cast: CastMember[], limit: number): string[] {
  const sorted = [...cast].sort((a, b) => a.order - b.order);
  const names: string[] = [];
  for (const c of sorted) {
    if (c.name && !names.includes(c.name)) {
      names.push(c.name);
    }
    if (names.length >= limit) {
      break;
    }
  }
  return names;
}
