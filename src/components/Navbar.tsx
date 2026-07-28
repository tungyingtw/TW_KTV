import React from 'react';
import { Mic2, Table2, LayoutGrid, Heart, PlusCircle } from 'lucide-react';
import type { FilterOptions } from '../types/ktv';

interface NavbarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  favoriteCount: number;
  onOpenFavorites: () => void;
  onOpenSuggestSong?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  filters,
  setFilters,
  favoriteCount,
  onOpenFavorites,
  onOpenSuggestSong,
}) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '14px 20px',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Brand Logo & Pure Clean Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(236, 72, 153, 0.4)',
          }}>
            <Mic2 size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ 
              fontSize: '1.3rem', 
              fontWeight: 800, 
              letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg, #ffffff, #f472b6, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
            }}>
              台灣KTV歌曲索引
            </h1>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Suggest Missing Song Button */}
          {onOpenSuggestSong && (
            <button
              onClick={onOpenSuggestSong}
              className="btn-secondary"
              style={{
                borderColor: 'rgba(251, 191, 36, 0.4)',
                color: '#fbbf24',
                background: 'rgba(251, 191, 36, 0.1)',
              }}
              title="建議 / 許願新增本站尚未收錄的新歌或遺漏歌曲"
            >
              <PlusCircle size={16} />
              <span>建議/許願新歌</span>
            </button>
          )}

          {/* Favorite Songs Button */}
          <button
            onClick={onOpenFavorites}
            className="btn-secondary"
            style={{
              borderColor: favoriteCount > 0 ? 'rgba(236, 72, 153, 0.4)' : undefined,
              color: favoriteCount > 0 ? '#f472b6' : undefined,
            }}
          >
            <Heart size={16} fill={favoriteCount > 0 ? '#ec4899' : 'none'} color={favoriteCount > 0 ? '#ec4899' : 'currentColor'} />
            <span>我的歌本</span>
          </button>

          {/* View Mode Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <button
              onClick={() => setFilters(prev => ({ ...prev, viewMode: 'matrix' }))}
              style={{
                background: filters.viewMode === 'matrix' ? 'var(--accent-pink)' : 'transparent',
                color: filters.viewMode === 'matrix' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
              title="桌面端矩陣比對表"
            >
              <Table2 size={16} />
              <span className="desktop-only">矩陣比對</span>
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, viewMode: 'cards' }))}
              style={{
                background: filters.viewMode === 'cards' ? 'var(--accent-pink)' : 'transparent',
                color: filters.viewMode === 'cards' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
              title="手機卡片檢視"
            >
              <LayoutGrid size={16} />
              <span className="desktop-only">手機卡片</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
