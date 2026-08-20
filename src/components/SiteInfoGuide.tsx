import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, HelpCircle, Mic2, Search, ShieldAlert, Vote } from 'lucide-react';

type GuideTab = 'query' | 'data' | 'media' | 'faq';

const guideLinks = [
  { href: './how-to-use.html', label: '使用教學', desc: '搜尋、篩選與歌單整理方式' },
  { href: './ktv-song-search-guide.html', label: 'KTV 查詢指南', desc: '收錄、導唱與 MV 類型怎麼看' },
  { href: './before-ktv-song-checklist.html', label: '歌單準備清單', desc: '去 KTV 前先整理想唱歌曲' },
  { href: './ktv-song-not-found.html', label: '找不到歌怎麼辦', desc: '查不到歌曲時的常見原因與做法' },
  { href: './data-source.html', label: '資料來源', desc: '公開資訊、使用者回報與人工確認' },
  { href: './community-verification.html', label: '社群回報', desc: '收錄、導唱與 MV 類型回報說明' },
  { href: './ktv-guided-vocal.html', label: '導唱功能說明', desc: '有導唱、無導唱與純伴奏差異' },
  { href: './original-mv-vs-karaoke-video.html', label: 'MV 類型說明', desc: '原版 MV、伴唱帶類型與其他畫面分類' },
  { href: './ktv-song-availability-differences.html', label: '平台收錄差異', desc: '曲庫更新、門市與機台差異' },
  { href: './faq.html', label: '常見問題', desc: '非官方聲明與資料準確度' },
];

const faqItems = [
  {
    question: 'TYFunLab 的查詢結果可以直接當現場依據嗎？',
    answer: '不行。本站整理公開資訊、使用者回報與人工確認線索，適合歡唱前準備歌單；實際是否能點唱，仍以門市包廂內點歌系統為準。',
  },
  {
    question: '同一首歌為什麼不同平台結果不同？',
    answer: '不同平台、門市、機台版本與曲庫更新時間都可能造成差異。本站會把這些差異整理成可比較的查詢參考，但不取代現場系統。',
  },
  {
    question: '我查不到歌曲時該怎麼做？',
    answer: '先縮短歌名、改用歌手名稱、嘗試常見別名或放寬篩選。若現場確認有收錄，也可以提供建議，讓資料後續能修正。',
  },
];

