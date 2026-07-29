import React, { useState } from 'react';
import type { Song, BrandId } from '../types/ktv';
import { BRAND_LIST, BRANDS } from '../data/brands';
import { Heart, Video, Disc, CheckCircle2, Flag } from 'lucide-react';
import { ReportModal } from './ReportModal';
import { AdBannerSlot } from './AdBannerSlot';

interface MatrixViewProps {
  songs: Song[];
  selectedBrand: BrandId | 'all';
  selectedBrands?: BrandId[];
  favorites: string[];
  onToggleFavorite: (songId: string) => void;
  onSelectSongDetail: (song: Song) => void;
  selectedSongId?: string | null; // 目前已開啟詳細資料的歌曲 ID
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  songs,
  selectedBrand,
  selectedBrands = [],
  favorites,
  onToggleFavorite,
  onSelectSongDetail,
  selectedSongId,
}) => {
  const [reportingSong, setReportingSong] = useState<Song | null>(null);

  const isMultiSelecting = selectedBrands && selectedBrands.length > 0;
  const isSingleBrand = !isMultiSelecting && selectedBrand !== 'all';

  const activeBrands = isMultiSelecting
    ? BRAND_LIST.filter(b => selectedBrands.includes(b.id))
    : (selectedBrand === 'all' ? BRAND_LIST : [BRANDS[selectedBrand]]);

  const currentBrandInfo = isSingleBrand ? BRANDS[selectedBrand] : null;

  const isFewBrands = activeBrands.length > 0 && activeBrands.length <= 4;

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
                實體包廂多採用雲端對應系統（建議可先參考 Sing○ / 享○馨 收錄狀態）。
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
              <span>協助提供 / 回報【{currentBrandInfo?.shortName}】收錄狀態</span>
            </button>
          )}
          <div style={{ marginTop: '20px' }}>
            <AdBannerSlot slotType="in_feed" />
          </div>
        </div>

        {reportingSong && (
          <ReportModal song={reportingSong} onClose={() => setReportingSong(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="matrix-view-container" style={{ padding: '0 20px', overflowX: 'auto' }}>
      <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{
          width: '100%',
          tableLayout: isSingleBrand ? 'fixed' : 'auto',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.9rem',
        }}>
          <thead>
            <tr style={{
              background: 'rgba(15, 23, 42, 0.9)',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-secondary)',
            }}>
              <th style={{ padding: '14px 10px', width: '64px', minWidth: '64px', textAlign: 'center', whiteSpace: 'nowrap' }}>最愛</th>
              <th style={{ padding: '14px 16px', width: isSingleBrand ? '45%' : (isFewBrands ? 'auto' : '260px'), minWidth: '200px' }}>歌名 / 歌手 / 創作者</th>
              <th style={{ padding: '14px 16px', width: isSingleBrand ? '80px' : (isFewBrands ? '90px' : '65px'), textAlign: 'center' }}>語種</th>

              {activeBrands.map(b => {
                const isMultiHighlighted = selectedBrands.includes(b.id);
                return (
                  <th 
                    key={b.id} 
                    style={{ 
                      padding: '14px 12px', 
                      textAlign: 'center', 
                      whiteSpace: 'nowrap',
                      color: b.color,
                      borderLeft: isMultiHighlighted ? `2px solid ${b.color}` : '1px solid rgba(255, 255, 255, 0.05)',
                      background: isMultiHighlighted ? 'rgba(168, 85, 247, 0.12)' : (isSingleBrand ? 'rgba(30, 41, 59, 0.6)' : 'transparent'),
                      width: isSingleBrand ? '320px' : (isFewBrands ? '180px' : '75px'),
                      minWidth: isSingleBrand ? '280px' : (isFewBrands ? '150px' : '70px'),
                    }}
                  >
                    {isSingleBrand ? `【${b.shortName}】收錄狀態與詳細` : (isMultiHighlighted ? `✓ ${b.shortName}` : b.shortName)}
                  </th>
                );
              })}

              <th style={{ padding: '14px 16px', textAlign: 'center', width: isSingleBrand ? '90px' : '80px' }}>預覽</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song, index) => {
              const isFav = favorites.includes(song.id);
              const isSelected = selectedSongId === song.id;

              return (
                <React.Fragment key={song.id}>
                <tr
                  onClick={() => onSelectSongDetail(song)}
                  style={{
                    background: isSelected
                      ? 'rgba(236, 72, 153, 0.12)'
                      : index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    borderLeft: isSelected ? '3px solid #ec4899' : '3px solid transparent',
                    transition: 'background 0.15s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(236, 72, 153, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  {/* Favorite Toggle */}
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(song.id); }}
                      className={`heart-icon-btn ${isFav ? 'heart-active' : ''}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isFav ? '#ec4899' : 'var(--text-muted)',
                        padding: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      }}
                      title={isFav ? '移出歌單' : '加入歌單'}
                    >
                      <Heart 
                        size={18} 
                        fill={isFav ? '#ec4899' : 'none'} 
                        className={isFav ? 'heart-pop-anim' : ''}
                      />
                    </button>
                  </td>

                  {/* Song Title & Metadata */}
                  <td style={{ padding: '12px 16px', overflow: 'hidden' }}>
                    <div 
                      onClick={() => onSelectSongDetail(song)}
                      style={{ 
                        fontWeight: 700, 
                        fontSize: '1rem', 
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span className="song-title-link">{song.title}</span>
                      {selectedBrands.length > 1 && selectedBrands.every(bId => song.brands[bId]?.available) && (
                        <span style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          flexShrink: 0,
                          boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)',
                        }}>
                          全收錄 👑
                        </span>
                      )}
                      {song.popularRank && song.popularRank <= 3 && (
                        <span className="badge badge-original-vocal" style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                          TOP {song.popularRank}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      <strong>{song.artist}</strong> · 詞: {song.lyricist} / 曲: {song.composer}
                    </div>
                  </td>

                  {/* Language */}
                  <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}>
                      {song.language}
                    </span>
                  </td>

                  {/* KTV Brand Status Cells */}
                  {activeBrands.map(b => {
                    const status = song.brands[b.id];

                    if (!status || !status.available) {
                      return (
                        <td 
                          key={b.id} 
                          style={{ 
                            textAlign: 'center', 
                            padding: '12px 8px',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                          }}
                        >
                          —
                        </td>
                      );
                    }

                    const isOfficialMv = status.mvType === 'official_mv';
                    const isOriginalVocal = status.audioType === 'original_vocal';

                    if (isSingleBrand) {
                      return (
                        <td 
                          key={b.id}
                          style={{
                            textAlign: 'center',
                            padding: '10px 14px',
                            borderLeft: `2px solid ${b.color}44`,
                            background: 'rgba(30, 41, 59, 0.4)',
                          }}
                        >
                          <div 
                            style={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              borderRadius: '12px',
                              background: b.badgeBg,
                              border: `1px solid ${b.color}55`,
                              minWidth: '200px',
                            }}
                          >
                            <div style={{ 
                              fontWeight: 800, 
                              color: b.color, 
                              fontSize: '0.88rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}>
                              <CheckCircle2 size={15} color={b.color} />
                              <span>有收錄</span>
                              {status.code && status.code !== 'OK' && (
                                <span style={{
                                  background: 'rgba(255,255,255,0.15)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.82rem',
                                  color: '#fff',
                                  fontWeight: 800,
                                  border: '1px solid rgba(255,255,255,0.2)',
                                }}>
                                  🔢 碼: {status.code}
                                </span>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '5px' }}>
                              {isOfficialMv && (
                                <span className="badge badge-official-mv" style={{ padding: '2px 7px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  🎥 官方原版 MV
                                </span>
                              )}
                              {isOriginalVocal && (
                                <span className="badge badge-original-vocal" style={{ padding: '2px 7px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  🎙️ 原聲原唱
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td 
                        key={b.id}
                        style={{
                          textAlign: 'center',
                          padding: '10px 8px',
                          borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <div 
                          style={{
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: b.badgeBg,
                            border: `1px solid ${b.color}44`,
                          }}
                        >
                          <div style={{ 
                            fontWeight: 700, 
                            color: b.color, 
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}>
                            <CheckCircle2 size={13} color={b.color} />
                            有收錄
                          </div>
                          
                          {(isOfficialMv || isOriginalVocal) && (
                            <div style={{ display: 'flex', gap: '3px' }}>
                              {isOfficialMv && (
                                <span className="badge badge-official-mv" style={{ padding: '1px 5px', fontSize: '0.65rem' }}>
                                  MV
                                </span>
                              )}
                              {isOriginalVocal && (
                                <span className="badge badge-original-vocal" style={{ padding: '1px 5px', fontSize: '0.65rem' }}>
                                  原唱
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Preview Link */}
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    {song.youtubeUrl ? (
                      <a
                        href={song.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: '6px 10px', borderRadius: '8px', color: '#f87171' }}
                        title="線上 MV 預覽"
                      >
                        <Video size={16} />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
                {(index + 1) % 15 === 0 && (
                  <tr>
                    <td colSpan={3 + activeBrands.length + 1} style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.5)' }}>
                      <AdBannerSlot slotType="in_feed" />
                    </td>
                  </tr>
                )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {reportingSong && (
        <ReportModal song={reportingSong} onClose={() => setReportingSong(null)} />
      )}
    </div>
  );
};

