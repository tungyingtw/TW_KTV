import { useState, useMemo, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import type { Song, FilterOptions, BrandId, Language } from './types/ktv';
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { BrandTabScroll } from './components/BrandTabScroll';
import { MobileNavbar } from './components/mobile/MobileNavbar';
import { MobileSearchBar } from './components/mobile/MobileSearchBar';
import { MobileBrandTabScroll } from './components/mobile/MobileBrandTabScroll';
import { MatrixView } from './components/MatrixView';
import { CardView } from './components/CardView';
import { SongDetailModal } from './components/SongDetailModal';
import { ReportModal } from './components/ReportModal';
import { SuggestSongModal } from './components/SuggestSongModal';
import { AdBannerSlot } from './components/AdBannerSlot';
import { BottomSheetFilter } from './components/BottomSheetFilter';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { ToastNotification } from './components/ToastNotification';
import { LegalNoticeModal } from './components/LegalNoticeModal';
import { SiteInfoGuide } from './components/SiteInfoGuide';
import { checkApiHealth, fetchFullCatalog } from './services/apiService';
import { fetchBrands } from './data/brands';
import { useBrands } from './hooks/useBrands';
import { useDebounce } from './hooks/useDebounce';
import { useIsMobile } from './hooks/useIsMobile';
import { stripPunctuation, normalizeText } from './utils/stringUtils';
import { expandFrontendQuery } from './utils/artistAliases';
import { Sparkles, Music, ChevronDown, Mail } from 'lucide-react';

function getSearchablePhonetic(value?: string): string {
  const normalized = (value || '').trim();
  return normalized && normalized.toUpperCase() !== 'AUTO' ? normalized : '';
}

export function App() {
  const isMobile = useIsMobile();
  const brandList = useBrands();
  const resultsRegionRef = useRef<HTMLElement>(null);
  const latestSearchStateRef = useRef({
    query: '',
    resultCount: 0,
  });

  // Main Catalog State
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [isCatalogReady, setIsCatalogReady] = useState<boolean>(false);
  const [apiHealthStatus, setApiHealthStatus] = useState<'checking' | 'waking' | 'online' | 'unavailable'>('checking');
  const [targetProgress, setTargetProgress] = useState<number>(0);
  const [displayProgress, setDisplayProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [catalogLoadError, setCatalogLoadError] = useState<string | null>(null);

  // Filter Options State (Default: length = 字數 > 注音/筆劃)
  const [filters, setFilters] = useState<FilterOptions>(() => {
    let initialViewMode: 'matrix' | 'cards' = 'matrix';
    try {
      const savedMode = localStorage.getItem('ktv_view_mode');
      const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 768;
      if (!isMobileViewport && (savedMode === 'matrix' || savedMode === 'cards')) {
        initialViewMode = savedMode;
      }
    } catch {}

    return {
      searchQuery: '',
      selectedBrand: 'all',
      selectedBrands: [],
      brandFilterMode: 'any',
      selectedLanguages: [],
      selectedTitleLength: 'all',
      onlyOfficialMv: false,
      onlyOriginalVocal: false,
      onlyMainlandViral: false,
      onlyNicheSongs: false,
      viewMode: initialViewMode,
      sortBy: 'length',
    };
  });

  // Debounced Search Query (280ms delay)
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 280);
  const isSearching = filters.searchQuery !== debouncedSearchQuery;

  // Favorites State (Default: [] empty array)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ktv_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI Modals State
  const [selectedSongDetail, setSelectedSongDetail] = useState<Song | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [reportModalSong, setReportModalSong] = useState<Song | null>(null);
  const [legalNoticeTab, setLegalNoticeTab] = useState<'privacy' | 'terms' | 'about' | 'contact' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination / Load More limit state (Default display: 40)
  const [displayedCount, setDisplayedCount] = useState<number>(40);

  // Reset pagination when search query or filter changes
  useEffect(() => {
    setDisplayedCount(40);
  }, [
    debouncedSearchQuery,
    filters.selectedBrand,
    filters.selectedBrands,
    filters.brandFilterMode,
    filters.selectedLanguages,
    filters.selectedTitleLength,
    filters.onlyOfficialMv,
    filters.onlyOriginalVocal,
    filters.onlyMainlandViral,
    filters.onlyNicheSongs,
    filters.sortBy,
  ]);

  // Load Full Expanded Catalog with IndexedDB 快取 & 串流 0%~100%
  useEffect(() => {
    fetchBrands();
    fetchFullCatalog((pct) => setTargetProgress(pct)).then(catalog => {
      if (catalog && catalog.length > 0) {
        // 前台硬過濾防護牆 (Strict Sanitizer Guard)
        const sanitized = catalog.filter(s => {
          const t = s.title || '';
          const snippet = s.lyricsSnippet || '';
          if (/\bVol\.\d+|\bVOL\.\d+|\bvol\.\d+|\bNo\.\d+/i.test(t)) return false;
          if (snippet.includes('10 大 KTV 歌號對照') || snippet.includes('包廂歡唱點歌碼')) return false;
          return true;
        });
        setAllSongs(sanitized);
        setIsCatalogReady(sanitized.length > 0);
      }
      setTargetProgress(100);
    }).catch(() => {
      setIsCatalogReady(false);
      setCatalogLoadError('歌庫資料暫時無法載入。請稍候再試，或確認網路連線後重新整理。');
      setTargetProgress(100);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const wakeTimer = window.setTimeout(() => {
      if (!cancelled) setApiHealthStatus(prev => prev === 'checking' ? 'waking' : prev);
    }, 4500);

    checkApiHealth(12000).then(health => {
      if (cancelled) return;
      window.clearTimeout(wakeTimer);
      setApiHealthStatus(health.ok ? 'online' : 'unavailable');
    });

    return () => {
      cancelled = true;
      window.clearTimeout(wakeTimer);
    };
  }, []);

  // 平滑進度條插值器 (即使本地端極速連線，也能順暢呈現 0% -> 100% 填滿過程)
  useEffect(() => {
    let animationFrame: number;
    const updateProgress = () => {
      setDisplayProgress(prev => {
        if (prev < targetProgress) {
          const diff = targetProgress - prev;
          const step = Math.max(1.5, diff * 0.15);
          const next = Math.min(targetProgress, prev + step);
          return Math.round(next * 10) / 10;
        }
        return prev;
      });
      animationFrame = requestAnimationFrame(updateProgress);
    };
    animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [targetProgress]);

  // 100% 達成且資料狀態確定後再切換，避免 loading 與列表之間出現空白空檔
  useEffect(() => {
    if (displayProgress >= 100 && targetProgress >= 100 && (isCatalogReady || catalogLoadError)) {
      const timer = setTimeout(() => {
        setIsFadingOut(false);
        setIsLoadingCatalog(false);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [catalogLoadError, displayProgress, isCatalogReady, targetProgress]);

  // Sync favorites to localStorage
  useEffect(() => {
    localStorage.setItem('ktv_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Fuse.js Fuzzy Search Setup (歌名、歌手與歌曲導引資訊比對)
  const fuse = useMemo(() => {
    return new Fuse(allSongs, {
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
    });
  }, [allSongs]);

  // Dynamic brand song count auditing
  const brandSongCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    brandList.forEach(b => {
      counts[b.id] = 0;
    });

    allSongs.forEach(song => {
      if (!song.brands) return;
      Object.entries(song.brands).forEach(([bId, status]) => {
        if (status?.available) {
          counts[bId] = (counts[bId] || 0) + 1;
        }
      });
    });
    return counts;
  }, [allSongs, brandList]);

  // Main Multi-Dimensional Filter Logic
  const filteredSongs = useMemo(() => {
    let result = allSongs;
    const rawQuery = debouncedSearchQuery.trim();

    if (rawQuery) {
      const cleanQuery = stripPunctuation(rawQuery);
      const normalizedQuery = normalizeText(rawQuery);
      const { matchedArtists, expandedTerms } = expandFrontendQuery(rawQuery);

      const substringMatches = allSongs.filter(s => {
        const cleanTitle = stripPunctuation(s.title);
        const cleanArtist = stripPunctuation(s.artist);
        const cleanLyrics = stripPunctuation(s.lyricsSnippet || '');
        const zhuyin = getSearchablePhonetic(s.zhuyin).toLowerCase();
        const pinyin = getSearchablePhonetic(s.pinyin).toLowerCase();

        if (matchedArtists.has(s.artist)) return true;

        return (
          s.title.includes(rawQuery) || 
          s.artist.includes(rawQuery) || 
          (s.lyricsSnippet && s.lyricsSnippet.includes(rawQuery)) ||
          (cleanQuery && cleanTitle.includes(cleanQuery)) ||
          (cleanQuery && cleanArtist.includes(cleanQuery)) ||
          (cleanQuery && cleanLyrics.includes(cleanQuery)) ||
          (normalizedQuery && normalizeText(s.title).includes(normalizedQuery)) ||
          (normalizedQuery && normalizeText(s.artist).includes(normalizedQuery)) ||
          (normalizedQuery && s.lyricsSnippet && normalizeText(s.lyricsSnippet).includes(normalizedQuery)) ||
          (zhuyin && zhuyin.includes(rawQuery.toLowerCase())) ||
          (pinyin && pinyin.includes(rawQuery.toLowerCase())) ||
          expandedTerms.some(term => (
            s.title.toLowerCase().includes(term) ||
            s.artist.toLowerCase().includes(term)
          ))
        );
      });

      if (substringMatches.length > 0) {
        // 別名或關鍵字精確相符排序置頂 (Rank-1 Artist Matching)
        result = [...substringMatches].sort((a, b) => {
          const isAArtistMatch = matchedArtists.has(a.artist);
          const isBArtistMatch = matchedArtists.has(b.artist);
          if (isAArtistMatch && !isBArtistMatch) return -1;
          if (!isAArtistMatch && isBArtistMatch) return 1;
          return 0;
        });
      } else {
        const fuzzyResults = fuse.search(rawQuery);
        result = fuzzyResults.map(res => res.item);
      }
    }

    // 2. Selected Brand Filter
    // 2. Brand Filter (支持廠牌複選比對！OR / AND 雙模式)
    if (filters.selectedBrands && filters.selectedBrands.length > 0) {
      result = result.filter(song => {
        if (filters.brandFilterMode === 'all_of_them') {
          return filters.selectedBrands.every(bId => song.brands?.[bId]?.available);
        } else {
          return filters.selectedBrands.some(bId => song.brands?.[bId]?.available);
        }
      });
    } else if (filters.selectedBrand !== 'all') {
      result = result.filter(song => {
        const brandStatus = song.brands[filters.selectedBrand as BrandId];
        return brandStatus && brandStatus.available;
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

      const isLanguageMatch = (songLang: string, selectedLangs: Language[], isMainlandViral?: boolean) => {
        if (selectedLangs.length === 0) return true;
        const normalizedSongLang = normalizeLanguage(songLang);
        return selectedLangs.some(sel => {
          if (sel === '陸歌' && (songLang === '陸歌' || isMainlandViral)) return true;
          return normalizedSongLang === sel;
        });
      };
      result = result.filter(song => isLanguageMatch(song.language, filters.selectedLanguages, song.isMainlandViral));
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
        return Object.values(song.brands).some(b => b.available && b.mvType === 'official_mv');
      });
    }

    // 6. Original Vocal Filter
    if (filters.onlyOriginalVocal) {
      result = result.filter(song => {
        if (filters.selectedBrand !== 'all') {
          return song.brands[filters.selectedBrand as BrandId]?.audioType === 'original_vocal';
        }
        return Object.values(song.brands).some(b => b.available && b.audioType === 'original_vocal');
      });
    }

    // 6.5 Mainland Viral Filter
    if (filters.onlyMainlandViral) {
      result = result.filter(song => song.isMainlandViral || song.language === '陸歌');
    }

    // 6.6 Niche Songs Filter
    if (filters.onlyNicheSongs) {
      result = result.filter(song => song.isNiche);
    }

    // 7. Sorting: 預設【字數 ➔ 注音/筆劃 (短至長)】
    return [...result].sort((a, b) => {
      if (filters.sortBy === 'length') {
        const lenA = a.title.trim().length;
        const lenB = b.title.trim().length;
        if (lenA !== lenB) {
          return lenA - lenB;
        }
        return a.title.localeCompare(b.title, 'zh-Hant-u-co-stroke');
      } else if (filters.sortBy === 'stroke') {
        return a.title.localeCompare(b.title, 'zh-Hant-u-co-stroke');
      } else if (filters.sortBy === 'popular') {
        return (a.popularRank || 999) - (b.popularRank || 999);
      } else if (filters.sortBy === 'newest') {
        return b.releaseYear - a.releaseYear;
      } else {
        return a.title.localeCompare(b.title, 'zh-Hant');
      }
    });
  }, [
    filters.selectedBrand,
    filters.selectedBrands,
    filters.brandFilterMode,
    filters.selectedLanguages,
    filters.selectedTitleLength,
    filters.onlyOfficialMv,
    filters.onlyOriginalVocal,
    filters.onlyMainlandViral,
    filters.onlyNicheSongs,
    filters.sortBy,
    debouncedSearchQuery,
    fuse,
    allSongs,
  ]);

  // Currently Paginated Songs
  const paginatedSongs = useMemo(() => {
    return filteredSongs.slice(0, displayedCount);
  }, [filteredSongs, displayedCount]);

  useEffect(() => {
    latestSearchStateRef.current = {
      query: filters.searchQuery,
      resultCount: filteredSongs.length,
    };
  }, [filters.searchQuery, filteredSongs.length]);

  // Favorite Toggle
  const handleToggleFavorite = (songId: string) => {
    setFavorites(prev => {
      const exists = prev.includes(songId);
      if (exists) {
        showToast('已自歌本移除');
        return prev.filter(id => id !== songId);
      } else {
        showToast('已加入歌本');
        return [...prev, songId];
      }
    });
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 2800);
  };

  const handleMobileSearchComplete = () => {
    if (!isMobile) return;
    if (!isCatalogReady) {
      showToast(apiHealthStatus === 'waking' ? '伺服器正在喚醒，歌庫準備好後會自動顯示' : '歌庫正在準備中，請稍候');
      return;
    }
    const settleDelay = isSearching ? 360 : 120;

    window.setTimeout(() => {
      const resultsRegion = resultsRegionRef.current;
      if (!resultsRegion) return;

      const top = resultsRegion.getBoundingClientRect().top + window.scrollY - 12;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: 'smooth',
      });
    }, settleDelay);

    window.setTimeout(() => {
      const { query, resultCount } = latestSearchStateRef.current;
      if (query.trim()) {
        showToast(`已顯示 ${resultCount.toLocaleString()} 首相關歌曲`);
      } else {
        showToast(`目前顯示 ${resultCount.toLocaleString()} 首歌曲`);
      }
    }, settleDelay);
  };

  // Favorite Songs list objects
  const favoriteSongObjects = useMemo(() => {
    return allSongs.filter(s => favorites.includes(s.id));
  }, [favorites, allSongs]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      {isMobile ? (
        <MobileNavbar
          filters={filters}
          setFilters={setFilters}
          favoriteCount={favorites.length}
          onOpenFavorites={() => setIsFavoritesOpen(true)}
          onOpenSuggestSong={() => setIsSuggestModalOpen(true)}
        />
      ) : (
        <Navbar
          filters={filters}
          setFilters={setFilters}
          favoriteCount={favorites.length}
          onOpenFavorites={() => setIsFavoritesOpen(true)}
          onOpenSuggestSong={() => setIsSuggestModalOpen(true)}
        />
      )}

      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero-kicker">
          <Sparkles size={14} />
          <span>歌友共同校對的 KTV 現場資料</span>
        </div>
        <h1 id="home-hero-title" className="home-hero-title">
          一起確認 KTV 現場到底有沒有這首歌
        </h1>
        <p className="home-hero-copy">
          查詢各 KTV 品牌的收錄狀態，並一起補完原版 MV、伴唱帶、導唱與現場版本差異。
        </p>
        <div className="home-hero-metrics" aria-label="目前資料概況">
          <span>{allSongs.length.toLocaleString()} 首歌曲</span>
          <span>{brandList.length.toLocaleString()} 個品牌</span>
          <span>收錄 / MV / 導唱對照</span>
        </div>
      </section>

      {/* Main Search Controls */}
      {isMobile ? (
        <MobileSearchBar
          filters={filters}
          setFilters={setFilters}
          onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
          resultCount={filteredSongs.length}
          isSearching={isSearching}
          isCatalogLoading={!isCatalogReady}
          isServerWaking={apiHealthStatus === 'waking'}
          isServerUnavailable={apiHealthStatus === 'unavailable'}
          onOpenSuggestSong={() => setIsSuggestModalOpen(true)}
          onSearchComplete={handleMobileSearchComplete}
        />
      ) : (
        <SearchBar
          filters={filters}
          setFilters={setFilters}
          onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
          resultCount={filteredSongs.length}
          isSearching={isSearching}
          isCatalogLoading={!isCatalogReady}
          isServerWaking={apiHealthStatus === 'waking'}
          isServerUnavailable={apiHealthStatus === 'unavailable'}
          onOpenSuggestSong={() => setIsSuggestModalOpen(true)}
        />
      )}

      {/* 頂部廣告區 */}
      <AdBannerSlot slotType="header" />

      {/* Horizontally Scrollable Brand Tabs */}
      {isMobile ? (
        <MobileBrandTabScroll
          selectedBrand={filters.selectedBrand}
          selectedBrands={filters.selectedBrands}
          brandFilterMode={filters.brandFilterMode}
          onSelectBrand={(brand) => {
            setFilters(prev => ({
              ...prev,
              selectedBrand: brand,
              selectedBrands: brand === 'all' ? [] : [brand],
            }));
            setDisplayedCount(40);
          }}
          onToggleBrand={(brandId) => {
            setFilters(prev => {
              const current = prev.selectedBrands || [];
              const exists = current.includes(brandId);
              const nextBrands = exists
                ? current.filter(b => b !== brandId)
                : [...current, brandId];
              return {
                ...prev,
                selectedBrands: nextBrands,
                selectedBrand: nextBrands.length === 1 ? nextBrands[0] : (nextBrands.length === 0 ? 'all' : prev.selectedBrand),
              };
            });
            setDisplayedCount(40);
          }}
          onClearBrands={() => {
            setFilters(prev => ({
              ...prev,
              selectedBrands: [],
              selectedBrand: 'all',
            }));
            setDisplayedCount(40);
          }}
          onToggleFilterMode={() => {
            setFilters(prev => ({
              ...prev,
              brandFilterMode: prev.brandFilterMode === 'all_of_them' ? 'any' : 'all_of_them',
            }));
          }}
          brandSongCounts={brandSongCounts}
          totalSongCount={allSongs.length}
        />
      ) : (
        <BrandTabScroll
          selectedBrand={filters.selectedBrand}
          selectedBrands={filters.selectedBrands}
          brandFilterMode={filters.brandFilterMode}
          onSelectBrand={(brand) => {
            setFilters(prev => ({
              ...prev,
              selectedBrand: brand,
              selectedBrands: brand === 'all' ? [] : [brand],
            }));
            setDisplayedCount(40);
          }}
          onToggleBrand={(brandId) => {
            setFilters(prev => {
              const current = prev.selectedBrands || [];
              const exists = current.includes(brandId);
              const nextBrands = exists
                ? current.filter(b => b !== brandId)
                : [...current, brandId];
              return {
                ...prev,
                selectedBrands: nextBrands,
                selectedBrand: nextBrands.length === 1 ? nextBrands[0] : (nextBrands.length === 0 ? 'all' : prev.selectedBrand),
              };
            });
            setDisplayedCount(40);
          }}
          onClearBrands={() => {
            setFilters(prev => ({
              ...prev,
              selectedBrands: [],
              selectedBrand: 'all',
            }));
            setDisplayedCount(40);
          }}
          onToggleFilterMode={() => {
            setFilters(prev => ({
              ...prev,
              brandFilterMode: prev.brandFilterMode === 'all_of_them' ? 'any' : 'all_of_them',
            }));
          }}
          brandSongCounts={brandSongCounts}
          totalSongCount={allSongs.length}
        />
      )}

      {/* 內容間廣告區 */}
      <AdBannerSlot slotType="in_feed" />

      {/* Main Content Area */}
      <main ref={resultsRegionRef} style={{ flex: 1, paddingBottom: '60px', scrollMarginTop: isMobile ? '12px' : '24px' }}>
        {isLoadingCatalog || (!isCatalogReady && !catalogLoadError) ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            margin: '24px auto',
            maxWidth: '560px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 18px 50px rgba(0,0,0,0.24)',
            opacity: isFadingOut ? 0 : 1,
            transform: isFadingOut ? 'scale(0.98)' : 'scale(1)',
            transition: 'opacity 0.38s ease-out, transform 0.38s ease-out',
            pointerEvents: isFadingOut ? 'none' : 'auto'
          }}>
            <div style={{ display: 'inline-block', marginBottom: '20px' }}>
              <Music size={52} style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 12px rgba(128, 82, 255, 0.45))' }} />
            </div>

            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '8px' }}>
              {apiHealthStatus === 'waking' ? '伺服器正在喚醒資料服務' : '正在整理大家共同補完的歌庫資料'}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              {catalogLoadError || (displayProgress >= 100
                ? '歌庫資料已準備完成'
                : apiHealthStatus === 'waking'
                  ? '正在確認 Render API 是否已醒來。這不是搜尋 0 筆，請先停留本頁稍候。'
                  : apiHealthStatus === 'online'
                    ? '伺服器已連線，正在套用最新回報修正與歌庫標示。'
                    : apiHealthStatus === 'unavailable'
                      ? '暫時無法確認伺服器狀態，仍會先載入可用的靜態歌庫資料。'
                  : '正在比對歌曲收錄、原聲原唱、導唱與 MV 標示')}
            </p>

            {/* 進度條容器 */}
            <div style={{
              width: '100%',
              height: '14px',
              background: 'rgba(128, 82, 255, 0.12)',
              borderRadius: '20px',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid var(--border-color)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)'
            }}>
              {/* 平滑填滿進度條 (0% ~ 100%) */}
              <div style={{
                width: `${displayProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-pink), var(--accent-support))',
                borderRadius: '20px',
                transition: 'width 0.12s linear',
                boxShadow: '0 0 15px rgba(128, 82, 255, 0.5)'
              }} />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-secondary)'
            }}>
              <span>0%</span>
              <span style={{ color: 'var(--accent-primary)', fontSize: '0.95rem' }}>{displayProgress}%</span>
              <span>100%</span>
            </div>

            <div className="loading-equalizer" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, index) => <span key={index} />)}
            </div>
          </div>
        ) : catalogLoadError ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-card)',
            border: '1px solid rgba(248, 113, 113, 0.25)',
            borderRadius: '12px',
            margin: '24px auto',
            maxWidth: '560px',
          }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '8px' }}>歌庫資料暫時無法載入</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{catalogLoadError}</p>
          </div>
        ) : isCatalogReady && filteredSongs.length === 0 ? (
          <div className="empty-state-panel glass-panel" style={{
            textAlign: 'center',
            padding: isMobile ? '34px 18px' : '44px 28px',
            margin: isMobile ? '14px 10px' : '24px auto',
            maxWidth: '620px',
          }}>
            <Music size={42} style={{ color: 'var(--accent-highlight)', marginBottom: '14px' }} />
            <h3 style={{ color: 'var(--text-primary)', fontSize: isMobile ? '1rem' : '1.15rem', marginBottom: '8px' }}>
              目前沒有符合條件的歌曲
            </h3>
            <p style={{ margin: '0 auto 18px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.75, maxWidth: '460px' }}>
              可以調整搜尋字、切換品牌或放寬篩選條件。如果你確定現場有這首歌，也可以提供建議讓大家一起補完資料。
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    searchQuery: '',
                    selectedBrand: 'all',
                    selectedBrands: [],
                    selectedLanguages: [],
                    selectedTitleLength: 'all',
                    onlyOfficialMv: false,
                    onlyOriginalVocal: false,
                    onlyMainlandViral: false,
                    onlyNicheSongs: false,
                  }));
                  setDisplayedCount(40);
                }}
              >
                清除篩選
              </button>
              <button className="btn-primary" onClick={() => setIsSuggestModalOpen(true)}>
                提供建議
              </button>
            </div>
          </div>
        ) : filters.viewMode === 'matrix' ? (
          <MatrixView
            songs={paginatedSongs}
            selectedBrand={filters.selectedBrand}
            selectedBrands={filters.selectedBrands}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectSongDetail={(song) => setSelectedSongDetail(song)}
            compact={isMobile}
            brandSongCounts={brandSongCounts}
          />
        ) : (
          <CardView
            songs={paginatedSongs}
            selectedBrand={filters.selectedBrand}
            selectedBrands={filters.selectedBrands}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectSongDetail={(song) => setSelectedSongDetail(song)}
            brandSongCounts={brandSongCounts}
          />
        )}

        {/* Load More Button */}
        {displayedCount < filteredSongs.length && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => setDisplayedCount(prev => prev + 40)}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '0.95rem' }}
            >
              <span>載入更多歌曲 (已顯示 {paginatedSongs.length} / {filteredSongs.length} 首)</span>
              <ChevronDown size={18} />
            </button>
          </div>
        )}
      </main>

      {/* Modals & Overlays */}
      <SongDetailModal
        song={selectedSongDetail}
        onClose={() => setSelectedSongDetail(null)}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        brandSongCounts={brandSongCounts}
      />

      <BottomSheetFilter
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />

      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favoriteSongs={favoriteSongObjects}
        onToggleFavorite={handleToggleFavorite}
      />

      {isSuggestModalOpen && (
        <SuggestSongModal
          onClose={() => setIsSuggestModalOpen(false)}
        />
      )}

      {reportModalSong && (
        <ReportModal
          song={reportModalSong}
          onClose={() => setReportModalSong(null)}
        />
      )}

      {legalNoticeTab && (
        <LegalNoticeModal
          initialTab={legalNoticeTab}
          onClose={() => setLegalNoticeTab(null)}
        />
      )}

      <ToastNotification message={toastMessage} />

      {/* 站內導覽內容 */}
      <SiteInfoGuide />

      {/* 頁尾廣告區 */}
      <AdBannerSlot slotType="footer" />

      {/* Footer */}
      <footer style={{
        background: 'var(--bg-glass)',
        borderTop: '1px solid var(--border-color)',
        padding: '20px',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        marginTop: 'auto',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 700 }}>
            台灣KTV歌曲索引
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* 主連結：真實 <a href> 讓 Google 爬蟲可直接索引獨立靜態頁面 */}
            <a
              href="./privacy.html"
              onClick={(e) => { e.preventDefault(); setLegalNoticeTab('privacy'); }}
              style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              隱私權政策
            </a>

            <a
              href="./terms.html"
              onClick={(e) => { e.preventDefault(); setLegalNoticeTab('terms'); }}
              style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              免責聲明與條款
            </a>

            <a
              href="./about.html"
              onClick={(e) => { e.preventDefault(); setLegalNoticeTab('about'); }}
              style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              關於本站
            </a>

            <a
              href="./contact.html"
              onClick={(e) => { e.preventDefault(); setLegalNoticeTab('contact'); }}
              style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              聯絡我們
            </a>

            <a
              href="./how-to-use.html"
              style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              使用教學
            </a>

            <a
              href="./data-source.html"
              style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              資料來源
            </a>

            <a
              href="./ktv-audio-types.html"
              style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              版本說明
            </a>

            <a
              href="./community-verification.html"
              style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              社群驗證
            </a>

            <a
              href="./original-mv-vs-karaoke-video.html"
              style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              MV 類型差異
            </a>

            <a
              href="./faq.html"
              style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              常見問題
            </a>

            <a
              href="mailto:tyfunlab@gmail.com"
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="點擊發送信件至 tyfunlab@gmail.com"
            >
              <Mail size={14} color="#38bdf8" /> tyfunlab@gmail.com
            </a>

            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} color="#10b981" /> 原版MV標示
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Music size={14} color="#ec4899" /> 原聲原唱對照
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
