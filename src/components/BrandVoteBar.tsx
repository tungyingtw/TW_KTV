import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BarChart2,
  ChevronDown,
  HelpCircle,
  Mic2,
  MicOff,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import type { BrandId, VoteConfidence, VoteData } from '../types/ktv';
import { submitGuidedVote, submitVote } from '../services/communityService';

interface BrandVoteBarProps {
  songId: string;
  brandId: BrandId;
  initialVote?: VoteData;
}

const CONFIDENCE_CONFIG: Record<VoteConfidence, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  neutral: { icon: <HelpCircle size={11} />, label: '', color: 'transparent', bg: 'transparent' },
  verified: { icon: <ShieldCheck size={11} />, label: '歌友確認可唱', color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
  disputed: { icon: <AlertCircle size={11} />, label: '歌友回報不一致', color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  uncertain: { icon: <HelpCircle size={11} />, label: '資料仍待確認', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
};

const LS_KEY_SONG = (songId: string, brandId: string) => `ktv_vote_${songId}_${brandId}`;
const LS_KEY_GUIDE = (songId: string, brandId: string) => `ktv_guide_vote_${songId}_${brandId}`;

export const BrandVoteBar: React.FC<BrandVoteBarProps> = ({ songId, brandId, initialVote }) => {
  const [voteData, setVoteData] = useState<VoteData>(
    initialVote ?? {
      confirm: 0,
      deny: 0,
      confidence: 'neutral',
      officialMv: 0,
      editedMv: 0,
      guidedVocal: 0,
      noGuidedVocal: 0,
    }
  );
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [userVote, setUserVote] = useState<'confirm' | 'deny' | null>(() => {
    try {
      return localStorage.getItem(LS_KEY_SONG(songId, brandId)) as 'confirm' | 'deny' | null;
    } catch {
      return null;
    }
  });
  const [userGuideVote, setUserGuideVote] = useState<'guided' | 'none' | null>(() => {
    try {
      return localStorage.getItem(LS_KEY_GUIDE(songId, brandId)) as 'guided' | 'none' | null;
    } catch {
      return null;
    }
  });
  const [isVoting, setIsVoting] = useState(false);
  const [isGuideVoting, setIsGuideVoting] = useState(false);

  useEffect(() => {
    if (!initialVote) return;

    setVoteData(prev => ({
      ...prev,
      ...initialVote,
      officialMv: initialVote.officialMv ?? prev.officialMv ?? 0,
      editedMv: initialVote.editedMv ?? prev.editedMv ?? 0,
      guidedVocal: initialVote.guidedVocal ?? prev.guidedVocal ?? 0,
      noGuidedVocal: initialVote.noGuidedVocal ?? prev.noGuidedVocal ?? 0,
    }));
  }, [initialVote]);

  const handleVote = useCallback(async (vote: 'confirm' | 'deny') => {
    if (isVoting) return;

    if (userVote === vote) {
      setIsVoting(true);
      setUserVote(null);
      setVoteData(prev => ({ ...prev, [vote]: Math.max(0, prev[vote] - 1) }));
      try { localStorage.removeItem(LS_KEY_SONG(songId, brandId)); } catch {}
      const result = await submitVote(songId, brandId, vote, { removeVote: true });
      if (result) {
        setVoteData(prev => ({
          ...prev,
          confirm: result.confirm,
          deny: result.deny,
          guidedVocal: result.guidedVocal ?? prev.guidedVocal ?? 0,
          noGuidedVocal: result.noGuidedVocal ?? prev.noGuidedVocal ?? 0,
          confidence: result.confidence,
        }));
      } else {
        setUserVote(vote);
        setVoteData(prev => ({ ...prev, [vote]: prev[vote] + 1 }));
        try { localStorage.setItem(LS_KEY_SONG(songId, brandId), vote); } catch {}
      }
      setIsVoting(false);
      return;
    }

    const previousVote = userVote;
    if (userVote !== null) {
      setVoteData(prev => ({ ...prev, [userVote]: Math.max(0, prev[userVote] - 1) }));
    }

    setIsVoting(true);
    setUserVote(vote);
    setVoteData(prev => ({ ...prev, [vote]: prev[vote] + 1 }));

    try { localStorage.setItem(LS_KEY_SONG(songId, brandId), vote); } catch {}

    const result = await submitVote(songId, brandId, vote, { previousVote });
    if (result) {
      setVoteData(prev => ({
        ...prev,
        confirm: result.confirm,
        deny: result.deny,
        guidedVocal: result.guidedVocal ?? prev.guidedVocal ?? 0,
          noGuidedVocal: result.noGuidedVocal ?? prev.noGuidedVocal ?? 0,
          confidence: result.confidence,
        }));
    } else {
      setUserVote(previousVote);
      setVoteData(prev => {
        const next = { ...prev, [vote]: Math.max(0, prev[vote] - 1) };
        if (previousVote) next[previousVote] += 1;
        return next;
      });
      try {
        if (previousVote) localStorage.setItem(LS_KEY_SONG(songId, brandId), previousVote);
        else localStorage.removeItem(LS_KEY_SONG(songId, brandId));
      } catch {}
    }

    setIsVoting(false);
  }, [brandId, isVoting, songId, userVote]);

  const handleGuideVote = useCallback(async (guideVote: 'guided' | 'none') => {
    if (isGuideVoting) return;

    const voteKey = guideVote === 'guided' ? 'guidedVocal' : 'noGuidedVocal';
    const previousKey = userGuideVote === 'guided' ? 'guidedVocal' : 'noGuidedVocal';

    if (userGuideVote === guideVote) {
      setIsGuideVoting(true);
      setUserGuideVote(null);
      setVoteData(prev => ({ ...prev, [voteKey]: Math.max(0, (prev[voteKey] || 0) - 1) }));
      try { localStorage.removeItem(LS_KEY_GUIDE(songId, brandId)); } catch {}
      const result = await submitGuidedVote(songId, brandId, guideVote, { removeVote: true });
      if (result) {
        setVoteData(prev => ({
          ...prev,
          confirm: result.confirm,
          deny: result.deny,
          guidedVocal: result.guidedVocal ?? 0,
          noGuidedVocal: result.noGuidedVocal ?? 0,
          confidence: result.confidence,
        }));
      } else {
        setUserGuideVote(guideVote);
        setVoteData(prev => ({ ...prev, [voteKey]: (prev[voteKey] || 0) + 1 }));
        try { localStorage.setItem(LS_KEY_GUIDE(songId, brandId), guideVote); } catch {}
      }
      setIsGuideVoting(false);
      return;
    }

    const previousGuideVote = userGuideVote;
    if (userGuideVote !== null) {
      setVoteData(prev => ({ ...prev, [previousKey]: Math.max(0, (prev[previousKey] || 0) - 1) }));
    }

    setIsGuideVoting(true);
    setUserGuideVote(guideVote);
    setVoteData(prev => ({ ...prev, [voteKey]: (prev[voteKey] || 0) + 1 }));

    try { localStorage.setItem(LS_KEY_GUIDE(songId, brandId), guideVote); } catch {}

    const result = await submitGuidedVote(songId, brandId, guideVote, { previousVote: previousGuideVote });
    if (result) {
      setVoteData(prev => ({
        ...prev,
        confirm: result.confirm,
        deny: result.deny,
        guidedVocal: result.guidedVocal ?? 0,
          noGuidedVocal: result.noGuidedVocal ?? 0,
          confidence: result.confidence,
        }));
    } else {
      setUserGuideVote(previousGuideVote);
      setVoteData(prev => {
        const next = { ...prev, [voteKey]: Math.max(0, (prev[voteKey] || 0) - 1) };
        if (previousGuideVote) next[previousKey] = (next[previousKey] || 0) + 1;
        return next;
      });
      try {
        if (previousGuideVote) localStorage.setItem(LS_KEY_GUIDE(songId, brandId), previousGuideVote);
        else localStorage.removeItem(LS_KEY_GUIDE(songId, brandId));
      } catch {}
    }
    setIsGuideVoting(false);
  }, [brandId, isGuideVoting, songId, userGuideVote]);

  const conf = CONFIDENCE_CONFIG[voteData.confidence];
  const songTotal = voteData.confirm + voteData.deny;
  const guidedCount = voteData.guidedVocal || 0;
  const noGuidedCount = voteData.noGuidedVocal || 0;
  const guideTotal = guidedCount + noGuidedCount;
  const songConfirmPct = songTotal > 0 ? Math.round((voteData.confirm / songTotal) * 100) : 0;
  const guidedPct = guideTotal > 0 ? Math.round((guidedCount / guideTotal) * 100) : 0;

  const buttonBaseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    borderRadius: '6px',
    padding: '3px 7px',
    fontSize: '0.72rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      marginTop: '8px',
      paddingTop: '8px',
      borderTop: '1px dashed rgba(255,255,255,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>
          歌曲對照
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); handleVote('confirm'); }}
            disabled={isVoting}
            title="現場可點到這首歌"
            style={{
              ...buttonBaseStyle,
              background: userVote === 'confirm' ? 'rgba(74,222,128,0.22)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${userVote === 'confirm' ? '#4ade80' : 'rgba(255,255,255,0.12)'}`,
              color: userVote === 'confirm' ? '#4ade80' : '#cbd5e1',
              fontWeight: userVote === 'confirm' ? 700 : 500,
            }}
          >
            <ThumbsUp size={11} />
            <span>有</span>
            {voteData.confirm > 0 && <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '0 4px', fontSize: '0.65rem' }}>{voteData.confirm}</span>}
          </button>

          <button
            onClick={e => { e.stopPropagation(); handleVote('deny'); }}
            disabled={isVoting}
            title="現場點不到這首歌"
            style={{
              ...buttonBaseStyle,
              background: userVote === 'deny' ? 'rgba(248,113,113,0.22)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${userVote === 'deny' ? '#f87171' : 'rgba(255,255,255,0.12)'}`,
              color: userVote === 'deny' ? '#f87171' : '#cbd5e1',
              fontWeight: userVote === 'deny' ? 700 : 500,
            }}
          >
            <ThumbsDown size={11} />
            <span>無</span>
            {voteData.deny > 0 && <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '0 4px', fontSize: '0.65rem' }}>{voteData.deny}</span>}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>
          導唱功能
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); handleGuideVote('guided'); }}
            title="現場可切換或播放導唱人聲"
            style={{
              ...buttonBaseStyle,
              background: userGuideVote === 'guided' ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${userGuideVote === 'guided' ? '#22d3ee' : 'rgba(255,255,255,0.12)'}`,
              color: userGuideVote === 'guided' ? '#22d3ee' : '#cbd5e1',
              fontWeight: userGuideVote === 'guided' ? 700 : 500,
            }}
          >
            <Mic2 size={11} />
            <span>有導唱</span>
            {guidedCount > 0 && <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '0 4px', fontSize: '0.65rem' }}>{guidedCount}</span>}
          </button>

          <button
            onClick={e => { e.stopPropagation(); handleGuideVote('none'); }}
            title="現場無法使用導唱人聲"
            style={{
              ...buttonBaseStyle,
              background: userGuideVote === 'none' ? 'rgba(251,146,60,0.22)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${userGuideVote === 'none' ? '#fb923c' : 'rgba(255,255,255,0.12)'}`,
              color: userGuideVote === 'none' ? '#fb923c' : '#cbd5e1',
              fontWeight: userGuideVote === 'none' ? 700 : 500,
            }}
          >
            <MicOff size={11} />
            <span>無導唱</span>
            {noGuidedCount > 0 && <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '0 4px', fontSize: '0.65rem' }}>{noGuidedCount}</span>}
          </button>
        </div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); setShowBreakdown(prev => !prev); }}
        style={{
          background: 'none',
          border: 'none',
          color: '#a855f7',
          fontSize: '0.7rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '3px',
          padding: '2px 0',
          width: '100%',
          fontWeight: 600,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <BarChart2 size={11} /> 檢視歌友回報比例
        </span>
        <ChevronDown size={12} style={{ transform: showBreakdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {showBreakdown && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '8px',
          padding: '8px 10px',
          marginTop: '2px',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          fontSize: '0.72rem',
        }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0', marginBottom: '3px', fontWeight: 600 }}>
              <span>歌曲可點比例</span>
              <span>{songConfirmPct}% ({voteData.confirm} 有 / {songTotal} 總票)</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${songConfirmPct}%`, background: '#4ade80', transition: 'width 0.3s' }} />
              <div style={{ width: `${100 - songConfirmPct}%`, background: '#f87171', transition: 'width 0.3s' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0', marginBottom: '3px', fontWeight: 600 }}>
              <span>導唱功能比例</span>
              <span>{guidedPct}% ({guidedCount} 有導唱 / {guideTotal} 總票)</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${guidedPct}%`, background: '#22d3ee', transition: 'width 0.3s' }} />
              <div style={{ width: `${100 - guidedPct}%`, background: '#fb923c', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
      )}

      {songTotal >= 3 && voteData.confidence !== 'neutral' && (
        <div style={{ marginTop: '2px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: conf.bg,
            border: `1px solid ${conf.color}44`,
            borderRadius: '4px',
            padding: '2px 6px',
            color: conf.color,
            fontSize: '0.68rem',
            fontWeight: 700,
          }}>
            {conf.icon}
            {conf.label}
          </span>
        </div>
      )}
    </div>
  );
};
