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
  { value: 'wrong_info', label: '歌名、歌手或收錄狀態有誤' },
  { value: 'other',      label: '其他問題' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ song, onClose, defaultIssueType }) => {
  const brandList = useBrands();
  const [selectedBrand, setSelectedBrand] = useState<BrandId | ''>('');
  const [issueType, setIssueType] = useState<IssueType | ''>(defaultIssueType || 'no_song');
  const [note, setNote] = useState('');
  const [helperNickname, setHelperNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

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
      helperNickname: helperNickname.trim(),
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
      className="app-modal-overlay report-modal-overlay"
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
        className="app-modal-content report-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px',
          background: 'var(--bg-card, #1e293b)',
          color: 'var(--text-primary, #ffffff)',
          border: '1px solid var(--border-color, rgba(248, 113, 113, 0.3))',
          borderRadius: 'var(--radius-md, 14px)',
          padding: '22px',
          boxShadow: 'none',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="關閉回報表單"
          className="action-icon modal-close-button"
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'var(--bg-glass, rgba(255,255,255,0.08))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: 'var(--radius-sm, 8px)',
            width: '30px', height: '30px', color: 'var(--text-muted, #94a3b8)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle2 size={52} color="#4ade80" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>回報已送出</div>
            <div style={{ color: 'var(--text-secondary, #94a3b8)', marginTop: '8px', fontSize: '0.88rem' }}>
              已收到你的回報。這筆資料會作為人工整理與後續修正線索，不會立即覆蓋查詢結果。你的回報會幫助後續查詢更完整。
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <AlertTriangle size={20} color="currentColor" />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary, #fff)', fontSize: '1.05rem' }}>
                  回報現場差異
                </div>
                <div style={{ fontSize: '0.82rem', color: '#f472b6', marginTop: '2px', fontWeight: 600 }}>
                  《{song.title}》／{song.artist}
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
                    className={`modal-option-button ${issueType === opt.value ? 'is-selected' : ''}`}
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
                  <option value="" style={{ background: 'var(--bg-card, #1e293b)' }}>請選擇廠牌</option>
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
              <p style={{ margin: '0 0 0.45rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.82rem', lineHeight: 1.55 }}>
                請盡量提供歌名、歌手、KTV 平台或門市線索、現場看到的是有收錄或未收錄、是否有導唱，以及 MV 類型是原版 MV、伴唱帶、Live、剪輯或不確定。
              </p>
              <p style={{ margin: '0 0 0.55rem', color: 'var(--text-muted, #94a3b8)', fontSize: '0.78rem', lineHeight: 1.55 }}>
                回報內容會作為後續人工整理參考，不代表立即更新。請勿提供個資、內部資料，或不適合公開的截圖、音訊與影片檔；若資料互相衝突，後續需人工確認。
              </p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={300}
                placeholder="例如：某門市查得到但標示未收錄，或現場畫面不是原版 MV..."
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

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px', fontWeight: 600 }}>
                暱稱（選填）
              </label>
              <input
                type="text"
                value={helperNickname}
                onChange={e => setHelperNickname(e.target.value)}
                maxLength={24}
                placeholder="方便管理者辨識協助者，處理完成後會清除"
                style={{
                  width: '100%',
                  background: 'var(--bg-glass, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'var(--text-primary, #fff)',
                  fontSize: '0.88rem',
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
              className="btn-primary action-primary app-modal-submit"
              style={{
                width: '100%',
                background: isSubmitting ? 'rgba(219, 39, 119, 0.22)' : 'var(--accent-primary, #8052ff)',
                border: '1px solid var(--accent-primary, #8052ff)',
                borderRadius: 'var(--radius-sm, 8px)',
                padding: '11px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'none',
              }}
            >
              <Send size={16} />
              <span>{isSubmitting ? '送出中...' : '送出現場差異回報'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
