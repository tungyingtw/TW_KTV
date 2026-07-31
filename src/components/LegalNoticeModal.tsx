import React, { useState } from 'react';
import { ShieldCheck, FileText, Info, Mail, X } from 'lucide-react';

interface LegalNoticeModalProps {
  initialTab?: 'privacy' | 'terms' | 'about' | 'contact';
  onClose: () => void;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'about' | 'contact'>(initialTab);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-notice-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg-overlay, rgba(15, 23, 42, 0.75))',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card, #1e293b)',
          color: 'var(--text-primary, #f8fafc)',
          borderRadius: 'var(--radius-lg, 16px)',
          width: '100%',
          maxWidth: '780px',
          height: 'min(760px, calc(100vh - 32px))',
          maxHeight: 'calc(100vh - 32px)',
          minHeight: 'min(620px, calc(100vh - 32px))',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg, 0 20px 50px rgba(0, 0, 0, 0.4))',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          <div>
            <h3 id="legal-notice-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>
              關於本站與法律條款 (Terms & Privacy Policy)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
              Taiwan KTV Song Catalog — Legal Notices & Compliance Policy
            </p>
          </div>
          <button
            aria-label="關閉"
            onClick={onClose}
            style={{
              background: 'var(--bg-glass, rgba(255, 255, 255, 0.05))',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'var(--text-secondary, #94a3b8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            backgroundColor: 'var(--bg-glass, rgba(15, 23, 42, 0.2))',
            padding: '0 16px',
            overflowX: 'auto',
            minHeight: '48px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setActiveTab('privacy')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'privacy' ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
              borderBottom: activeTab === 'privacy' ? '2px solid #38bdf8' : '2px solid transparent',
              fontWeight: activeTab === 'privacy' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
            }}
          >
            <ShieldCheck size={16} /> 隱私權政策 (Privacy)
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'terms' ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
              borderBottom: activeTab === 'terms' ? '2px solid #38bdf8' : '2px solid transparent',
              fontWeight: activeTab === 'terms' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
            }}
          >
            <FileText size={16} /> 免責聲明與條款 (Terms)
          </button>

          <button
            onClick={() => setActiveTab('about')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'about' ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
              borderBottom: activeTab === 'about' ? '2px solid #38bdf8' : '2px solid transparent',
              fontWeight: activeTab === 'about' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
            }}
          >
            <Info size={16} /> 關於本站 (About)
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'contact' ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
              borderBottom: activeTab === 'contact' ? '2px solid #38bdf8' : '2px solid transparent',
              fontWeight: activeTab === 'contact' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
            }}
          >
            <Mail size={16} /> 聯絡我們 (Contact)
          </button>
        </div>

        {/* Modal Body Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            fontSize: '0.92rem',
            lineHeight: 1.7,
            color: 'var(--text-secondary, #cbd5e1)',
          }}
        >
          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: 'var(--text-primary, #f8fafc)', margin: '0 0 4px 0', fontSize: '1.1rem' }}>
                隱私權保護政策 (Privacy Policy)
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', margin: '0 0 12px 0' }}>
                Last Updated: July 2026 | Effective for all global users & web crawlers
              </p>

              <h5 style={{ color: '#38bdf8', margin: '8px 0 4px 0' }}>1. 資料收集與個人資訊保護 (Information Collection)</h5>
              <p>
                本網站非常重視您的隱私權。我們不強制使用者進行帳號註冊，亦不收集任何個人身份辨識資料（如姓名、身分證字號、真實住址等）。
              </p>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)', background: 'var(--bg-glass, rgba(255,255,255,0.03))', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                <b>English Summary:</b> We highly respect your privacy. This website does not require mandatory account registration and does not collect personally identifiable information (PII).
              </div>

              <h5 style={{ color: '#38bdf8', margin: '12px 0 4px 0' }}>2. Cookies、本機快取與廣告技術 (Cookies, Local Storage & Ads)</h5>
              <p>
                為了提供秒開與快取搜尋體驗，本網站會使用 HTML5 LocalStorage 與 IndexedDB 在您的本機瀏覽器中儲存歌曲快取與「我的最愛」歌單。本網站配合 Google AdSense 聯播網廣告；Google 與第三方廣告技術供應商可能會使用 Cookie、網路信標、IP 位址或其他識別碼，依使用者造訪本網站與其他網站或應用程式的情形提供、衡量及改善廣告服務。
              </p>
              <p>
                關於 Google 如何使用合作夥伴網站或應用程式中的資料，請參閱 <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>Google 合作夥伴網站資料使用說明</a>。使用者亦可透過 Google 廣告設定或瀏覽器設定管理個人化廣告、Cookie 與追蹤偏好。
              </p>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)', background: 'var(--bg-glass, rgba(255,255,255,0.03))', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                <b>English Summary:</b> We use HTML5 LocalStorage and IndexedDB for local caching and song catalog indexing. Google and third-party ad technology providers may use cookies, web beacons, IP addresses, or other identifiers to serve, measure, and improve ads.
              </div>

              <h5 style={{ color: '#38bdf8', margin: '12px 0 4px 0' }}>3. 訪客統計與資料用途 (Analytics & Data Use)</h5>
              <p>
                本網站使用自建伺服器端匿名訪客統計（以裝置 UUID 識別，不關聯個人身份），以了解網站使用人數。統計資料僅用於網站營運優化，不作為個人身份辨識用途。
              </p>

              <h5 style={{ color: '#38bdf8', margin: '12px 0 4px 0' }}>4. 外部連結與第三方宣告 (Third-Party Links)</h5>
              <p>
                本網站包含導向第三方公開平台（如 YouTube 官方頻道）之超連結。第三方網站擁有獨立之隱私權政策，本網站不承擔外部網站之連帶責任。
              </p>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)', background: 'var(--bg-glass, rgba(255,255,255,0.03))', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                <b>English Summary:</b> Our service contains links to third-party sites (e.g., YouTube official channels). These external platforms operate under separate privacy policies, and we assume no liability for third-party practices.
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: 'var(--text-primary, #f8fafc)', margin: '0 0 4px 0', fontSize: '1.1rem' }}>
                免責聲明與服務條款 (Terms of Service & Legal Disclaimer)
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', margin: '0 0 12px 0' }}>
                Non-Official Independent Reference Platform Compliance Policy
              </p>

              <h5 style={{ color: '#f59e0b', margin: '8px 0 4px 0' }}>1. 第三方非官方獨立平台聲明 (Independent Platform Statement)</h5>
              <p>
                本網站為<strong>民間社群獨立開發維護之客觀歌曲索引與對照平台</strong>，非任何 KTV 伴唱業者（包括但不限於錢○、好○迪、享○馨、星○點、Sing○、V-M○X、超○巨星、音○、金○、弘○等）之官方網站或營利附屬機構。本網站與上述任何連鎖業者及伴唱機品牌無商業隸屬或官方授權關係。
              </p>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)', background: 'var(--bg-glass, rgba(255,255,255,0.03))', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                <b>English Summary:</b> This platform is an independent, non-official community song catalog reference index. It is not affiliated with, endorsed by, or commercially connected to any commercial karaoke brand or hardware manufacturer.
              </div>

              <h5 style={{ color: '#f59e0b', margin: '12px 0 4px 0' }}>2. 商標權與品牌宣告 (Trademarks & Copyrights)</h5>
              <p>
                本網站提及之所有公司名稱、KTV 門市品牌、伴唱機廠牌名稱及商標標誌，其財產權與商標權均<strong>完全歸屬於原註冊公司及權利人所有</strong>。本網站僅出於資訊客觀對照、便於民眾個人歌唱檢索之合理使用目的進行載錄，且一律實施圓圈遮蔽 (`○`) 保護。
              </p>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)', background: 'var(--bg-glass, rgba(255,255,255,0.03))', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                <b>English Summary:</b> All product names, logos, and registered trademarks displayed belong strictly to their respective corporate owners. Brand names are masked for trademark protection under fair use.
              </div>

              <h5 style={{ color: '#f59e0b', margin: '12px 0 4px 0' }}>3. 音樂影音與著作權聲明 (Audio/Video Copyright Compliance)</h5>
              <p>
                本網站<strong>不儲存、上傳、託管或散佈任何未經授權之 MP3、MP4 音訊、影片檔案或盜版影音資源</strong>。網站內展示之官方 MV 影片連結，均來自第三方公開影音平台（如 YouTube 官方頻道）之標準嵌入或超連結，版權均屬原唱片公司、創作者及原發布平台所有。
              </p>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)', background: 'var(--bg-glass, rgba(255,255,255,0.03))', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                <b>English Summary:</b> We do NOT host, store, stream, or distribute copyrighted MP3/MP4 audio or video files. All media previews utilize standard embeds or hyperlinks directly to third-party public platforms (e.g., YouTube official channels).
              </div>

              <h5 style={{ color: '#f59e0b', margin: '12px 0 4px 0' }}>4. 門市數據精準度與現場機器免責 (On-Site Accuracy Disclaimer)</h5>
              <p>
                本網站之門市收錄狀態為大眾共識校對與公開目錄整理，僅供社群歡唱前之輔助查詢。因各大 KTV 門市伴唱機器之維護狀況及即時更新進度不一，<strong>現場實際點唱與收錄狀況請一律以各門市點歌系統機器為準</strong>。
              </p>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)', background: 'var(--bg-glass, rgba(255,255,255,0.03))', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                <b>English Summary:</b> Store song availability data is crowdsourced for informational purposes. Actual song availability is subject to physical karaoke machine systems on site.
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: 'var(--text-primary, #f8fafc)', margin: '0 0 8px 0', fontSize: '1.1rem' }}>
                關於「台灣 KTV 歌曲對照查詢網」 (About This Site)
              </h4>
              <p>
                「台灣 KTV 歌曲對照查詢網」成立旨在解決廣大歌友在全台各大 KTV 連鎖門市歡唱時，常遇到「找不到原聲原唱」及「不確定現場門市有無收錄」等痛點。
              </p>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)', background: 'var(--bg-glass, rgba(255,255,255,0.03))', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                <b>English Summary:</b> Taiwan KTV Song Catalog is a crowdsourced reference directory helping users cross-check song availability, original vocals, and official MVs across top karaoke venue systems.
              </div>

              <h5 style={{ color: '#10b981', margin: '8px 0 4px 0' }}>核心特色 (Key Features)</h5>
              <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
                <li><strong>跨廠牌門市對照</strong>：整合全台各大連鎖門市與伴唱機系統之動態歌曲對照目錄。</li>
                <li><strong>原版 MV 與原聲原唱標示</strong>：明確註記歌曲是否提供原聲原唱或官方 MV 影音參考。</li>
                <li><strong>眾包共識與現場勘誤</strong>：提供現場歌友實時參與歌曲收錄與對照勘誤回報。</li>
              </ul>
            </div>
          )}

          {activeTab === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: 'var(--text-primary, #f8fafc)', margin: '0 0 8px 0', fontSize: '1.1rem' }}>
                聯絡我們 (Contact Us)
              </h4>
              <p>
                感謝您使用「台灣 KTV 歌曲對照查詢網」！若您有任何意見建議、資料勘誤、合作提案或著作權聯繫，歡迎透過下方公用信箱與我們聯繫：
              </p>

              <div
                style={{
                  background: 'var(--bg-glass, rgba(15, 23, 42, 0.6))',
                  border: '1px solid var(--border-color, rgba(56, 189, 248, 0.25))',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                    公用聯絡信箱 (Public Contact Email)
                  </div>
                  <a
                    href="mailto:tyfunlab@gmail.com"
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: '#38bdf8',
                      textDecoration: 'none',
                    }}
                  >
                    tyfunlab@gmail.com
                  </a>
                </div>
              </div>

              <h5 style={{ color: '#38bdf8', margin: '8px 0 4px 0' }}>主要服務與聯繫範疇 (Service Scope)</h5>
              <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
                <li><strong>品牌合作與廣告贊助 (Sponsorship & Ads)</strong>：歡迎相關歡唱品牌與活動贊助洽詢。</li>
                <li><strong>歌曲收錄與數據勘誤 (Data Correction)</strong>：現場點唱數據異動聯繫。</li>
                <li><strong>權益與技術交流 (Copyright & Tech Inquiry)</strong>：著作權通知與技術反饋。</li>
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            backgroundColor: 'var(--bg-glass, rgba(15, 23, 42, 0.6))',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)',
            }}
          >
            我已了解 (Understood)
          </button>
        </div>
      </div>
    </div>
  );
};
