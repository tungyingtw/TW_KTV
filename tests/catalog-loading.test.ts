import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { decodeCatalogPayload } from '../src/utils/catalogCodec';

const manifest = JSON.parse(fs.readFileSync('public/songs_catalog.manifest.json', 'utf8'));
const compact = fs.readFileSync(`public/${manifest.compact.file}`);
const legacy = Buffer.concat(manifest.chunks.map((chunk: { file: string }) => fs.readFileSync(`public/${chunk.file}`)));

test('compact catalog preserves every song and field, with a verified checksum and smaller payload', async () => {
  assert.equal(compact.length, manifest.compact.bytes);
  assert.equal(createHash('sha256').update(compact).digest('hex'), manifest.compact.sha256);
  assert.ok(compact.length < legacy.length * 0.25);
  const original = await decodeCatalogPayload(legacy);
  const restored = await decodeCatalogPayload(compact);
  assert.deepEqual(restored, original);
  assert.ok(restored && restored.length > 0);
});

test('truncated compressed payload rejects instead of returning partial songs', async () => {
  await assert.rejects(decodeCatalogPayload(compact.subarray(0, compact.length - 100)));
});

// Transform only Vite's environment constants; exercise the actual service and native codec.
const source = fs.readFileSync('src/services/apiService.ts', 'utf8').replaceAll('import.meta.env', '({})').replace("'../utils/catalogCodec'", JSON.stringify(pathToFileURL(`${process.cwd()}/src/utils/catalogCodec.ts`).href));
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;

test('catalog download, fallback and nonblocking override synchronization', async t => {
  const storage = new Map<string, string>();
  t.mock.method(console, 'warn', () => {});
  const windowValue = { location: { hostname: 'localhost' }, setTimeout, clearTimeout };
  Object.defineProperty(globalThis, 'window', { value: windowValue, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) }, configurable: true });
  const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const originalSongs = (await decodeCatalogPayload(legacy))!;
  let requests: string[] = [];
  let corrupt = false;
  let overrides: () => Promise<Response> = async () => Response.json({ songs: [], deletedIds: [] });
  t.mock.method(globalThis, 'fetch', async (input: string) => {
    const url = new URL(input, 'http://localhost');
    requests.push(url.pathname);
    if (url.pathname === '/api/catalog-overrides') return overrides();
    if (url.pathname.endsWith('manifest.json')) return Response.json(manifest);
    const bytes = fs.readFileSync(`public${url.pathname}`);
    if (corrupt && url.pathname.endsWith('compact.bin')) bytes[20] ^= 1;
    return new Response(bytes, { headers: { 'content-length': String(bytes.length) } });
  });
  await t.test('cold load requests compact data only', async () => {
    const songs = await api.fetchFullCatalog(undefined, { forceRefresh: true });
    assert.equal(songs.length, originalSongs.length);
    assert.deepEqual(requests.filter(path => path.endsWith('.bin')), ['/songs_catalog.compact.bin']);
  });
  await t.test('checksum failure falls back to the complete legacy catalog', async () => {
    requests = []; corrupt = true;
    const songs = await api.fetchFullCatalog(undefined, { forceRefresh: true });
    assert.deepEqual(songs, originalSongs);
    assert.ok(requests.includes('/songs_catalog.part001.bin'));
    corrupt = false;
  });
  await t.test('browser without native decompression uses legacy assets', async () => {
    requests = [];
    const native = globalThis.DecompressionStream;
    Object.defineProperty(globalThis, 'DecompressionStream', { value: undefined, configurable: true });
    try {
      const songs = await api.fetchFullCatalog(undefined, { forceRefresh: true });
      assert.equal(songs.length, originalSongs.length);
      assert.ok(!requests.includes('/songs_catalog.compact.bin'));
    } finally { Object.defineProperty(globalThis, 'DecompressionStream', { value: native, configurable: true }); }
  });
  await t.test('slow sync does not block initial results, then applies edits and deletions', { timeout: 5000 }, async () => {
    let release!: (response: Response) => void;
    overrides = () => new Promise(resolve => { release = resolve; });
    let updated!: (songs: unknown[]) => void;
    const update = new Promise<unknown[]>(resolve => { updated = resolve; });
    const songs = await api.fetchFullCatalog(undefined, { forceRefresh: true, onCatalogUpdate: updated });
    assert.equal(songs.length, originalSongs.length);
    const changed = { ...originalSongs[0], title: '同步修正測試' };
    release(Response.json({ songs: [changed], deletedIds: [originalSongs[1].id] }));
    const result = await update as typeof originalSongs;
    assert.equal(result.find(song => song.id === changed.id)?.title, changed.title);
    assert.ok(!result.some(song => song.id === originalSongs[1].id));
  });
  await t.test('empty latest overrides remove previously cached corrections', { timeout: 5000 }, async () => {
    let release!: (response: Response) => void;
    overrides = () => new Promise(resolve => { release = resolve; });
    let updated!: (songs: unknown[]) => void;
    const update = new Promise<unknown[]>(resolve => { updated = resolve; });
    const initial = await api.fetchFullCatalog(undefined, { forceRefresh: true, onCatalogUpdate: updated });
    assert.equal(initial.length, originalSongs.length - 1);
    release(Response.json({ songs: [], deletedIds: [] }));
    assert.deepEqual(await update, originalSongs);
  });
  delete (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).localStorage;
});
