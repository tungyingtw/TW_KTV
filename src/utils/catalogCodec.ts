import type { Song } from '../types/ktv';

const XOR_KEY = [0x9E, 0x4F, 0xC3, 0x8A, 0x27, 0x1B, 0x6D, 0xE5];

export async function decodeCatalogPayload(bytes: Uint8Array): Promise<Song[] | null> {
  const header = new TextDecoder().decode(bytes.subarray(0, 8));
  const compressed = header === 'TWKTVGZ1';
  const offset = compressed || header === 'TWKTVBIN' ? 8 : 0;
  const payload = new Uint8Array(bytes.length - offset);
  for (let i = 0; i < payload.length; i++) payload[i] = bytes[offset + i] ^ XOR_KEY[i % XOR_KEY.length];
  const json = compressed
    ? await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
    : new TextDecoder().decode(payload);
  const catalog: unknown = JSON.parse(json);
  return Array.isArray(catalog) && catalog.length > 0 ? catalog as Song[] : null;
}
