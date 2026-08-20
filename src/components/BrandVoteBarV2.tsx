import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  HelpCircle,
  X,
} from 'lucide-react';
import type { BrandId, VoteConfidence, VoteData } from '../types/ktv';
import { submitGuidedVote, submitMvVote, submitVote } from '../services/communityService';

interface BrandVoteBarProps {
  songId: string;
  brandId: BrandId;
  initialVote?: VoteData;
}

const ENABLE_MV_VOTE = import.meta.env.VITE_ENABLE_MV_VOTE !== 'false';

const LS_KEY_SONG = (songId: string, brandId: string) => `ktv_vote_${songId}_${brandId}`;
const LS_KEY_GUIDE = (songId: string, brandId: string) => `ktv_guide_vote_${songId}_${brandId}`;
const LS_KEY_MV = (songId: string, brandId: string) => `ktv_mv_vote_${songId}_${brandId}`;

type VoteState = 'ok' | 'leanOk' | 'disputed' | 'empty' | 'negative';
type AvailabilityVote = 'confirm' | 'deny';
type GuidedVote = 'guided' | 'none';
type MvVote = 'official' | 'edited';

const getPct = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

const getVoteState = (voteData: VoteData): VoteState => {
  const total = voteData.confirm + voteData.deny;
  if (total === 0) return 'empty';
  const pct = getPct(voteData.confirm, total);
  if (voteData.confidence === 'disputed' || (pct >= 40 && pct <= 60 && total >= 3)) return 'disputed';
  if (pct >= 80 && total >= 3) return 'ok';
  if (pct >= 50) return 'leanOk';
  return 'negative';
};

const stateConfig: Record<VoteState, { label: string; hint: string; tooltip: string; icon: React.ReactNode }> = {
  ok: { label: '一致度高', hint: '可唱', tooltip: '多數歌友回報可唱，且結果一致度高', icon: <Check size={15} /> },
  leanOk: { label: '偏向可唱', hint: '尚未穩定', tooltip: '目前偏向可唱，但回報比例尚未穩定', icon: <HelpCircle size={15} /> },
  disputed: { label: '回報分歧', hint: '需現場確認', tooltip: '正反回報接近，建議以現場狀況為準', icon: <AlertCircle size={15} /> },
  empty: { label: '資料不足', hint: '需要第一筆回報', tooltip: '尚無歌友回報，需要第一筆現場資料', icon: <HelpCircle size={15} /> },
  negative: { label: '反向一致', hint: '多數回報未收錄', tooltip: '多數歌友回報未收錄或無導唱', icon: <X size={15} /> },
};

const confidenceLabel: Record<VoteConfidence, string> = {
  neutral: '',
  verified: '歌友確認收錄',
  disputed: '歌友回報不一致',
  uncertain: '資料仍待確認',
};

const readStoredVote = <T extends string>(key: string, allowed: readonly T[]): T | null => {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value as T) ? (value as T) : null;
  } catch {
    return null;
  }
};

const emptyVoteData = (): VoteData => ({
  confirm: 0,
  deny: 0,
  confidence: 'neutral',
  officialMv: 0,
  editedMv: 0,
  guidedVocal: 0,
  noGuidedVocal: 0,
});

const MetricRow: React.FC<{
  label: string;
  positiveLabel: string;
  negativeLabel: string;
  positive: number;
  negative: number;
  kind: 'availability' | 'guided' | 'mv';
}> = ({ label, positiveLabel, negativeLabel, positive, negative, kind }) => {
  const total = positive + negative;
  const pct = getPct(positive, total);

  return (
    <div className={`brand-vote-metric is-${kind}`}>
      <div className="brand-vote-metric-top">
        <span>{label}</span>
        <strong>{total > 0 ? `${pct}%` : '--'}</strong>
      </div>
      <div className="brand-vote-scale">
        <span>{positiveLabel}</span>
        <div className="brand-vote-split" aria-label={total > 0 ? `${label} ${pct}%` : `${label} 尚無回報`}>
          {total > 0 ? (
            <>
              <i className="is-positive" style={{ width: `${pct}%` }} />
              <i className="is-negative" style={{ width: `${100 - pct}%` }} />
            </>
          ) : (
            <i className="is-empty" />
          )}
        </div>
        <span>{negativeLabel}</span>
      </div>
    </div>
  );
};

