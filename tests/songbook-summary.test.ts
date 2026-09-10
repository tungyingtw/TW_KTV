import assert from 'node:assert/strict';
import test from 'node:test';
import type { BrandInfo, Song } from '../src/types/ktv';
import { summarizeSongbook, songbookText, songbookStatus } from '../src/utils/songbookSummary';

const brands: BrandInfo[] = ['a','b','c'].map(id => ({ id, name: `平台 ${id}`, shortName: `平台 ${id}`, color: '', badgeBg: '', description: '' }));
const songs: Song[] = [
  { id: '1', title: '同名歌', artist: '歌手甲', language: '國語', brands: { a: {}, b: { available: false } }, lyricsSnippet: 'PRIVATE', youtubeUrl: 'PRIVATE' },
  { id: '2', title: '同名歌', artist: '歌手乙', language: '國語', brands: { b: { available: true } } },
  { id: '3', title: '備用歌', artist: '歌手丙', language: '國語', brands: { a: { available: false } } },
];
test('deduplicate favorite IDs without merging same titles or losing missing IDs', () => {
  const ids = ['2','1','2','missing','missing'];
  const summary = summarizeSongbook(ids, songs, brands);
  assert.deepEqual(summary.songs.map(song => song.id), ['2','1']);
  assert.deepEqual(summary.missingIds, ['missing']);
  assert.deepEqual(ids, ['2','1','2','missing','missing']);
});
test('platform totals include unknown songs in denominator and retain stable ties', () => {
  const summary = summarizeSongbook(['1','2','3'],songs,brands);
  assert.equal(summary.songs.length,3);
  assert.deepEqual(summary.platforms.map(({brand,available,unavailable,unknown})=>[brand.id,available,unavailable,unknown]), [['a',1,1,1],['b',1,1,1],['c',0,0,3]]);
  assert.equal(songbookStatus(songs[0],'a'),'有收錄線索');
  assert.equal(songbookStatus(songs[0],'b'),'未收錄');
  assert.equal(songbookStatus(songs[0],'c'),'尚未確認');
});
test('higher coverage ranks first, all-zero and empty songbooks never invent availability', () => {
  assert.equal(summarizeSongbook(['2'], songs, brands).platforms[0].brand.id,'b');
  for (const ids of [[], ['missing'], ['3']]) {
    const summary = summarizeSongbook(ids,songs,brands);
    assert.equal(summary.platforms.some(row=>row.available>0),false);
    assert.deepEqual(summary.platforms.map(row=>row.brand.id),['a','b','c']);
  }
});
test('copied summary uses an explicit safe field list and the selected platform', () => {
  const text = songbookText(summarizeSongbook(['1','2','missing'],songs,brands),new Date(2026,8,10),'b');
  assert.match(text,/查詢日期：2026\/09\/10/);
  assert.match(text,/https:\/\/tyfunlab.com\//);
  assert.match(text,/平台 b：1\/2 首/);
  assert.match(text,/同名歌／歌手甲 — 未收錄/);
  assert.match(text,/同名歌／歌手乙 — 有收錄線索/);
  assert.match(text,/另有 1 個收藏/);
  assert.match(text,/不保證所有門市/);
  assert.equal(text.includes('PRIVATE'),false);
  assert.equal(text.includes('missing'),false);
});
