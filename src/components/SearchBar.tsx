import React from 'react';
import { Search, X, SlidersHorizontal, Video, Disc, Hash, Loader2, PlusCircle } from 'lucide-react';
import type { FilterOptions, TitleLengthFilter } from '../types/ktv';

interface SearchBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onOpenMobileFilters: () => void;
  resultCount: number;
  isSearching?: boolean;
  onOpenSuggestSong?: () => void;
}

const LANGUAGES = ['全部', '國語', '台語', '粵語', '陸歌', '日語', '韓語', '英語'];
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
      if (lang === '全部') {
        return { ...prev, selectedLanguages: [] };
      }
      const exists = prev.selectedLanguages.includes(lang);
      if (exists) {
        return { ...prev, selectedLanguages: prev.selectedLanguages.filter(l => l !== lang) };
      } else {
        return { ...prev, selectedLanguages: [...prev.selectedLanguages, lang] };
      }
    });
  };

  return (
    <div className="search-bar-container" style={{
      maxWidth: '1400px',
      margin: '20px auto 10px',
      padding: '0 20px',
    }}>
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        {/* Main Search Input Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          {/* Input Box */}
          <div style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}>
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
              placeholder="搜尋歌名、歌手 (可查周杰倫、蔡依林、五月天、草東、告五人)..."
              style={{
                width: '100%',
                padding: '14px 44px 14px 48px',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-pink)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
            />
            {filters.searchQuery && (
              <button
                onClick={handleClearQuery}
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

          {/* Mobile Filter Button */}
          <button
            onClick={onOpenMobileFilters}
            className="btn-secondary"
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              borderColor: (filters.onlyOfficialMv || filters.onlyOriginalVocal || filters.selectedLanguages.length > 0 || filters.selectedTitleLength !== 'all')
                ? 'var(--accent-pink)'
                : undefined,
            }}
          >
            <SlidersHorizontal size={18} color={
              (filters.onlyOfficialMv || filters.onlyOriginalVocal || filters.selectedLanguages.length > 0 || filters.selectedTitleLength !== 'all')
                ? '#ec4899'
                : 'currentColor'
            } />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>進階過濾</span>
          </button>
        </div>

        {/* Quick Language & Character Count Pills Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '14px',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          {/* Left: Language & Word Count Filter Group */}
          <div className="search-bar-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
            {/* Language Pills */}
            <div className="quick-filter-scroll-row">
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '2px', flexShrink: 0 }}>
                語種與分類：
              </span>
              {LANGUAGES.map(lang => {
                const isSelected = lang === '全部' 
                  ? filters.selectedLanguages.length === 0 
                  : filters.selectedLanguages.includes(lang);

                return (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      background: isSelected 
                        ? (lang === '陸歌' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(236, 72, 153, 0.2)')
                        : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected 
                        ? (lang === '陸歌' ? '#fb923c' : '#f472b6')
                        : 'var(--text-secondary)',
                      border: `1px solid ${isSelected ? (lang === '陸歌' ? 'rgba(249, 115, 22, 0.5)' : 'rgba(236, 72, 153, 0.4)') : 'rgba(255, 255, 255, 0.08)'}`,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>

            {/* Character Count Pills */}
            <div className="quick-filter-scroll-row">
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '2px', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                <Hash size={13} color="var(--accent-purple)" /> 字數：
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
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Quality Checkboxes & Result Count */}
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
                  onChange={(e) => setFilters(prev => ({ ...prev, onlyOfficialMv: e.target.checked }))}
                  style={{ accentColor: '#10b981', cursor: 'pointer' }}
                />
                <Video size={14} /> 僅原版 MV
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.82rem',
                color: filters.onlyOriginalVocal ? '#f472b6' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>
                <input
                  type="checkbox"
                  checked={filters.onlyOriginalVocal}
                  onChange={(e) => setFilters(prev => ({ ...prev, onlyOriginalVocal: e.target.checked }))}
                  style={{ accentColor: '#ec4899', cursor: 'pointer' }}
                />
                <Disc size={14} /> 僅原聲原唱
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                結果: <strong style={{ color: 'var(--accent-pink)' }}>{resultCount}</strong> 首
              </div>

              {onOpenSuggestSong && (
                <button
                  onClick={onOpenSuggestSong}
                  style={{
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    color: '#fbbf24',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  title="找不到想唱的歌曲或想追加 KTV 廠牌對照？點此建議追加"
                >
                  <PlusCircle size={13} />
                  <span>建議追加</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
