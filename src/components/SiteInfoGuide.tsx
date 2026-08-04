import React, { useState } from 'react';
import { BookOpen, HelpCircle, Music2, ShieldAlert, ChevronDown, ChevronUp, Sliders, Disc, Mic2, Search, CheckCircle2, Heart, Vote } from 'lucide-react';

export const SiteInfoGuide: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'how_to_use' | 'articles' | 'faq'>('overview');
  const [activeArticleIndex, setActiveArticleIndex] = useState<number>(0);

  const articles = [
    {
      id: 'vocal-mv-guide',
      title: '原聲原唱 vs 人聲導唱 vs 伴奏切換完全解析',
      icon: Mic2,
      tag: '音軌切換指南',
      summary: '解密 KTV 門市伴唱機立體音軌與導唱切換原理，教您如何聽出歌手原音音軌。',
      content: [
        '在連鎖 KTV 門市歡唱時，許多歌友常困惑於「原聲原唱」與「人聲導唱」的差別。傳統伴唱機的導唱音軌主要利用立體聲左右聲道（L/R Channel）分離技術，將歌聲錄製在其中一個聲道；點歌機切換導唱時，系統會將包含人聲的聲道混合輸出。',
        '而真正的「原聲原唱（Original Track）」則是唱片公司直接提供原曲的多軌母帶人聲，歡唱時可以清晰聽到歌手原汁原味的聲線與呼吸細節，而非合聲老師或後製重錄的人聲。',
        '官方原版 MV（Official MV）則是唱片公司授權之官方拍攝影片，播放畫面為歌手親自演出之 MV，而非一般伴唱機常見的通用風景照或模特兒示範畫面，大幅提升包廂內的視覺歡唱氣氛。'
      ]
    },
    {
      id: 'system-licensing',
      title: '營業連鎖門市 vs 專業伴唱機系統 版權生態解密',
      icon: Disc,
      tag: '系統與版權',
      summary: '為什麼營業門市與電腦伴唱機的新歌上架時間不同？揭開公播授權與歌本發行機制。',
      content: [
        '全台伴唱系統主要分為兩大體系：一為「連鎖營業門市專用伴唱系統」；二為「家用與專業電腦伴唱機體系」。',
        '連鎖門市專用伴唱系統採用「連鎖營業公播授權」，新歌從唱片公司授權、門市伴唱機網路自動同步到門市專用影音資料庫的時間較短。',
        '家用與專業電腦伴唱機則需配合電腦伴唱機規格、卡拉OK晶片音源製作與每月歌本更新發行，因此在不同伴唱機品牌間，同一首新歌的上架發行時間點會有所差異。'
      ]
    },
    {
      id: 'pitch-key-tips',
      title: '歡唱技巧：男歌女唱與女歌男唱升降調 (Pitch/Key) 實用指南',
      icon: Sliders,
      tag: '練歌與調性',
      summary: '包廂歡唱如何調 Key 不變形？掌握男女聲調轉換黃金法則，輕鬆飆高音不鎖喉。',
      content: [
        '在包廂點唱異性歌手的歌曲時，盲目硬唱容易導致鎖喉或音準不佳。由於男女平均音域通常相差約 4 至 5 個半音（Half Steps），適當使用伴唱機的升降調（Key / Pitch Adjust）是發揮歌聲的關鍵。',
        '【男唱女歌建議】：建議將 Key 調降 3 至 4 個半音 (-3 ~ -4 Key)，或升 1 至 2 個半音 (+1 ~ +2 Key) 並降八度唱，這樣可以在舒適的中低音域展現磁性音調。',
        '【女唱男歌建議】：建議將 Key 升 3 至 4 個半音 (+3 ~ +4 Key)，讓旋律落在女聲自然明亮的真聲與混音發聲區間。'
      ]
    },
    {
      id: 'party-songs-guide',
      title: '熱門歡唱情境與合唱歌單分類推薦',
      icon: BookOpen,
      tag: '歡唱指南',
      summary: '包廂破冰開嗓、男女對唱金曲、飆高音紓壓等情境歌單心法。',
      content: [
        '歡唱聚會的成功關鍵在於氣氛的鋪陳與歌單的輪替。建議將歡唱過程分為三個階段：',
        '1. 【開嗓破冰期】：選擇節奏明快、傳唱度高的中速流行歌或台語經典，讓包廂全員快速進入歡唱狀態。',
        '2. 【氣氛高峰期】：安排男女經典對唱神曲、團體合唱爆紅曲或飆高音抒情歌曲，炒熱全場氣氛。',
        '3. 【尾聲暖心期】：歡唱結束前最後半小時，適合點選感性懷舊金曲或全員大合唱曲目，為聚會畫下完美句點。'
      ]
    }
  ];

  return (
    <section
      aria-label="全台 KTV 歌曲對照與歡唱知識指南"
      style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '24px auto',
        padding: '0 20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'var(--bg-glass, rgba(30, 41, 59, 0.6))',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          borderRadius: '16px',
          padding: '24px',
          color: 'var(--text-secondary, #cbd5e1)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: isExpanded ? '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' : 'none',
            paddingBottom: isExpanded ? '16px' : '0',
            marginBottom: isExpanded ? '20px' : '0',
            cursor: 'pointer',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #f8fafc)',
                }}
              >
                全台 KTV 歌曲對照與歡唱知識指南
              </h2>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted, #94a3b8)',
                }}
              >
                整合全台各大連鎖門市與營業型伴唱機系統之對照說明、原聲原唱標示與歡唱秘笈
              </p>
            </div>
          </div>

          <button
            style={{
              background: 'var(--bg-glass, rgba(255, 255, 255, 0.05))',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'var(--text-secondary, #cbd5e1)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {isExpanded ? (
              <>
                <span>收起指南</span>
                <ChevronUp size={16} />
              </>
            ) : (
              <>
                <span>閱讀完整指南</span>
                <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div>
            {/* Top Navigation Tabs (無圖示、一律保持純文字風格對齊) */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                paddingBottom: '12px',
                overflowX: 'auto',
              }}
            >
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'overview' ? '#38bdf8' : 'var(--bg-glass, rgba(255, 255, 255, 0.05))',
                  color: activeTab === 'overview' ? '#0f172a' : 'var(--text-secondary, #cbd5e1)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                廠牌收錄對照
              </button>

              <button
                onClick={() => setActiveTab('how_to_use')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'how_to_use' ? '#10b981' : 'var(--bg-glass, rgba(255, 255, 255, 0.05))',
                  color: activeTab === 'how_to_use' ? '#0f172a' : 'var(--text-secondary, #cbd5e1)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                系統操作指引與教學
              </button>

              <button
                onClick={() => setActiveTab('articles')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'articles' ? '#ec4899' : 'var(--bg-glass, rgba(255, 255, 255, 0.05))',
                  color: activeTab === 'articles' ? '#ffffff' : 'var(--text-secondary, #cbd5e1)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                KTV 歡唱知識學堂 (原創專題)
              </button>

              <button
                onClick={() => setActiveTab('faq')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'faq' ? '#f59e0b' : 'var(--bg-glass, rgba(255, 255, 255, 0.05))',
                  color: activeTab === 'faq' ? '#0f172a' : 'var(--text-secondary, #cbd5e1)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                常見問答 FAQ
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              {[
                { href: './how-to-use.html', label: '使用教學', desc: '搜尋、篩選與歌單整理方式' },
                { href: './data-source.html', label: '資料來源', desc: '公開資訊、回報與人工校對' },
                { href: './ktv-audio-types.html', label: '版本說明', desc: '原唱、導唱與 MV 標示差異' },
                { href: './community-verification.html', label: '社群驗證', desc: '收錄、原版 MV 與導唱投票說明' },
                { href: './faq.html', label: '常見問題', desc: '非官方聲明與資料準確度' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    background: 'var(--bg-glass, rgba(15, 23, 42, 0.45))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ color: '#38bdf8', fontSize: '0.86rem', fontWeight: 700, marginBottom: '2px' }}>
                    {link.label}
                  </div>
                  <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.76rem', lineHeight: 1.45 }}>
                    {link.desc}
                  </div>
                </a>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  fontSize: '0.88rem',
                  lineHeight: 1.65,
                }}
              >
                {/* Column 1: System Differences & Brands */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700 }}>
                    <Music2 size={18} />
                    <span>1. 跨廠牌收錄狀態與伴唱系統對照說明</span>
                  </div>
                  <p style={{ margin: 0 }}>
                    全台連鎖門市與自助式伴唱系統採用的曲庫與影音版本各不相同，主要包含 <strong>營業門市專用伴唱系統</strong> 以及 <strong>家用/專業電腦伴唱機體系</strong>。
                  </p>
                  <p style={{ margin: 0 }}>
                    本網站透過大眾共識校對與數據彙整，為歌友提供動態擴充的跨廠牌門市收錄對照，幫助您在歡唱前快速掌握現場是否有收錄該曲目。
                  </p>
                </div>

                {/* Column 2: Original Vocal & MV Explanation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', fontWeight: 700 }}>
                    <BookOpen size={18} />
                    <span>2. 原聲原唱與官方 MV 標示指引</span>
                  </div>
                  <p style={{ margin: 0 }}>
                    在 KTV 點歌時，「原聲原唱」與「官方原版 MV」是影響歡唱體驗的核心因素。
                  </p>
                  <ul style={{ paddingLeft: '18px', margin: 0 }}>
                    <li><strong>原聲原唱標示</strong>：代表該伴唱系統含有歌手原聲人聲導唱音軌，切換導唱時可聆聽原唱聲線。</li>
                    <li><strong>官方原版 MV 標示</strong>：代表該門市播放之畫面為唱片公司授權之官方拍攝原版影片，非風景照或通用模特兒畫面。</li>
                  </ul>
                </div>

                {/* Column 3: FAQ & Common Questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700 }}>
                    <HelpCircle size={18} />
                    <span>3. 社群校對與回報</span>
                  </div>
                  <p style={{ margin: 0 }}>
                    <strong>現場資訊校對</strong>：<br />
                    若現場點歌時發現門市歌曲收錄狀況有變更，可透過本站回報功能提供線索。系統會彙整使用者回饋，作為後續資料校正參考。
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: How to Use (系統操作指引與教學) */}
            {activeTab === 'how_to_use' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', fontSize: '0.88rem', lineHeight: 1.65 }}>
                <div style={{ background: 'var(--bg-glass, rgba(15, 23, 42, 0.5))', padding: '18px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, fontSize: '0.98rem', marginBottom: '8px' }}>
                    <Search size={18} />
                    <span>1. 快速搜尋與門市對照</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #cbd5e1)' }}>
                    在頂部搜尋欄輸入<strong>歌手名稱、歌名關鍵字或歌曲辨識線索</strong>，系統將自動即時比對各大 KTV 門市與伴唱系統之收錄狀態。您亦可點擊頂部廠牌頁籤快速篩選特定門市或伴唱機系統查看收錄狀況。
                  </p>
                </div>

                <div style={{ background: 'var(--bg-glass, rgba(15, 23, 42, 0.5))', padding: '18px', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', fontWeight: 700, fontSize: '0.98rem', marginBottom: '8px' }}>
                    <CheckCircle2 size={18} />
                    <span>2. 辨識原唱與導唱標示</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #cbd5e1)' }}>
                    歌曲卡片上標示 <strong>原唱</strong> 代表該伴唱系統保留歌手原聲音軌；標示 <strong>導唱</strong> 代表該系統可提供人聲導唱輔助。若未顯示標籤，代表目前資料尚未確認，實際狀態仍以現場設備為準。
                  </p>
                </div>

                <div style={{ background: 'var(--bg-glass, rgba(15, 23, 42, 0.5))', padding: '18px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, fontSize: '0.98rem', marginBottom: '8px' }}>
                    <Heart size={18} />
                    <span>3. 我的最愛口袋歌單</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #cbd5e1)' }}>
                    點擊歌曲愛心圖示可將歌曲加入<strong>「我的最愛」</strong>口袋歌單，方便您在歡唱時快速瀏覽個人專屬愛歌與比對各大門市收錄狀態。
                  </p>
                </div>

                <div style={{ background: 'var(--bg-glass, rgba(15, 23, 42, 0.5))', padding: '18px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7', fontWeight: 700, fontSize: '0.98rem', marginBottom: '8px' }}>
                    <Vote size={18} />
                    <span>4. 社群投票與資料回報</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #cbd5e1)' }}>
                    找不到欲點唱的歌曲？可透過「提供建議」送出歌曲線索。若在門市現場發現狀況有誤，亦可在歌曲詳情中透過「收錄對照、導唱功能、MV 類型」進行即時投票協助校對。
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Articles (Knowledge Hub) */}
            {activeTab === 'articles' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Article Sub-selector */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {articles.map((art, idx) => {
                    const isSelected = activeArticleIndex === idx;
                    return (
                      <button
                        key={art.id}
                        onClick={() => setActiveArticleIndex(idx)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #ec4899' : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                          background: isSelected ? 'rgba(236, 72, 153, 0.15)' : 'var(--bg-glass, rgba(15, 23, 42, 0.4))',
                          color: isSelected ? '#f472b6' : 'var(--text-muted, #94a3b8)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <span>{art.tag}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Article Detail */}
                {articles[activeArticleIndex] && (
                  <article
                    style={{
                      background: 'var(--bg-glass, rgba(15, 23, 42, 0.5))',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span
                        style={{
                          background: 'rgba(236, 72, 153, 0.2)',
                          color: '#ec4899',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {articles[activeArticleIndex].tag}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--text-primary, #f8fafc)',
                        marginTop: 0,
                        marginBottom: '12px',
                      }}
                    >
                      {articles[activeArticleIndex].title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#38bdf8', fontStyle: 'italic', marginBottom: '16px' }}>
                      說明：{articles[activeArticleIndex].summary}
                    </p>
                    <div style={{ fontSize: '0.88rem', lineHeight: 1.75, color: 'var(--text-secondary, #cbd5e1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {articles[activeArticleIndex].content.map((paragraph, pIdx) => (
                        <p key={pIdx} style={{ margin: 0 }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </article>
                )}
              </div>
            )}

            {/* Tab 4: FAQ */}
            {activeTab === 'faq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.88rem', lineHeight: 1.65 }}>
                <div style={{ background: 'var(--bg-glass, rgba(15, 23, 42, 0.4))', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))' }}>
                  <h4 style={{ color: '#f59e0b', margin: '0 0 6px 0', fontSize: '0.95rem' }}>
                    Q1：為什麼同一首歌在不同 KTV 門市的收錄狀況不一樣？
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #cbd5e1)' }}>
                    答：各大 KTV 門市與伴唱機廠牌版權授權進度與歌本目錄更新頻率不同，因此同一首歌曲在不同連鎖門市與伴唱系統中的收錄時間點有所差異。
                  </p>
                </div>

                <div style={{ background: 'var(--bg-glass, rgba(15, 23, 42, 0.4))', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))' }}>
                  <h4 style={{ color: '#f59e0b', margin: '0 0 6px 0', fontSize: '0.95rem' }}>
                    Q2：如何區分 KTV 門市的「原聲原唱」與「官方原版 MV」標示？
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #cbd5e1)' }}>
                    答：「原聲原唱」代表該伴唱系統包含歌手原聲人聲導唱音軌，切換導唱時可聆聽原唱聲線；「官方原版 MV」代表門市播放畫面為唱片公司授權之官方拍攝原版影片，非風景照或通用模特兒畫面。
                  </p>
                </div>

                <div style={{ background: 'var(--bg-glass, rgba(15, 23, 42, 0.4))', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))' }}>
                  <h4 style={{ color: '#f59e0b', margin: '0 0 6px 0', fontSize: '0.95rem' }}>
                    Q3：門市沒有收錄我想唱的歌曲該怎麼辦？
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #cbd5e1)' }}>
                    答：您可透過本站的「提供建議」或歌曲詳情中的回報功能送出線索。使用者回饋會作為後續資料校正參考。
                  </p>
                </div>

                <div style={{ background: 'var(--bg-glass, rgba(15, 23, 42, 0.4))', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))' }}>
                  <h4 style={{ color: '#f59e0b', margin: '0 0 6px 0', fontSize: '0.95rem' }}>
                    Q4：連鎖營業門市與家用/專業伴唱機系統有何差異？
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary, #cbd5e1)' }}>
                    答：連鎖營業門市專用伴唱系統採用連鎖營業公播授權，多包含唱片公司授權之原版 MV 與原音軌；家用與專業伴唱機則採用電腦伴唱規格與發行模式，歌冊目錄更新頻率與版權範圍各有不同。
                  </p>
                </div>
              </div>
            )}

            {/* Column 4: Disclaimer Summary */}
            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                fontSize: '0.82rem',
                color: 'var(--text-muted, #94a3b8)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <ShieldAlert size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>客觀對照與版權免責</strong>：本網站為民間獨立開發之非官方歌曲索引對照庫，非各大 KTV 連鎖門市或伴唱機製造商之官方網站。網站內記載之品牌與商標權均歸原註冊公司所有；影音連結均引用第三方公開平台（如 YouTube），本站不儲存任何音訊影片檔案。門市實體收錄狀態請以各門市現場點歌機器為準。
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
