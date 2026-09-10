import type { BrandInfo, Song } from '../types/ktv';
import { isBrandAvailable } from './brandAvailability';

export function summarizeSongbook(favoriteIds: string[], catalog: Song[], brands: BrandInfo[]) {
  const byId = new Map(catalog.map(song => [song.id, song]));
  const ids = [...new Set(favoriteIds)];
  const songs = ids.flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
  const platforms = brands.map((brand, order) => {
    const available = songs.filter(song => isBrandAvailable(song.brands[brand.id])).length;
    const unavailable = songs.filter(song => song.brands[brand.id]?.available === false).length;
    return { brand, order, available, unavailable, unknown: songs.length - available - unavailable };
  }).sort((a, b) => b.available - a.available || a.order - b.order);
  return { songs, missingIds: ids.filter(id => !byId.has(id)), platforms };
}

export function songbookStatus(song: Song, brandId: string) {
  return isBrandAvailable(song.brands[brandId]) ? '有收錄線索' : song.brands[brandId]?.available === false ? '未收錄' : '尚未確認';
}

export function songbookText(summary: ReturnType<typeof summarizeSongbook>, date: Date, platformId?: string) {
  const dateText = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  const platform = summary.platforms.find(row => row.brand.id === platformId);
  return [
    `我的 KTV 歌本（${summary.songs.length} 首）`, `查詢日期：${dateText}`,
    'https://tyfunlab.com/',
    ...(summary.missingIds.length ? [`另有 ${summary.missingIds.length} 個收藏目前未在歌庫中找到，未計入以下統計。`] : []),
    '', '平台收錄線索：',
    ...summary.platforms.map(row => `${row.brand.shortName}：${row.available}/${summary.songs.length} 首有收錄線索；未收錄 ${row.unavailable} 首；尚未確認 ${row.unknown} 首`),
    '', platform ? `歌曲清單（${platform.brand.shortName}）：` : '歌曲清單：',
    ...summary.songs.map((song, index) => `${index + 1}. ${song.title}／${song.artist}${platform ? ` — ${songbookStatus(song, platform.brand.id)}` : ''}`),
    '', '以上為本站資料的收錄線索，不保證所有門市與版本相同；出發前與現場請再確認，並準備備用歌曲。',
  ].join('\n');
}