export const BrandVoteBarV2: React.FC<BrandVoteBarProps> = ({ songId, brandId, initialVote }) => {
  const [voteData, setVoteData] = useState<VoteData>(
    initialVote ?? emptyVoteData()
  );
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [userVote, setUserVote] = useState<AvailabilityVote | null>(() => readStoredVote(LS_KEY_SONG(songId, brandId), ['confirm', 'deny'] as const));
  const [userGuideVote, setUserGuideVote] = useState<GuidedVote | null>(() => readStoredVote(LS_KEY_GUIDE(songId, brandId), ['guided', 'none'] as const));
  const [userMvVote, setUserMvVote] = useState<MvVote | null>(() => readStoredVote(LS_KEY_MV(songId, brandId), ['official', 'edited'] as const));
  const [isVoting, setIsVoting] = useState(false);
  const [isGuideVoting, setIsGuideVoting] = useState(false);
  const [isMvVoting, setIsMvVoting] = useState(false);

  useEffect(() => {
    setUserVote(readStoredVote(LS_KEY_SONG(songId, brandId), ['confirm', 'deny'] as const));
    setUserGuideVote(readStoredVote(LS_KEY_GUIDE(songId, brandId), ['guided', 'none'] as const));
    setUserMvVote(readStoredVote(LS_KEY_MV(songId, brandId), ['official', 'edited'] as const));
    setShowBreakdown(false);
  }, [brandId, songId]);

  useEffect(() => {
    setVoteData({
      ...emptyVoteData(),
      ...initialVote,
      officialMv: initialVote?.officialMv ?? 0,
      editedMv: initialVote?.editedMv ?? 0,
      guidedVocal: initialVote?.guidedVocal ?? 0,
      noGuidedVocal: initialVote?.noGuidedVocal ?? 0,
    });
  }, [brandId, initialVote, songId]);

  const syncResult = (result: VoteData | null, fallback: () => void) => {
    if (result) {
      setVoteData(prev => ({
        ...prev,
        confirm: result.confirm,
        deny: result.deny,
        guidedVocal: result.guidedVocal ?? prev.guidedVocal ?? 0,
        noGuidedVocal: result.noGuidedVocal ?? prev.noGuidedVocal ?? 0,
        officialMv: result.officialMv ?? prev.officialMv ?? 0,
        editedMv: result.editedMv ?? prev.editedMv ?? 0,
        confidence: result.confidence,
      }));
    } else {
      fallback();
    }
  };

  const handleVote = useCallback(async (vote: 'confirm' | 'deny') => {
    if (isVoting) return;
    const previousVote = userVote;
    const removing = previousVote === vote;
    setIsVoting(true);
    setUserVote(removing ? null : vote);
    setVoteData(prev => {
      const next = { ...prev };
      if (previousVote) next[previousVote] = Math.max(0, next[previousVote] - 1);
      if (!removing) next[vote] += 1;
      return next;
    });
    try {
      if (removing) localStorage.removeItem(LS_KEY_SONG(songId, brandId));
      else localStorage.setItem(LS_KEY_SONG(songId, brandId), vote);
    } catch {}
    const result = await submitVote(songId, brandId, vote, { previousVote, removeVote: removing });
    syncResult(result, () => {
      setUserVote(previousVote);
      setVoteData(prev => {
        const next = { ...prev };
        if (!removing) next[vote] = Math.max(0, next[vote] - 1);
        if (previousVote) next[previousVote] += 1;
        return next;
      });
      try {
        if (previousVote) localStorage.setItem(LS_KEY_SONG(songId, brandId), previousVote);
        else localStorage.removeItem(LS_KEY_SONG(songId, brandId));
      } catch {}
    });
    setIsVoting(false);
  }, [brandId, isVoting, songId, userVote]);

  const handleGuideVote = useCallback(async (vote: 'guided' | 'none') => {
    if (isGuideVoting) return;
    const key = vote === 'guided' ? 'guidedVocal' : 'noGuidedVocal';
    const previousVote = userGuideVote;
    const previousKey = previousVote === 'guided' ? 'guidedVocal' : 'noGuidedVocal';
    const removing = previousVote === vote;
    setIsGuideVoting(true);
    setUserGuideVote(removing ? null : vote);
    setVoteData(prev => {
      const next = { ...prev };
      if (previousVote) next[previousKey] = Math.max(0, (next[previousKey] || 0) - 1);
      if (!removing) next[key] = (next[key] || 0) + 1;
      return next;
    });
    try {
      if (removing) localStorage.removeItem(LS_KEY_GUIDE(songId, brandId));
      else localStorage.setItem(LS_KEY_GUIDE(songId, brandId), vote);
    } catch {}
    const result = await submitGuidedVote(songId, brandId, vote, { previousVote, removeVote: removing });
    syncResult(result, () => {
      setUserGuideVote(previousVote);
      setVoteData(prev => {
        const next = { ...prev };
        if (!removing) next[key] = Math.max(0, (next[key] || 0) - 1);
        if (previousVote) next[previousKey] = (next[previousKey] || 0) + 1;
        return next;
      });
      try {
        if (previousVote) localStorage.setItem(LS_KEY_GUIDE(songId, brandId), previousVote);
        else localStorage.removeItem(LS_KEY_GUIDE(songId, brandId));
      } catch {}
    });
    setIsGuideVoting(false);
  }, [brandId, isGuideVoting, songId, userGuideVote]);

  const handleMvVote = useCallback(async (vote: 'official' | 'edited') => {
    if (isMvVoting) return;
    const key = vote === 'official' ? 'officialMv' : 'editedMv';
    const previousVote = userMvVote;
    const previousKey = previousVote === 'official' ? 'officialMv' : 'editedMv';
    const removing = previousVote === vote;
    setIsMvVoting(true);
    setUserMvVote(removing ? null : vote);
    setVoteData(prev => {
      const next = { ...prev };
      if (previousVote) next[previousKey] = Math.max(0, (next[previousKey] || 0) - 1);
      if (!removing) next[key] = (next[key] || 0) + 1;
      return next;
    });
    try {
      if (removing) localStorage.removeItem(LS_KEY_MV(songId, brandId));
      else localStorage.setItem(LS_KEY_MV(songId, brandId), vote);
    } catch {}
    const result = await submitMvVote(songId, brandId, vote, { previousVote, removeVote: removing });
    syncResult(result, () => {
      setUserMvVote(previousVote);
      setVoteData(prev => {
        const next = { ...prev };
        if (!removing) next[key] = Math.max(0, (next[key] || 0) - 1);
        if (previousVote) next[previousKey] = (next[previousKey] || 0) + 1;
        return next;
      });
      try {
        if (previousVote) localStorage.setItem(LS_KEY_MV(songId, brandId), previousVote);
        else localStorage.removeItem(LS_KEY_MV(songId, brandId));
      } catch {}
    });
    setIsMvVoting(false);
  }, [brandId, isMvVoting, songId, userMvVote]);

  const songTotal = voteData.confirm + voteData.deny;
  const guidedCount = voteData.guidedVocal || 0;
  const noGuidedCount = voteData.noGuidedVocal || 0;
  const guideTotal = guidedCount + noGuidedCount;
  const officialMvCount = voteData.officialMv || 0;
  const editedMvCount = voteData.editedMv || 0;
  const mvTotal = officialMvCount + editedMvCount;
  const state = useMemo(() => getVoteState(voteData), [voteData]);
  const stateInfo = stateConfig[state];
  const actionLabel = songTotal + guideTotal + mvTotal === 0
    ? '提供第一筆回報'
    : userVote || userGuideVote || userMvVote
      ? '查看票數・修改回報'
      : state === 'disputed'
        ? '協助確認現場狀態'
        : '查看票數・提供回報';

  return (
    <div className={`brand-vote-bar brand-vote-card is-${state}`}>
      <div className="brand-vote-overview">
        <div className="brand-vote-overview-head">
          <div>
            <strong>回報統計</strong>
            <span>{stateInfo.label}</span>
          </div>
          <span className="brand-vote-state-mark" role="img" aria-label={stateInfo.tooltip} tabIndex={0}>
            {stateInfo.icon}
            <span className="brand-vote-state-tooltip">{stateInfo.tooltip}</span>
          </span>
        </div>
        <MetricRow label="收錄" positiveLabel="有收錄" negativeLabel="未收錄" positive={voteData.confirm} negative={voteData.deny} kind="availability" />
        <MetricRow label="導唱" positiveLabel="有導唱" negativeLabel="無導唱" positive={guidedCount} negative={noGuidedCount} kind="guided" />
        {ENABLE_MV_VOTE && <MetricRow label="MV" positiveLabel="原版" negativeLabel="伴唱" positive={officialMvCount} negative={editedMvCount} kind="mv" />}
        <div className="brand-vote-hint"><span>{stateInfo.hint}</span><b>{userVote || userGuideVote || userMvVote ? '已回報' : '尚未回報'}</b></div>
      </div>

      <button className="brand-vote-breakdown-toggle" type="button" onClick={e => { e.stopPropagation(); setShowBreakdown(prev => !prev); }} aria-expanded={showBreakdown} aria-label={actionLabel}>
        <span>{actionLabel}</span>
        <ChevronDown size={13} aria-hidden="true" />
      </button>

      {showBreakdown && (
        <div className="brand-vote-breakdown">
          <div className="brand-vote-detail-lines">
            <div><strong>收錄</strong><span>{songTotal > 0 ? `${voteData.confirm} 有 / ${voteData.deny} 無` : '尚無回報'}</span></div>
            <div><strong>導唱</strong><span>{guideTotal > 0 ? `${guidedCount} 有 / ${noGuidedCount} 無` : '尚無回報'}</span></div>
            {ENABLE_MV_VOTE && <div><strong>MV</strong><span>{mvTotal > 0 ? `${officialMvCount} 原版 / ${editedMvCount} 伴唱` : '尚無回報'}</span></div>}
          </div>
          <div className="brand-vote-actions">
            <button type="button" className={`brand-vote-action is-positive ${userVote === 'confirm' ? 'is-selected' : ''}`} disabled={isVoting} onClick={e => { e.stopPropagation(); handleVote('confirm'); }} aria-pressed={userVote === 'confirm'}><span>有收錄</span>{voteData.confirm > 0 && <em>{voteData.confirm}</em>}</button>
            <button type="button" className={`brand-vote-action is-negative ${userVote === 'deny' ? 'is-selected' : ''}`} disabled={isVoting} onClick={e => { e.stopPropagation(); handleVote('deny'); }} aria-pressed={userVote === 'deny'}><span>未收錄</span>{voteData.deny > 0 && <em>{voteData.deny}</em>}</button>
            <button type="button" className={`brand-vote-action is-guided ${userGuideVote === 'guided' ? 'is-selected' : ''}`} disabled={isGuideVoting} onClick={e => { e.stopPropagation(); handleGuideVote('guided'); }} aria-pressed={userGuideVote === 'guided'}><span>有導唱</span>{guidedCount > 0 && <em>{guidedCount}</em>}</button>
            <button type="button" className={`brand-vote-action is-muted ${userGuideVote === 'none' ? 'is-selected' : ''}`} disabled={isGuideVoting} onClick={e => { e.stopPropagation(); handleGuideVote('none'); }} aria-pressed={userGuideVote === 'none'}><span>無導唱</span>{noGuidedCount > 0 && <em>{noGuidedCount}</em>}</button>
            {ENABLE_MV_VOTE && <button type="button" className={`brand-vote-action is-mv ${userMvVote === 'official' ? 'is-selected' : ''}`} disabled={isMvVoting} onClick={e => { e.stopPropagation(); handleMvVote('official'); }} aria-pressed={userMvVote === 'official'}><span>原版 MV</span>{officialMvCount > 0 && <em>{officialMvCount}</em>}</button>}
            {ENABLE_MV_VOTE && <button type="button" className={`brand-vote-action is-edited ${userMvVote === 'edited' ? 'is-selected' : ''}`} disabled={isMvVoting} onClick={e => { e.stopPropagation(); handleMvVote('edited'); }} aria-pressed={userMvVote === 'edited'}><span>伴唱帶</span>{editedMvCount > 0 && <em>{editedMvCount}</em>}</button>}
          </div>
          {voteData.confidence !== 'neutral' && <div className="brand-vote-confidence">{confidenceLabel[voteData.confidence]}</div>}
        </div>
      )}
    </div>
  );
};
