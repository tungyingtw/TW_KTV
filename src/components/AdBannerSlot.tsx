import React, { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerSlotProps {
  slotType?: 'header' | 'in_feed' | 'modal' | 'footer';
  adClient?: string; // 例: 'ca-pub-1234567890123456'
  adSlot?: string;   // 例: '9876543210'
  adFormat?: string; // 例: 'auto', 'fluid', 'rectangle'
  customBannerUrl?: string;
  targetUrl?: string;
}

export const AdBannerSlot: React.FC<AdBannerSlotProps> = ({
  slotType = 'in_feed',
  adClient = import.meta.env.VITE_ADSENSE_CLIENT_ID,
  adSlot = import.meta.env.VITE_ADSENSE_SLOT_INFEED,
  adFormat = 'auto',
  customBannerUrl,
  targetUrl,
}) => {
  const bannerLink = targetUrl || '#';
  const bannerImage = customBannerUrl;
  useEffect(() => {
    try {
      if (adClient && adSlot && typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn('[AdSense] Push ad error:', e);
    }
  }, [adClient, adSlot]);

  // 若提供真實的 Google AdSense 10 位數 adSlot 代碼，渲染 AdSense 標準 ins 標籤
  const isRealAdSlot = adClient && adSlot && adSlot !== 'auto' && /^\d+$/.test(adSlot);
  if (isRealAdSlot) {
    return (
      <div style={{
        maxWidth: slotType === 'modal' ? '100%' : '1400px',
        margin: slotType === 'modal' ? '14px 0' : '12px auto 16px',
        padding: slotType === 'modal' ? '0' : '0 20px',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '80px' }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // 預覽與展示型廣告 Banner（廣告展示示範狀態）
  return (
    <div style={{
      maxWidth: slotType === 'modal' ? '100%' : '1400px',
      margin: slotType === 'modal' ? '14px 0' : '14px auto 18px',
      padding: slotType === 'modal' ? '0' : '0 20px',
      textAlign: 'center',
    }}>
      <div className="ad-slot-container" style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(236, 72, 153, 0.3)',
        borderRadius: '16px',
        padding: '14px 20px',
        minHeight: '75px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        boxSizing: 'border-box',
        maxWidth: '100%',
      }}>
        {/* AD 標記 */}
        <span style={{
          position: 'absolute', top: '6px', right: '10px',
          fontSize: '0.65rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.08)',
          padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          📢 廣告招商中 AD SLOT
        </span>

        {bannerImage ? (
          <a href={bannerLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%' }}>
            <img src={bannerImage} alt="贊助廣告" style={{ maxHeight: '75px', width: 'auto', borderRadius: '8px' }} />
          </a>
        ) : (
          <>
            {/* 左側廣告內文 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
              <div style={{
                fontSize: '1.8rem', background: 'rgba(168, 85, 247, 0.15)',
                padding: '8px 12px', borderRadius: '12px', flexShrink: 0,
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}>
                📢
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {slotType === 'header' && '【廣告贊助位 #1 頂部黃金區】Google AdSense 審核與品牌招募中'}
                  {slotType === 'in_feed' && '【廣告贊助位 #2 列表熱區】Google AdSense 審核與品牌招募中'}
                  {slotType === 'modal' && '【廣告贊助位 #3 歌曲詳細頁】Google AdSense 審核與品牌招募中'}
                  {slotType === 'footer' && '【廣告贊助位 #4 頁尾專區】Google AdSense 審核與品牌招募中'}
                  <span style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    ⏳ 審核/招商中
                  </span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px' }}>
                  精準觸及全台 KTV 歡唱聚會歌友族群！此欄位正開放 Google 廣告與品牌贊助合作
                </div>
              </div>
            </div>

            {/* 右側行動按鈕 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <button 
                onClick={() => alert('此廣告欄位目前為審核與招商預留狀態。已串接 Google AdSense 規格，審核通過或設定 adSlot 代碼後將自動投遞正式廣告！')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                廣告位說明 ℹ️
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
