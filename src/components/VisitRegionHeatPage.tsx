import { ArrowLeft } from 'lucide-react';
import { VisitRegionHeatContent } from './VisitRegionHeatModal';

function goHome() {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.delete('view');
  window.location.assign(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
}

export function VisitRegionHeatPage() {
  return (
    <main className="visit-region-page">
      <div className="visit-region-page-topbar">
        <button type="button" className="btn-secondary" onClick={goHome}>
          <ArrowLeft size={16} />
          <span>返回查詢</span>
        </button>
      </div>
      <section className="visit-region-modal visit-region-page-card">
        <VisitRegionHeatContent />
      </section>
    </main>
  );
}
