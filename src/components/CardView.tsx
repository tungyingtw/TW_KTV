import React, { useState, useMemo } from 'react';
import type { Song, BrandId, BrandInfo, BrandSongStatus, SongVotes, VoteData } from '../types/ktv';
import { BRANDS } from '../data/brands';
import { useBrands } from '../hooks/useBrands';
import { useIsMobile } from '../hooks/useIsMobile';
import { Heart, Video, Disc, ChevronRight, CheckCircle2, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import { ReportModal } from './ReportModal';
import { AdBannerSlot } from './AdBannerSlot';
import { ResultLegend } from './ResultLegend';
import { getLanguageStyle } from '../utils/languageStyle';
import { isStatusAvailableWithCommunity, shouldShowGuidedVocal, shouldShowOfficialMv } from '../utils/communityVoteStatus';
import { getMeaningfulLyricsSnippet, getYoutubeReferenceUrl } from '../utils/songReference';

interface CardViewProps {
  songs: Song[];
  selectedBrand: BrandId | 'all';
  selectedBrands?: BrandId[];
  favorites: string[];
  onToggleFavorite: (songId: string) => void;
  onSelectSongDetail: (song: Song) => void;
  brandSongCounts?: Record<BrandId, number>;
  songVotes?: Record<string, SongVotes>;
}

function getMvLabel(status?: BrandSongStatus, vote?: VoteData): string {
  if (shouldShowOfficialMv(status, vote)) return 'MV';
  if (status?.mvType === 'reedited_mv' || status?.mvType === 'live_mv' || status?.mvType === 'anime_mv') return '伴唱帶類型';
  return '';
}

function getPlatformStatusLabel(status?: BrandSongStatus, vote?: VoteData): string {
  if (!isStatusAvailableWithCommunity(status, vote)) return '未收錄';
  const labels = ['有收錄'];
  const mvLabel = getMvLabel(status, vote);
  if (shouldShowGuidedVocal(status, vote)) labels.push('導唱');
  if (mvLabel) labels.push(mvLabel);
  return labels.join(' · ');
}

export const CardView: React.FC<CardViewProps> = ({
  songs,
  selectedBrand,
  selectedBrands = [],
  favorites,
  onToggleFavorite,
  onSelectSongDetail,
  brandSongCounts,
  songVotes = {},
}) => {
  const brandList = useBrands();
  const isMobile = useIsMobile();
  const [reportingSong, setReportingSong] = useState<Song | null>(null);
  const [expandedSongIds, setExpandedSongIds] = useState<Record<string, boolean>>({});
  const isMultiSelecting = selectedBrands.length > 0;
  const isSingleBrand = !isMultiSelecting && selectedBrand !== 'all';

  const sortedBrandList = useMemo(() => {
    if (!brandSongCounts) return brandList;
    return [...brandList].sort((a, b) => {
      const countA = brandSongCounts[a.id] || 0;
      const countB = brandSongCounts[b.id] || 0;
      return countB - countA;
    });
  }, [brandList, brandSongCounts]);

  const currentBrandInfo = isSingleBrand ? (sortedBrandList.find(b => b.id === selectedBrand) || BRANDS[selectedBrand]) : null;

  const getDisplayBrands = (song: Song): BrandInfo[] => {
    if (isMultiSelecting) {
      return selectedBrands.map(bId => sortedBrandList.find(b => b.id === bId) || BRANDS[bId]).filter(Boolean);
    }

    if (selectedBrand === 'all') {
      const votes = songVotes[song.id] || {};
      const availableInSong = sortedBrandList.filter(b => isStatusAvailableWithCommunity(song.brands?.[b.id], votes[b.id]));
      return availableInSong.length > 0 ? availableInSong.slice(0, 4) : sortedBrandList.slice(0, 4);
    }

    return [sortedBrandList.find(b => b.id === selectedBrand) || BRANDS[selectedBrand]].filter(Boolean);
  };

  const getDetailBrands = (): BrandInfo[] => {
    if (isMultiSelecting) {
      return selectedBrands.map(bId => sortedBrandList.find(b => b.id === bId) || BRANDS[bId]).filter(Boolean);
    }
    return sortedBrandList;
  };

  const getMobileSummary = (song: Song) => {
    const detailBrands = getDetailBrands();
    const votes = songVotes[song.id] || {};
    const availableBrands = detailBrands.filter(b => isStatusAvailableWithCommunity(song.brands?.[b.id], votes[b.id]));
    const guidedCount = availableBrands.filter(b => shouldShowGuidedVocal(song.brands?.[b.id], votes[b.id])).length;
    const mvCount = availableBrands.filter(b => Boolean(getMvLabel(song.brands?.[b.id], votes[b.id]))).length;

    return {
      detailBrands,
      topBrands: availableBrands.slice(0, 3),
      availabilityText: availableBrands.length > 0 ? `${availableBrands.length} 個平台有收錄參考` : '目前未見平台收錄參考',
      guidedText: guidedCount > 0 ? `${guidedCount} 個平台標示導唱` : '目前未見導唱標示',
      mvText: mvCount > 0 ? `${mvCount} 個平台有 MV 類型參考` : '目前未見 MV 類型標示',
    };
  };

  const toggleExpanded = (songId: string) => {
    setExpandedSongIds(prev => ({ ...prev, [songId]: !prev[songId] }));
  };

  if (songs.length === 0) {
    return (
      <div style={{ padding: '0 20px' }}>
        <div className="glass-panel empty-state-panel" style={{
          padding: '44px 24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          border: isSingleBrand ? `1px solid ${currentBrandInfo?.color}44` : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          background: 'rgba(30, 41, 59, 0.5)',
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          <Disc size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />

          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            {isSingleBrand ? `【${currentBrandInfo?.name}】目前尚無資料` : '未找到符合條件的歌曲'}
          </h3>

          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '8px', maxWidth: '560px', margin: '8px auto 20px', lineHeight: 1.6 }}>
            {isSingleBrand ? (
              <>
                目前尚無【{currentBrandInfo?.shortName}】的已確認收錄資料。<br />
                可以改用歌手、部分歌名、別名或較短關鍵字再查一次；本站目前不支援用歌詞片段查詢。若你確認現場有收錄，歡迎提供現場線索協助補充。
              </>
            ) : (
              '目前沒有找到相符歌曲。可以改用歌手、部分歌名、別名或較短關鍵字再查一次；本站目前不支援用歌詞片段查詢。若你確認現場有收錄，歡迎提供建議作為後續整理參考。'
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
                background: `linear-gradient(135deg, ${currentBrandInfo?.color || '#ec4899'}, #8b5cf6)`,
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

  return (
    <>
      <ResultLegend />
      <div className="card-view-container" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
        gap: '16px',
      }}>
        {songs.map((song, index) => {
          const isFav = favorites.includes(song.id);
          const displayBrands = getDisplayBrands(song);
          const mobileSummary = getMobileSummary(song);
          const isExpanded = Boolean(expandedSongIds[song.id]);
          const langStyle = getLanguageStyle(song.language);
          const youtubeReferenceUrl = getYoutubeReferenceUrl(song);

          if (isMobile) {
            return (
              <React.Fragment key={song.id}>
                <article
                  onClick={() => onSelectSongDetail(song)}
                  className="glass-panel animate-fade-in song-list-click-target song-card-mobile"
                >
                  <div className="song-card-mobile-header">
                    <div className="song-card-mobile-title-group">
                      <div className="song-card-mobile-title-row">
                        <h3 className="song-card-mobile-title">{song.title}</h3>
                        <span
                          className="song-card-mobile-language"
                          style={{
                            background: langStyle.bg,
                            color: langStyle.color,
                            border: `1px solid ${langStyle.border}`,
                          }}
                        >
                          {song.language}
                        </span>
                      </div>
                      <p className="song-card-mobile-artist">{song.artist}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(song.id);
                      }}
                      className={`song-card-mobile-favorite action-icon ${isFav ? 'heart-active' : ''}`}
                      aria-label={isFav ? '從我的歌本移除' : '加入我的歌本'}
                      title={isFav ? '從我的歌本移除' : '加入我的歌本'}
                    >
                      <Heart size={18} fill={isFav ? 'var(--accent-pink)' : 'none'} className={isFav ? 'heart-pop-anim' : ''} />
                    </button>
                  </div>

                  {getMeaningfulLyricsSnippet(song) && (
                    <p className="song-card-mobile-snippet">辨識提示：{getMeaningfulLyricsSnippet(song)}</p>
                  )}

                  <div className="song-card-mobile-summary" aria-label="歌曲收錄摘要">
                    <strong>{mobileSummary.availabilityText}</strong>
                    <span>{mobileSummary.guidedText}</span>
                    <span>{mobileSummary.mvText}</span>
                    <small>實際以現場點歌系統為準</small>
                  </div>

                  <div className="song-card-mobile-platforms" aria-label="重點平台摘要">
                    {mobileSummary.topBrands.length > 0 ? mobileSummary.topBrands.map(b => (
                      <span key={b.id} className="song-card-mobile-platform-chip" style={{ borderColor: `${b.color}66`, color: b.color }}>
                        <span className="song-card-mobile-platform-name">{b.shortName}</span>
                        <span>{getPlatformStatusLabel(song.brands?.[b.id], songVotes[song.id]?.[b.id])}</span>
                      </span>
                    )) : (
                      <span className="song-card-mobile-platform-chip is-muted">目前沒有平台摘要</span>
                    )}
                  </div>

                  <div className="song-card-mobile-actions">
                    {youtubeReferenceUrl ? (
                      <a
                        href={youtubeReferenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="song-card-mobile-action song-card-mobile-action-primary"
                      >
                        <Video size={16} />
                        <span>版本參考</span>
                      </a>
                    ) : null}

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleExpanded(song.id);
                      }}
                      className="song-card-mobile-action"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span>{isExpanded ? '收起平台狀態' : '查看各平台狀態'}</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="song-card-mobile-details" onClick={e => e.stopPropagation()}>
                      <div className="song-card-mobile-detail-list">
                        {mobileSummary.detailBrands.map(b => {
                          const status = song.brands?.[b.id];
                          const brandVote = songVotes[song.id]?.[b.id];
                          const available = isStatusAvailableWithCommunity(status, brandVote);
                          const mvLabel = getMvLabel(status, brandVote);

                          return (
                            <div key={b.id} className={`song-card-mobile-detail-row ${available ? 'is-available' : 'is-unavailable'}`}>
                              <div>
                                <strong style={{ color: b.color }}>{b.shortName}</strong>
                                <span>{available ? '有收錄參考' : '目前未見收錄'}</span>
                              </div>
                              <div className="song-card-mobile-detail-badges">
                                {available && shouldShowGuidedVocal(status, brandVote) && <span className="badge badge-guided-vocal">導唱</span>}
                                {available && mvLabel && (
                                  <span className={mvLabel === 'MV' ? 'badge badge-official-mv' : 'badge song-card-mobile-backing-badge'}>
                                    {mvLabel}
                                  </span>
                                )}
                                {!available && <span className="song-card-mobile-muted-mark">-</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <p className="song-card-mobile-detail-note">
                        本站整理公開資訊與歌友回報；列表標籤會參考「有」多於「沒有」的投票方向，現場仍以點歌系統為準。
                      </p>

                      <button
                        onClick={() => setReportingSong(song)}
                        className="song-card-mobile-report action-text-link"
                      >
                        <Flag size={13} />
                        <span>回報現場差異</span>
                      </button>
                    </div>
                  )}
                </article>

                {(index + 1) % 12 === 0 && (
                  <div style={{ gridColumn: '1 / -1', margin: '8px 0' }}>
                    <AdBannerSlot slotType="in_feed" />
                  </div>
                )}
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={song.id}>
              <div
                onClick={() => onSelectSongDetail(song)}
                className="glass-panel animate-fade-in song-list-click-target"
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
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: langStyle.bg,
                          color: langStyle.color,
                          border: `1px solid ${langStyle.border}`,
                          fontWeight: 700,
                          letterSpacing: '0.02em',
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
                      className={`heart-icon-btn action-icon ${isFav ? 'heart-active' : ''}`}
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
                      aria-label={isFav ? '從我的歌本移除' : '加入我的歌本'}
                      title={isFav ? '從我的歌本移除' : '加入我的歌本'}
                    >
                      <Heart size={18} fill={isFav ? 'var(--accent-pink)' : 'none'} className={isFav ? 'heart-pop-anim' : ''} />
                    </button>
                  </div>

                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    marginTop: '8px',
                    lineHeight: 1.4,
                  }}>
                    {getMeaningfulLyricsSnippet(song) && (
                      <p style={{
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                        marginTop: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        辨識提示：{getMeaningfulLyricsSnippet(song)}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                }}>
                  {displayBrands.map(b => {
                    const status = song.brands[b.id];
                    const brandVote = songVotes[song.id]?.[b.id];

                    if (!isStatusAvailableWithCommunity(status, brandVote)) {
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: b.color, fontSize: '0.85rem' }}>
                            {b.shortName}
                          </span>
                          {shouldShowOfficialMv(status, brandVote) && (
                            <span className="badge badge-official-mv" title="原始資料或歌友回報顯示畫面可能接近公開常見 MV，實際仍以現場點歌系統為準。" style={{ fontSize: '0.65rem', padding: '1px 5px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px', fontWeight: 700 }}>
                              MV
                            </span>
                          )}
                          {status?.mvType === 'reedited_mv' && (
                            <span className="badge" title="目前資料顯示現場畫面可能不是公開常見原版 MV，可能是伴唱帶、Live 或剪輯類型。" style={{ fontSize: '0.65rem', padding: '1px 5px', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '4px', fontWeight: 700 }}>
                              伴唱帶
                            </span>
                          )}
                          {shouldShowGuidedVocal(status, brandVote) && (
                            <span className="badge badge-guided-vocal" title="原始資料或歌友回報顯示此平台或版本可能提供導唱功能，實際以現場點歌系統為準。" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                              導唱
                            </span>
                          )}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--status-available-color)',
                        }}>
                          <CheckCircle2 size={16} color="var(--status-available-color)" />
                          <span className="status-label status-availability">有收錄</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  paddingTop: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {youtubeReferenceUrl ? (
                      <a
                        href={youtubeReferenceUrl}
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
                        <Video size={16} /> 版本參考
                      </a>
                    ) : null}

                    <button
                      onClick={e => { e.stopPropagation(); setReportingSong(song); }}
                      title="現場看到的收錄、導唱或 MV 類型和本站不同時，可提供回報線索。"
                      className="action-text-link"
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
                      回報現場差異
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectSongDetail(song)}
                    className="action-text-link"
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
                    台灣 KTV 門市收錄查詢 <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              {(index + 1) % 12 === 0 && (
                <div style={{ gridColumn: '1 / -1', margin: '8px 0' }}>
                  <AdBannerSlot slotType="in_feed" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {reportingSong && (
        <ReportModal song={reportingSong} onClose={() => setReportingSong(null)} />
      )}
    </>
  );
};
