import type { Song } from '../types/ktv';

export function isGeneratedLyricsSnippet(value?: string): boolean {
  const text = String(value || '').trim();
  return text.includes('全台 10 大 KTV') || /^.+《.+》KTV 歌曲資料待校對。$/.test(text);
}

export function getMeaningfulLyricsSnippet(song: Pick<Song, 'lyricsSnippet'>): string {
  return isGeneratedLyricsSnippet(song.lyricsSnippet) ? '' : String(song.lyricsSnippet || '').trim();
}

export function isGeneratedYoutubeSearchUrl(value?: string): boolean {
  return String(value || '').includes('youtube.com/results?search_query=');
}

export function getYoutubeSearchUrl(song: Pick<Song, 'artist' | 'title'>): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artist || ''} ${song.title || ''}`.trim())}`;
}

export function getYoutubeReferenceUrl(song: Pick<Song, 'artist' | 'title' | 'youtubeUrl'>): string {
  const storedUrl = String(song.youtubeUrl || '').trim();
  return storedUrl && !isGeneratedYoutubeSearchUrl(storedUrl) ? storedUrl : getYoutubeSearchUrl(song);
}
