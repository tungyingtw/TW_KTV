import { useState } from 'react';
export function ReportReceipt({ reportId }: { reportId: string }) {
  const [message, setMessage] = useState('');
  return <div style={{ marginTop: 16 }}><p>請保留回報編號，聯絡我們時可提供此編號。</p><input aria-label="回報編號" value={reportId} readOnly onFocus={e => e.target.select()} style={{ width: '100%', boxSizing: 'border-box' }} /><button type="button" className="btn-secondary" onClick={async () => { try { await navigator.clipboard.writeText(reportId); setMessage('已複製'); } catch { setMessage('請選取上方編號並手動複製'); } }}>複製編號</button><p role="status">{message}</p></div>;
}
