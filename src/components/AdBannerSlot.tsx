import React, { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerSlotProps {
  slotType?: 'header' | 'in_feed' | 'modal' | 'footer';
  adClient?: string;
  adSlot?: string;
  adFormat?: string;
  customBannerUrl?: string;
  targetUrl?: string;
}

export const AdBannerSlot: React.FC<AdBannerSlotProps> = ({
  slotType = 'in_feed',
  adClient = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-6322989670610668',
  adSlot = import.meta.env.VITE_ADSENSE_SLOT_INFEED || 'auto',
  adFormat = 'auto',
  customBannerUrl,
  targetUrl,
}) => {
  const isConfiguredAdSlot = Boolean(adClient && adSlot && adSlot !== 'auto');
  const bannerLink = targetUrl || '#';

  useEffect(() => {
    if (!isConfiguredAdSlot || typeof window === 'undefined') return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn('[AdSense] Push ad error:', error);
    }
  }, [isConfiguredAdSlot]);

  if (isConfiguredAdSlot) {
    return (
      <div style={{
        maxWidth: slotType === 'modal' ? '100%' : '1400px',
        margin: slotType === 'modal' ? '14px 0' : '8px auto 10px',
        padding: slotType === 'modal' ? '0' : '0 20px',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight: slotType === 'header' ? '56px' : '72px' }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  if (!customBannerUrl) return null;

  return (
    <div style={{
      maxWidth: slotType === 'modal' ? '100%' : '1400px',
      margin: slotType === 'modal' ? '14px 0' : '14px auto 18px',
      padding: slotType === 'modal' ? '0' : '0 20px',
      textAlign: 'center',
    }}>
      <div className="sponsor-banner-card" style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(236, 72, 153, 0.3)',
        borderRadius: '16px',
        padding: '12px 16px',
        minHeight: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        boxSizing: 'border-box',
        maxWidth: '100%',
      }}>
        <a href={bannerLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%' }}>
          <img src={customBannerUrl} alt="贊助內容" style={{ maxHeight: '75px', width: 'auto', borderRadius: '8px' }} />
        </a>
      </div>
    </div>
  );
};
