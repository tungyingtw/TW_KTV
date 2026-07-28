import React, { useState } from 'react';
import { X, PlusCircle, Send, CheckCircle2, Video, Film, HelpCircle, Store, Music } from 'lucide-react';
import type { BrandId } from '../types/ktv';
import { BRAND_LIST } from '../data/brands';
import { submitReport } from '../services/communityService';

interface SuggestSongModalProps {
  onClose: () => void;
  initialTitle?: string;
}

export const SuggestSongModal: React.FC<SuggestSongModalProps> = ({ onClose, initialTitle = '' }) => {
  const [activeTab, setActiveTab] = useState<'song' | 'brand'>('song');

  // 1. 建議追加新歌曲 Form States
  const [songTitle, setSongTitle] = useState(initialTitle);
  const [artist, setArtist] = useState('');
  const [songCode, setSongCode] = useState('');
  const [brandId, setBrandId] = useState<BrandId | ''>('cashbox');
  const [lang, setLang] = useState('國語');
  const [lyricist, setLyricist] = useState('');
  const [composer, setComposer] = useState('');
  const [mvType, setMvType] = useState<'official' | 'edited' | 'unknown'>('official');
  const [note, setNote] = useState('');

  // 2. 建議追加 KTV 新廠牌 Form States
  const [brandName, setBrandName] = useState('');
  const [shortName, setShortName] = useState('');
  const [systemType, setSystemType] = useState('庭園/包廂伴唱系統');
  const [codeFormat, setCodeFormat] = useState('5位或6位數碼');
  const [storeLocations, setStoreLocations] = useState('');
  const [brandNote, setBrandNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (activeTab === 'song') {
      if (!songTitle.trim()) {
        setError('請填寫欲建議追加之歌名'); return;
      }
      if (!artist.trim()) {
        setError('請填寫歌手或樂團名稱'); return;
      }

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
    } else {
      // 建議追加 KTV 新廠牌/新系統
      if (!brandName.trim()) {
        setError('請填寫欲建議追加之 KTV 廠牌全名'); return;
      }

      setIsSubmitting(true);
      const result = await submitReport({
        songId: `brand_${Date.now()}`,
        songTitle: brandName.trim(),
        artist: 'KTV新廠牌建議',
        brandId: 'cashbox',
        issueType: 'suggest_new_brand',
        brandName: brandName.trim(),
        shortName: shortName.trim() || brandName.trim().slice(0, 4),
        systemType: systemType.trim() || '通用點歌系統',
        codeFormat: codeFormat.trim() || '數字編號',
        storeLocations: storeLocations.trim() || '全台門市',
        note: brandNote.trim(),
      });

      setIsSubmitting(false);
      if (result.success) {
        setSubmitted(true);
        setTimeout(onClose, 2200);
      } else {
        setError('送出失敗，請確認後端服務已開啟，或稍後再試');
      }
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
          width: '100%', maxWidth: '560px',
          maxHeight: '92vh', overflowY: 'auto',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          borderRadius: '18px',
          padding: '26px',
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
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              {activeTab === 'song' ? '感謝您的新歌建議！' : '感謝您的 KTV 新廠牌回報建議！'}
            </div>
            <div style={{ color: '#94a3b8', marginTop: '10px', fontSize: '0.92rem', lineHeight: 1.6 }}>
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
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.15rem' }}>
                  建議追加 (新歌曲 / KTV 廠牌對照)
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
                  請選擇欲建議追加的項目分類，填寫後直送管理後台審核
                </div>
              </div>
            </div>

            {/* Sub-Tab Navigation */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <button
                type="button"
                onClick={() => { setActiveTab('song'); setError(''); }}
                style={{
                  background: activeTab === 'song' ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                  border: `1px solid ${activeTab === 'song' ? '#fbbf24' : 'transparent'}`,
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: activeTab === 'song' ? '#fbbf24' : '#94a3b8',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Music size={16} /> 建議追加新歌曲
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('brand'); setError(''); }}
                style={{
                  background: activeTab === 'brand' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  border: `1px solid ${activeTab === 'brand' ? '#38bdf8' : 'transparent'}`,
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: activeTab === 'brand' ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Store size={16} /> 建議追加 KTV 新廠牌
              </button>
            </div>

            {/* TAB 1: 建議追加新歌曲 Form */}
            {activeTab === 'song' && (
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
                        boxSizing: 'border-box',
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
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: KTV點歌號 & 相關廠牌 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: '#fbbf24', marginBottom: '5px', fontWeight: 700 }}>
                      相關門市 / KTV 廠牌
                    </label>
                    <input
                      type="text"
                      value={songCode}
                      onChange={e => setSongCode(e.target.value)}
                      placeholder="例：45678 或 錢○:45678"
                      style={{
                        width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(251, 191, 36, 0.35)', borderRadius: '8px',
                        padding: '9px 12px', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: '#94a3b8', marginBottom: '5px', fontWeight: 600 }}>
                      相關 KTV 廠牌
                    </label>
                    <select
                      value={brandId}
                      onChange={e => setBrandId(e.target.value as BrandId)}
                      style={{
                        width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                        padding: '9px 12px', color: '#fff', fontSize: '0.88rem', cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      {BRAND_LIST.map(b => (
                        <option key={b.id} value={b.id} style={{ background: '#1e293b' }}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: MV 畫面類型標記 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', color: '#38bdf8', marginBottom: '6px', fontWeight: 700 }}>
                    現場包廂 MV 畫面類型
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
                        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      }}
                    >
                      <Video size={14} /> 官方原版 MV
                    </button>

                    <button
                      type="button"
                      onClick={() => setMvType('edited')}
                      style={{
                        background: mvType === 'edited' ? 'rgba(251, 146, 60, 0.22)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${mvType === 'edited' ? '#fb923c' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '8px', padding: '8px 6px',
                        color: mvType === 'edited' ? '#fb923c' : '#cbd5e1',
                        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      }}
                    >
                      <Film size={14} /> 剪輯/非原版 MV
                    </button>

                    <button
                      type="button"
                      onClick={() => setMvType('unknown')}
                      style={{
                        background: mvType === 'unknown' ? 'rgba(168, 85, 247, 0.22)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${mvType === 'unknown' ? '#c084fc' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '8px', padding: '8px 6px',
                        color: mvType === 'unknown' ? '#c084fc' : '#cbd5e1',
                        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      }}
                    >
                      <HelpCircle size={14} /> 尚未確認畫面
                    </button>
                  </div>
                </div>

                {/* Row 4: 語種 / 作詞 / 作曲 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                      🌐 語種分類
                    </label>
                    <select
                      value={lang}
                      onChange={e => setLang(e.target.value)}
                      style={{
                        width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
                        padding: '7px 8px', color: '#fff', fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      {['國語', '台語', '粵語', '陸歌', '日語', '韓語', '英語'].map(l => (
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
                        boxSizing: 'border-box',
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
                        boxSizing: 'border-box',
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
                    placeholder="例：在門市包廂點得到，此歌曲為2024全新專輯歌曲..."
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
            )}

            {/* TAB 2: 建議追加 KTV 新廠牌/新系統 Form */}
            {activeTab === 'brand' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: 'rgba(2, 132, 199, 0.12)',
                  border: '1px solid rgba(2, 132, 199, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.83rem',
                  color: '#e0f2fe',
                  lineHeight: 1.5,
                }}>
                  💡 <b>KTV 廠牌追加提示：</b> 發現全台有新開立的連鎖 KTV、獨立歡唱門市，或未收錄的營業型伴唱機（如：超級巨星、晴空點播...）？請在此回報，管理員審核後將第一時間建置其點歌碼對照欄位！
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
                        width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '8px',
                        padding: '9px 12px', color: '#fff', fontSize: '0.9rem',
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
                        width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                        padding: '9px 12px', color: '#fff', fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: 點歌系統類型 & 點歌號格式 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: '#94a3b8', marginBottom: '5px', fontWeight: 600 }}>
                      系統 / 伴唱機類型
                    </label>
                    <input
                      type="text"
                      value={systemType}
                      onChange={e => setSystemType(e.target.value)}
                      placeholder="例：庭園包廂點歌號 / 自助伴唱"
                      style={{
                        width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                        padding: '9px 12px', color: '#fff', fontSize: '0.88rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.83rem', color: '#94a3b8', marginBottom: '5px', fontWeight: 600 }}>
                      點歌碼格式範例
                    </label>
                    <input
                      type="text"
                      value={codeFormat}
                      onChange={e => setCodeFormat(e.target.value)}
                      placeholder="例：6位數 (如 581234)"
                      style={{
                        width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                        padding: '9px 12px', color: '#fff', fontSize: '0.88rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Row 3: 門市/區域分佈 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', color: '#94a3b8', marginBottom: '5px', fontWeight: 600 }}>
                    門市 / 主要據點分佈區域
                  </label>
                  <input
                    type="text"
                    value={storeLocations}
                    onChange={e => setStoreLocations(e.target.value)}
                    placeholder="例：台中/彰化地區連鎖門市"
                    style={{
                      width: '100%', background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                      padding: '9px 12px', color: '#fff', fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Row 4: 備註與官方網址 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
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
