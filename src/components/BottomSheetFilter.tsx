import React, { useEffect } from 'react';
import type { FilterOptions, Language, TitleLengthFilter } from '../types/ktv';
import { X, Check, RotateCcw, SortAsc, Hash } from 'lucide-react';
import { getLanguageStyle } from '../utils/languageStyle';

interface BottomSheetFilterProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
}

const LANGUAGES: Language[] = ['國語', '台語', '粵語', '客語', '兒歌', '原住民語', '陸歌', '日語', '韓語', '英語'];
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

export const BottomSheetFilter: React.FC<BottomSheetFilterProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
}) => {
  // 支援 Esc 鍵關閉抽屜
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleReset = () => {
    setFilters(prev => ({
      ...prev,
      selectedLanguages: [],
      selectedTitleLength: 'all',
      onlyOfficialMv: false,
      onlyGuidedVocal: false,
      onlyMainlandViral: false,
      onlyNicheSongs: false,
      sortBy: 'length',
    }));
  };

  const toggleLanguage = (lang: Language) => {
    setFilters(prev => {
      const exists = prev.selectedLanguages.includes(lang);
      if (exists) {
        return { ...prev, selectedLanguages: prev.selectedLanguages.filter(l => l !== lang) };
      } else {
        return { ...prev, selectedLanguages: [...prev.selectedLanguages, lang] };
      }
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'var(--bg-overlay, rgba(15, 23, 42, 0.75))',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="glass-panel animate-slide-up bottom-sheet-content"
        style={{
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          padding: '22px',
          maxHeight: '85vh',
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            進階條件過濾與排序
          </h3>
          <button
            onClick={onClose}
            className="action-icon bottom-sheet-close-button"
            style={{
              background: 'var(--bg-card-hover)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              width: '32px',
              height: '32px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Sort By Option Row */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <SortAsc size={16} color="var(--accent-pink)" /> 排序方式
          </label>
          <div className="bottom-sheet-grid bottom-sheet-grid-sort" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { id: 'length', label: '字數排序（預設）' },
              { id: 'popular', label: '熱門程度' },
              { id: 'stroke', label: '首字筆劃' },
              { id: 'title', label: '注音與字典序' },
            ].map(item => (
              <button
                key={item.id}
                className={`bottom-sheet-option ${filters.sortBy === item.id ? 'is-selected' : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, sortBy: item.id as any }))}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: filters.sortBy === item.id ? 'var(--accent-pink)' : 'var(--bg-card-hover)',
                  color: filters.sortBy === item.id ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${filters.sortBy === item.id ? 'transparent' : 'var(--border-color)'}`,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Character Count Filter */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Hash size={16} color="var(--accent-purple)" /> 歌名字數篩選
          </label>
          <div className="bottom-sheet-grid bottom-sheet-grid-length" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {TITLE_LENGTHS.map(item => {
              const isSelected = filters.selectedTitleLength === item.id;
              return (
                <button
                  key={item.id}
                  className={`bottom-sheet-option ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, selectedTitleLength: item.id as any }))}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(219, 39, 119, 0.075)' : 'var(--bg-card-hover)',
                    color: isSelected ? 'var(--accent-pink, #f472b6)' : 'var(--text-secondary)',
                    border: `1px solid ${isSelected ? 'rgba(219, 39, 119, 0.26)' : 'var(--border-color)'}`,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality Toggles */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            影片與音訊品質
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className={`bottom-sheet-toggle ${filters.onlyOfficialMv ? 'is-selected' : ''}`} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card-hover)',
              cursor: 'pointer',
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                原版 MV
              </span>
              <input
                type="checkbox"
                checked={filters.onlyOfficialMv}
                onChange={(e) => setFilters(prev => ({ ...prev, onlyOfficialMv: e.target.checked }))}
                style={{ accentColor: '#10b981', width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>

            <label className={`bottom-sheet-toggle ${filters.onlyGuidedVocal ? 'is-selected' : ''}`} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card-hover)',
              cursor: 'pointer',
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                有導唱
              </span>
              <input
                type="checkbox"
                checked={filters.onlyGuidedVocal}
                onChange={(e) => setFilters(prev => ({ ...prev, onlyGuidedVocal: e.target.checked }))}
                style={{ accentColor: '#22d3ee', width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>

        {/* Language Multi-Select */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            多選語種
          </label>
          <div className="bottom-sheet-grid bottom-sheet-grid-language" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {LANGUAGES.map(lang => {
              const isSelected = filters.selectedLanguages.includes(lang);
              const lStyle = getLanguageStyle(lang);

              return (
                <button
                  key={lang}
                  className={`bottom-sheet-option ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => toggleLanguage(lang)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? lStyle.bg : 'var(--bg-card-hover)',
                    color: isSelected ? lStyle.color : 'var(--text-secondary)',
                    border: `1px solid ${isSelected ? lStyle.border : 'var(--border-color)'}`,
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: 'none',
                  }}
                >
                  {isSelected && <Check size={14} color={lStyle.color} />}
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleReset}
            className="btn-secondary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <RotateCcw size={16} /> 重置
          </button>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ flex: 2, justifyContent: 'center' }}
          >
            套用設定
          </button>
        </div>
      </div>
    </div>
  );
};
