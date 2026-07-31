import React, { useState } from 'react';
import { X, PlusCircle, Send, CheckCircle2, Music2, Building2 } from 'lucide-react';
import type { BrandId } from '../types/ktv';
import { BRAND_LIST } from '../data/brands';
import { submitSuggestSong, submitSuggestBrand } from '../services/communityService';

interface SuggestSongModalProps {
  onClose: () => void;
  defaultTab?: 'song' | 'brand';
}

const languageOptions = ['國語', '台語', '粵語', '英語', '日語', '韓語', '陸歌'];

export const SuggestSongModal: React.FC<SuggestSongModalProps> = ({ onClose, defaultTab = 'song' }) => {
  const [activeTab, setActiveTab] = useState<'song' | 'brand'>(defaultTab);

  // 支援 Esc 鍵關閉彈窗
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lyricist, setLyricist] = useState('');
  const [composer, setComposer] = useState('');
  const [language, setLanguage] = useState('國語');
  const [brandId, setBrandId] = useState<BrandId>('cashbox');
  const [hasOfficialMv, setHasOfficialMv] = useState(true);
  const [hasOriginalVocal, setHasOriginalVocal] = useState(true);
  const [lyricsSnippet, setLyricsSnippet] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [brandName, setBrandName] = useState('');
  const [shortName, setShortName] = useState('');
  const [systemType, setSystemType] = useState('');
  const [codeFormat, setCodeFormat] = useState('');
  const [storeLocations, setStoreLocations] = useState('');
  const [brandNote, setBrandNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (activeTab === 'song') {
      if (!title.trim() || !artist.trim()) {
        setError('請填寫歌名與歌手名稱');
        return;
      }

      setIsSubmitting(true);
      const res = await submitSuggestSong({
        title: title.trim(),
        artist: artist.trim(),
        lyricist: lyricist.trim(),
        composer: composer.trim(),
        language,
        brandId,
        hasOfficialMv,
        hasOriginalVocal,
        lyricsSnippet: lyricsSnippet.trim(),
        youtubeUrl: youtubeUrl.trim(),
      });
      setIsSubmitting(false);

      if (res.success) {
        setSubmitted(true);
        setTimeout(onClose, 2500);
      } else {
        setError(res.error || '送出失敗，請稍後再試');
      }
      return;
    }

    if (!brandName.trim()) {
      setError('請填寫 KTV 廠牌或門市體系名稱');
      return;
    }

    setIsSubmitting(true);
    const res = await submitSuggestBrand({
      brandName: brandName.trim(),
      shortName: shortName.trim() || brandName.trim().substring(0, 4),
      systemType: systemType.trim() || '通用伴唱系統',
      codeFormat: codeFormat.trim() || '未提供',
      storeLocations: storeLocations.trim() || '未提供',
      note: brandNote.trim(),
    });
    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
      setTimeout(onClose, 2500);
    } else {
      setError(res.error || '送出失敗，請稍後再試');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9100,
        background: 'var(--bg-overlay, rgba(15, 23, 42, 0.75))',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={event => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--bg-card, #1e293b)',
          color: 'var(--text-primary, #ffffff)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
          borderRadius: '18px',
          padding: '26px',
          boxShadow: 'var(--shadow-lg, 0 24px 60px rgba(0,0,0,0.65))',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="關閉建議表單"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--bg-glass, rgba(255,255,255,0.08))',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <CheckCircle2 size={56} color="#4ade80" style={{ margin: '0 auto 14px' }} />
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>
              {activeTab === 'song' ? '已收到您的歌曲建議' : '已收到您的 KTV 廠牌建議'}
            </div>
            <div style={{ color: 'var(--text-secondary, #94a3b8)', marginTop: '10px', fontSize: '0.92rem', lineHeight: 1.6 }}>
              感謝提供資料。我們會完成資料確認後，再更新至網站可查詢內容。
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <PlusCircle size={22} color="#fbbf24" />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary, #fff)', fontSize: '1.15rem' }}>
                  提供資料建議
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                  找不到歌曲或發現新的 KTV 廠牌時，可以在這裡提供線索。
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: 'var(--bg-glass, rgba(255, 255, 255, 0.05))',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '20px',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            }}>
              <button
                onClick={() => setActiveTab('song')}
                style={{
                  background: activeTab === 'song' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                  color: activeTab === 'song' ? '#fff' : 'var(--text-secondary, #cbd5e1)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '9px 12px',
                  fontWeight: activeTab === 'song' ? 700 : 500,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Music2 size={16} /> 新歌曲
              </button>

              <button
                onClick={() => setActiveTab('brand')}
                style={{
                  background: activeTab === 'brand' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                  color: activeTab === 'brand' ? '#fff' : 'var(--text-secondary, #cbd5e1)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '9px 12px',
                  fontWeight: activeTab === 'brand' ? 700 : 500,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Building2 size={16} /> KTV 廠牌
              </button>
            </div>

            {activeTab === 'song' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-primary, #fff)', marginBottom: '5px', fontWeight: 700 }}>
                      歌名 <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={event => setTitle(event.target.value)}
                      placeholder="例：烏梅子醬"
                      style={inputStyle()}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-primary, #fff)', marginBottom: '5px', fontWeight: 700 }}>
                      歌手 <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={artist}
                      onChange={event => setArtist(event.target.value)}
                      placeholder="例：李榮浩"
                      style={inputStyle()}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '5px', fontWeight: 600 }}>
                      對應 KTV 廠牌
                    </label>
                    <select
                      value={brandId}
                      onChange={event => setBrandId(event.target.value as BrandId)}
                      style={{ ...inputStyle(), cursor: 'pointer' }}
                    >
                      {BRAND_LIST.map(brand => (
                        <option key={brand.id} value={brand.id} style={{ background: 'var(--bg-card, #1e293b)' }}>
                          {brand.shortName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={smallLabelStyle()}>歌曲語種</label>
                    <select
                      value={language}
                      onChange={event => setLanguage(event.target.value)}
                      style={{ ...inputStyle(), cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      {languageOptions.map(option => (
                        <option key={option} value={option} style={{ background: 'var(--bg-card, #1e293b)' }}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={smallLabelStyle()}>作詞者（選填）</label>
                    <input type="text" value={lyricist} onChange={event => setLyricist(event.target.value)} placeholder="例：李榮浩" style={{ ...inputStyle(), fontSize: '0.85rem' }} />
                  </div>

                  <div>
                    <label style={smallLabelStyle()}>作曲者（選填）</label>
                    <input type="text" value={composer} onChange={event => setComposer(event.target.value)} placeholder="例：李榮浩" style={{ ...inputStyle(), fontSize: '0.85rem' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', margin: '4px 0', flexWrap: 'wrap' }}>
                  <label style={checkboxLabelStyle()}>
                    <input type="checkbox" checked={hasOfficialMv} onChange={event => setHasOfficialMv(event.target.checked)} style={{ accentColor: '#ec4899', width: '16px', height: '16px' }} />
                    有官方原版 MV
                  </label>

                  <label style={checkboxLabelStyle()}>
                    <input type="checkbox" checked={hasOriginalVocal} onChange={event => setHasOriginalVocal(event.target.checked)} style={{ accentColor: '#8b5cf6', width: '16px', height: '16px' }} />
                    支援原聲原唱
                  </label>
                </div>

                <div>
                  <label style={smallLabelStyle()}>歌曲辨識提示（選填）</label>
                  <textarea
                    value={lyricsSnippet}
                    onChange={event => setLyricsSnippet(event.target.value)}
                    maxLength={200}
                    placeholder="可填寫容易辨識的歌曲線索，請勿貼上歌詞正文"
                    rows={2}
                    style={textareaStyle()}
                  />
                </div>

                <div>
                  <label style={smallLabelStyle()}>MV 或歌曲參考網址（選填）</label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={event => setYoutubeUrl(event.target.value)}
                    placeholder="例：https://www.youtube.com/watch?v=..."
                    style={{ ...inputStyle(), fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'brand' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.83rem',
                  color: 'var(--text-primary, #e0f2fe)',
                  lineHeight: 1.5,
                }}>
                  發現未收錄的連鎖 KTV、獨立歡唱門市或伴唱系統時，可提供名稱、系統類型與主要據點，方便後續整理。
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: '#38bdf8', marginBottom: '5px', fontWeight: 700 }}>
                      KTV 廠牌 / 門市體系名稱 <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input type="text" value={brandName} onChange={event => setBrandName(event.target.value)} placeholder="例：晴空歡唱連鎖 KTV" style={inputStyle('rgba(56, 189, 248, 0.35)')} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: '#f472b6', marginBottom: '5px', fontWeight: 700 }}>
                      顯示簡稱
                    </label>
                    <input type="text" value={shortName} onChange={event => setShortName(event.target.value)} placeholder="例：晴空" style={inputStyle()} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={smallLabelStyle()}>系統 / 伴唱機類型</label>
                    <input type="text" value={systemType} onChange={event => setSystemType(event.target.value)} placeholder="例：自助伴唱系統" style={inputStyle()} />
                  </div>

                  <div>
                    <label style={smallLabelStyle()}>曲庫 / 版本線索</label>
                    <input type="text" value={codeFormat} onChange={event => setCodeFormat(event.target.value)} placeholder="例：原版 MV 較多、導唱版本完整" style={inputStyle()} />
                  </div>
                </div>

                <div>
                  <label style={smallLabelStyle()}>門市 / 主要據點區域</label>
                  <input type="text" value={storeLocations} onChange={event => setStoreLocations(event.target.value)} placeholder="例：台中、彰化地區" style={inputStyle()} />
                </div>

                <div>
                  <label style={smallLabelStyle()}>備註或官方網址（選填）</label>
                  <textarea
                    value={brandNote}
                    onChange={event => setBrandNote(event.target.value)}
                    maxLength={300}
                    placeholder="可補充官方網站、門市資訊或實際看到的點歌系統特色"
                    rows={2}
                    style={textareaStyle()}
                  />
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(248,113,113,0.12)',
                border: '1px solid rgba(248,113,113,0.35)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#f87171',
                fontSize: '0.85rem',
                marginTop: '14px',
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                width: '100%',
                background: isSubmitting
                  ? 'rgba(251,191,36,0.3)'
                  : (activeTab === 'song' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #0284c7, #0369a1)'),
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '18px',
                boxShadow: activeTab === 'song' ? '0 4px 15px rgba(245, 158, 11, 0.3)' : '0 4px 15px rgba(2, 132, 199, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              <Send size={16} />
              {isSubmitting ? '送出中...' : (activeTab === 'song' ? '送出歌曲建議' : '送出 KTV 廠牌建議')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const inputStyle = (borderColor = 'var(--border-color, rgba(255, 255, 255, 0.15))', color = 'var(--text-primary, #fff)', fontWeight = 400): React.CSSProperties => ({
  width: '100%',
  background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
  border: `1px solid ${borderColor}`,
  borderRadius: '8px',
  padding: '9px 12px',
  color,
  fontSize: '0.9rem',
  fontWeight,
  boxSizing: 'border-box',
});

const smallLabelStyle = (): React.CSSProperties => ({
  display: 'block',
  fontSize: '0.8rem',
  color: 'var(--text-secondary, #94a3b8)',
  marginBottom: '4px',
  fontWeight: 600,
});

const checkboxLabelStyle = (): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.85rem',
  color: 'var(--text-secondary, #cbd5e1)',
  cursor: 'pointer',
});

const textareaStyle = (): React.CSSProperties => ({
  width: '100%',
  background: 'var(--bg-glass, rgba(255,255,255,0.04))',
  border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
  borderRadius: '8px',
  padding: '8px 10px',
  color: 'var(--text-primary, #fff)',
  fontSize: '0.85rem',
  resize: 'vertical',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
});
