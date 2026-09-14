import { createCatalogSearch } from '../utils/catalogSearch';
import type { Song, FilterOptions } from '../types/ktv';

let search: ReturnType<typeof createCatalogSearch>;
let positions: Map<Song, number>;
self.onmessage = ({ data }: MessageEvent<{ type: 'init'; songs: Song[] } | { type: 'search'; id: number; filters: FilterOptions }>) => {
  if (data.type === 'init') {
    search = createCatalogSearch(data.songs);
    positions = new Map(data.songs.map((song, i) => [song, i]));
    return;
  }
  try {
    const indices = Uint32Array.from(search(data.filters), song => positions.get(song)!);
    self.postMessage({ id: data.id, indices }, { transfer: [indices.buffer] });
  } catch { self.postMessage({ id: data.id, error: true }); }
};
