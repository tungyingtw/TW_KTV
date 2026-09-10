import React from 'react';

export const ResultLegend: React.FC = () => (
  <aside className="result-legend" aria-label="結果判讀提示">
    <span><strong className="result-legend-key is-available">有收錄</strong>：網站資料或歌友回報顯示有此項目，仍以現場為準。</span>
    <span><strong className="result-legend-key is-empty">-</strong>：尚未確認，不代表沒有。「回報偏向未收錄」表示目前回報多為未收錄。</span>
    <span><strong className="result-legend-key is-guided">導唱</strong> / <strong className="result-legend-key is-mv">MV</strong>：網站資料或歌友回報顯示有此項目，仍以現場為準。</span>
  </aside>
);
