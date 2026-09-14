import Fuse from 'fuse.js';
import type { Song, FilterOptions, BrandId, Language } from '../types/ktv';
import { normalizeText } from './stringUtils';
import { getSearchRank } from './searchRanking';
import { expandFrontendQuery } from './artistAliases';
import { isBrandAvailable } from './brandAvailability';
import { getMeaningfulLyricsSnippet } from './songReference';
import { getMeaningfulComposer, getMeaningfulLyricist } from './songCredits';
function getSearchablePhonetic(value?: string): string {
  const normalized = (value || '').trim();
  return normalized && normalized.toUpperCase() !== 'AUTO' ? normalized : '';
}

export function createCatalogSearch(allSongs: Song[]) {
  let index: Fuse<Song> | undefined;
  const getFuseIndex = () => {
    if (index) return index;
    const fuse = new Fuse(allSongs, {
      keys: [
        { name: 'title', weight: 0.35 },
        { name: 'artist', weight: 0.3 },
        { name: 'lyricsSnippet', weight: 0.25 },
      ],
      threshold: 0.48,
      distance: 120,
      minMatchCharLength: 1,
      ignoreLocation: true,
      useExtendedSearch: true,
      getFn: (song, path) => {
        if (path === 'lyricsSnippet') return getMeaningfulLyricsSnippet(song as Song);
        if (path === 'lyricist') return getMeaningfulLyricist(song as Song);
        if (path === 'composer') return getMeaningfulComposer(song as Song);
        return Fuse.config.getFn(song, path);
      },
    });
    return index = fuse;
  };
  return (filters: FilterOptions): Song[] => {
    let result = allSongs;
    const rawQuery = filters.searchQuery.trim();
    const searchRanks = new Map<Song, number>();

    if (rawQuery) {
      const cleanQuery = normalizeText(rawQuery);
      const normalizedQuery = cleanQuery;
      const { matchedArtists, expandedTerms } = expandFrontendQuery(rawQuery);

      const substringMatches = allSongs.filter(s => {
        const cleanTitle = normalizeText(s.title);
        const cleanArtist = normalizeText(s.artist);
        const lyricist = getMeaningfulLyricist(s);
        const composer = getMeaningfulComposer(s);
        const lyricsSnippet = getMeaningfulLyricsSnippet(s);
        const cleanLyrics = normalizeText(lyricsSnippet);
        const zhuyin = getSearchablePhonetic(s.zhuyin).toLowerCase();
        const pinyin = getSearchablePhonetic(s.pinyin).toLowerCase();

        if (matchedArtists.has(s.artist)) return true;

        return (
          s.title.includes(rawQuery) || 
          s.artist.includes(rawQuery) || 
          (lyricist && lyricist.includes(rawQuery)) ||
          (composer && composer.includes(rawQuery)) ||
          (lyricsSnippet && lyricsSnippet.includes(rawQuery)) ||
          (cleanQuery && cleanTitle.includes(cleanQuery)) ||
          (cleanQuery && cleanArtist.includes(cleanQuery)) ||
          (cleanQuery && normalizeText(lyricist).includes(cleanQuery)) ||
          (cleanQuery && normalizeText(composer).includes(cleanQuery)) ||
          (cleanQuery && cleanLyrics.includes(cleanQuery)) ||
          (zhuyin && zhuyin.includes(rawQuery.toLowerCase())) ||
          (pinyin && pinyin.includes(rawQuery.toLowerCase())) ||
          expandedTerms.some(term => (
            s.title.toLowerCase().includes(term) ||
            s.artist.toLowerCase().includes(term)
          ))
        );
      });

      if (substringMatches.length > 0) {
        result = substringMatches;
        result.forEach(song => searchRanks.set(song, getSearchRank(song, normalizedQuery, matchedArtists)));
      } else {
        const fuzzyResults = getFuseIndex().search(rawQuery);
        result = fuzzyResults.map(res => res.item);
        result.forEach((song, index) => searchRanks.set(song, index));
      }
    }

    // 2. Selected Brand Filter
    // 2. Brand Filter (支持廠牌複選比對！OR / AND 雙模式)
    if (filters.selectedBrands && filters.selectedBrands.length > 0) {
      result = result.filter(song => {
        if (filters.brandFilterMode === 'all_of_them') {
          return filters.selectedBrands.every(bId => isBrandAvailable(song.brands?.[bId]));
        } else {
          return filters.selectedBrands.some(bId => isBrandAvailable(song.brands?.[bId]));
        }
      });
    } else if (filters.selectedBrand !== 'all') {
      result = result.filter(song => {
        const brandStatus = song.brands[filters.selectedBrand as BrandId];
        return isBrandAvailable(brandStatus);
      });
    }

    // 3. Language Filter
    if (filters.selectedLanguages.length > 0) {
      const normalizeLanguage = (songLang: string): Language | string => {
        const languageMap: Record<string, Language> = {
          國: '國語',
          台: '台語',
          粵: '粵語',
          英: '英語',
          日: '日語',
          韓: '韓語',
          客: '客語',
          兒: '兒歌',
          山: '原住民語',
          藏: '藏語',
        };
        return languageMap[songLang] || songLang;
      };

      const isLanguageMatch = (songLang: string, selectedLangs: Language[]) => {
        if (selectedLangs.length === 0) return true;
        const normalizedSongLang = normalizeLanguage(songLang);
        return selectedLangs.some(sel => {
          return normalizedSongLang === sel;
        });
      };
      result = result.filter(song => isLanguageMatch(song.language, filters.selectedLanguages));
    }

    // 4. Character Count Filter
    if (filters.selectedTitleLength !== 'all') {
      result = result.filter(song => {
        const titleLen = song.title.trim().length;
        if (filters.selectedTitleLength === '1') return titleLen === 1;
        if (filters.selectedTitleLength === '2') return titleLen === 2;
        if (filters.selectedTitleLength === '3') return titleLen === 3;
        if (filters.selectedTitleLength === '4') return titleLen === 4;
        if (filters.selectedTitleLength === '5') return titleLen === 5;
        if (filters.selectedTitleLength === '6') return titleLen === 6;
        if (filters.selectedTitleLength === '7+') return titleLen >= 7;
        return true;
      });
    }

    // 5. Official MV Filter
    if (filters.onlyOfficialMv) {
      result = result.filter(song => {
        if (filters.selectedBrand !== 'all') {
          return song.brands[filters.selectedBrand as BrandId]?.mvType === 'official_mv';
        }
        return Object.values(song.brands).some(b => isBrandAvailable(b) && b.mvType === 'official_mv');
      });
    }

    // 6. Guided Vocal Filter
    if (filters.onlyGuidedVocal) {
      result = result.filter(song => {
        if (filters.selectedBrand !== 'all') {
          return song.brands[filters.selectedBrand as BrandId]?.audioType === 'guided_vocal';
        }
        return Object.values(song.brands).some(b => isBrandAvailable(b) && b.audioType === 'guided_vocal');
      });
    }

    // 6.5 Niche Songs Filter
    if (filters.onlyNicheSongs) {
      result = result.filter(song => song.isNiche);
    }

    // 有查詢時先依命中程度排序，同級或未搜尋時沿用字數／筆劃排序。
    return [...result].sort((a, b) => {
      const relevance = (searchRanks.get(a) ?? 0) - (searchRanks.get(b) ?? 0);
      if (relevance) return relevance;
      if (filters.sortBy === 'length') {
        const lenA = a.title.trim().length;
        const lenB = b.title.trim().length;
        if (lenA !== lenB) {
          return lenA - lenB;
        }
        return a.title.localeCompare(b.title, 'zh-Hant-u-co-stroke');
      } else if (filters.sortBy === 'stroke') {
        return a.title.localeCompare(b.title, 'zh-Hant-u-co-stroke');
      } else {
        return a.title.localeCompare(b.title, 'zh-Hant');
      }
    });
  };
}