export const SiteInfoGuide: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<GuideTab>('query');

  return (
    <section className="site-info-guide" aria-labelledby="site-info-guide-title">
      <div className="site-info-guide-shell">
        <button
          type="button"
          className="site-info-guide-toggle"
          onClick={() => setIsExpanded(prev => !prev)}
          aria-expanded={isExpanded}
          aria-controls="site-info-guide-body"
        >
          <span className="site-info-guide-icon" aria-hidden="true">
            <BookOpen size={20} />
          </span>
          <span className="site-info-guide-heading">
            <span id="site-info-guide-title">台灣 KTV 歌曲查詢完整指南</span>
            <small>想看操作教學、資料來源、導唱與 MV 類型說明，可以從這裡進一步閱讀。</small>
          </span>
          <span className="site-info-guide-action">
            {isExpanded ? '收起指南' : '閱讀指南'}
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        {isExpanded && (
          <div id="site-info-guide-body" className="site-info-guide-body">
            <nav className="site-info-guide-links" aria-label="完整指南頁面入口">
              {guideLinks.map(link => (
                <a key={link.href} href={link.href} className="site-info-guide-link">
                  <strong>{link.label}</strong>
                  <span>{link.desc}</span>
                </a>
              ))}
            </nav>

            <div className="site-info-guide-tabs" role="tablist" aria-label="指南分類">
              {[
                ['query', '查詢工具指南', Search],
                ['data', '資料與回報', Vote],
                ['media', '導唱與 MV 類型', Mic2],
                ['faq', '常見問題', HelpCircle],
              ].map(([id, label, Icon]) => (
                <button
                  key={id as GuideTab}
                  type="button"
                  className={`site-info-tab ${activeTab === id ? 'is-selected' : ''}`}
                  onClick={() => setActiveTab(id as GuideTab)}
                  role="tab"
                  aria-selected={activeTab === id}
                >
                  <Icon size={16} />
                  <span>{label as string}</span>
                </button>
              ))}
            </div>

            {activeTab === 'query' && (
              <div className="site-info-guide-panel">
                <div>
                  <h3>查詢時先看什麼？</h3>
                  <p>先搜尋歌名或歌手，再依序查看平台收錄、導唱功能與 MV 類型。這樣能避免只看到有收錄，卻忽略現場版本、門市或機台差異。</p>
                </div>
                <div>
                  <h3>去 KTV 前怎麼準備？</h3>
                  <p>先列出想唱歌曲，用 TYFunLab 查收錄、導唱與 MV 類型，再把想唱的歌加入我的最愛。到現場後，仍以包廂內點歌系統再次確認。</p>
                </div>
                <div>
                  <h3>找不到歌怎麼辦？</h3>
                  <p>縮短歌名、改用歌手名稱、嘗試別名或放寬篩選。若確認現場有收錄，可以提供建議作為後續修正線索。</p>
                </div>
                <div>
                  <h3>哪些搜尋詞適合用？</h3>
                  <p>歌名最準，歌手次之；只記得片段時可先用短關鍵字，再搭配語種、字數、導唱或 MV 類型篩選縮小範圍。</p>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="site-info-guide-panel">
                <div>
                  <h3>本站資料從哪裡來？</h3>
                  <p>本站整理公開可查資料、使用者回報與人工確認線索，目標是協助歡唱前快速比對，不宣稱代表任何 KTV 品牌或伴唱系統。</p>
                </div>
                <div>
                  <h3>為什麼需要回報？</h3>
                  <p>KTV 現場會受門市、機台、曲庫更新與平台差異影響。使用者回報能補足公開資料無法即時呈現的現場狀況。</p>
                </div>
                <div>
                  <h3>資料可信度怎麼看？</h3>
                  <p>把查詢結果視為出發前參考最合適。若資訊牽涉是否能點唱、是否有導唱或畫面類型，請以現場點歌系統為準。</p>
                </div>
                <div>
                  <h3>為什麼不用單一答案？</h3>
                  <p>KTV 現場結果會受平台、門市、機台與更新時間影響。本站用多欄位並列，讓使用者自行比較不同線索。</p>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="site-info-guide-panel">
                <div>
                  <h3>收錄狀態、導唱與 MV 類型怎麼分？</h3>
                  <p>收錄狀態代表資料顯示歌曲可能可在該平台查到，導唱代表平台可能提供跟唱輔助，MV 類型則是畫面來源或呈現方式參考。三者都適合歡唱前準備，現場仍以包廂點歌系統為準。</p>
                </div>
                <div>
                  <h3>MV 標示怎麼看？</h3>
                  <p>MV 類型標示用來區分現場畫面可能接近原版 MV、伴唱帶類型或其他版本。它不是品質評分，也不代表所有門市一致。</p>
                </div>
                <div>
                  <h3>平台差異會影響什麼？</h3>
                  <p>同一首歌在不同平台可能出現收錄、導唱與 MV 類型不同。查詢時建議同時看多個品牌，不只看單一欄位。</p>
                </div>
                <div>
                  <h3>有導唱和有 MV 要一起看嗎？</h3>
                  <p>要分開看。有導唱代表可能有跟唱輔助；有 MV 則是畫面類型參考，兩者不互相保證。</p>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="site-info-guide-faq">
                {faqItems.map(item => (
                  <article key={item.question}>
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </article>
                ))}
              </div>
            )}

            <div className="site-info-guide-disclaimer">
              <ShieldAlert size={18} />
              <p>
                <strong>查詢參考與權利聲明：</strong>
                本站為民間整理的 KTV 歌曲收錄對照工具，非任何 KTV 品牌官方網站；查詢結果僅供歡唱前參考，現場仍以包廂點歌系統顯示為準。頁面中提及之品牌名稱、商標或服務名稱均屬其各自權利人所有；本站不儲存、不上傳、不提供下載音訊或影片檔。
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
