import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Info, Mail, X } from 'lucide-react';

type LegalTab = 'privacy' | 'terms' | 'about' | 'contact';

interface LegalNoticeModalProps {
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  initialTab = 'terms',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  // 支援 Esc 鍵關閉彈窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="app-modal-overlay legal-modal-overlay"
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
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="legal-modal"
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
          className="legal-modal-header"
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
          <div className="legal-modal-heading">
            <h3 id="legal-notice-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>
              關於本站與使用說明
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
              了解網站用途、資料處理方式與聯絡管道。
            </p>
          </div>
          <button
            className="action-icon modal-close-button legal-modal-close-button"
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
          className="legal-modal-tabs"
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
            className={`legal-modal-tab ${activeTab === 'privacy' ? 'is-selected' : ''}`}
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
            <ShieldCheck size={16} /> 隱私權政策
          </button>

          <button
            className={`legal-modal-tab ${activeTab === 'terms' ? 'is-selected' : ''}`}
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
            <FileText size={16} /> 免責聲明與條款
          </button>

          <button
            className={`legal-modal-tab ${activeTab === 'about' ? 'is-selected' : ''}`}
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
            <Info size={16} /> 關於本站
          </button>

          <button
            className={`legal-modal-tab ${activeTab === 'contact' ? 'is-selected' : ''}`}
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
            <Mail size={16} /> 聯絡我們
          </button>
        </div>

        {/* Modal Body Content */}
        <div
          className="legal-modal-body"
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
            <div className="legal-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4>隱私權摘要</h4>
              <p>查歌不需要註冊。使用本站時，我們仍會處理 IP 位址、訪客識別碼，以及你送出的回報、投票或聯絡資料。</p>
              <p>歌本、偏好與部分使用紀錄保存在此瀏覽器。清除網站資料不會自動刪除伺服器上的回報、統計或備份，也不會撤回投票。</p>
              <p>啟用地區推估時，IP 會送至地區查詢服務。Google 與第三方廣告服務也可能使用 Cookie 等資料；完整政策提供資料保存、廣告偏好與刪除請求的說明。</p>
              <a href="/privacy.html">閱讀完整隱私權政策</a>
            </div>
          )}
          {activeTab === 'terms' && (
            <div className="legal-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4>使用本站前，請先了解</h4>
              <p>TYFunLab 是民間查歌工具，與 KTV 業者沒有官方關係。查詢結果供行前參考，能否點播、是否有導唱及播放畫面，請以現場點歌系統為準。</p>
              <p>YouTube 連結會開啟外部搜尋結果，不代表影片已經本站核實或取得授權。本站不提供歌曲或影片下載。</p>
              <p>回報時請提供你實際看到的情況，不要填入他人個資或未經允許公開的內容。</p>
              <a href="/terms.html">閱讀完整服務條款</a>
            </div>
          )}
          {activeTab === 'about' && (
            <div className="legal-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4>關於 TYFunLab</h4>
              <p>想知道一首歌在哪些 KTV 有收錄？你可以用歌名或歌手搜尋，比對收錄、導唱與 MV 資訊，再把想唱的歌加入「我的歌本」。</p>
              <p>網站資料由既有歌冊資料與歌友回報整理而來，尚未逐筆向所有平台及門市確認。發現與現場不同時，歡迎提供線索。</p>
              <a href="/about.html">閱讀完整網站介紹</a>
            </div>
          )}
          {activeTab === 'contact' && (
            <div className="legal-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4>聯絡我們</h4>
              <p>歌曲資料不符，請使用歌曲詳情中的「回報現場差異」；找不到歌曲或 KTV，請使用「提供建議」。</p>
              <p>其他問題、權利通知或個人資料請求，請寄信至 tyfunlab@gmail.com，附上相關頁面及問題說明。此信箱非即時客服，請勿寄送密碼或不必要的個人資料。</p>
              <a href="/contact.html">閱讀完整聯絡說明</a>
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
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};


