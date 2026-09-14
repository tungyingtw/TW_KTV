import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCatalogSearch } from '../src/utils/catalogSearch';
import { loadPreferences, savePreferences } from '../src/utils/searchPreferences';
import type { Song, FilterOptions } from '../src/types/ktv';

const defaults: FilterOptions = { searchQuery: '', selectedBrand: 'all', selectedBrands: [], brandFilterMode: 'any', selectedLanguages: [], selectedTitleLength: 'all', onlyOfficialMv: false, onlyGuidedVocal: false, onlyNicheSongs: false, sortBy: 'length' };
const songs: Song[] = [
  { id: '1', title: '晴天', artist: '周杰倫', language: '國語', brands: { a: { available: true, mvType: 'official_mv' }, b: { available: true } } },
  { id: '2', title: '晴天之後', artist: '測試歌手', language: '台語', brands: { a: { available: true, audioType: 'guided_vocal' }, b: { available: false } } },
  { id: '3', title: 'Hello', artist: 'Adele', language: '英語', isNiche: true, brands: {} },
];
const search = createCatalogSearch(songs);
const ids = (changes: Partial<FilterOptions>) => search({ ...defaults, ...changes }).map(s => s.id);
test('search preserves exact relevance and fuzzy matching without mutating the catalog', () => {
  assert.deepEqual(ids({ searchQuery: '晴天' }), ['1', '2']);
  assert.deepEqual(ids({ searchQuery: '周杰倫' }), ['1']);
  assert.ok(ids({ searchQuery: 'Helo' }).includes('3'));
  assert.deepEqual(songs.map(s => s.id), ['1', '2', '3']);
});
test('worker returns transferable positions with the matching request ID and accepts catalog replacement', async () => {
  const messages: { id: number; indices: Uint32Array }[] = [];
  const worker = { onmessage: (_event: { data: unknown }) => {}, postMessage: (message: { id: number; indices: Uint32Array }) => messages.push(message) };
  Object.defineProperty(globalThis, 'self', { value: worker, configurable: true });
  try {
    await import('../src/workers/catalogSearchWorker');
    worker.onmessage({ data: { type: 'init', songs } });
    worker.onmessage({ data: { type: 'search', id: 7, filters: { ...defaults, searchQuery: '晴天' } } });
    assert.equal(messages[0].id, 7);
    assert.deepEqual(Array.from(messages[0].indices), [0, 1]);
    worker.onmessage({ data: { type: 'init', songs: [songs[2]] } });
    worker.onmessage({ data: { type: 'search', id: 8, filters: defaults } });
    assert.equal(messages[1].id, 8);
    assert.deepEqual(Array.from(messages[1].indices), [0]);
  } finally { Reflect.deleteProperty(globalThis, 'self'); }
});
test('combined brand, language, MV and guided filters preserve availability rules', () => {
  assert.deepEqual(ids({ selectedBrands: ['a', 'b'], brandFilterMode: 'all_of_them' }), ['1']);
  assert.deepEqual(ids({ selectedLanguages: ['台語'], onlyGuidedVocal: true }), ['2']);
  assert.deepEqual(ids({ onlyOfficialMv: true }), ['1']);
  assert.deepEqual(ids({ onlyNicheSongs: true }), ['3']);
  assert.deepEqual(ids({ selectedBrand: 'b', selectedLanguages: ['台語'] }), []);
});
test('preferences retain only reusable conditions and tolerate corrupt/blocked storage', () => {
  let value: string | null = null;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } } });
  savePreferences({ ...defaults, searchQuery: 'private query', selectedLanguages: ['台語'], sortBy: 'stroke', onlyOfficialMv: true });
  assert.equal(value!.includes('private query'), false);
  assert.deepEqual(loadPreferences(defaults), { ...defaults, selectedLanguages: ['台語'], sortBy: 'stroke' });
  value = '{broken'; assert.deepEqual(loadPreferences(defaults), defaults);
  value = JSON.stringify({ selectedLanguages: ['invalid'], selectedBrands: [null, 1], sortBy: 'invalid' });
  assert.deepEqual(loadPreferences(defaults), defaults);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
  assert.deepEqual(loadPreferences(defaults), defaults);
  assert.doesNotThrow(() => savePreferences(defaults));
  Reflect.deleteProperty(globalThis, 'localStorage');
});
