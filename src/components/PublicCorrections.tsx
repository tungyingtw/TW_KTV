import { useEffect, useState } from 'react';
import { fetchPublicCorrections } from '../services/communityService';
import type { PublicCorrection } from '../services/communityService';
import { useBrands } from '../hooks/useBrands';
const labels: Record<string, string> = { available: '收錄', audioType: '導唱', mvType: 'MV', guided_vocal: '有導唱', backing_track: '純伴奏', official_mv: '原版 MV 線索', reedited_mv: '伴唱帶類型', unknown: '尚未確認' };
const describe = (value: string | boolean | null) => value === true ? '有收錄線索' : value === false ? '未收錄' : value === null ? '尚未確認' : labels[value] || '其他版本';
export function PublicCorrections({ songId }: { songId: string }) {
  const brands = useBrands();
  const [state, setState] = useState<{ songId: string; rows: PublicCorrection[]; error: boolean } | null>(null);
  useEffect(() => { const controller = new AbortController(); fetchPublicCorrections(songId, controller.signal).then(rows => setState({ songId, rows, error: false })).catch(() => { if (!controller.signal.aborted) setState({ songId, rows: [], error: true }); }); return () => controller.abort(); }, [songId]);
  return <section style={{ marginTop: 20 }} aria-label="資料修正紀錄"><h4>資料修正紀錄</h4>{state?.songId !== songId ? <p>正在載入修正紀錄…</p> : state.error ? <p>修正紀錄暫時無法載入，不影響查歌。</p> : !state.rows.length ? <p>目前沒有可公開的修正紀錄。</p> : <><p>以下為站方核對後的資料修正，仍不能保證每家門市相同。門市細節未公開。</p>{state.rows.map(row => <div key={row.id} style={{ borderTop: '1px solid var(--border-color)', padding: '10px 0' }}><strong>{brands.find(b => b.id === row.brandId)?.name || '平台資訊待確認'}</strong><p>觀察日期：{row.observedOn || '未提供'}；資訊來源：{row.observationType === 'direct' ? '回報者表示親自確認' : row.observationType === 'hearsay' ? '他人轉述' : '未提供'}<br />站方處理日期：{row.reviewedAt?.slice(0, 10) || '未提供'}</p>{row.changes.map(change => <p key={change.field}>{labels[change.field] || '資料'}：{describe(change.before)} → {describe(change.after)}</p>)}</div>)}</>}</section>;
}
