import { GENRES, MOVIES, type Movie } from './catalog';

export const ALL_MOVIES: Movie[] = MOVIES;
export const ALL_GENRES: string[] = GENRES;

const byIdCache = new Map<string, Movie>(MOVIES.map((m) => [m.id, m]));

export function getMovie(id: string): Movie | undefined {
  return byIdCache.get(id);
}

export function getMovieOrFirst(id: string): Movie {
  return byIdCache.get(id) ?? MOVIES[0];
}

export function byGenre(genre: string): Movie[] {
  return MOVIES.filter((m) => m.genres.includes(genre));
}

export function featured(): Movie[] {
  return MOVIES.filter((m) => m.featured);
}

export function trending(): Movie[] {
  return MOVIES.filter((m) => m.featured || m.year >= 2014).slice(0, 14);
}

export function topRated(limit = 10): Movie[] {
  return [...MOVIES].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export function nollywood(): Movie[] {
  return byGenre('Nollywood');
}

export function recentReleases(): Movie[] {
  return [...MOVIES].filter((m) => m.year >= 2014).sort((a, b) => b.year - a.year);
}

export function classics(): Movie[] {
  return [...MOVIES].filter((m) => m.year < 2000).sort((a, b) => b.rating - a.rating);
}

export function genreCounts(): { genre: string; count: number }[] {
  return GENRES.map((genre) => ({ genre, count: byGenre(genre).length })).filter((g) => g.count > 0);
}

export function similarTo(movie: Movie, limit = 8): Movie[] {
  const scored = MOVIES.filter((m) => m.id !== movie.id).map((m) => {
    const shared = m.genres.filter((g) => movie.genres.includes(g)).length;
    const era = Math.abs(m.year - movie.year) <= 12 ? 1 : 0;
    return { movie: m, score: shared * 3 + era + m.rating / 20 };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.movie);
}

export function castOf(movie: Movie): { name: string; role: string }[] {
  return movie.cast.map((name, i) => ({ name, role: i === 0 ? 'Lead' : 'Cast' }));
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

export function searchMovies(query: string): Movie[] {
  const q = normalize(query);
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const scored: { movie: Movie; score: number }[] = [];
  for (const movie of MOVIES) {
    const title = normalize(movie.title);
    const director = normalize(movie.director);
    const genres = movie.genres.map(normalize).join(' ');
    const cast = movie.cast.map(normalize).join(' ');
    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      let termScore = 0;
      if (title.startsWith(term)) termScore += 12;
      else if (title.includes(term)) termScore += 8;
      if (director.includes(term)) termScore += 5;
      if (cast.includes(term)) termScore += 4;
      if (genres.includes(term)) termScore += 3;
      if (String(movie.year).includes(term)) termScore += 2;
      if (termScore === 0) matchedAll = false;
      score += termScore;
    }

    if (matchedAll && score > 0) scored.push({ movie, score: score + movie.rating });
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.movie);
}

export const POPULAR_SEARCHES = [
  'Nolan',
  'Nollywood',
  'Sci-Fi',
  'Tarantino',
  'Keanu Reeves',
  'Oscar',
  '1994',
  'Villeneuve',
];

export type SortKey = 'rating' | 'year' | 'title' | 'runtime';

export function sortMovies(list: Movie[], key: SortKey): Movie[] {
  const copy = [...list];
  switch (key) {
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating);
    case 'year':
      return copy.sort((a, b) => b.year - a.year);
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'runtime':
      return copy.sort((a, b) => b.runtime - a.runtime);
    default:
      return copy;
  }
}
