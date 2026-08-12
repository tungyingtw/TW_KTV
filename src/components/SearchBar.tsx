import React from 'react';
import { Search, X, SlidersHorizontal, Video, Mic2, Hash, Loader2, PlusCircle } from 'lucide-react';
import type { FilterOptions, Language, TitleLengthFilter } from '../types/ktv';
import { getLanguageStyle } from '../utils/languageStyle';

interface SearchBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onOpenMobileFilters: () => void;
  resultCount: number;
  isSearching?: boolean;
  isCatalogLoading?: boolean;
  isServerWaking?: boolean;
  isServerUnavailable?: boolean;
  onOpenSuggestSong?: () => void;
}

const LANGUAGES: Array<Language | '全部'> = ['全部', '國語', '台語', '粵語', '客語', '兒歌', '原住民語', '陸歌', '日語', '韓語', '英語'];
const TITLE_LENGTHS: { id: TitleLengthFilter; label: string }[] = [
  { id: 'all', label: '全部字數' },
  { id: '1', label: '1字歌' },
  { id: '2', label: '2字歌' },
  { id: '3', label: '3字歌' },
  { id: '4', label: '4字歌' },
  { id: '5', label: '5字歌' },
  { id: '6', label: '6字歌' },
  { id: '7+', label: '7字以上' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  setFilters,
  onOpenMobileFilters,
  resultCount,
  isSearching = false,
  isCatalogLoading = false,
  isServerWaking = false,
  isServerUnavailable = false,
  onOpenSuggestSong,
}) => {
  const hasActiveFilters = filters.onlyOfficialMv || filters.onlyGuidedVocal || filters.selectedLanguages.length > 0 || filters.selectedTitleLength !== 'all';

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleClearQuery = () => {
    setFilters(prev => ({ ...prev, searchQuery: '' }));
  };

  const toggleLanguage = (lang: Language | '全部') => {
    setFilters(prev => {
      if (lang === '全部') return { ...prev, selectedLanguages: [] };

      const exists = prev.selectedLanguages.includes(lang);
      return {
        ...prev,
        selectedLanguages: exists
          ? prev.selectedLanguages.filter(item => item !== lang)
          : [...prev.selectedLanguages, lang as Language],
      };
    });
  };

  return (
    <div className="search-bar-container" style={{
      maxWidth: '1400px',
      margin: '18px auto 8px',
      padding: '0 20px',
    }}>
      <div className="glass-panel search-panel">
        <div className="search-main-row">
          <div className="search-input-wrap">
            {isSearching ? (
              <Loader2
                size={20}
                color="var(--accent-pink)"
                style={{ position: 'absolute', left: '16px', pointerEvents: 'none', animation: 'spin 1s linear infinite' }}
              />
            ) : (
              <Search
                size={20}
                color="var(--text-secondary)"
                style={{ position: 'absolute', left: '16px', pointerEvents: 'none' }}
              />
            )}

            <input
              type="text"
              value={filters.searchQuery}
              onChange={handleQueryChange}
              placeholder="搜尋歌名或歌手，例如周杰倫、蔡依林、五月天"
              className="search-input"
              onFocus={e => e.target.style.borderColor = 'var(--accent-pink)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
            {filters.searchQuery && (
              <button
                onClick={handleClearQuery}
                aria-label="清除搜尋文字"
                style={{
                  position: 'absolute',
                  right: '14px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          <button
            onClick={onOpenMobileFilters}
            className={`search-filter-button ${hasActiveFilters ? 'is-active' : ''}`}
          >
            <SlidersHorizontal size={18} color={hasActiveFilters ? '#ec4899' : 'currentColor'} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>進階篩選</span>
          </button>
        </div>

        <div className="search-filter-strip">
          <div className="search-bar-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', width: '100%', maxWidth: '100%', minWidth: 0 }}>
            <div className="quick-filter-scroll-row" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
              <span className="filter-row-label">
                語種：
              </span>
              {LANGUAGES.map(lang => {
                const isSelected = lang === '全部'
                  ? filters.selectedLanguages.length === 0
                  : filters.selectedLanguages.includes(lang as Language);
                const lStyle = getLanguageStyle(lang);

                return (
                  <button
                    key={lang}
                    className={`filter-chip ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      color: isSelected ? lStyle.color : 'var(--text-secondary)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>

            <div className="quick-filter-scroll-row" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
              <span className="filter-row-label">
                <Hash size={13} /> 字數：
              </span>
              {TITLE_LENGTHS.map(item => {
                const isSelected = filters.selectedTitleLength === item.id;

                return (
                  <button
                    key={item.id}
                    className={`filter-chip ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setFilters(prev => ({ ...prev, selectedTitleLength: item.id }))}
                    style={{
                      color: isSelected ? 'var(--accent-pink)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 700 : 600,
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="search-bar-bottom-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.82rem',
                color: filters.onlyOfficialMv ? '#34d399' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>
                <input
                  type="checkbox"
                  checked={filters.onlyOfficialMv}
                  onChange={e => setFilters(prev => ({ ...prev, onlyOfficialMv: e.target.checked }))}
                  style={{ accentColor: '#10b981', cursor: 'pointer' }}
                />
                <Video size={14} /> 原版 MV
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.82rem',
                color: filters.onlyGuidedVocal ? '#22d3ee' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>
                <input
                  type="checkbox"
                  checked={filters.onlyGuidedVocal}
                  onChange={e => setFilters(prev => ({ ...prev, onlyGuidedVocal: e.target.checked }))}
                  style={{ accentColor: '#22d3ee', cursor: 'pointer' }}
                />
                <Mic2 size={14} /> 有導唱
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {isCatalogLoading ? (
                  <span style={{ color: 'var(--accent-highlight)' }}>{isServerWaking ? '伺服器喚醒中' : isServerUnavailable ? '伺服器暫時未連線' : '歌庫準備中'}</span>
                ) : (
                  <>結果：<strong style={{ color: 'var(--accent-pink)' }}>{resultCount.toLocaleString()}</strong> 首</>
                )}
              </div>

              {onOpenSuggestSong && (
                <button
                  onClick={onOpenSuggestSong}
                  className="inline-suggest-link"
                  title="找不到想唱的歌曲，或想提供 KTV 廠牌資料時可送出建議"
                >
                  <PlusCircle size={13} />
                  <span>提供建議</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
