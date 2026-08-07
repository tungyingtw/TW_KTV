import React, { useRef, useState } from 'react';
import { Search, X, SlidersHorizontal, Loader2, PlusCircle } from 'lucide-react';
import type { FilterOptions } from '../../types/ktv';

interface MobileSearchBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onOpenMobileFilters: () => void;
  resultCount: number;
  isSearching?: boolean;
  onOpenSuggestSong?: () => void;
  onSearchComplete?: () => void;
}

export const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
  filters,
  setFilters,
  onOpenMobileFilters,
  resultCount,
  isSearching = false,
  onOpenSuggestSong,
  onSearchComplete,
}) => {
  const hasActiveFilters = filters.onlyOfficialMv || filters.onlyOriginalVocal || filters.selectedLanguages.length > 0 || filters.selectedTitleLength !== 'all';
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
    if (filters.onlyOriginalVocal) parts.push('原聲原唱');
    return parts.join(' · ');
  };

  return (
    <div style={{ padding: '8px 10px 4px', boxSizing: 'border-box', width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <div className="glass-panel" style={{ padding: '10px 12px', borderRadius: '14px', width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            {isSearching ? (
              <Loader2 size={16} color="var(--accent-pink)" style={{ position: 'absolute', left: '12px', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px' }} />
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
              style={{
                width: '100%',
                padding: '10px 32px 10px 36px',
                background: 'var(--bg-input, rgba(15, 23, 42, 0.7))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                borderRadius: '10px',
                color: 'var(--text-primary, #ffffff)',
                fontSize: '0.85rem',
                outline: 'none',
                borderColor: isInputFocused ? 'var(--accent-pink, #ec4899)' : 'var(--border-color, rgba(255, 255, 255, 0.12))',
              }}
            />
            {filters.searchQuery && (
              <button
                onClick={handleClearQuery}
                aria-label="清除搜尋文字"
                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={handleSearchComplete}
            aria-label="完成搜尋並查看結果"
            style={{
              padding: '8px 10px',
              borderRadius: '10px',
              border: '1px solid rgba(236, 72, 153, 0.42)',
              background: filters.searchQuery
                ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.95), rgba(168, 85, 247, 0.92))'
                : 'rgba(255, 255, 255, 0.06)',
              color: filters.searchQuery ? '#ffffff' : 'var(--text-secondary, #cbd5e1)',
              fontSize: '0.8rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flexShrink: 0,
              minWidth: '48px',
            }}
          >
            完成
          </button>

          <button
            onClick={onOpenMobileFilters}
            className="btn-secondary"
            style={{ padding: '8px 10px', borderRadius: '10px', fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <SlidersHorizontal size={15} color={hasActiveFilters ? '#ec4899' : 'currentColor'} />
            <span>篩選</span>
          </button>
        </div>

        <button
          onClick={onOpenMobileFilters}
          aria-label="開啟篩選條件"
          style={{
            marginTop: '8px',
            width: '100%',
            minWidth: 0,
            border: `1px solid ${hasActiveFilters ? 'rgba(236, 72, 153, 0.42)' : 'var(--border-color)'}`,
            background: hasActiveFilters ? 'rgba(236, 72, 153, 0.1)' : 'var(--bg-card-hover)',
            color: hasActiveFilters ? 'var(--accent-pink, #ec4899)' : 'var(--text-secondary)',
            borderRadius: '10px',
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
          <SlidersHorizontal size={14} />
        </button>

        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
          <div
            aria-live="polite"
            style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'normal', lineHeight: 1.45 }}
          >
            {isSearching ? (
              <>正在即時比對...</>
            ) : filters.searchQuery.trim() ? (
              <>找到 <strong style={{ color: 'var(--accent-pink)', fontSize: '0.85rem' }}>{resultCount.toLocaleString()}</strong> 首</>
            ) : (
              <>結果：<strong style={{ color: 'var(--accent-pink)', fontSize: '0.85rem' }}>{resultCount.toLocaleString()}</strong> 首</>
            )}
          </div>

          {onOpenSuggestSong && (
            <button
              onClick={onOpenSuggestSong}
              style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '6px',
                padding: '3px 8px',
                color: '#fbbf24',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              <PlusCircle size={12} />
              <span>提供建議</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
