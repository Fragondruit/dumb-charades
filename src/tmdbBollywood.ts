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

function buildTmdbUrl(
  apiKey: string,
  path: string,
  params: Record<string, string>,
): string {
  const u = new URL(`${TMDB_BASE}${path}`);
  u.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v);
  }
  return u.toString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDb request failed (${res.status}). Try again later.`);
  }
  return res.json() as Promise<T>;
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

/**
 * Discover Hindi-original movies by popularity, random page 1–100, random title,
 * then load top billed cast.
 */
export async function fetchRandomBollywoodMovie(
  apiKey: string,
): Promise<BollywoodMoviePick> {
  if (!apiKey.trim()) {
    throw new Error("Missing TMDb API key.");
  }

  const page = randomInt(1, 100);
  const discoverUrl = buildTmdbUrl(apiKey, "/discover/movie", {
    language: "en-US",
    with_original_language: "hi",
    sort_by: "popularity.desc",
    include_adult: "false",
    page: String(page),
  });

  const data = await fetchJson<DiscoverResponse>(discoverUrl);
  const results = data.results ?? [];
  const movie = pickRandom(results);

  if (!movie) {
    throw new Error("No Bollywood movies found for that request.");
  }

  const creditsUrl = buildTmdbUrl(apiKey, `/movie/${movie.id}/credits`, {});
  const credits = await fetchJson<CreditsResponse>(creditsUrl);
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
