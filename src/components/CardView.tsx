import React, { useState } from 'react';
import type { Song, BrandId } from '../types/ktv';
import { BRANDS } from '../data/brands';
import { Heart, Video, Disc, ChevronRight, CheckCircle2, Flag } from 'lucide-react';
import { ReportModal } from './ReportModal';

interface CardViewProps {
  songs: Song[];
  selectedBrand: BrandId | 'all';
  selectedBrands?: BrandId[];
  favorites: string[];
  onToggleFavorite: (songId: string) => void;
  onSelectSongDetail: (song: Song) => void;
}

export const CardView: React.FC<CardViewProps> = ({
  songs,
  selectedBrand,
  selectedBrands = [],
  favorites,
  onToggleFavorite,
  onSelectSongDetail,
}) => {
  const [reportingSong, setReportingSong] = useState<Song | null>(null);
  const isMultiSelecting = selectedBrands.length > 0;
  const isSingleBrand = !isMultiSelecting && selectedBrand !== 'all';
  const currentBrandInfo = isSingleBrand ? BRANDS[selectedBrand] : null;

  if (songs.length === 0) {
    return (
      <div style={{ padding: '0 20px' }}>
        <div className="glass-panel" style={{
          padding: '44px 24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          border: isSingleBrand ? `1px solid ${currentBrandInfo?.color}44` : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          background: 'rgba(30, 41, 59, 0.5)',
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          <Disc size={52} color={currentBrandInfo?.color || "var(--text-muted)"} style={{ marginBottom: '12px', filter: currentBrandInfo ? `drop-shadow(0 0 10px ${currentBrandInfo.color}66)` : 'none' }} />
          
          <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>
            {isSingleBrand ? `📍 【${currentBrandInfo?.name}】目前尚無資料` : '未找到符合條件的歌曲'}
          </h3>

          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '8px', maxWidth: '560px', margin: '8px auto 20px', lineHeight: 1.6 }}>
            {isSingleBrand ? (
              <>
                資料庫中暫無【{currentBrandInfo?.shortName}】的驗證收錄對照記錄。<br />
                實體包廂多採用雲端對應系統（建議可先參考 SingGo / 享溫馨 收錄狀態）。
              </>
            ) : (
              '嘗試更換關鍵字或取消過濾條件。'
            )}
          </p>

          {isSingleBrand && (
            <button 
              onClick={() => {
                setReportingSong({
                  id: `report_${selectedBrand}`,
                  title: `${currentBrandInfo?.shortName || ''} 門市收錄`,
                  artist: '現場資料補充',
                  lyricist: '', composer: '', language: '國語', zhuyin: '', pinyin: '', releaseYear: 2024, lyricsSnippet: '', brands: {} as any
                });
              }}
              className="btn-primary"
              style={{
                padding: '10px 22px',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: `linear-gradient(135deg, ${currentBrandInfo?.color || '#ec4899'}, #8b5cf6)`,
              }}
            >
              <Flag size={16} />
              <span>協助提供 / 回報【{currentBrandInfo?.shortName}】點歌資料</span>
            </button>
          )}
        </div>

        {reportingSong && (
          <ReportModal song={reportingSong} onClose={() => setReportingSong(null)} />
        )}
      </div>
    );
  }

  return (
    <>
    <div className="card-view-container" style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 20px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
      gap: '16px',
    }}>
      {songs.map(song => {
        const isFav = favorites.includes(song.id);

        const displayBrands = isMultiSelecting
          ? selectedBrands.map(bId => BRANDS[bId]).filter(Boolean)
          : (selectedBrand === 'all'
            ? [BRANDS['cashbox'], BRANDS['holiday'], BRANDS['watering_hole'], BRANDS['starlight']]
            : [BRANDS[selectedBrand]]);

        return (
          <div 
            key={song.id}
            onClick={() => onSelectSongDetail(song)}
            className="glass-panel animate-fade-in"
            style={{
              padding: '16px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            {/* Header: Title & Favorite Button */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '8px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 
                      onClick={() => onSelectSongDetail(song)}
                      style={{ 
                        fontSize: '1.15rem', 
                        fontWeight: 800, 
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {song.title}
                    </h3>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}>
                      {song.language}
                    </span>
                  </div>

                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--accent-pink)', 
                    fontWeight: 700, 
                    marginTop: '2px', 
                  }}>
                    {song.artist}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(song.id);
                  }}
                  className={`heart-icon-btn ${isFav ? 'heart-active' : ''}`}
                  style={{
                    background: isFav ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${isFav ? 'rgba(236, 72, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isFav ? '#ec4899' : 'var(--text-muted)',
                  }}
                  title={isFav ? '移出歌單' : '加入歌單'}
                >
                  <Heart size={18} fill={isFav ? '#ec4899' : 'none'} className={isFav ? 'heart-pop-anim' : ''} />
                </button>
              </div>

              {/* Lyricist / Composer & Snippet */}
              <div style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                marginTop: '8px',
                lineHeight: 1.4,
              }}>
                <div>詞: {song.lyricist} | 曲: {song.composer}</div>
                {song.lyricsSnippet && !song.lyricsSnippet.includes('全台 10 大 KTV') && (
                  <p style={{
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    marginTop: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    "{song.lyricsSnippet}"
                  </p>
                )}
              </div>
            </div>

            {/* Brand Song Availability Grid */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              {displayBrands.map(b => {
                const status = song.brands[b.id];

                if (!status || !status.available) {
                  return (
                    <div 
                      key={b.id} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        padding: '4px 8px',
                      }}
                    >
                      <span style={{ color: b.color, fontWeight: 600 }}>{b.shortName}</span>
                      <span>未收錄</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: b.badgeBg,
                      border: `1px solid ${b.color}33`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: b.color, fontSize: '0.85rem' }}>
                        {b.shortName}
                      </span>
                      {status.mvType === 'official_mv' && (
                        <span className="badge badge-official-mv" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                          MV
                        </span>
                      )}
                      {status.audioType === 'original_vocal' && (
                        <span className="badge badge-original-vocal" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                          原唱
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: b.color,
                    }}>
                      <CheckCircle2 size={14} color={b.color} />
                      <span>有收錄</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              paddingTop: '6px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {song.youtubeUrl ? (
                  <a
                    href={song.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      color: '#f87171',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                    }}
                  >
                    <Video size={14} /> 線上預覽
                  </a>
                ) : null}

                {/* 回報錯誤小按鈕 */}
                <button
                  onClick={e => { e.stopPropagation(); setReportingSong(song); }}
                  title="回報資料錯誤"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '0.75rem',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                >
                  <Flag size={12} />
                  回報
                </button>
              </div>

              <button
                onClick={() => onSelectSongDetail(song)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-pink)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '0.8rem',
                }}
              >
                全台 KTV 點歌碼對照 <ChevronRight size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>

    {/* Report Modal（從歌曲卡觸發）*/}
    {reportingSong && (
      <ReportModal song={reportingSong} onClose={() => setReportingSong(null)} />
    )}
    </>
  );
};
