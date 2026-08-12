import React, { useState, useEffect, useMemo } from 'react';
import type { Song, SongVotes, BrandId } from '../types/ktv';
import { useBrands } from '../hooks/useBrands';
import { X, Heart, Video, CheckCircle2, Flag } from 'lucide-react';
import { BrandVoteBar } from './BrandVoteBar';
import { ReportModal } from './ReportModal';
import { fetchSongVotes } from '../services/communityService';
import { getLanguageStyle } from '../utils/languageStyle';
import { isBrandAvailable } from '../utils/brandAvailability';
import { getMeaningfulLyricsSnippet, getYoutubeReferenceUrl } from '../utils/songReference';
import { getMeaningfulComposer, getMeaningfulLyricist } from '../utils/songCredits';

interface SongDetailModalProps {
  song: Song | null;
  onClose: () => void;
  favorites: string[];
  onToggleFavorite: (songId: string) => void;
  brandSongCounts?: Record<BrandId, number>;
}

export const SongDetailModal: React.FC<SongDetailModalProps> = ({
  song,
  onClose,
  favorites,
  onToggleFavorite,
  brandSongCounts,
}) => {
  const brandList = useBrands();
  const [showReport, setShowReport] = useState(false);
  const [songVotes, setSongVotes] = useState<SongVotes>({});

  const sortedBrandList = useMemo(() => {
    if (!brandSongCounts) return brandList;
    return [...brandList].sort((a, b) => {
      const countA = brandSongCounts[a.id] || 0;
      const countB = brandSongCounts[b.id] || 0;
      return countB - countA;
    });
  }, [brandList, brandSongCounts]);

  // 開啟 modal 時載入該歌曲的社群投票資料
  useEffect(() => {
    if (!song) return;
    setSongVotes({});
    fetchSongVotes(song.id).then(votes => {
      setSongVotes(votes as SongVotes);
    });
  }, [song]);

  // 支援 Esc 鍵關閉（當子彈窗 showReport 未開啟時關閉）
  useEffect(() => {
    if (!song) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showReport) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [song, onClose, showReport]);

  if (!song) return null;

  const isFav = favorites.includes(song.id);

  // 規範語言標示顯示
  const displayLanguage = song.language || '流行曲目';
  const lyricist = getMeaningfulLyricist(song);
  const composer = getMeaningfulComposer(song);

  return (
    <>
      {/* 背景遮罩 - 點擊空白處關閉 */}
      <div
        className="song-detail-modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          zIndex: 12000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        {/* Modal 主容器 - 使用動態 CSS 主題變數支援日間/夜間雙切換 */}
        <div
          className="modal-content song-detail-modal-content"
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--modal-surface, #111827)',
            color: 'var(--text-primary, #ffffff)',
            borderRadius: 'var(--radius-lg, 20px)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'none',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            overflow: 'hidden',
          }}
        >
          {/* Scrollable Modal Content */}
          <div
            className="song-detail-modal-body"
            style={{
              width: '100%',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '24px',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            <button
              onClick={onClose}
              className="action-icon modal-close-button"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'var(--bg-glass, rgba(255, 255, 255, 0.08))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                borderRadius: 'var(--radius-sm, 8px)',
                width: '34px',
                height: '34px',
                color: 'var(--text-secondary, #cbd5e1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <X size={18} />
            </button>

            <div className="song-detail-modal-heading" style={{ paddingRight: '44px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {(() => {
                  const langStyle = getLanguageStyle(displayLanguage);
                  return (
                    <span
                      style={{
                        background: langStyle.bg,
                        color: langStyle.color,
                        border: `1px solid ${langStyle.border}`,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {displayLanguage}
                    </span>
                  );
                })()}
                {song.releaseYear && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                    {song.releaseYear} 年發行
                  </span>
                )}
              </div>

              <h2
                className="song-detail-title"
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: 'var(--text-primary, #ffffff)',
                  margin: '4px 0 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span>{song.title}</span>
                <button
                  onClick={() => onToggleFavorite(song.id)}
                  className="action-icon"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isFav ? 'var(--accent-pink, #ec4899)' : 'var(--text-muted, #64748b)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={isFav ? '已加入歌本' : '加入歌本'}
                >
                  <Heart size={24} fill={isFav ? 'var(--accent-pink, #ec4899)' : 'none'} />
                </button>
              </h2>

              <p style={{ fontSize: '1.05rem', color: 'var(--accent-pink, #ec4899)', fontWeight: 700, margin: '0 0 6px 0' }}>
                歌手：{song.artist}
              </p>

              {(lyricist || composer) && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                  {lyricist && <span>作詞：{lyricist}</span>}
                  {lyricist && composer && <span style={{ margin: '0 6px' }}>|</span>}
                  {composer && <span>作曲：{composer}</span>}
                </div>
              )}
            </div>

            {/* Song identification hint */}
            {getMeaningfulLyricsSnippet(song) ? (
              <div
                className="song-detail-note song-detail-note-lyrics"
                style={{
                  background: 'var(--bg-glass, rgba(15, 23, 42, 0.4))',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md, 14px)',
                  borderLeft: '4px solid var(--accent-pink, #ec4899)',
                  borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                  borderRight: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                  borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                  margin: '16px 0 12px 0',
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary, #cbd5e1)',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--accent-pink, #ec4899)', fontStyle: 'normal' }}>歌曲辨識提示：</span> {getMeaningfulLyricsSnippet(song)}
              </div>
            ) : (
              <div
                className="song-detail-note song-detail-note-muted"
                style={{
                  background: 'var(--bg-glass, rgba(255, 255, 255, 0.02))',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  border: '1px dashed var(--border-color, rgba(255, 255, 255, 0.1))',
                  margin: '16px 0 12px 0',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted, #94a3b8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>歌曲導引：可前往公開影音平台參考官方版本資訊</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-blue, #38bdf8)', fontWeight: 600 }}>[即時對照]</span>
              </div>
            )}

            {/* 歡唱建議與技巧提示 */}
            <div
              className="song-detail-info-box"
              style={{
                background: 'var(--bg-glass, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                borderRadius: 'var(--radius-md, 14px)',
                padding: '14px 16px',
                margin: '12px 0 16px 0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--accent-pink, #ec4899)',
                    background: 'rgba(236, 72, 153, 0.12)',
                    border: '1px solid rgba(236, 72, 153, 0.25)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  歡唱熱播
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--accent-amber, #f59e0b)',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  經典歌單
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.6 }}>
                歡唱提示：可在包廂點歌時利用伴唱機升降調按鍵調整 Key（男唱女歌建議降 3-4 調、女唱男歌建議升 3-4 調），搭配導唱或伴奏找到最適合自己的音域。
              </p>
            </div>

            {/* YouTube Link Banner */}
            {getYoutubeReferenceUrl(song) && (
              <a
                className="song-detail-youtube-link"
                href={getYoutubeReferenceUrl(song)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md, 14px)',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  margin: '12px 0 20px 0',
                  transition: 'all 0.2s ease',
                }}
              >
                <Video size={18} /> 前往 YouTube 參考官方版本
              </a>
            )}

            {/* 10 KTV Brands Availability Table */}
            <h4
              className="song-detail-section-title"
              style={{
                fontSize: '0.98rem',
                fontWeight: 700,
                color: 'var(--text-primary, #ffffff)',
                margin: '20px 0 12px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              各 KTV 收錄與版本狀態
            </h4>

            <div
              className="song-detail-brand-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              {sortedBrandList.map(b => {
                const status = song.brands[b.id];
                const brandVote = songVotes[b.id];

                if (!isBrandAvailable(status)) {
                  return (
                    <div
                      className="song-detail-brand-card is-unavailable"
                      key={b.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm, 10px)',
                        background: 'var(--bg-glass, rgba(255, 255, 255, 0.02))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                        opacity: 0.75,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, color: b.color, fontSize: '0.9rem' }}>{b.shortName}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>未收錄</span>
                      </div>
                      <BrandVoteBar songId={song.id} brandId={b.id} initialVote={brandVote} />
                    </div>
                  );
                }

                return (
                  <div
                    className="song-detail-brand-card is-available"
                    key={b.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm, 10px)',
                      background: b.badgeBg,
                      border: `1px solid ${b.color}44`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: b.color, fontSize: '0.9rem' }}>
                          {b.shortName}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                          {status.mvType === 'official_mv' && (
                            <span className="badge" style={{ fontSize: '0.6rem', padding: '0 4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px', fontWeight: 700 }}>
                              MV
                            </span>
                          )}
                          {status.mvType === 'reedited_mv' && (
                            <span className="badge" style={{ fontSize: '0.6rem', padding: '0 4px', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '4px', fontWeight: 700 }}>
                              伴唱帶
                            </span>
                          )}
                          {status.audioType === 'guided_vocal' && (
                            <span className="badge badge-guided-vocal" style={{ fontSize: '0.6rem', padding: '0 4px' }}>
                              導唱
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: b.color,
                        }}
                      >
                        <CheckCircle2 size={16} color={b.color} />
                        <span>有收錄</span>
                      </div>
                    </div>

                    <BrandVoteBar songId={song.id} brandId={b.id} initialVote={brandVote} />
                  </div>
                );
              })}
            </div>

            {/* 回報錯誤按鈕 */}
            <div className="song-detail-report-row" style={{ marginTop: '24px', borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', paddingTop: '16px' }}>
              <button
                onClick={() => setShowReport(true)}
                className="action-text-link report-action-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'var(--accent-amber, #fbbf24)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(251, 191, 36, 0.08)')}
              >
                <Flag size={16} />
                回報資料錯誤
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 400 }}>
                  （幫助我們讓資料更準確）
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <ReportModal song={song} onClose={() => setShowReport(false)} />
      )}
    </>
  );
};
