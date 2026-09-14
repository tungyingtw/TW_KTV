import { decodeCatalogPayload } from '../utils/catalogCodec';

self.onmessage = async (event: MessageEvent<Uint8Array>) => {
  try {
    self.postMessage({ ok: true, catalog: await decodeCatalogPayload(event.data) });
  } catch (err) {
    self.postMessage({ ok: false, error: err instanceof Error ? err.message : 'catalog decode failed' });
  }
};

export {};
