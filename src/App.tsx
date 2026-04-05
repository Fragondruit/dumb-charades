import { useCallback, useMemo, useState } from "react";
import { BollywoodMoviePick, MovieClient } from "./MovieClient";

const HINDI_PLACEHOLDER = "(Hindi title — translation coming later)";
const URDU_PLACEHOLDER = "(Urdu title — translation coming later)";

export default function App() {
  const client = useMemo(
    () => new MovieClient(import.meta.env.VITE_TMDB_API_KEY ?? ""),
    [],
  );

  const [movie, setMovie] = useState<BollywoodMoviePick | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await client.fetchRandomBollywoodMovie();
      setMovie(next);
    } catch (e) {
      setMovie(null);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  return (
    <div className="app">
      <div className="layout">
        <aside className="sidebar" aria-label="Movie details">
          {movie ? (
            <>
              <section className="meta-card">
                <h3 className="meta-heading">Year</h3>
                <p className="meta-value">{movie.releaseYear ?? "—"}</p>
              </section>
              <section className="meta-card">
                <h3 className="meta-heading">Cast</h3>
                {movie.castNames.length > 0 ? (
                  <ul className="cast-list">
                    {movie.castNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="meta-muted">No cast listed</p>
                )}
              </section>
            </>
          ) : (
            <p className="meta-muted sidebar-hint">
              Generate a movie to see year and cast here.
            </p>
          )}
        </aside>

        <main className="main">
          <p className="eyebrow">Dumb Charades — Bollywood</p>

          <h1 className="title-en">
            {movie?.title ?? (loading ? "…" : "Ready when you are")}
          </h1>

          <div className="translations">
            <div className="translation-block">
              <h2 className="subheading">Hindi</h2>
              <p className="translation-placeholder">{HINDI_PLACEHOLDER}</p>
            </div>
            <div className="translation-block">
              <h2 className="subheading">Urdu</h2>
              <p className="translation-placeholder">{URDU_PLACEHOLDER}</p>
            </div>
          </div>

          {error ? <p className="error-banner">{error}</p> : null}

          <div className="actions">
            <button
              type="button"
              className="generate-btn"
              onClick={() => void generate()}
              disabled={loading}
            >
              {loading ? "Loading…" : "Generate"}
            </button>
            {movie ? (
              <a
                className="tmdb-link"
                href={movie.tmdbUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open on TMDb
              </a>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
