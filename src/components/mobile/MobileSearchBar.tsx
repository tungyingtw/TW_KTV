import React from 'react';
import { Search, X, SlidersHorizontal, Video, Disc, Hash, Loader2, PlusCircle } from 'lucide-react';
import type { FilterOptions, TitleLengthFilter } from '../../types/ktv';

interface MobileSearchBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onOpenMobileFilters: () => void;
  resultCount: number;
  isSearching?: boolean;
  onOpenSuggestSong?: () => void;
}

const LANGUAGES = ['全部', '國語', '台語', '粵語', '陸歌', '日語', '韓語', '英語'];
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
}) => {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleClearQuery = () => {
    setFilters(prev => ({ ...prev, searchQuery: '' }));
  };

  const toggleLanguage = (lang: string) => {
    setFilters(prev => {
      if (lang === '全部') return { ...prev, selectedLanguages: [] };
      const exists = prev.selectedLanguages.includes(lang);
      if (exists) return { ...prev, selectedLanguages: prev.selectedLanguages.filter(l => l !== lang) };
      return { ...prev, selectedLanguages: [...prev.selectedLanguages, lang] };
    });
  };

  return (
    <div style={{ padding: '10px 10px 6px', boxSizing: 'border-box', width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <div className="glass-panel" style={{ padding: '12px 14px', borderRadius: '14px', width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
        {/* Row 1: Search Input & Mobile Filter Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            {isSearching ? (
              <Loader2 size={16} color="var(--accent-pink)" style={{ position: 'absolute', left: '12px', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px' }} />
            )}
            <input
              type="text"
              value={filters.searchQuery}
              onChange={handleQueryChange}
              placeholder="搜尋歌名、歌手 (周傑倫、蔡依林)..."
              style={{
                width: '100%', padding: '10px 32px 10px 36px',
                background: 'var(--bg-input, rgba(15, 23, 42, 0.7))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                borderRadius: '10px', color: 'var(--text-primary, #ffffff)', fontSize: '0.85rem', outline: 'none',
              }}
            />
            {filters.searchQuery && (
              <button onClick={handleClearQuery} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={onOpenMobileFilters}
            className="btn-secondary"
            style={{ padding: '9px 12px', borderRadius: '10px', fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <SlidersHorizontal size={15} color={
              (filters.onlyOfficialMv || filters.onlyOriginalVocal || filters.selectedLanguages.length > 0 || filters.selectedTitleLength !== 'all')
                ? '#ec4899' : 'currentColor'
            } />
            <span>進階</span>
          </button>
        </div>

        {/* Row 2: Language Scroll Pills */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', width: '100%', minWidth: 0, paddingBottom: '2px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>語種:</span>
          {LANGUAGES.map(lang => {
            const isSelected = lang === '全部' ? filters.selectedLanguages.length === 0 : filters.selectedLanguages.includes(lang);
            return (
              <button
                key={lang}
                onClick={() => toggleLanguage(lang)}
                style={{
                  background: isSelected ? 'rgba(236, 72, 153, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#f472b6' : 'var(--text-secondary)',
                  border: `1px solid ${isSelected ? 'rgba(236, 72, 153, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
                  padding: '3px 9px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                }}
              >
                {lang}
              </button>
            );
          })}
        </div>

        {/* Row 3: Word Count Scroll Pills */}
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', width: '100%', minWidth: 0, paddingBottom: '2px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Hash size={12} color="var(--accent-purple)" />字數:
          </span>
          {TITLE_LENGTHS.map(item => {
            const isSelected = filters.selectedTitleLength === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFilters(prev => ({ ...prev, selectedTitleLength: item.id as any }))}
                style={{
                  background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#c084fc' : 'var(--text-secondary)',
                  border: `1px solid ${isSelected ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                  padding: '3px 9px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Row 4: Quality Checkboxes */}
        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: filters.onlyOfficialMv ? '#34d399' : '#cbd5e1', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={filters.onlyOfficialMv}
              onChange={(e) => setFilters(prev => ({ ...prev, onlyOfficialMv: e.target.checked }))}
              style={{ accentColor: '#10b981', cursor: 'pointer' }}
            />
            <Video size={13} /> 原版 MV
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: filters.onlyOriginalVocal ? '#f472b6' : '#cbd5e1', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={filters.onlyOriginalVocal}
              onChange={(e) => setFilters(prev => ({ ...prev, onlyOriginalVocal: e.target.checked }))}
              style={{ accentColor: '#ec4899', cursor: 'pointer' }}
            />
            <Disc size={13} /> 原聲原唱
          </label>
        </div>

        {/* Row 5: Results Count & Suggest Song Button (Dedicated Clean Row) */}
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            結果: <strong style={{ color: 'var(--accent-pink)', fontSize: '0.85rem' }}>{resultCount.toLocaleString()}</strong> 首
          </div>

          {onOpenSuggestSong && (
            <button
              onClick={onOpenSuggestSong}
              style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '6px', padding: '3px 8px', color: '#fbbf24',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
              }}
            >
              <PlusCircle size={12} />
              <span>建議追加</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
