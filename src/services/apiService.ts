import type { Song } from '../types/ktv';

const DB_NAME = 'KtvCatalogDB';
const STORE_NAME = 'catalog_store';
const KEY_NAME = 'full_catalog_v23';

const XOR_KEY = [0x9E, 0x4F, 0xC3, 0x8A, 0x27, 0x1B, 0x6D, 0xE5];
const MAGIC_HEADER = [0x54, 0x57, 0x4B, 0x54, 0x56, 0x42, 0x49, 0x4E]; // "TWKTVBIN"
const isLocalEnv = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = import.meta.env.VITE_API_URL || (isLocalEnv ? 'http://localhost:3001' : 'https://tw-ktv.onrender.com');

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
    ['full_catalog_v1', 'full_catalog_v2', 'full_catalog_v3', 'full_catalog_v4', 'full_catalog_v5', 'full_catalog_v6', 'full_catalog_v7', 'full_catalog_v8', 'full_catalog_v9', 'full_catalog_v17', 'full_catalog_v18', 'full_catalog_v19', 'full_catalog_v20', 'full_catalog_v21', 'full_catalog_v22'].forEach(k => storeClear.delete(k));
    
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

const TIME_KEY = 'full_catalog_timestamp_v23';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24小時快取效期 (避免重複浪費頻寬)

export async function fetchFullCatalog(onProgress?: (percent: number) => void): Promise<Song[]> {
  onProgress?.(5);

  // 1. 優先從本機 IndexedDB 快取讀取 (秒級 <50ms 載入)
  const cached = await getCachedCatalog();
  if (cached && cached.length > 0) {
    onProgress?.(100);
    const lastFetch = localStorage.getItem(TIME_KEY);
    const now = Date.now();
    const isExpired = !lastFetch || (now - parseInt(lastFetch, 10) > CACHE_TTL_MS);

    // 僅在快取超過 24 小時時才於背景默默觸發更新，省下載流量
    if (isExpired) {
      fetchFreshCatalog().then(fresh => {
        if (fresh && fresh.length > 0) {
          setCachedCatalog(fresh);
          try { localStorage.setItem(TIME_KEY, String(Date.now())); } catch {}
        }
      });
    }
    return mergeCatalogOverrides(cached);
  }

  // 2. 若無快取，開始真實 HTTP 二進位串流下載解密與進度計算
  onProgress?.(10);
  const fresh = await fetchFreshCatalog(onProgress);
  if (fresh && fresh.length > 0) {
    setCachedCatalog(fresh);
    try { localStorage.setItem(TIME_KEY, String(Date.now())); } catch {}
    return mergeCatalogOverrides(fresh);
  }

  onProgress?.(100);
  throw new Error('正式歌庫載入失敗');
}

async function mergeCatalogOverrides(catalog: Song[]): Promise<Song[]> {
  const overrides = await fetchCatalogOverrides();
  if (!overrides.songs.length && !overrides.deletedIds.length) return catalog;

  const deletedIds = new Set(overrides.deletedIds);
  const byId = new Map(catalog.filter(song => !deletedIds.has(song.id)).map(song => [song.id, song]));
  for (const overrideSong of overrides.songs) {
    if (deletedIds.has(overrideSong.id)) continue;
    byId.set(overrideSong.id, overrideSong);
  }

  return Array.from(byId.values());
}

async function fetchCatalogOverrides(): Promise<{ songs: Song[]; deletedIds: string[] }> {
  try {
    const response = await fetch(`${API_BASE}/api/catalog-overrides?t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return {
      songs: Array.isArray(data.songs) ? data.songs : [],
      deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds : [],
    };
  } catch (err) {
    console.warn('[API Service] 讀取歌庫覆寫資料失敗，僅使用靜態歌庫:', err);
    return { songs: [], deletedIds: [] };
  }
}

async function fetchFreshCatalog(onProgress?: (percent: number) => void): Promise<Song[] | null> {
  try {
    const baseUrl = import.meta.env.BASE_URL || './';
    const catalogUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}songs_catalog.bin?v=${Date.now()}`;
    const response = await fetch(catalogUrl);
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

      // 驗證 Magic Header
      let isHeaderMatch = true;
      for (let i = 0; i < MAGIC_HEADER.length; i++) {
        if (concatenated[i] !== MAGIC_HEADER[i]) {
          isHeaderMatch = false;
          break;
        }
      }

      const payloadOffset = isHeaderMatch ? MAGIC_HEADER.length : 0;
      const payloadLength = loadedBytes - payloadOffset;
      const decodedBytes = new Uint8Array(payloadLength);

      // 記憶體中 Byte 解混淆 (In-Memory De-obfuscation)
      for (let i = 0; i < payloadLength; i++) {
        const keyByte = XOR_KEY[i % XOR_KEY.length];
        decodedBytes[i] = concatenated[payloadOffset + i] ^ keyByte;
      }

      const text = new TextDecoder('utf-8').decode(decodedBytes);
      const catalogData = JSON.parse(text);
      onProgress?.(100);

      if (Array.isArray(catalogData) && catalogData.length > 0) {
        return catalogData;
      }
    }
  } catch (err) {
    console.warn('[API Service] 串流下載或解密 static catalog BIN 失敗:', err);
  }
  return null;
}
