import React from 'react';
import type { Song } from '../types/ktv';
import { BRAND_LIST } from '../data/brands';
import { X, Heart, Trash2, Mic2, CheckCircle2 } from 'lucide-react';
import { AdBannerSlot } from './AdBannerSlot';

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
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'flex-end',
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          borderRadius: 0,
          borderLeft: '1px solid rgba(236, 72, 153, 0.3)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={22} fill="#ec4899" color="#ec4899" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              我的歌本 ({favoriteSongs.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
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

        {/* 📢 廣告位（歌冊專用） */}
        <AdBannerSlot slotType="modal" />

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
            <Mic2 size={48} opacity={0.4} style={{ marginBottom: '12px' }} />
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>歌本目前沒有歌曲</p>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              點擊歌曲旁的愛心圖標即可新增至歌本對照表
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
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{song.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--accent-pink)', fontWeight: 600 }}>{song.artist}</p>
                  </div>
                  <button
                    onClick={() => onToggleFavorite(song.id)}
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
                  {BRAND_LIST.map(b => {
                    const status = song.brands[b.id];
                    if (!status || !status.available) return null;

                    return (
                      <span
                        key={b.id}
                        style={{
                          fontSize: '0.78rem',
                          background: b.badgeBg,
                          border: `1px solid ${b.color}44`,
                          color: b.color,
                          padding: '3px 8px',
                          borderRadius: '12px',
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
