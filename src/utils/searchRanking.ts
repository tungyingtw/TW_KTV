import { normalizeText } from './stringUtils';

export function getSearchRank(song: { title: string; artist: string }, normalizedQuery: string, matchedArtists: Set<string>): number {
  if (normalizedQuery && normalizeText(song.title) === normalizedQuery) return 0;
  if (matchedArtists.has(song.artist) || (normalizedQuery && normalizeText(song.artist) === normalizedQuery)) return 1;
  return 2;
}
