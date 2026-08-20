import React from 'react';

export const ResultLegend: React.FC = () => (
  <aside className="result-legend" aria-label="結果判讀提示">
    <span><strong>有收錄</strong>：資料顯示可能可在該平台查到，現場仍以包廂點歌系統為準。</span>
    <span><strong>-</strong>：目前尚無確認資料，不代表已確認沒有。</span>
    <span><strong>導唱 / MV</strong>：標示可能因平台、門市或機台版本不同。</span>
  </aside>
);
