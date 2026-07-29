import React, { useState } from 'react';
import { X, PlusCircle, Send, CheckCircle2, Music2, Building2 } from 'lucide-react';
import type { BrandId } from '../types/ktv';
import { BRAND_LIST } from '../data/brands';
import { submitSuggestSong, submitSuggestBrand } from '../services/communityService';

interface SuggestSongModalProps {
  onClose: () => void;
  defaultTab?: 'song' | 'brand';
}

export const SuggestSongModal: React.FC<SuggestSongModalProps> = ({ onClose, defaultTab = 'song' }) => {
  const [activeTab, setActiveTab] = useState<'song' | 'brand'>(defaultTab);

  // 1. 新歌曲建議表單欄位
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lyricist, setLyricist] = useState('');
  const [composer, setComposer] = useState('');
  const [language, setLanguage] = useState('國語');
  const [songCode, setSongCode] = useState('');
  const [brandId, setBrandId] = useState<BrandId>('cashbox');
  const [hasOfficialMv, setHasOfficialMv] = useState(true);
  const [hasOriginalVocal, setHasOriginalVocal] = useState(true);
  const [lyricsSnippet, setLyricsSnippet] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // 2. KTV 新廠牌/門市對照建議表單欄位
  const [brandName, setBrandName] = useState('');
  const [shortName, setShortName] = useState('');
  const [systemType, setSystemType] = useState('');
  const [codeFormat, setCodeFormat] = useState('');
  const [storeLocations, setStoreLocations] = useState('');
  const [brandNote, setBrandNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // 提交建議處理
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
        songCode: songCode.trim(),
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
        setError(res.error || '提交失敗，請檢查後端連線');
      }
    } else {
      if (!brandName.trim()) {
        setError('請填寫 KTV 廠牌或門市體系名稱');
        return;
      }
      setIsSubmitting(true);
      const res = await submitSuggestBrand({
        brandName: brandName.trim(),
        shortName: shortName.trim() || brandName.trim().substring(0, 4),
        systemType: systemType.trim() || '通用點歌系統',
        codeFormat: codeFormat.trim() || '標準6位數點歌碼',
        storeLocations: storeLocations.trim() || '全台營業門市',
        note: brandNote.trim(),
      });
      setIsSubmitting(false);
      if (res.success) {
        setSubmitted(true);
        setTimeout(onClose, 2500);
      } else {
        setError(res.error || '提交失敗，請檢查後端連線');
      }
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 220,
        background: 'var(--bg-overlay, rgba(15, 23, 42, 0.75))',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '560px',
          maxHeight: '92vh', overflowY: 'auto',
          background: 'var(--bg-card, #1e293b)',
          color: 'var(--text-primary, #ffffff)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
          borderRadius: '18px',
          padding: '26px',
          boxShadow: 'var(--shadow-lg, 0 24px 60px rgba(0,0,0,0.65))',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'var(--bg-glass, rgba(255,255,255,0.08))',
            border: 'none', borderRadius: '50%',
            width: '32px', height: '32px',
            color: 'var(--text-muted, #94a3b8)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        {submitted ? (
          /* 送出成功視窗 */
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <CheckCircle2 size={56} color="#4ade80" style={{ margin: '0 auto 14px' }} />
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>
              {activeTab === 'song' ? '感謝您的新歌建議！' : '感謝您的 KTV 新廠牌回報建議！'}
            </div>
            <div style={{ color: 'var(--text-secondary, #94a3b8)', marginTop: '10px', fontSize: '0.92rem', lineHeight: 1.6 }}>
              管理後台已收到您的資料。<br />
              審核與資料庫對照完成後，將自動上架發布！
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <PlusCircle size={22} color="#fbbf24" />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary, #fff)', fontSize: '1.15rem' }}>
                  建議追加 (新歌曲 / KTV 廠牌對照)
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                  請選擇欲建議追加的項目分類，填寫後直送管理後台審核
                </div>
              </div>
            </div>

            {/* Sub-Tab Navigation */}
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
                <Music2 size={16} /> 建議追加新歌曲
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
                <Building2 size={16} /> 回報未收錄 KTV 廠牌
              </button>
            </div>

            {/* TAB 1: 建議追加新歌曲 */}
            {activeTab === 'song' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Row 1: 歌名 & 歌手 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-primary, #fff)', marginBottom: '5px', fontWeight: 700 }}>
                      歌名 <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="例：烏梅子醬"
                      style={{
                        width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))', borderRadius: '8px',
                        padding: '9px 12px', color: 'var(--text-primary, #fff)', fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-primary, #fff)', marginBottom: '5px', fontWeight: 700 }}>
                      演唱歌手 <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={artist}
                      onChange={e => setArtist(e.target.value)}
                      placeholder="例：李榮浩"
                      style={{
                        width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))', borderRadius: '8px',
                        padding: '9px 12px', color: 'var(--text-primary, #fff)', fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: 點歌代碼 & 相關廠牌 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: '#fbbf24', marginBottom: '5px', fontWeight: 700 }}>
                      點歌代碼（選填）
                    </label>
                    <input
                      type="text"
                      value={songCode}
                      onChange={e => setSongCode(e.target.value)}
                      placeholder="例：45678 或 錢○:45678"
                      style={{
                        width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                        border: '1px solid rgba(251, 191, 36, 0.35)', borderRadius: '8px',
                        padding: '9px 12px', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '5px', fontWeight: 600 }}>
                      對應 KTV 廠牌
                    </label>
                    <select
                      value={brandId}
                      onChange={e => setBrandId(e.target.value as BrandId)}
                      style={{
                        width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))', borderRadius: '8px',
                        padding: '9px 12px', color: 'var(--text-primary, #fff)', fontSize: '0.88rem',
                        cursor: 'pointer', boxSizing: 'border-box',
                      }}
                    >
                      {BRAND_LIST.map(b => (
                        <option key={b.id} value={b.id} style={{ background: 'var(--bg-card, #1e293b)' }}>
                          {b.shortName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: 填寫語種與創作者 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '4px', fontWeight: 600 }}>
                      歌曲語種
                    </label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      style={{
                        width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))', borderRadius: '8px',
                        padding: '8px 10px', color: 'var(--text-primary, #fff)', fontSize: '0.85rem',
                        cursor: 'pointer', boxSizing: 'border-box',
                      }}
                    >
                      <option value="國語" style={{ background: 'var(--bg-card, #1e293b)' }}>國語</option>
                      <option value="台語" style={{ background: 'var(--bg-card, #1e293b)' }}>台語</option>
                      <option value="粵語" style={{ background: 'var(--bg-card, #1e293b)' }}>粵語</option>
                      <option value="英語" style={{ background: 'var(--bg-card, #1e293b)' }}>英語</option>
                      <option value="日語" style={{ background: 'var(--bg-card, #1e293b)' }}>日語</option>
                      <option value="韓語" style={{ background: 'var(--bg-card, #1e293b)' }}>韓語</option>
                      <option value="陸歌" style={{ background: 'var(--bg-card, #1e293b)' }}>陸歌</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '4px', fontWeight: 600 }}>
                      作詞者 (選填)
                    </label>
                    <input
                      type="text"
                      value={lyricist}
                      onChange={e => setLyricist(e.target.value)}
                      placeholder="例：李榮浩"
                      style={{
                        width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))', borderRadius: '8px',
                        padding: '8px 10px', color: 'var(--text-primary, #fff)', fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '4px', fontWeight: 600 }}>
                      作曲者 (選填)
                    </label>
                    <input
                      type="text"
                      value={composer}
                      onChange={e => setComposer(e.target.value)}
                      placeholder="例：李榮浩"
                      style={{
                        width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))', borderRadius: '8px',
                        padding: '8px 10px', color: 'var(--text-primary, #fff)', fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Checkbox MV 與原唱標籤 */}
                <div style={{ display: 'flex', gap: '20px', margin: '4px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary, #cbd5e1)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasOfficialMv}
                      onChange={e => setHasOfficialMv(e.target.checked)}
                      style={{ accentColor: '#ec4899', width: '16px', height: '16px' }}
                    />
                    🎥 擁有官方原版 MV
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary, #cbd5e1)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasOriginalVocal}
                      onChange={e => setHasOriginalVocal(e.target.checked)}
                      style={{ accentColor: '#8b5cf6', width: '16px', height: '16px' }}
                    />
                    🎙️ 支援原聲原唱音軌
                  </label>
                </div>

                {/* 歌詞摘要 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '4px', fontWeight: 600 }}>
                    副歌經典歌詞片段（輔助精準搜尋）
                  </label>
                  <textarea
                    value={lyricsSnippet}
                    onChange={e => setLyricsSnippet(e.target.value)}
                    maxLength={200}
                    placeholder="例：你立在雨中像一朵烏梅子醬..."
                    rows={2}
                    style={{
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
                    }}
                  />
                </div>

                {/* MV 網址 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '4px', fontWeight: 600 }}>
                    MV 線上預覽網址 (YouTube / Bilibili)
                  </label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="例：https://www.youtube.com/watch?v=..."
                    style={{
                      width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))', borderRadius: '8px',
                      padding: '8px 10px', color: 'var(--text-primary, #fff)', fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: 回報未收錄 KTV 新廠牌 */}
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
                  <b>KTV 廠牌追加提示：</b> 發現全台有新開立的連鎖 KTV、獨立歡唱門市，或未收錄的營業型伴唱機（如：超○巨星、晴空點播...）？請在此回報，管理員審核後將第一時間建置其點歌碼對照欄位！
                </div>

                {/* Row 1: 廠牌全名 & 簡稱 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: '#38bdf8', marginBottom: '5px', fontWeight: 700 }}>
                      KTV 廠牌/連鎖體系全名 <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={e => setBrandName(e.target.value)}
                      placeholder="例：晴空歡唱連鎖 KTV"
                      style={{
                        width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                        border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '8px',
                        padding: '9px 12px', color: 'var(--text-primary, #fff)', fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: '#f472b6', marginBottom: '5px', fontWeight: 700 }}>
                      顯示簡稱
                    </label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={e => setShortName(e.target.value)}
                      placeholder="例：晴空"
                      style={{
                        width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))', borderRadius: '8px',
                        padding: '9px 12px', color: 'var(--text-primary, #fff)', fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: 點歌系統類型 & 點歌號格式 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '5px', fontWeight: 600 }}>
                      系統 / 伴唱機類型
                    </label>
                    <input
                      type="text"
                      value={systemType}
                      onChange={e => setSystemType(e.target.value)}
                      placeholder="例：庭園包廂點歌系統 / 自助伴唱"
                      style={{
                        width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))', borderRadius: '8px',
                        padding: '9px 12px', color: 'var(--text-primary, #fff)', fontSize: '0.88rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '5px', fontWeight: 600 }}>
                      點歌碼格式範例
                    </label>
                    <input
                      type="text"
                      value={codeFormat}
                      onChange={e => setCodeFormat(e.target.value)}
                      placeholder="例：6位數 (如 581234)"
                      style={{
                        width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))', borderRadius: '8px',
                        padding: '9px 12px', color: 'var(--text-primary, #fff)', fontSize: '0.88rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Row 3: 門市/區域分佈 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '5px', fontWeight: 600 }}>
                    門市 / 主要據點分佈區域
                  </label>
                  <input
                    type="text"
                    value={storeLocations}
                    onChange={e => setStoreLocations(e.target.value)}
                    placeholder="例：台中/彰化地區連鎖門市"
                    style={{
                      width: '100%', background: 'var(--bg-input, rgba(15, 23, 42, 0.6))',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))', borderRadius: '8px',
                      padding: '9px 12px', color: 'var(--text-primary, #fff)', fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Row 4: 備註與官方網址 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '4px', fontWeight: 600 }}>
                    備註說明或官方網址（選填）
                  </label>
                  <textarea
                    value={brandNote}
                    onChange={e => setBrandNote(e.target.value)}
                    maxLength={300}
                    placeholder="例：此廠牌目前在台中大里與逢甲有門市，使用的點歌機系統選單非常現代化..."
                    rows={2}
                    style={{
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
                    }}
                  />
                </div>
              </div>
            )}

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
                background: isSubmitting 
                  ? 'rgba(251,191,36,0.3)' 
                  : (activeTab === 'song' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #0284c7, #0369a1)'),
                border: 'none', borderRadius: '10px',
                padding: '12px',
                color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginTop: '18px',
                boxShadow: activeTab === 'song' ? '0 4px 15px rgba(245, 158, 11, 0.3)' : '0 4px 15px rgba(2, 132, 199, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              <Send size={16} />
              {isSubmitting 
                ? '正在寫入後台審核區...' 
                : (activeTab === 'song' ? '送出新歌建議至後台審核' : '送出 KTV 新廠牌建議至後台審核')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
