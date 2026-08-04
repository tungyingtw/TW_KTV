import type { BrandInfo, BrandId } from '../types/ktv';

export const DEFAULT_BRANDS: Record<string, BrandInfo> = {
  cashbox: {
    id: 'cashbox',
    name: '錢○ Cashbox 收錄',
    shortName: '錢○',
    color: '#34d399',
    badgeBg: 'rgba(52, 211, 153, 0.16)',
    description: '錢○ 門市系統歌曲收錄',
  },
  holiday: {
    id: 'holiday',
    name: '好○迪 Holiday 收錄',
    shortName: '好○迪',
    color: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.16)',
    description: '好○迪 門市系統歌曲收錄',
  },
  watering_hole: {
    id: 'watering_hole',
    name: '享○馨 KTV 收錄',
    shortName: '享○馨',
    color: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.16)',
    description: '享○馨 門市庭園包廂歌曲收錄',
  },
  starlight: {
    id: 'starlight',
    name: '星○點 收錄',
    shortName: '星○點',
    color: '#c084fc',
    badgeBg: 'rgba(192, 132, 252, 0.16)',
    description: '星○點 門市系統歌曲收錄',
  },
  singgo: {
    id: 'singgo',
    name: 'Sing○ 聚唱收錄',
    shortName: 'Sing○',
    color: '#f472b6',
    badgeBg: 'rgba(244, 114, 182, 0.16)',
    description: 'Sing○ 時尚包廂歌曲收錄',
  },
  vmix: {
    id: 'vmix',
    name: 'V-M○X 收錄',
    shortName: 'V-M○X',
    color: '#2dd4bf',
    badgeBg: 'rgba(45, 212, 191, 0.16)',
    description: 'V-M○X 門市系統歌曲收錄',
  },
  superstar: {
    id: 'superstar',
    name: '超○巨星 收錄',
    shortName: '超○巨星',
    color: '#fb923c',
    badgeBg: 'rgba(251, 146, 60, 0.16)',
    description: '超○巨星 門市系統歌曲收錄',
  },
  silver_cabinet: {
    id: 'silver_cabinet',
    name: '銀○ KTV 收錄',
    shortName: '銀○',
    color: '#eab308',
    badgeBg: 'rgba(234, 179, 8, 0.16)',
    description: '銀○ 門市系統歌曲收錄',
  },
  yinyuan: {
    id: 'yinyuan',
    name: '音○ 收錄',
    shortName: '音○',
    color: '#a3e635',
    badgeBg: 'rgba(163, 230, 53, 0.16)',
    description: '音○ 伴唱系統歌曲收錄',
  },
  golden_voice: {
    id: 'golden_voice',
    name: '金○ 收錄',
    shortName: '金○',
    color: '#2dd4bf',
    badgeBg: 'rgba(45, 212, 191, 0.16)',
    description: '金○ 伴唱系統歌曲收錄',
  },
  hongyin: {
    id: 'hongyin',
    name: '弘○ 收錄',
    shortName: '弘○',
    color: '#f43f5e',
    badgeBg: 'rgba(244, 63, 94, 0.16)',
    description: '弘○ 伴唱系統歌曲收錄',
  },
  datang: {
    id: 'datang',
    name: '大○系統 收錄',
    shortName: '大○',
    color: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.16)',
    description: '大○ 伴唱系統歌曲收錄',
  },
  ruiying: {
    id: 'ruiying',
    name: '瑞○系統 收錄',
    shortName: '瑞○',
    color: '#14b8a6',
    badgeBg: 'rgba(20, 184, 166, 0.16)',
    description: '瑞○ 伴唱系統歌曲收錄',
  },
  meihua: {
    id: 'meihua',
    name: '美○系統 收錄',
    shortName: '美○',
    color: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.16)',
    description: '美○ 伴唱系統歌曲收錄',
  },
};

const CACHE_KEY = 'ktv_active_brands_cache';
const CACHE_TIME_KEY = 'ktv_active_brands_cache_time';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour TTL (startup fallback only; fetchBrands always calls API)

let activeBrandsMap: Record<string, BrandInfo> = { ...DEFAULT_BRANDS };
export let BRAND_LIST: BrandInfo[] = Object.values(activeBrandsMap);

// 嘗試由快照復原品牌
try {
  if (typeof localStorage !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedAtStr = localStorage.getItem(CACHE_TIME_KEY);
    const cachedAt = cachedAtStr ? parseInt(cachedAtStr, 10) : 0;
    const isExpired = !cachedAt || (Date.now() - cachedAt > CACHE_TTL_MS);

    if (cached && !isExpired) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map: Record<string, BrandInfo> = {};
        parsed.forEach(b => { if (b && b.id) map[b.id] = b; });
        activeBrandsMap = map;
        BRAND_LIST = parsed;
      }
    }
  }
} catch {
  // Ignore cache parse error
}

type BrandChangeListener = (brands: BrandInfo[]) => void;
const listeners = new Set<BrandChangeListener>();

export function subscribeBrandChanges(listener: BrandChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  BRAND_LIST = Object.values(activeBrandsMap);
  listeners.forEach(fn => fn(BRAND_LIST));
}

export async function fetchBrands(): Promise<BrandInfo[]> {
  try {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const isGH = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
    const apiBase = isLocal ? `${window.location.protocol}//${window.location.hostname}:3001` : (isGH ? 'https://tw-ktv.onrender.com' : '');

    const res = await fetch(`${apiBase}/api/brands`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.brands) && data.brands.length > 0) {
        const newMap: Record<string, BrandInfo> = {};
        const newList: BrandInfo[] = [];

        data.brands.forEach((b: BrandInfo) => {
          if (b && b.id) {
            newMap[b.id] = {
              id: b.id,
              name: b.name || `${b.shortName || b.id} 收錄`,
              shortName: b.shortName || b.id,
              color: b.color || '#38bdf8',
              badgeBg: b.badgeBg || 'rgba(56, 189, 248, 0.16)',
              description: b.description || `${b.shortName || b.id} 系統歌曲收錄`,
            };
            newList.push(newMap[b.id]);
          }
        });

        activeBrandsMap = newMap;
        BRAND_LIST = newList;

        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(CACHE_KEY, JSON.stringify(newList));
            localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
          }
        } catch {
          // Ignore write error
        }

        notifyListeners();
        return newList;
      }
    }
  } catch {
    // Fetch failed, keep local or cached fallback
  }
  return BRAND_LIST;
}

// Proxy 封裝，保護存取未定義品牌 ID 時不出錯，亦即時聯動 activeBrandsMap
export const BRANDS: Record<BrandId, BrandInfo> = new Proxy(activeBrandsMap, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    if (prop in DEFAULT_BRANDS) {
      return DEFAULT_BRANDS[prop];
    }
    if (typeof prop === 'string' && prop !== 'then' && prop !== 'toJSON') {
      return {
        id: prop as BrandId,
        name: `${prop} 收錄`,
        shortName: prop,
        color: '#38bdf8',
        badgeBg: 'rgba(56, 189, 248, 0.16)',
        description: `${prop} 系統歌曲收錄`,
      };
    }
    return Reflect.get(target, prop);
  },
}) as Record<BrandId, BrandInfo>;
