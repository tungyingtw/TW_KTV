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
        <div>
          <span><Activity size={16} /> 全台 KTV 歌友到訪紀錄</span>
          <h1>歌友熱度分布</h1>
          <p>看看目前歌友都從哪些縣市加入，也可以修正自己的記錄位置。</p>
        </div>
      </header>
      <section className="visit-region-modal visit-region-page-card">
        <VisitRegionHeatContent compactHeader />
      </section>
    </main>
  );
}
