import type { FilterOptions } from '../types/ktv';

export function relaxFilters(filters: FilterOptions, clearQuery = false): FilterOptions {
  return { ...filters, searchQuery: clearQuery ? '' : filters.searchQuery, selectedBrand: 'all', selectedBrands: [], selectedLanguages: [], selectedTitleLength: 'all', onlyOfficialMv: false, onlyGuidedVocal: false, onlyNicheSongs: false };
}
