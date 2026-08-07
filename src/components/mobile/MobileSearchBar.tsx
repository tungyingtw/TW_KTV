import React, { useRef, useState } from 'react';
import { Search, X, SlidersHorizontal, Video, Disc, Hash, Loader2, PlusCircle } from 'lucide-react';
import type { FilterOptions, Language, TitleLengthFilter } from '../../types/ktv';
import { getLanguageStyle } from '../../utils/languageStyle';

interface MobileSearchBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onOpenMobileFilters: () => void;
  resultCount: number;
  isSearching?: boolean;
  onOpenSuggestSong?: () => void;
  onSearchComplete?: () => void;
}

const LANGUAGES: Array<Language | '全部'> = ['全部', '國語', '台語', '粵語', '客語', '兒歌', '原住民語', '陸歌', '日語', '韓語', '英語'];
const TITLE_LENGTHS: { id: TitleLengthFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: '1', label: '1字' },
  { id: '2', label: '2字' },
  { id: '3', label: '3字' },
  { id: '4', label: '4字' },
  { id: '5', label: '5字' },
  { id: '6', label: '6字' },
  { id: '7+', label: '7字+' },
];

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

        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', width: '100%', minWidth: 0, paddingBottom: '2px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>語種：</span>
          {LANGUAGES.map(lang => {
            const isSelected = lang === '全部' ? filters.selectedLanguages.length === 0 : filters.selectedLanguages.includes(lang as Language);
            const lStyle = getLanguageStyle(lang);
            return (
              <button
                key={lang}
                onClick={() => toggleLanguage(lang)}
                style={{
                  background: isSelected ? lStyle.bg : 'var(--bg-card-hover)',
                  color: isSelected ? lStyle.color : 'var(--text-secondary)',
                  border: `1px solid ${isSelected ? lStyle.border : 'var(--border-color)'}`,
                  padding: '3px 9px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? `0 0 8px ${lStyle.border}` : 'none',
                }}
              >
                {lang}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', width: '100%', minWidth: 0, paddingBottom: '2px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Hash size={12} color="var(--accent-purple)" />字數：
          </span>
          {TITLE_LENGTHS.map(item => {
            const isSelected = filters.selectedTitleLength === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFilters(prev => ({ ...prev, selectedTitleLength: item.id }))}
                style={{
                  background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'var(--bg-card-hover)',
                  color: isSelected ? '#c084fc' : 'var(--text-secondary)',
                  border: `1px solid ${isSelected ? 'rgba(168, 85, 247, 0.5)' : 'var(--border-color)'}`,
                  padding: '3px 9px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: '8px', paddingTop: '7px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: filters.onlyOfficialMv ? '#34d399' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={filters.onlyOfficialMv}
              onChange={e => setFilters(prev => ({ ...prev, onlyOfficialMv: e.target.checked }))}
              style={{ accentColor: '#10b981', cursor: 'pointer' }}
            />
            <Video size={13} /> 原版 MV
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: filters.onlyOriginalVocal ? '#f472b6' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={filters.onlyOriginalVocal}
              onChange={e => setFilters(prev => ({ ...prev, onlyOriginalVocal: e.target.checked }))}
              style={{ accentColor: '#ec4899', cursor: 'pointer' }}
            />
            <Disc size={13} /> 原聲原唱
          </label>
        </div>

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
