import React, { useRef, useState } from 'react';
import { Search, X, SlidersHorizontal, Loader2, PlusCircle } from 'lucide-react';
import type { FilterOptions } from '../../types/ktv';

interface MobileSearchBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onOpenMobileFilters: () => void;
  resultCount: number;
  isSearching?: boolean;
  isCatalogLoading?: boolean;
  isServerWaking?: boolean;
  isServerUnavailable?: boolean;
  onOpenSuggestSong?: () => void;
  onSearchComplete?: () => void;
}

export const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
  filters,
  setFilters,
  onOpenMobileFilters,
  resultCount,
  isSearching = false,
  isCatalogLoading = false,
  isServerWaking = false,
  isServerUnavailable = false,
  onOpenSuggestSong,
  onSearchComplete,
}) => {
  const hasActiveFilters = filters.onlyOfficialMv || filters.onlyGuidedVocal || filters.selectedLanguages.length > 0 || filters.selectedTitleLength !== 'all';
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleClearQuery = () => {
    setFilters(prev => ({ ...prev, searchQuery: '' }));
    inputRef.current?.focus();
  };

  const handleSearchComplete = () => {
    inputRef.current?.blur();
    setIsInputFocused(false);
    onSearchComplete?.();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearchComplete();
    }
  };

  const getFilterSummary = () => {
    const parts: string[] = [];
    parts.push(filters.selectedLanguages.length > 0 ? filters.selectedLanguages.join('、') : '全部語種');
    parts.push(filters.selectedTitleLength === 'all' ? '全部字數' : `${filters.selectedTitleLength}字歌`);
    if (filters.onlyOfficialMv) parts.push('原版 MV');
    if (filters.onlyGuidedVocal) parts.push('有導唱');
    return parts.join(' · ');
  };

  return (
    <div className="mobile-search-shell">
      <div className="glass-panel mobile-search-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            {isSearching ? (
              <Loader2 size={16} color="currentColor" style={{ position: 'absolute', left: '12px', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Search size={16} color="currentColor" style={{ position: 'absolute', left: '12px' }} />
            )}
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={filters.searchQuery}
              onChange={handleQueryChange}
              onKeyDown={handleInputKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="搜尋歌名或歌手"
              className="mobile-search-input"
              style={{ borderColor: isInputFocused ? 'var(--accent-pink, #ec4899)' : 'var(--border-color, rgba(255, 255, 255, 0.12))' }}
            />
            {filters.searchQuery && (
              <button
                onClick={handleClearQuery}
                aria-label="清除搜尋文字"
                className="action-icon search-clear-button is-mobile"
                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={handleSearchComplete}
            aria-label="完成搜尋並查看結果"
            className={`mobile-search-submit ${filters.searchQuery ? 'is-active' : ''}`}
          >
            完成
          </button>

          <button
            onClick={onOpenMobileFilters}
            className={`search-filter-button is-mobile ${hasActiveFilters ? 'is-active' : ''}`}
          >
            <SlidersHorizontal size={16} />
            <span>篩選</span>
          </button>
        </div>

        <button
          onClick={onOpenMobileFilters}
          className="filter-summary-button"
          aria-label="開啟篩選條件"
          style={{
            marginTop: '8px',
            width: '100%',
            minWidth: 0,
            border: `1px solid ${hasActiveFilters ? 'rgba(219, 39, 119, 0.32)' : 'var(--border-color)'}`,
            background: 'transparent',
            color: hasActiveFilters ? 'var(--accent-pink, #ec4899)' : 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: '7px 9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>篩選</span>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700 }}>
            {getFilterSummary()}
          </span>
          <SlidersHorizontal size={16} />
        </button>

        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
          <div
            aria-live="polite"
            style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'normal', lineHeight: 1.45 }}
          >
            {isSearching ? (
              <>正在即時比對...</>
            ) : isCatalogLoading ? (
              <>{isServerWaking ? '伺服器喚醒中，歌庫正在準備' : isServerUnavailable ? '伺服器暫時未連線，歌庫準備中' : '歌庫準備中...'}</>
            ) : filters.searchQuery.trim() ? (
              <>找到 <strong style={{ color: 'var(--accent-pink)', fontSize: '0.85rem' }}>{resultCount.toLocaleString()}</strong> 首</>
            ) : (
              <>結果：<strong style={{ color: 'var(--accent-pink)', fontSize: '0.85rem' }}>{resultCount.toLocaleString()}</strong> 首</>
            )}
          </div>

          {onOpenSuggestSong && (
            <button
              onClick={onOpenSuggestSong}
              className="inline-suggest-link"
            >
              <PlusCircle size={16} />
              <span>提供建議</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
