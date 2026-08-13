import type { Song } from '../types/ktv';

const XOR_KEY = [0x9E, 0x4F, 0xC3, 0x8A, 0x27, 0x1B, 0x6D, 0xE5];
const MAGIC_HEADER = [0x54, 0x57, 0x4B, 0x54, 0x56, 0x42, 0x49, 0x4E];

function decodeCatalogBytes(catalogBytes: Uint8Array): Song[] | null {
  let isHeaderMatch = true;
  for (let i = 0; i < MAGIC_HEADER.length; i++) {
    if (catalogBytes[i] !== MAGIC_HEADER[i]) {
      isHeaderMatch = false;
      break;
    }
  }

  const payloadOffset = isHeaderMatch ? MAGIC_HEADER.length : 0;
  const payloadLength = catalogBytes.length - payloadOffset;
  const decodedBytes = new Uint8Array(payloadLength);

  for (let i = 0; i < payloadLength; i++) {
    decodedBytes[i] = catalogBytes[payloadOffset + i] ^ XOR_KEY[i % XOR_KEY.length];
  }

  const catalogData = JSON.parse(new TextDecoder('utf-8').decode(decodedBytes));
  return Array.isArray(catalogData) && catalogData.length > 0 ? catalogData : null;
}

self.onmessage = (event: MessageEvent<Uint8Array>) => {
  try {
    self.postMessage({ ok: true, catalog: decodeCatalogBytes(event.data) });
  } catch (err) {
    self.postMessage({ ok: false, error: err instanceof Error ? err.message : 'catalog decode failed' });
  }
};

export {};
