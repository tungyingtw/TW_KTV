import React, { useState } from 'react';
import { X, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import type { Song, BrandId, IssueType } from '../types/ktv';
import { useBrands } from '../hooks/useBrands';
import { submitReport } from '../services/communityService';

interface ReportModalProps {
  song: Song;
  onClose: () => void;
  defaultIssueType?: IssueType;
}

const ISSUE_OPTIONS: { value: IssueType; label: string }[] = [
  { value: 'no_song',    label: '實際上沒有這首歌（系統誤標為收錄）' },
  { value: 'has_song',   label: '實際上有這首歌（系統誤標為未收錄）' },
  { value: 'wrong_info', label: '歌名 / 歌手 / 收錄狀態有誤' },
  { value: 'other',      label: '其他問題' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ song, onClose, defaultIssueType }) => {
  const brandList = useBrands();
  const [selectedBrand, setSelectedBrand] = useState<BrandId | ''>('');
  const [issueType, setIssueType] = useState<IssueType | ''>(defaultIssueType || 'no_song');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // 支援 Esc 鍵優先關閉此二級彈窗
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!issueType) { setError('請選擇問題類型'); return; }
    if (!selectedBrand && issueType !== 'other') {
      setError('請選擇相關的 KTV 廠牌'); return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await submitReport({
      songId: song.id,
      songTitle: song.title,
      artist: song.artist,
      brandId: (selectedBrand || 'cashbox') as BrandId,
      issueType: issueType as IssueType,
      note,
      songSnapshot: song,
    });

    setIsSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } else {
      setError('送出失敗，請稍後再試');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 13000,
        background: 'var(--bg-overlay, rgba(15, 23, 42, 0.82))',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px',
          background: 'var(--bg-card, #1e293b)',
          color: 'var(--text-primary, #ffffff)',
          border: '1px solid var(--border-color, rgba(248, 113, 113, 0.3))',
          borderRadius: '16px',
          padding: '26px',
          boxShadow: 'var(--shadow-lg, 0 24px 60px rgba(0,0,0,0.6))',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="關閉回報表單"
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'var(--bg-glass, rgba(255,255,255,0.08))', border: 'none', borderRadius: '50%',
            width: '30px', height: '30px', color: 'var(--text-muted, #94a3b8)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle2 size={52} color="#4ade80" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>已收到您的回報</div>
            <div style={{ color: 'var(--text-secondary, #94a3b8)', marginTop: '8px', fontSize: '0.88rem' }}>
              感謝協助校對資料。我們會完成確認後更新網站內容。
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <AlertTriangle size={22} color="#f87171" />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary, #fff)', fontSize: '1.05rem' }}>
                  回報歌曲資料異常
                </div>
                <div style={{ fontSize: '0.82rem', color: '#f472b6', marginTop: '2px', fontWeight: 600 }}>
                  《{song.title}》— {song.artist}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '8px', fontWeight: 600 }}>
                異常類型 <span style={{ color: '#f87171' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ISSUE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIssueType(opt.value)}
                    style={{
                      background: issueType === opt.value
                        ? 'rgba(248, 113, 113, 0.18)' : 'var(--bg-glass, rgba(255,255,255,0.04))',
                      border: `1px solid ${issueType === opt.value ? '#f87171' : 'var(--border-color, rgba(255,255,255,0.08))'}`,
                      borderRadius: '8px',
                      padding: '9px 14px',
                      color: issueType === opt.value ? '#f87171' : 'var(--text-secondary, #cbd5e1)',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: issueType === opt.value ? 700 : 400,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {issueType !== 'other' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px', fontWeight: 600 }}>
                  相關 KTV 廠牌 <span style={{ color: '#f87171' }}>*</span>
                </label>
                <select
                  value={selectedBrand}
                  onChange={e => setSelectedBrand(e.target.value as BrandId)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: 'var(--text-primary, #fff)',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-card, #1e293b)' }}>── 請選擇廠牌 ──</option>
                  {brandList.map(b => (
                    <option key={b.id} value={b.id} style={{ background: 'var(--bg-card, #1e293b)' }}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px', fontWeight: 600 }}>
                補充說明
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={300}
                placeholder="例如：我在門市包廂點歌輸入歌名沒有搜出這首..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg-glass, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'var(--text-primary, #fff)',
                  fontSize: '0.88rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(248,113,113,0.15)',
                border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '14px',
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                width: '100%',
                background: isSubmitting ? 'rgba(248, 113, 113, 0.4)' : 'linear-gradient(135deg, #f87171, #ef4444)',
                border: 'none',
                borderRadius: '10px',
                padding: '11px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(248, 113, 113, 0.3)',
              }}
            >
              <Send size={16} />
              <span>{isSubmitting ? '送出中...' : '送出資料修正回報'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
