import React, { useState } from 'react';
import { BookOpen, HelpCircle, Music2, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

export const SiteInfoGuide: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <section
      aria-label="全台 KTV 歌曲對照與點歌攻略指南"
      style={{
        maxWidth: '1400px',
        margin: '32px auto 20px auto',
        padding: '0 20px',
      }}
    >
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          color: 'var(--text-secondary, #cbd5e1)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Title Header with Expand/Collapse Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
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
                全台 KTV 歌曲對照與點歌攻略指南
              </h2>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted, #94a3b8)',
                }}
              >
                收錄 錢櫃、好樂迪、享溫馨、星聚點、超級巨星、音圓、金嗓等 10 大廠牌對照說明
              </p>
            </div>
          </div>

          <button
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'var(--text-secondary, #cbd5e1)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
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

        {/* Expandable Crawlable Content */}
        {isExpanded && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              fontSize: '0.88rem',
              lineHeight: 1.65,
            }}
          >
            {/* Column 1: System Differences & Brands */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700 }}>
                <Music2 size={18} />
                <span>1. 全台 10 大伴唱機廠牌對照說明</span>
              </div>
              <p style={{ margin: 0 }}>
                全台連鎖 KTV 與自助式伴唱系統使用的點歌系統主要分為 **連鎖門市專用伴唱系統**（如錢櫃 Cashbox、好樂迪 Holiday、享溫馨 Enjoy KTV、星聚點等）以及 **家用/專業電腦伴唱機**（如音圓 InYuan、金嗓 Golden Voice、弘音等）。
              </p>
              <p style={{ margin: 0 }}>
                本網站透過大眾共識校對，為歌友整理跨廠牌的歌曲代碼與收錄對照，幫助您在不同場地歡唱時能快速輸入點歌代碼。
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
                <li>**原聲原唱標示**：代表該伴唱系統含有歌手原聲人聲導唱音軌，切換導唱時可聆聽原唱聲線。</li>
                <li>**官方原版 MV 標示**：代表該門市播放之畫面為唱片公司授權之官方拍攝原版影片，非風景照或通用模特兒畫面。</li>
              </ul>
            </div>

            {/* Column 3: FAQ & Common Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700 }}>
                <HelpCircle size={18} />
                <span>3. 點歌常識與 FAQ</span>
              </div>
              <p style={{ margin: 0 }}>
                **問：為什麼同一首歌在錢櫃與好樂迪的點歌號碼不一樣？**<br />
                答：各大 KTV 門市伴唱機使用的編碼規則與資料庫架構不同，因此同一首歌曲在不同廠牌的電腦點歌機中皆有獨立對應的歌號。
              </p>
              <p style={{ margin: 0 }}>
                **問：門市沒有收錄該首歌怎麼辦？**<br />
                答：您可利用本站的「無歌/補件回報」功能進行登記，共識演算法將自動彙整數據供社群參考。
              </p>
            </div>

            {/* Column 4: Disclaimer Summary */}
            <div
              style={{
                gridColumn: '1 / -1',
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.82rem',
                color: 'var(--text-muted, #94a3b8)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <ShieldAlert size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                **客觀對照與版權免責**：本網站為民間獨立開發之非官方歌曲索引對照庫，非各大 KTV 連鎖門市或伴唱機製造商之官方網站。網站內記載之品牌與商標權均歸原註冊公司所有；影音連結均引用第三方公開平台（如 YouTube），本站不儲存任何音訊影片檔案。門市實體收錄狀態與代碼請以各門市現場機器為準。
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
