import React, { useState, useMemo } from 'react';
import type { Song, BrandId, BrandInfo } from '../types/ktv';
import { BRANDS } from '../data/brands';
import { useBrands } from '../hooks/useBrands';
import { Heart, Video, Disc, CheckCircle2, Flag } from 'lucide-react';
import { ReportModal } from './ReportModal';
import { AdBannerSlot } from './AdBannerSlot';
import { getLanguageStyle } from '../utils/languageStyle';

interface MatrixViewProps {
  songs: Song[];
  selectedBrand: BrandId | 'all';
  selectedBrands?: BrandId[];
  compact?: boolean;
  favorites: string[];
  onToggleFavorite: (songId: string) => void;
  onSelectSongDetail: (song: Song) => void;
  selectedSongId?: string | null; // 目前已開啟詳細資料的歌曲 ID
  brandSongCounts?: Record<BrandId, number>;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  songs,
  selectedBrand,
  selectedBrands = [],
  compact = false,
  favorites,
  onToggleFavorite,
  onSelectSongDetail,
  selectedSongId,
  brandSongCounts,
}) => {
  const brandList = useBrands();
  const [reportingSong, setReportingSong] = useState<Song | null>(null);

  const isMultiSelecting = selectedBrands && selectedBrands.length > 0;
  const isSingleBrand = !isMultiSelecting && selectedBrand !== 'all';
  const selectedBrandInfo = isSingleBrand ? (brandList.find(b => b.id === selectedBrand) || BRANDS[selectedBrand]) : null;

  const activeBrands: BrandInfo[] = useMemo(() => {
    const rawList = isMultiSelecting
      ? brandList.filter(b => selectedBrands.includes(b.id))
      : (selectedBrand === 'all' ? brandList : (selectedBrandInfo ? [selectedBrandInfo] : []));

    if (!brandSongCounts) return rawList;

    return [...rawList].sort((a, b) => {
      const countA = brandSongCounts[a.id] || 0;
      const countB = brandSongCounts[b.id] || 0;
      return countB - countA;
    });
  }, [isMultiSelecting, selectedBrands, selectedBrand, brandList, selectedBrandInfo, brandSongCounts]);

  const currentBrandInfo = selectedBrandInfo;

  const isFewBrands = activeBrands.length > 0 && activeBrands.length <= 4;

  const getCompactAvailability = (song: Song) => {
    const availableBrands = activeBrands.filter(b => song.brands[b.id]?.available);
    const totalBrands = activeBrands.length || brandList.length;

    if (isSingleBrand && currentBrandInfo) {
      const status = song.brands[currentBrandInfo.id];
      if (!status?.available) {
        return { label: '未收錄', color: 'var(--text-muted, #94a3b8)' };
      }

      const codeText = status.code && status.code !== 'OK' ? ` ${status.code}` : '';
      return { label: `有收錄${codeText}`, color: currentBrandInfo.color };
    }

    return {
      label: `${availableBrands.length}/${totalBrands} 家`,
      color: availableBrands.length > 0 ? '#34d399' : 'var(--text-muted, #94a3b8)',
    };
  };

  const getCompactVocalLabel = (song: Song) => {
    const hasOriginal = activeBrands.some(b => song.brands[b.id]?.available && song.brands[b.id]?.audioType === 'original_vocal');
    const hasGuided = activeBrands.some(b => song.brands[b.id]?.available && song.brands[b.id]?.audioType === 'guided_vocal');

    if (hasOriginal) return { label: '原唱', color: 'var(--accent-pink, #ec4899)' };
    if (hasGuided) return { label: '導唱', color: '#22d3ee' };
    return { label: '-', color: 'var(--text-muted, #64748b)' };
  };

  if (songs.length === 0) {
    return (
      <div style={{ padding: '0 20px' }}>
        <div className="glass-panel" style={{
          padding: '44px 24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          border: isSingleBrand ? `1px solid ${currentBrandInfo?.color}44` : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          borderRadius: '16px',
          background: 'var(--bg-glass, rgba(30, 41, 59, 0.5))',
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          <Disc size={52} color={currentBrandInfo?.color || "var(--text-muted)"} style={{ marginBottom: '12px', filter: currentBrandInfo ? `drop-shadow(0 0 10px ${currentBrandInfo.color}66)` : 'none' }} />
          
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary, #fff)', fontWeight: 800 }}>
            {isSingleBrand ? `📍 【${currentBrandInfo?.name}】目前尚無資料` : '未找到符合條件的歌曲'}
          </h3>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)', marginTop: '8px', maxWidth: '560px', margin: '8px auto 20px', lineHeight: 1.6 }}>
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

  // 計算表格最小總寬度，防止響應式擠壓與動態偏移
  const tableMinWidth = isSingleBrand ? '780px' : (isFewBrands ? '880px' : '1180px');

  if (compact) {
    return (
      <div className="matrix-view-container" style={{ padding: '0 10px' }}>
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table style={{
            width: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.84rem',
          }}>
            <thead>
              <tr style={{
                background: 'var(--bg-glass, rgba(15, 23, 42, 0.9))',
                borderBottom: '2px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                color: 'var(--text-secondary, #cbd5e1)',
              }}>
                <th style={{ padding: '10px 6px', width: '38px', textAlign: 'center' }}></th>
                <th style={{ padding: '10px 8px' }}>歌曲</th>
                <th style={{ padding: '10px 6px', width: '76px', textAlign: 'center' }}>收錄</th>
                <th style={{ padding: '10px 6px', width: '54px', textAlign: 'center' }}>導唱</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song, index) => {
                const isFav = favorites.includes(song.id);
                const isSelected = selectedSongId === song.id;
                const availability = getCompactAvailability(song);
                const vocalStatus = getCompactVocalLabel(song);

                return (
                  <tr
                    key={song.id}
                    onClick={() => onSelectSongDetail(song)}
                    style={{
                      background: isSelected
                        ? 'rgba(236, 72, 153, 0.12)'
                        : index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                      borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                      borderLeft: isSelected ? '3px solid var(--accent-pink, #ec4899)' : '3px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ textAlign: 'center', padding: '10px 4px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(song.id); }}
                        className={`heart-icon-btn ${isFav ? 'heart-active' : ''}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: isFav ? 'var(--accent-pink, #ec4899)' : 'var(--text-muted, #64748b)',
                          padding: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={isFav ? '移出歌本' : '加入歌本'}
                      >
                        <Heart size={17} fill={isFav ? 'var(--accent-pink, #ec4899)' : 'none'} />
                      </button>
                    </td>

                    <td style={{ padding: '10px 8px', overflow: 'hidden' }}>
                      <div style={{
                        color: isSelected ? 'var(--accent-pink, #ec4899)' : 'var(--text-primary, #fff)',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {song.title}
                      </div>
                      <div style={{
                        color: 'var(--text-muted, #94a3b8)',
                        fontSize: '0.76rem',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        <span style={{ color: 'var(--text-secondary, #cbd5e1)', fontWeight: 600 }}>{song.artist}</span>
                        {(() => {
                          const langStyle = getLanguageStyle(song.language);
                          return (
                            <span style={{
                              marginLeft: '6px',
                              fontSize: '0.7rem',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              background: langStyle.bg,
                              color: langStyle.color,
                              border: `1px solid ${langStyle.border}`,
                              fontWeight: 700,
                              display: 'inline-block',
                            }}>
                              {song.language}
                            </span>
                          );
                        })()}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center', padding: '10px 4px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '58px',
                        minHeight: '28px',
                        padding: '3px 6px',
                        borderRadius: '8px',
                        background: 'var(--bg-glass, rgba(255, 255, 255, 0.06))',
                        color: availability.color,
                        fontWeight: 800,
                        fontSize: '0.73rem',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                        whiteSpace: 'nowrap',
                      }}>
                        {availability.label}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center', padding: '10px 4px' }}>
                      <span style={{
                        color: vocalStatus.color,
                        fontWeight: 800,
                        fontSize: '0.74rem',
                        whiteSpace: 'nowrap',
                      }}>
                        {vocalStatus.label}
                      </span>
                    </td>
                  </tr>
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
  }

  return (
    <div className="matrix-view-container" style={{ padding: '0 20px', overflowX: 'auto', scrollbarGutter: 'stable' }}>
      <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{
          width: '100%',
          minWidth: tableMinWidth,
          tableLayout: 'fixed', // 100% 固定表格版型，徹底解決語種切換與過濾時的欄位跳動偏移 Bug
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.9rem',
        }}>
          <thead>
            <tr style={{
              background: 'var(--bg-glass, rgba(15, 23, 42, 0.9))',
              borderBottom: '2px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              color: 'var(--text-secondary, #cbd5e1)',
            }}>
              <th style={{ padding: '14px 10px', width: '56px', textAlign: 'center', whiteSpace: 'nowrap' }}>最愛</th>
              <th style={{ padding: '14px 16px', width: isSingleBrand ? '35%' : (isFewBrands ? '32%' : '260px') }}>歌名 / 歌手 / 創作者</th>
              <th style={{ padding: '14px 12px', width: '70px', textAlign: 'center' }}>語種</th>

              {activeBrands.map(b => {
                const isMultiHighlighted = selectedBrands.includes(b.id);
                return (
                  <th 
                    key={b.id} 
                    style={{ 
                      padding: '14px 8px', 
                      textAlign: 'center', 
                      whiteSpace: 'nowrap',
                      color: b.color,
                      borderLeft: isMultiHighlighted ? `2px solid ${b.color}` : '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                      background: isMultiHighlighted ? 'rgba(168, 85, 247, 0.12)' : (isSingleBrand ? 'rgba(30, 41, 59, 0.6)' : 'transparent'),
                      width: isSingleBrand ? '360px' : (isFewBrands ? '180px' : '90px'),
                    }}
                  >
                    {isSingleBrand ? `【${b.shortName}】收錄狀態與詳細` : (isMultiHighlighted ? `✓ ${b.shortName}` : b.shortName)}
                  </th>
                );
              })}

              <th style={{ padding: '14px 12px', textAlign: 'center', width: '75px' }}>預覽</th>
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
                    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                    borderLeft: isSelected ? '3px solid var(--accent-pink, #ec4899)' : '3px solid transparent',
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
                        color: isFav ? 'var(--accent-pink, #ec4899)' : 'var(--text-muted, #64748b)',
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
                        fill={isFav ? 'var(--accent-pink, #ec4899)' : 'none'} 
                        className={isFav ? 'heart-pop-anim' : ''}
                      />
                    </button>
                  </td>

                  {/* Song Title & Artist & Authors */}
                  <td style={{ padding: '12px 16px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary, #fff)', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: isSelected ? 'var(--accent-pink, #ec4899)' : 'var(--text-primary, #fff)' }}>{song.title}</span>
                      {song.isMainlandViral && (
                        <span className="badge badge-mainland" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          🔥 爆紅
                        </span>
                      )}
                      {song.isNiche && (
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(168, 85, 247, 0.15)',
                          color: '#c084fc',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          fontWeight: 700,
                        }}>
                          獨家
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', marginTop: '3px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>{song.artist}</span>
                      {(song.lyricist || song.composer) && (
                        <span style={{ fontSize: '0.78rem', marginLeft: '6px', opacity: 0.8 }}>
                          (詞: {song.lyricist || '—'} / 曲: {song.composer || '—'})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Language Tag */}
                  <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                    {(() => {
                      const langStyle = getLanguageStyle(song.language);
                      return (
                        <span style={{
                          fontSize: '0.74rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: langStyle.bg,
                          color: langStyle.color,
                          border: `1px solid ${langStyle.border}`,
                          fontWeight: 700,
                        }}>
                          {song.language}
                        </span>
                      );
                    })()}
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
                            padding: '10px 4px',
                            borderLeft: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                            color: 'var(--text-muted, #64748b)',
                            fontSize: '0.85rem',
                          }}
                        >
                          —
                        </td>
                      );
                    }

                    const hasGuidedVocal = status.audioType === 'guided_vocal';
                    const isOfficialMv = status.mvType === 'official_mv';
                    const isReeditedMv = status.mvType === 'reedited_mv';

                    if (isSingleBrand) {
                      return (
                        <td 
                          key={b.id}
                          style={{
                            textAlign: 'center',
                            padding: '10px 14px',
                            borderLeft: `2px solid ${b.color}44`,
                            background: 'var(--bg-glass, rgba(30, 41, 59, 0.4))',
                          }}
                        >
                          <div 
                            style={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
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
                            
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                              {isOfficialMv && (
                                <span className="badge" style={{ padding: '2px 7px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px' }}>
                                  MV
                                </span>
                              )}
                              {isReeditedMv && (
                                <span className="badge" style={{ padding: '2px 7px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '4px' }}>
                                  伴唱帶
                                </span>
                              )}
                              {hasGuidedVocal && (
                                <span className="badge badge-guided-vocal" style={{ padding: '2px 7px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  導唱
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
                          padding: '6px 2px',
                          borderLeft: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                          verticalAlign: 'middle',
                        }}
                      >
                        <div 
                          style={{
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span style={{ 
                            fontWeight: 700, 
                            color: b.color, 
                            fontSize: '0.78rem',
                            lineHeight: 1.2,
                          }}>
                            有收錄
                          </span>
                          
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {isOfficialMv && (
                              <span className="badge" style={{ padding: '1px 4px', fontSize: '0.6rem', fontWeight: 700, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '3px' }}>
                                MV
                              </span>
                            )}
                            {isReeditedMv && (
                              <span className="badge" style={{ padding: '1px 4px', fontSize: '0.6rem', fontWeight: 700, background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '3px' }}>
                                伴唱帶
                              </span>
                            )}
                            {hasGuidedVocal && (
                              <span className="badge badge-guided-vocal" style={{ padding: '1px 4px', fontSize: '0.6rem' }}>
                                導唱
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}

                  {/* Preview Link */}
                  <td style={{ textAlign: 'center', padding: '12px 8px' }}>
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
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>—</span>
                    )}
                  </td>
                </tr>
                {(index + 1) % 15 === 0 && (
                  <tr>
                    <td colSpan={3 + activeBrands.length + 1} style={{ padding: '8px 12px', background: 'var(--bg-glass, rgba(15, 23, 42, 0.5))' }}>
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
