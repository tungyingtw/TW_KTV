import React, { useState, useEffect } from 'react';
import type { Song, SongVotes } from '../types/ktv';
import { BRAND_LIST } from '../data/brands';
import { X, Heart, Video, Sparkles, CheckCircle2, Flag } from 'lucide-react';
import { BrandVoteBar } from './BrandVoteBar';
import { ReportModal } from './ReportModal';
import { AdBannerSlot } from './AdBannerSlot';
import { fetchSongVotes } from '../services/communityService';

interface SongDetailModalProps {
  song: Song | null;
  onClose: () => void;
  favorites: string[];
  onToggleFavorite: (songId: string) => void;
}

export const SongDetailModal: React.FC<SongDetailModalProps> = ({
  song,
  onClose,
  favorites,
  onToggleFavorite,
}) => {
  const [showReport, setShowReport] = useState(false);
  const [songVotes, setSongVotes] = useState<SongVotes>({});

  // 開啟 modal 時載入該歌曲的社群投票資料
  useEffect(() => {
    if (!song) return;
    setSongVotes({});
    fetchSongVotes(song.id).then(votes => {
      setSongVotes(votes as SongVotes);
    });
  }, [song?.id]);

  if (!song) return null;

  const isFav = favorites.includes(song.id);

  return (
    <>
      {/* 背景遮罩 - 點擊空白處關閉 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        {/* Modal 主容器 */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              position: 'relative',
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
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

            {/* Song Header */}
            <div style={{ paddingRight: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-original-vocal" style={{ fontSize: '0.75rem' }}>
                  {song.language}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {song.releaseYear} 年發行
                </span>
              </div>

              <h2 style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: '#fff',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                {song.title}
                <button
                  onClick={() => onToggleFavorite(song.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isFav ? '#ec4899' : 'var(--text-muted)',
                  }}
                >
                  <Heart size={24} fill={isFav ? '#ec4899' : 'none'} />
                </button>
              </h2>

              <p style={{ fontSize: '1.05rem', color: 'var(--accent-pink)', fontWeight: 700, marginTop: '2px' }}>
                歌手：{song.artist}
              </p>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                作詞：{song.lyricist} | 作曲：{song.composer}
              </div>
            </div>

            {/* Lyrics Snippet */}
            {song.lyricsSnippet && !song.lyricsSnippet.includes('全台 10 大 KTV') ? (
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--accent-pink)',
                margin: '12px 0',
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}>
                "{song.lyricsSnippet}"
              </div>
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                margin: '12px 0',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px',
              }}>
                <span>歌詞導引：可點擊下方按鈕進行官方原唱/MV歌詞預覽</span>
                <span style={{ fontSize: '0.78rem', color: '#a855f7', fontWeight: 600 }}>[即時對照]</span>
              </div>
            )}

            {/* 歡唱建議與風格標籤 */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              margin: '12px 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                  {song.language || '流行曲目'}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ec4899', background: 'rgba(236, 72, 153, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                  歡唱熱播
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                  經典歌單
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                歡唱提示：可在包廂點歌時利用伴唱機升降調按鍵調整 Key（男唱女歌建議降 3-4 調、女唱男歌建議升 3-4 調），隨心切換原聲導唱體驗最佳音感。
              </p>
            </div>

            {/* YouTube Link Banner */}
            {song.youtubeUrl && (
              <a
                href={song.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  margin: '12px 0 20px',
                }}
              >
                <Video size={20} /> 在 YouTube 播放全曲及官方 MV 預覽
              </a>
            )}

            {/* 10 KTV Brands Availability Table */}
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Sparkles size={16} color="var(--accent-pink)" /> 全台各大 KTV 門市/廠牌收錄狀態：
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '12px',
            }}>
              {BRAND_LIST.map(b => {
                const status = song.brands[b.id];
                const brandVote = songVotes[b.id];

                if (!status || !status.available) {
                  return (
                    <div key={b.id} style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      opacity: 0.65,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, color: b.color, fontSize: '0.9rem' }}>{b.shortName}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>未收錄</span>
                      </div>
                      <BrandVoteBar songId={song.id} brandId={b.id} initialVote={brandVote} />
                    </div>
                  );
                }

                return (
                  <div key={b.id} style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: b.badgeBg,
                    border: `1px solid ${b.color}44`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: b.color, fontSize: '0.9rem' }}>
                          {b.shortName}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                          {status.mvType === 'official_mv' && (
                            <span className="badge badge-official-mv" style={{ fontSize: '0.6rem', padding: '0 4px' }}>
                              MV
                            </span>
                          )}
                          {status.audioType === 'original_vocal' && (
                            <span className="badge badge-original-vocal" style={{ fontSize: '0.6rem', padding: '0 4px' }}>
                              原唱
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: b.color,
                      }}>
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
            <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
              <button
                onClick={() => setShowReport(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#fbbf24',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,191,36,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(251,191,36,0.08)')}
              >
                <Flag size={14} />
                回報資料錯誤
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                  （幫助我們讓資料更準確）
                </span>
              </button>
            </div>

            {/* 廣告位專區 */}
            <div style={{ padding: '0 24px 16px' }}>
              <AdBannerSlot slotType="modal" />
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
