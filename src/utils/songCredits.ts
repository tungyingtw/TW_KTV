import type { Song } from '../types/ktv';

function normalizeCredit(value?: string): string {
  return String(value || '').trim().toLowerCase();
}

export function isGeneratedCredit(value: string | undefined, artist: string | undefined): boolean {
  const credit = normalizeCredit(value);
  const artistName = normalizeCredit(artist);
  return Boolean(credit && artistName && credit === artistName);
}

export function getMeaningfulLyricist(song: Pick<Song, 'artist' | 'lyricist'>): string {
  return isGeneratedCredit(song.lyricist, song.artist) ? '' : String(song.lyricist || '').trim();
}

export function getMeaningfulComposer(song: Pick<Song, 'artist' | 'composer'>): string {
  return isGeneratedCredit(song.composer, song.artist) ? '' : String(song.composer || '').trim();
}
