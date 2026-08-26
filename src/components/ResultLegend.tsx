import React from 'react';

export const ResultLegend: React.FC = () => (
  <aside className="result-legend" aria-label="結果判讀提示">
    <span><strong className="result-legend-key is-available">有收錄</strong>：主資料已有標示，或歌友回報「有」多於「沒有」。</span>
    <span><strong className="result-legend-key is-empty">-</strong>：目前尚無確認資料，不代表已確認沒有。</span>
    <span><strong className="result-legend-key is-guided">導唱</strong> / <strong className="result-legend-key is-mv">MV</strong>：主資料已有標示，或歌友回報「有」多於「沒有」。</span>
  </aside>
);
