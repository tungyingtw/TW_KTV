import type { Song } from '../types/ktv';
import { MOCK_SONGS } from '../data/mockSongs';

const DB_NAME = 'KtvCatalogDB';
const STORE_NAME = 'catalog_store';
const KEY_NAME = 'full_catalog_v17';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedCatalog(): Promise<Song[] | null> {
  try {
    const db = await openDB();
    // 清理舊版本快取鍵值
    const txClear = db.transaction(STORE_NAME, 'readwrite');
    const storeClear = txClear.objectStore(STORE_NAME);
    ['full_catalog_v1', 'full_catalog_v2', 'full_catalog_v3', 'full_catalog_v4', 'full_catalog_v5', 'full_catalog_v6', 'full_catalog_v7', 'full_catalog_v8', 'full_catalog_v9'].forEach(k => storeClear.delete(k));
    
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_NAME);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedCatalog(catalog: Song[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(catalog, KEY_NAME);
  } catch (e) {
    console.warn('[API Service] 寫入 IndexedDB 快取失敗:', e);
  }
}

export async function fetchFullCatalog(onProgress?: (percent: number) => void): Promise<Song[]> {
  onProgress?.(5);

  // 1. 優先從本機 IndexedDB 快取讀取 (秒級 <50ms 載入)
  const cached = await getCachedCatalog();
  if (cached && cached.length > 0) {
    onProgress?.(100);
    // 背景默默更新快取
    fetchFreshCatalog().then(fresh => {
      if (fresh && fresh.length > 0) {
        setCachedCatalog(fresh);
      }
    });
    return cached;
  }

  // 2. 若無快取，開始真實 HTTP 串流下載與百分比計算
  onProgress?.(10);
  const fresh = await fetchFreshCatalog(onProgress);
  if (fresh && fresh.length > 0) {
    setCachedCatalog(fresh);
    return fresh;
  }

  onProgress?.(100);
  return MOCK_SONGS;
}

async function fetchFreshCatalog(onProgress?: (percent: number) => void): Promise<Song[] | null> {
  try {
    const response = await fetch(`/songs_catalog.json?v=${Date.now()}`);
    if (response.ok && response.body) {
      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body.getReader();
      let loadedBytes = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loadedBytes += value.length;

        if (totalBytes > 0) {
          const pct = Math.min(92, Math.round(10 + (loadedBytes / totalBytes) * 82));
          onProgress?.(pct);
        } else {
          // 估算進度（針對未回傳 content-length 之情況）
          const estPct = Math.min(90, Math.round(10 + 80 * (1 - Math.exp(-loadedBytes / 15000000))));
          onProgress?.(estPct);
        }
      }

      onProgress?.(95);
      const concatenated = new Uint8Array(loadedBytes);
      let offset = 0;
      for (const chunk of chunks) {
        concatenated.set(chunk, offset);
        offset += chunk.length;
      }

      const text = new TextDecoder('utf-8').decode(concatenated);
      const catalogData = JSON.parse(text);
      onProgress?.(100);

      if (Array.isArray(catalogData) && catalogData.length > 0) {
        return catalogData;
      }
    }
  } catch (err) {
    console.warn('[API Service] 串流下載 static catalog JSON 失敗:', err);
  }
  return null;
}
