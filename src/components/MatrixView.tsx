import React, { useState, useMemo } from 'react';
import type { Song, BrandId, BrandInfo } from '../types/ktv';
import { BRANDS } from '../data/brands';
import { useBrands } from '../hooks/useBrands';
import { Heart, Video, Disc, CheckCircle2, Flag } from 'lucide-react';
import { ReportModal } from './ReportModal';
import { AdBannerSlot } from './AdBannerSlot';
import { getLanguageStyle } from '../utils/languageStyle';
import { isBrandAvailable } from '../utils/brandAvailability';
import { getYoutubeReferenceUrl } from '../utils/songReference';
import { getMeaningfulComposer, getMeaningfulLyricist } from '../utils/songCredits';

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
    const availableBrands = activeBrands.filter(b => isBrandAvailable(song.brands[b.id]));
    const totalBrands = activeBrands.length || brandList.length;

    if (isSingleBrand && currentBrandInfo) {
      const status = song.brands[currentBrandInfo.id];
      if (!isBrandAvailable(status)) {
        return { label: '未收錄', color: 'var(--text-muted, #94a3b8)' };
      }

      return { label: '有收錄', color: currentBrandInfo.color };
    }

    return {
      label: `${availableBrands.length}/${totalBrands} 家`,
      color: availableBrands.length > 0 ? '#34d399' : 'var(--text-muted, #94a3b8)',
    };
  };

  const getCompactMvLabel = (song: Song) => {
    const hasOfficialMv = activeBrands.some(b => isBrandAvailable(song.brands[b.id]) && song.brands[b.id]?.mvType === 'official_mv');
    if (hasOfficialMv) return { label: '有', color: '#38bdf8' };
    return { label: '-', color: 'var(--text-muted, #64748b)' };
  };

  const getCompactGuidedLabel = (song: Song) => {
    const hasGuided = activeBrands.some(b => isBrandAvailable(song.brands[b.id]) && song.brands[b.id]?.audioType === 'guided_vocal');
    if (hasGuided) return { label: '有', color: '#22d3ee' };
    return { label: '-', color: 'var(--text-muted, #64748b)' };
  };

  if (songs.length === 0) {
    return (
      <div style={{ padding: '0 20px' }}>
        <div className="glass-panel empty-state-panel" style={{
          padding: '44px 24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          border: isSingleBrand ? `1px solid ${currentBrandInfo?.color}44` : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-glass, rgba(30, 41, 59, 0.5))',
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          <Disc size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary, #fff)', fontWeight: 800 }}>
            {isSingleBrand ? `【${currentBrandInfo?.name}】目前尚無資料` : '未找到符合條件的歌曲'}
          </h3>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)', marginTop: '8px', maxWidth: '560px', margin: '8px auto 20px', lineHeight: 1.6 }}>
            {isSingleBrand ? (
              <>
                目前尚無【{currentBrandInfo?.shortName}】的已確認收錄資料。<br />
                可先參考其他 KTV 門市或伴唱品牌的收錄狀態，或提供現場線索協助補充。
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
              className="btn-primary action-primary"
              style={{
                padding: '10px 22px',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Flag size={16} />
              <span>提供【{currentBrandInfo?.shortName}】收錄線索</span>
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
  const tableMinWidth = isSingleBrand ? '780px' : (isFewBrands ? '880px' : '1260px');

  if (compact) {
    return (
      <div className="matrix-view-container" style={{ padding: '0 10px' }}>
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table className="data-table matrix-data-table" style={{
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
                <th style={{ padding: '9px 6px', width: '38px', textAlign: 'center' }}></th>
                <th style={{ padding: '9px 8px' }}>歌曲</th>
                <th style={{ padding: '9px 4px', width: '70px', textAlign: 'center' }}>收錄</th>
                <th style={{ padding: '9px 4px', width: '42px', textAlign: 'center' }}>MV</th>
                <th style={{ padding: '9px 4px', width: '46px', textAlign: 'center' }}>導唱</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song, index) => {
                const isFav = favorites.includes(song.id);
                const isSelected = selectedSongId === song.id;
                const availability = getCompactAvailability(song);
                const mvStatus = getCompactMvLabel(song);
                const guidedStatus = getCompactGuidedLabel(song);

                return (
                  <tr
                    className="song-list-click-target"
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
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(song.id); }}
                        className={`heart-icon-btn action-icon ${isFav ? 'heart-active' : ''}`}
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
                        <Heart size={18} fill={isFav ? 'var(--accent-pink, #ec4899)' : 'none'} />
                      </button>
                    </td>

                    <td style={{ padding: '9px 8px', overflow: 'hidden' }}>
                      <div className="song-title-text" style={{
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
                        <span className="song-artist-text" style={{ color: 'var(--text-secondary, #cbd5e1)', fontWeight: 600 }}>{song.artist}</span>
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

                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      <span className="status-label status-availability" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '58px',
                        minHeight: '28px',
                        padding: '3px 6px',
                        borderRadius: '8px',
                        background: 'var(--bg-glass, rgba(255, 255, 255, 0.06))',
                        color: 'var(--status-available-color)',
                        fontWeight: 800,
                        fontSize: '0.73rem',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                        whiteSpace: 'nowrap',
                      }}>
                        {availability.label}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      <span className={`status-label ${mvStatus.label === '-' ? 'status-empty' : 'status-mv'}`} style={{
                        color: mvStatus.color,
                        fontWeight: 800,
                        fontSize: '0.74rem',
                        whiteSpace: 'nowrap',
                      }}>
                        {mvStatus.label}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      <span className={`status-label ${guidedStatus.label === '-' ? 'status-empty' : 'status-guided'}`} style={{
                        color: guidedStatus.color,
                        fontWeight: 800,
                        fontSize: '0.74rem',
                        whiteSpace: 'nowrap',
                      }}>
                        {guidedStatus.label}
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
        <table className="data-table matrix-data-table" style={{
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
              <th style={{ padding: '9px 10px', width: '54px', textAlign: 'center', whiteSpace: 'nowrap' }}>最愛</th>
              <th style={{ padding: '9px 14px', width: isSingleBrand ? '35%' : (isFewBrands ? '32%' : '300px') }}>歌名 / 歌手 / 創作者</th>
              <th style={{ padding: '9px 10px', width: '68px', textAlign: 'center' }}>語種</th>

              {activeBrands.map(b => {
                const isMultiHighlighted = selectedBrands.includes(b.id);
                return (
                  <th
                    className="brand-column-cell"
                    key={b.id} 
                    style={{ 
                      padding: '9px 8px',
                      textAlign: 'center', 
                      whiteSpace: 'nowrap',
                      color: b.color,
                      borderLeft: isMultiHighlighted ? `2px solid ${b.color}` : '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                      background: isMultiHighlighted ? 'rgba(168, 85, 247, 0.12)' : (isSingleBrand ? 'rgba(30, 41, 59, 0.6)' : 'transparent'),
                      width: isSingleBrand ? '360px' : (isFewBrands ? '180px' : '90px'),
                    }}
                  >
                    <span className="brand-column-label">{isSingleBrand ? `【${b.shortName}】收錄狀態與詳細` : b.shortName}</span>
                  </th>
                );
              })}

              <th style={{ padding: '9px 10px', textAlign: 'center', width: '70px' }}>預覽</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song, index) => {
              const isFav = favorites.includes(song.id);
              const isSelected = selectedSongId === song.id;
              const lyricist = getMeaningfulLyricist(song);
              const composer = getMeaningfulComposer(song);

              return (
                <React.Fragment key={song.id}>
                <tr
                  className="song-list-click-target"
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
                  {/* Favorite Toggle */}
                  <td style={{ textAlign: 'center', padding: '9px 8px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(song.id); }}
                      className={`heart-icon-btn action-icon ${isFav ? 'heart-active' : ''}`}
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
                  <td style={{ padding: '9px 14px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div className="song-title-text" style={{ fontWeight: 800, color: 'var(--text-primary, #fff)', fontSize: '0.96rem', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ color: isSelected ? 'var(--accent-pink, #ec4899)' : 'var(--text-primary, #fff)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</span>
                      {song.isNiche && (
                        <span className="status-label" style={{
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
                    <div className="song-meta-text" style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span className="song-artist-text" style={{ fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>{song.artist}</span>
                      {(lyricist || composer) && (
                        <span style={{ fontSize: '0.78rem', marginLeft: '6px', opacity: 0.8 }}>
                          (詞: {lyricist || '—'} / 曲: {composer || '—'})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Language Tag */}
                  <td style={{ textAlign: 'center', padding: '9px 6px' }}>
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

                    if (!isBrandAvailable(status)) {
                      return (
                        <td
                          className="brand-column-cell"
                          key={b.id} 
                          style={{ 
                            textAlign: 'center', 
                            padding: '8px 4px',
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
                          className="brand-column-cell"
                          key={b.id}
                          style={{
                            textAlign: 'center',
                            padding: '8px 14px',
                            borderLeft: `2px solid ${b.color}44`,
                            background: 'var(--bg-glass, rgba(30, 41, 59, 0.4))',
                          }}
                        >
                          <div className="status-card"
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
                              color: 'var(--status-available-color)',
                              fontSize: '0.88rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}>
                              <CheckCircle2 size={16} color="var(--status-available-color)" />
                              <span className="status-label status-availability">有收錄</span>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                              {isOfficialMv && (
                                <span className="badge badge-official-mv" style={{ padding: '2px 7px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px' }}>
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
                        className="brand-column-cell"
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
                          <span className="status-label status-availability" style={{
                            fontWeight: 700, 
                            color: 'var(--status-available-color)',
                            fontSize: '0.78rem',
                            lineHeight: 1.2,
                          }}>
                            有收錄
                          </span>
                          
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {isOfficialMv && (
                              <span className="badge badge-official-mv" style={{ padding: '1px 4px', fontSize: '0.6rem', fontWeight: 700, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '3px' }}>
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
                  <td style={{ textAlign: 'center', padding: '9px 6px' }}>
                    {getYoutubeReferenceUrl(song) ? (
                      <a
                        href={getYoutubeReferenceUrl(song)}
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
