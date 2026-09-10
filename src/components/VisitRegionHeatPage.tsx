import { ArrowLeft, Activity } from 'lucide-react';
import { VisitRegionHeatContent } from './VisitRegionHeatModal';

function goHome() {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.delete('view');
  window.location.assign(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
}

export function VisitRegionHeatPage() {
  return (
    <main className="visit-region-page">
      <header className="visit-region-page-hero">
        <button type="button" className="visit-region-back-button" onClick={goHome}>
          <ArrowLeft size={20} />
          <span>返回查詢</span>
        </button>
        <div className="visit-region-page-title">
          <span><Activity size={16} /> 台灣 KTV 歌友到訪紀錄</span>
          <h1>歌友熱度分布</h1>
          <p>查看累積到訪的地區分布。地區由網路位置粗略推估，並非 GPS 定位；你可以更正統計中的地區。</p>
        </div>
      </header>
      <section className="visit-region-modal visit-region-page-card">
        <VisitRegionHeatContent compactHeader />
      </section>
    </main>
  );
}
