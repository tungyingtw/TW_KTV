import React, { useState } from 'react';
import { ShieldCheck, FileText, Info, X } from 'lucide-react';

interface LegalNoticeModalProps {
  initialTab?: 'privacy' | 'terms' | 'about';
  onClose: () => void;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'about'>(initialTab);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
          backgroundColor: 'var(--bg-secondary, #1e293b)',
          color: 'var(--text-primary, #f8fafc)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={24} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              條款與法規聲明
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            aria-label="關閉"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.3)',
            padding: '0 16px',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('privacy')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'privacy' ? '#38bdf8' : 'var(--text-muted, #94a3b8)',
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
            onClick={() => setActiveTab('terms')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'terms' ? '#38bdf8' : 'var(--text-muted, #94a3b8)',
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
            onClick={() => setActiveTab('about')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'about' ? '#38bdf8' : 'var(--text-muted, #94a3b8)',
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
        </div>

        {/* Modal Body Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            fontSize: '0.92rem',
            lineHeight: 1.7,
            color: 'var(--text-secondary, #cbd5e1)',
          }}
        >
          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: '#f8fafc', margin: '0 0 8px 0', fontSize: '1.1rem' }}>
                隱私權政策 (Privacy Policy)
              </h4>
              <p>
                歡迎使用「台灣 KTV 歌曲索引」（以下簡稱「本網站」）。本網站極力重視您的個人隱私與數據安全，特此說明本網站之資料收集與隱私權保護政策：
              </p>
              
              <h5 style={{ color: '#38bdf8', margin: '8px 0 4px 0' }}>1. 資料收集與使用</h5>
              <p>
                本網站為非註冊制之公開對照索引工具，一般瀏覽時無需提供個人姓名、電話或地址等敏感個資。為了提升系統效能與服務穩定度，我們可能會記錄匿名的系統存取紀錄（例如造訪時間、瀏覽器類型與頁面請求數）。
              </p>

              <h5 style={{ color: '#38bdf8', margin: '8px 0 4px 0' }}>2. Google AdSense 與 Cookie 政策</h5>
              <p>
                本網站使用 Google AdSense 提供第三方廣告服務。Google 及相關第三方廣告供應商會使用 Cookie（包括 DART Cookie）收集訪客造訪本網站及其他網站的匿名資訊，以顯示符合使用者興趣之廣告。
              </p>
              <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
                <li>您可選擇造訪 <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>Google 廣告設定</a> 來停用個人化廣告。</li>
                <li>您亦可透過瀏覽器設定停用或拒絕所有的 Cookie 寫入。</li>
              </ul>

              <h5 style={{ color: '#38bdf8', margin: '8px 0 4px 0' }}>3. 外部連結聲明</h5>
              <p>
                本網站部分頁面包含導向第三方網站（如 YouTube 官方頻道）之連結，該些外部網站擁有獨立之隱私權政策，本網站不承擔外部網站行為或內容之連帶責任。
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: '#f8fafc', margin: '0 0 8px 0', fontSize: '1.1rem' }}>
                免責聲明與服務條款 (Terms & Disclaimer)
              </h4>
              
              <h5 style={{ color: '#f59e0b', margin: '8px 0 4px 0' }}>1. 第三方非官方獨立平台聲明</h5>
              <p>
                本網站為**民間社群獨立開發維護之客觀歌曲索引與對照平台**，非任何 KTV 伴唱業者（包括但不限於錢櫃、好樂迪、享溫馨、星聚點、SingGo、V-MIX、超級巨星、音圓、金嗓、弘音等）之官方網站或營利附屬機構。本網站與上述任何連鎖業者及伴唱機品牌無商業隸屬或官方授權關係。
              </p>

              <h5 style={{ color: '#f59e0b', margin: '8px 0 4px 0' }}>2. 商標權與品牌宣告</h5>
              <p>
                本網站提及之所有公司名稱、KTV 門市品牌、伴唱機廠牌名稱及商標標誌，其財產權與商標權均**完全歸屬於原註冊公司及權利人所有**。本網站僅出於資訊客觀對照、便於民眾個人歌唱檢索之合理使用目的進行載錄。
              </p>

              <h5 style={{ color: '#f59e0b', margin: '8px 0 4px 0' }}>3. 音樂影音與著作權聲明</h5>
              <p>
                本網站**不儲存、上傳、託管或散佈任何未經授權之 MP3、MP4 音訊、影片檔案或盜版影音資源**。網站內展示之官方 MV 影片連結，均來自第三方公開影音平台（如 YouTube 官方頻道）之標準嵌入或超連結，版權均屬原唱片公司、創作者及原發布平台所有。歌詞與歌曲目錄數據僅供學術研究、社群校對與個人伴唱參考。
              </p>

              <h5 style={{ color: '#f59e0b', margin: '8px 0 4px 0' }}>4. 門市數據精準度與現場機器免責</h5>
              <p>
                本網站之曲號與門市收錄狀態為大眾共識校對與公開目錄整理，僅供社群歡唱前之輔助查詢。因各大 KTV 門市伴唱機器之維護狀況、地區版權授權及即時更新進度不一，**現場實際點唱收錄狀況與曲號請一律以各門市點歌系統機器為準**。
              </p>
            </div>
          )}

          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: '#f8fafc', margin: '0 0 8px 0', fontSize: '1.1rem' }}>
                關於「台灣 KTV 歌曲索引」
              </h4>
              <p>
                「台灣 KTV 歌曲索引」成立旨在解決廣大歌友在全台各大 KTV 連鎖門市歡唱時，常遇到「找不到原聲原唱」、「不同伴唱機曲號混亂」及「不確定現場門市有無收錄」等痛點。
              </p>

              <h5 style={{ color: '#10b981', margin: '8px 0 4px 0' }}>核心特色</h5>
              <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
                <li>**跨廠牌對照**：整合錢櫃、好樂迪、享溫馨、星聚點、超級巨星、音圓、金嗓等 10 大廠牌曲號資訊。</li>
                <li>**原版 MV 與原聲原唱標示**：明確註記歌曲是否提供原聲原唱或官方 MV 影音參考。</li>
                <li>**眾包共識與現場勘誤**：提供現場歌友實時參與歌曲收錄與對照勘誤回報，維持歌冊資訊更新。</li>
              </ul>
              <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                本站為非營利性質之社群伴唱資訊索引庫，歡迎廣大歌友共同維護與回報勘誤。
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            justifyContent: 'flex-end',
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
            我已了解
          </button>
        </div>
      </div>
    </div>
  );
};
