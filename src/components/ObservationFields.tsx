import { useId } from 'react';
import type { Observation } from '../types/observation';
export function ObservationFields({ value, onChange }: { value: Observation; onChange: (value: Observation) => void }) {
  const id = useId();
  return <fieldset style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, margin: '16px 0', display: 'grid', gap: 8, minWidth: 0 }}>
    <legend>現場資訊（選填）</legend>
    <label htmlFor={`${id}-date`}>確認日期</label><input id={`${id}-date`} type="date" value={value.observedOn} onChange={e => onChange({ ...value, observedOn: e.target.value })} />
    <label htmlFor={`${id}-store`}>門市名稱</label><input id={`${id}-store`} maxLength={100} value={value.storeName} onChange={e => onChange({ ...value, storeName: e.target.value })} placeholder="不確定可以留白" />
    <label htmlFor={`${id}-type`}>資訊取得方式</label><select id={`${id}-type`} value={value.observationType} onChange={e => onChange({ ...value, observationType: e.target.value as Observation['observationType'] })}><option value="unknown">不確定／未提供</option><option value="direct">親自確認</option><option value="hearsay">他人轉述</option></select>
    <small>只填知道的部分。請勿填入他人個資。</small>
  </fieldset>;
}
