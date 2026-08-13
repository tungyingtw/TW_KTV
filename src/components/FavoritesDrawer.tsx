import React from 'react';
import type { Song } from '../types/ktv';
import { useBrands } from '../hooks/useBrands';
import { X, Heart, Trash2, Mic2, CheckCircle2 } from 'lucide-react';
import { isBrandAvailable } from '../utils/brandAvailability';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteSongs: Song[];
  onToggleFavorite: (songId: string) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favoriteSongs,
  onToggleFavorite,
}) => {
  const brandList = useBrands();
  React.useEffect(() => {
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

  return (
    <div
      className="drawer-overlay favorites-drawer-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--bg-overlay, rgba(15, 23, 42, 0.75))',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="glass-panel animate-fade-in drawer-content favorites-drawer-content"
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          borderRadius: 0,
          borderLeft: '1px solid rgba(236, 72, 153, 0.3)',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={20} fill="var(--accent-pink)" color="currentColor" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              我的歌本 ({favoriteSongs.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="action-icon modal-close-button"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: 'var(--radius-sm, 8px)',
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

        {/* Favorite Songs List */}
        {favoriteSongs.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}>
            <Mic2 size={36} opacity={0.4} style={{ marginBottom: '12px' }} />
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>歌本目前沒有歌曲</p>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              點擊歌曲旁的愛心按鈕即可新增至我的歌單
            </p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {favoriteSongs.map(song => (
              <div 
                key={song.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{song.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--accent-pink)', fontWeight: 600 }}>{song.artist}</p>
                  </div>
                  <button
                    onClick={() => onToggleFavorite(song.id)}
                    className="action-icon"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title="移出歌本"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Brand Availability Badges */}
                <div style={{
                  marginTop: '10px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}>
                  {brandList.map(b => {
                    const status = song.brands[b.id];
                    if (!isBrandAvailable(status)) return null;

                    return (
                      <span
                        key={b.id}
                        style={{
                          fontSize: '0.78rem',
                          background: b.badgeBg,
                          border: `1px solid ${b.color}44`,
                          color: b.color,
                          padding: '3px 8px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={12} color={b.color} />
                        {b.shortName}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
