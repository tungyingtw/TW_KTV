import { useState } from 'react';
import { songbookText, type summarizeSongbook } from '../utils/songbookSummary';

interface Props { summary: ReturnType<typeof summarizeSongbook>; selectedPlatform: string; onSelectPlatform: (id: string) => void }
export function SongbookSummary({ summary, selectedPlatform, onSelectPlatform }: Props) {
  const [copyState, setCopyState] = useState<{ text: string; failed: boolean } | null>(null);
  const text = songbookText(summary, new Date(), selectedPlatform);
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopyState({ text, failed: false }); } catch { setCopyState({ text, failed: true }); } };
  return <section aria-label="歌本平台比較" className="songbook-summary">
    <h4>哪些平台有這些歌？</h4>
    <p>以下按有收錄線索的首數排列，仍請以現場為準。點平台可逐首查看；「尚未確認」不代表沒有。</p>
    {!summary.platforms.some(row => row.available > 0) && <p>目前沒有平台提供這份歌本的收錄線索，請先確認現場資訊。</p>}
    <div className="songbook-platforms">{summary.platforms.map(row => <button key={row.brand.id} type="button" className="songbook-platform" aria-pressed={selectedPlatform === row.brand.id} onClick={() => onSelectPlatform(selectedPlatform === row.brand.id ? '' : row.brand.id)}>
      <span><strong>{row.brand.shortName}</strong><span>{row.available}/{summary.songs.length} 首有收錄線索</span></span>
      <small>未收錄 {row.unavailable} 首 · 尚未確認 {row.unknown} 首</small>
    </button>)}</div>
    <button type="button" className="btn-secondary" onClick={copy}>複製歌本摘要</button>
    <p role="status">{copyState?.text === text ? copyState.failed ? '無法自動複製，請選取下方文字手動複製。' : '已複製歌本摘要。' : ''}</p>
    {copyState?.failed && <textarea aria-label="歌本摘要，供手動複製" readOnly value={text} onFocus={event => event.target.select()} rows={8} />}
  </section>;
}
