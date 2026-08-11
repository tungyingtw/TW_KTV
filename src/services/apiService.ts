import type { Song } from '../types/ktv';

const DB_NAME = 'KtvCatalogDB';
const STORE_NAME = 'catalog_store';
const KEY_NAME = 'full_catalog_v28';

const XOR_KEY = [0x9E, 0x4F, 0xC3, 0x8A, 0x27, 0x1B, 0x6D, 0xE5];
const MAGIC_HEADER = [0x54, 0x57, 0x4B, 0x54, 0x56, 0x42, 0x49, 0x4E]; // "TWKTVBIN"
const isLocalEnv = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = import.meta.env.VITE_API_URL || (isLocalEnv ? 'http://localhost:3001' : 'https://tw-ktv.onrender.com');

export type VisitRegionCode = string;

export interface VisitRegionStat {
  city_code: VisitRegionCode;
  city_name: string;
  seed_count: number;
  live_count: number;
  total_count: number;
}

export interface VisitRegionStatsResponse {
  version: number;
  total_count: number;
  total_seed_count: number;
  total_live_count: number;
  seeded_at: string | null;
  live_started_at: string | null;
  seed_baseline_total: number;
  seed_baseline_captured_at: string | null;
  updated_at: string;
  user_region_code: VisitRegionCode | null;
  user_region_source: string | null;
  user_region_corrected: boolean;
  regions: VisitRegionStat[];
}

export interface VisitRegionRecordResponse {
  counted: boolean;
  city_code: VisitRegionCode;
  stats: VisitRegionStatsResponse;
}

export interface VisitRegionCorrectionResponse extends VisitRegionRecordResponse {
  corrected: boolean;
  created: boolean;
  from_city_code: VisitRegionCode | null;
}

async function parseVisitRegionApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : fallbackMessage);
  return data as T;
}

export function getKtvVisitorId(): string {
  let visitorId = localStorage.getItem('tw_ktv_vid');
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('tw_ktv_vid', visitorId);
  }
  return visitorId;
}

export async function checkApiHealth(timeoutMs = 10000): Promise<{ ok: boolean; persistent?: boolean; storage?: string; error?: string }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE}/api/health?t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    const data = await response.json();
    return { ok: Boolean(data.ok), persistent: Boolean(data.persistent), storage: data.storage };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'API health check failed' };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchVisitRegionStats(): Promise<VisitRegionStatsResponse> {
  const params = new URLSearchParams({ t: String(Date.now()), vid: getKtvVisitorId() });
  const response = await fetch(`${API_BASE}/api/visit-region-stats?${params.toString()}`, { cache: 'no-store' });
  return parseVisitRegionApiResponse<VisitRegionStatsResponse>(response, '到訪紀錄暫時無法讀取');
}

export async function recordVisitRegion(cityCode: VisitRegionCode): Promise<VisitRegionRecordResponse> {
  const response = await fetch(`${API_BASE}/api/visit-region-stats/record`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city_code: cityCode, visitor_id: getKtvVisitorId() }),
  });
  return parseVisitRegionApiResponse<VisitRegionRecordResponse>(response, '到訪紀錄暫時無法更新');
}

export async function correctVisitRegion(cityCode: VisitRegionCode): Promise<VisitRegionCorrectionResponse> {
  const response = await fetch(`${API_BASE}/api/visit-region-stats/correct-region`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city_code: cityCode, visitor_id: getKtvVisitorId() }),
  });
  return parseVisitRegionApiResponse<VisitRegionCorrectionResponse>(response, '到訪紀錄暫時無法更新');
}

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
    ['full_catalog_v1', 'full_catalog_v2', 'full_catalog_v3', 'full_catalog_v4', 'full_catalog_v5', 'full_catalog_v6', 'full_catalog_v7', 'full_catalog_v8', 'full_catalog_v9', 'full_catalog_v17', 'full_catalog_v18', 'full_catalog_v19', 'full_catalog_v20', 'full_catalog_v21', 'full_catalog_v22', 'full_catalog_v23', 'full_catalog_v24', 'full_catalog_v25', 'full_catalog_v26', 'full_catalog_v27'].forEach(k => storeClear.delete(k));
    
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

const TIME_KEY = 'full_catalog_timestamp_v28';
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
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const catalogBytes = await fetchChunkedCatalog(normalizedBase, onProgress) || await fetchSingleCatalog(`${normalizedBase}songs_catalog.bin?v=${Date.now()}`, onProgress);

    if (catalogBytes && catalogBytes.length > 0) {
      onProgress?.(95);

      // 驗證 Magic Header
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

      // 記憶體中 Byte 解混淆 (In-Memory De-obfuscation)
      for (let i = 0; i < payloadLength; i++) {
        const keyByte = XOR_KEY[i % XOR_KEY.length];
        decodedBytes[i] = catalogBytes[payloadOffset + i] ^ keyByte;
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

async function fetchChunkedCatalog(baseUrl: string, onProgress?: (percent: number) => void): Promise<Uint8Array | null> {
  try {
    const manifestResponse = await fetch(`${baseUrl}songs_catalog.manifest.json?v=${Date.now()}`);
    if (!manifestResponse.ok) return null;
    const manifest = await manifestResponse.json();
    const chunks = Array.isArray(manifest.chunks) ? manifest.chunks : [];
    const totalBytes = Number(manifest.totalBytes) || chunks.reduce((sum: number, chunk: { bytes?: number }) => sum + (Number(chunk.bytes) || 0), 0);
    if (!chunks.length || totalBytes <= 0) return null;

    let loadedBytes = 0;
    const output = new Uint8Array(totalBytes);
    for (const chunk of chunks as Array<{ file: string; bytes: number }>) {
      const response = await fetch(`${baseUrl}${chunk.file}?v=${Date.now()}`);
      if (!response.ok) throw new Error(`chunk ${chunk.file} HTTP ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      output.set(bytes, loadedBytes);
      loadedBytes += bytes.length;
      const pct = Math.min(92, Math.round(10 + (loadedBytes / totalBytes) * 82));
      onProgress?.(pct);
    }
    return loadedBytes === totalBytes ? output : output.slice(0, loadedBytes);
  } catch (err) {
    console.warn('[API Service] 分片歌庫載入失敗，改用單檔備援:', err);
    return null;
  }
}

async function fetchSingleCatalog(catalogUrl: string, onProgress?: (percent: number) => void): Promise<Uint8Array | null> {
  const response = await fetch(catalogUrl);
  if (!response.ok || !response.body) return null;

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

  const concatenated = new Uint8Array(loadedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    concatenated.set(chunk, offset);
    offset += chunk.length;
  }
  return concatenated;
}
