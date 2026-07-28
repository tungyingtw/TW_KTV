import React, { useState } from 'react';
import { X, PlusCircle, Send, CheckCircle2, Video, Film, HelpCircle } from 'lucide-react';
import type { BrandId } from '../types/ktv';
import { BRAND_LIST } from '../data/brands';
import { submitReport } from '../services/communityService';

interface SuggestSongModalProps {
  onClose: () => void;
  initialTitle?: string;
}

export const SuggestSongModal: React.FC<SuggestSongModalProps> = ({ onClose, initialTitle = '' }) => {
  const [songTitle, setSongTitle] = useState(initialTitle);
  const [artist, setArtist] = useState('');
  const [songCode, setSongCode] = useState('');
  const [brandId, setBrandId] = useState<BrandId | ''>('cashbox');
  const [lang, setLang] = useState('國語');
  const [lyricist, setLyricist] = useState('');
  const [composer, setComposer] = useState('');
  const [mvType, setMvType] = useState<'official' | 'edited' | 'unknown'>('official');
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!songTitle.trim()) {
      setError('請填寫欲建議之歌名'); return;
    }
    if (!artist.trim()) {
      setError('請填寫歌手或樂團名稱'); return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await submitReport({
      songId: `suggest_${Date.now()}`,
      songTitle: songTitle.trim(),
      artist: artist.trim(),
      brandId: (brandId || 'cashbox') as BrandId,
      issueType: 'missing_song',
      lang,
      songCode: songCode.trim() || undefined,
      lyricist: lyricist.trim() || undefined,
      composer: composer.trim() || undefined,
      mvType,
      note,
    });

    setIsSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      setTimeout(onClose, 2200);
    } else {
      setError('送出失敗，請確認後端服務已開啟，或稍後再試');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 220,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '540px',
          maxHeight: '92vh', overflowY: 'auto',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.65), 0 0 35px rgba(251,191,36,0.18)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', color: '#94a3b8',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        {submitted ? (
          /* 送出成功視窗 */
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <CheckCircle2 size={56} color="#4ade80" style={{ margin: '0 auto 14px' }} />
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>感謝您的建議與新歌提供！</div>
            <div style={{ color: '#94a3b8', marginTop: '10px', fontSize: '0.92rem', lineHeight: 1.6 }}>
              管理後台已收到您的結構化資料（含 MV 類型與點歌編號）。<br />
              審核通過後，該歌曲將自動寫入全台歌庫！
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PlusCircle size={22} color="#fbbf24" />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.15rem' }}>
                  ➕ 建議 / 許願新增遺漏歌曲
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
                  提供您在現場點得到但本站尚未收錄的新歌或遺漏歌曲資訊
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Row 1: 歌名 & 歌手 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', color: '#fbbf24', marginBottom: '5px', fontWeight: 700 }}>
                    歌名 <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={e => setSongTitle(e.target.value)}
                    placeholder="例：回到那一天"
                    style={{
                      width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                      padding: '9px 12px', color: '#fff', fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', color: '#fbbf24', marginBottom: '5px', fontWeight: 700 }}>
                    歌手 / 樂團 <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={e => setArtist(e.target.value)}
                    placeholder="例：五月天"
                    style={{
                      width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                      padding: '9px 12px', color: '#fff', fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              {/* Row 2: KTV點歌號 & 相關廠牌 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', color: '#fbbf24', marginBottom: '5px', fontWeight: 700 }}>
                    🔢 KTV 點歌號 / 編號
                  </label>
                  <input
                    type="text"
                    value={songCode}
                    onChange={e => setSongCode(e.target.value)}
                    placeholder="例：45678 或 錢櫃:45678"
                    style={{
                      width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(251, 191, 36, 0.35)', borderRadius: '8px',
                      padding: '9px 12px', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', color: '#94a3b8', marginBottom: '5px', fontWeight: 600 }}>
                    📍 相關 KTV 廠牌
                  </label>
                  <select
                    value={brandId}
                    onChange={e => setBrandId(e.target.value as BrandId)}
                    style={{
                      width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                      padding: '9px 12px', color: '#fff', fontSize: '0.88rem', cursor: 'pointer',
                    }}
                  >
                    {BRAND_LIST.map(b => (
                      <option key={b.id} value={b.id} style={{ background: '#1e293b' }}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: MV 畫面類型標記 (重點升級!) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', color: '#38bdf8', marginBottom: '6px', fontWeight: 700 }}>
                  🎬 現場包廂 MV 畫面類型
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setMvType('official')}
                    style={{
                      background: mvType === 'official' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${mvType === 'official' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px', padding: '8px 6px',
                      color: mvType === 'official' ? '#38bdf8' : '#cbd5e1',
                      fontSize: '0.8rem', fontWeight: mvType === 'official' ? 700 : 500,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Video size={13} /> 原版 MV
                  </button>

                  <button
                    type="button"
                    onClick={() => setMvType('edited')}
                    style={{
                      background: mvType === 'edited' ? 'rgba(251, 146, 60, 0.22)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${mvType === 'edited' ? '#fb923c' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px', padding: '8px 6px',
                      color: mvType === 'edited' ? '#fb923c' : '#cbd5e1',
                      fontSize: '0.8rem', fontWeight: mvType === 'edited' ? 700 : 500,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Film size={13} /> 風景/剪輯
                  </button>

                  <button
                    type="button"
                    onClick={() => setMvType('unknown')}
                    style={{
                      background: mvType === 'unknown' ? 'rgba(148, 163, 184, 0.22)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${mvType === 'unknown' ? '#94a3b8' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px', padding: '8px 6px',
                      color: mvType === 'unknown' ? '#f1f5f9' : '#94a3b8',
                      fontSize: '0.8rem', fontWeight: mvType === 'unknown' ? 700 : 500,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <HelpCircle size={13} /> 不確定
                  </button>
                </div>
              </div>

              {/* Row 4: 語種 / 作詞 / 作曲 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    🌐 語種
                  </label>
                  <select
                    value={lang}
                    onChange={e => setLang(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
                      padding: '7px 8px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer',
                    }}
                  >
                    {['國語', '台語', '粵語', '陸歌', '日語', '韓語', '英語', '其他'].map(l => (
                      <option key={l} value={l} style={{ background: '#1e293b' }}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    ✍️ 作詞 (選填)
                  </label>
                  <input
                    type="text"
                    value={lyricist}
                    onChange={e => setLyricist(e.target.value)}
                    placeholder="例：阿信"
                    style={{
                      width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
                      padding: '7px 8px', color: '#fff', fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    🎼 作曲 (選填)
                  </label>
                  <input
                    type="text"
                    value={composer}
                    onChange={e => setComposer(e.target.value)}
                    placeholder="例：怪獸"
                    style={{
                      width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
                      padding: '7px 8px', color: '#fff', fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              {/* Row 5: 補充說明 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  💬 補充說明（選填）
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  maxLength={300}
                  placeholder="例：在西門門市包廂點得到，此歌曲為2024全新原聲帶專輯歌曲..."
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)',
                borderRadius: '8px', padding: '8px 12px', color: '#f87171',
                fontSize: '0.85rem', marginTop: '14px',
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                width: '100%',
                background: isSubmitting ? 'rgba(251,191,36,0.3)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none', borderRadius: '10px',
                padding: '12px',
                color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginTop: '18px',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              <Send size={16} />
              {isSubmitting ? '正在寫入後台審核區...' : '送出新歌建議至後台審核'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
