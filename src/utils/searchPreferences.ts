import type { FilterOptions, Language } from '../types/ktv';

const KEY = 'ktv_search_preferences_v1';
const languages: Language[] = ['國語', '台語', '粵語', '英語', '日語', '韓語', '陸歌', '客語', '兒歌', '原住民語', '藏語'];
export function loadPreferences(defaults: FilterOptions): FilterOptions {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!saved || typeof saved !== 'object') return defaults;
    return { ...defaults,
      selectedBrand: typeof saved.selectedBrand === 'string' ? saved.selectedBrand : defaults.selectedBrand,
      selectedBrands: Array.isArray(saved.selectedBrands) ? saved.selectedBrands.filter((v: unknown) => typeof v === 'string').slice(0, 100) : [],
      brandFilterMode: saved.brandFilterMode === 'all_of_them' ? 'all_of_them' : 'any',
      selectedLanguages: Array.isArray(saved.selectedLanguages) ? saved.selectedLanguages.filter((v: Language) => languages.includes(v)) : [],
      sortBy: ['length', 'stroke', 'title'].includes(saved.sortBy) ? saved.sortBy : defaults.sortBy,
    };
  } catch { return defaults; }
}
export function savePreferences({ selectedBrand, selectedBrands, brandFilterMode, selectedLanguages, sortBy }: FilterOptions) {
  try { localStorage.setItem(KEY, JSON.stringify({ selectedBrand, selectedBrands, brandFilterMode, selectedLanguages, sortBy })); } catch { /* Browsing remains usable when storage is unavailable. */ }
}
