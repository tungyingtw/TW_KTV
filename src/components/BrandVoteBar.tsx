import React, { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, ShieldCheck, AlertCircle, HelpCircle, Video, Film, BarChart2, ChevronDown } from 'lucide-react';
import type { BrandId, VoteData, VoteConfidence } from '../types/ktv';
import { submitVote, submitReport } from '../services/communityService';

interface BrandVoteBarProps {
  songId: string;
  brandId: BrandId;
  initialVote?: VoteData;
}

const CONFIDENCE_CONFIG: Record<VoteConfidence, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  neutral:   { icon: <HelpCircle size={11} />,  label: '',       color: 'transparent', bg: 'transparent' },
  verified:  { icon: <ShieldCheck size={11} />, label: '歌友對照可唱', color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
  disputed:  { icon: <AlertCircle size={11} />, label: '回報點不到歌', color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  uncertain: { icon: <HelpCircle size={11} />,  label: '資料實測中', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
};

/** 用 localStorage 記錄使用者本機曾投過的票，防止單一瀏覽器重複投票 */
const LS_KEY_SONG = (songId: string, brandId: string) => `ktv_vote_${songId}_${brandId}`;
const LS_KEY_MV = (songId: string, brandId: string) => `ktv_mv_vote_${songId}_${brandId}`;

export const BrandVoteBar: React.FC<BrandVoteBarProps> = ({ songId, brandId, initialVote }) => {
  const [voteData, setVoteData] = useState<VoteData>(
    initialVote ?? { confirm: 0, deny: 0, confidence: 'neutral', officialMv: 0, editedMv: 0 }
  );

  const [showBreakdown, setShowBreakdown] = useState(false);

  // 從 localStorage 取得歌曲收錄實測票
  const [userVote, setUserVote] = useState<'confirm' | 'deny' | null>(() => {
    try {
      return (localStorage.getItem(LS_KEY_SONG(songId, brandId)) as 'confirm' | 'deny' | null);
    } catch {
      return null;
    }
  });

  // 從 localStorage 取得 MV 類型實測票
  const [userMvVote, setUserMvVote] = useState<'official' | 'edited' | null>(() => {
    try {
      return (localStorage.getItem(LS_KEY_MV(songId, brandId)) as 'official' | 'edited' | null);
    } catch {
      return null;
    }
  });

  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (initialVote) {
      setVoteData(prev => ({
        ...prev,
        ...initialVote,
        officialMv: initialVote.officialMv ?? prev.officialMv ?? 0,
        editedMv: initialVote.editedMv ?? prev.editedMv ?? 0,
      }));
    }
  }, [initialVote]);

  const handleVote = useCallback(async (vote: 'confirm' | 'deny') => {
    if (isVoting) return;

    if (userVote === vote) {
      setUserVote(null);
      setVoteData(prev => ({
        ...prev,
        [vote]: Math.max(0, prev[vote] - 1),
      }));
      try { localStorage.removeItem(LS_KEY_SONG(songId, brandId)); } catch {}
      return;
    }

    if (userVote !== null) {
      setVoteData(prev => ({
        ...prev,
        [userVote]: Math.max(0, prev[userVote] - 1),
      }));
    }

    setIsVoting(true);
    setUserVote(vote);

    setVoteData(prev => ({
      ...prev,
      [vote]: prev[vote] + 1,
    }));

    try { localStorage.setItem(LS_KEY_SONG(songId, brandId), vote); } catch {}

    const result = await submitVote(songId, brandId, vote);
    if (result) {
      setVoteData(prev => ({ ...prev, confirm: result.confirm, deny: result.deny, confidence: result.confidence }));
    }
    setIsVoting(false);
  }, [songId, brandId, isVoting, userVote]);

  const handleMvVote = useCallback(async (mvVote: 'official' | 'edited') => {
    if (userMvVote === mvVote) {
      setUserMvVote(null);
      setVoteData(prev => ({
        ...prev,
        [mvVote === 'official' ? 'officialMv' : 'editedMv']: Math.max(0, (prev[mvVote === 'official' ? 'officialMv' : 'editedMv'] || 0) - 1),
      }));
      try { localStorage.removeItem(LS_KEY_MV(songId, brandId)); } catch {}
      return;
    }

    if (userMvVote !== null) {
      setVoteData(prev => ({
        ...prev,
        [userMvVote === 'official' ? 'officialMv' : 'editedMv']: Math.max(0, (prev[userMvVote === 'official' ? 'officialMv' : 'editedMv'] || 0) - 1),
      }));
    }

    setUserMvVote(mvVote);
    setVoteData(prev => ({
      ...prev,
      [mvVote === 'official' ? 'officialMv' : 'editedMv']: (prev[mvVote === 'official' ? 'officialMv' : 'editedMv'] || 0) + 1,
    }));

    try { localStorage.setItem(LS_KEY_MV(songId, brandId), mvVote); } catch {}

    submitReport({
      songId,
      songTitle: '',
      artist: '',
      brandId,
      issueType: 'other',
      note: `[MV畫面對照] 現場回報為: ${mvVote === 'official' ? '原版MV' : '非原版/剪輯MV'}`,
    });
  }, [songId, brandId, userMvVote]);

  const conf = CONFIDENCE_CONFIG[voteData.confidence];
  const total = voteData.confirm + voteData.deny;
  const officialCount = voteData.officialMv || 0;
  const editedCount = voteData.editedMv || 0;
  const mvTotal = officialCount + editedCount;

  const songConfirmPct = total > 0 ? Math.round((voteData.confirm / total) * 100) : 0;
  const mvOfficialPct = mvTotal > 0 ? Math.round((officialCount / mvTotal) * 100) : 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      marginTop: '8px',
      paddingTop: '8px',
      borderTop: '1px dashed rgba(255,255,255,0.08)',
    }}>
      {/* ── 1. 現場歌曲收錄實測票選 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>
          🎤 歌曲對照：
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); handleVote('confirm'); }}
            disabled={isVoting}
            title="點擊回報：我在這家 KTV 現場有點到這首歌 (唱得到)"
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              background: userVote === 'confirm' ? 'rgba(74,222,128,0.22)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${userVote === 'confirm' ? '#4ade80' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '6px', padding: '3px 7px',
              color: userVote === 'confirm' ? '#4ade80' : '#cbd5e1',
              fontSize: '0.72rem', cursor: 'pointer',
              fontWeight: userVote === 'confirm' ? 700 : 500,
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <ThumbsUp size={11} />
            <span>唱得到</span>
            {voteData.confirm > 0 && <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '0 4px', fontSize: '0.65rem' }}>{voteData.confirm}</span>}
          </button>

          <button
            onClick={e => { e.stopPropagation(); handleVote('deny'); }}
            disabled={isVoting}
            title="點擊回報：我在這家 KTV 現場點不到這首歌"
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              background: userVote === 'deny' ? 'rgba(248,113,113,0.22)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${userVote === 'deny' ? '#f87171' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '6px', padding: '3px 7px',
              color: userVote === 'deny' ? '#f87171' : '#cbd5e1',
              fontSize: '0.72rem', cursor: 'pointer',
              fontWeight: userVote === 'deny' ? 700 : 500,
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <ThumbsDown size={11} />
            <span>點不到</span>
            {voteData.deny > 0 && <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '0 4px', fontSize: '0.65rem' }}>{voteData.deny}</span>}
          </button>
        </div>
      </div>

      {/* ── 2. MV 畫面類型對照票選 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>
          🎬 MV 畫面：
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); handleMvVote('official'); }}
            title="點擊回報：現場包廂播出來是歌手官方原版 MV"
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              background: userMvVote === 'official' ? 'rgba(56,189,248,0.22)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${userMvVote === 'official' ? '#38bdf8' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '6px', padding: '3px 7px',
              color: userMvVote === 'official' ? '#38bdf8' : '#cbd5e1',
              fontSize: '0.72rem', cursor: 'pointer',
              fontWeight: userMvVote === 'official' ? 700 : 500,
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <Video size={11} />
            <span>原版 MV</span>
            {officialCount > 0 && <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '0 4px', fontSize: '0.65rem' }}>{officialCount}</span>}
          </button>

          <button
            onClick={e => { e.stopPropagation(); handleMvVote('edited'); }}
            title="點擊回報：現場包廂播出來是風景或文字重製剪輯 MV"
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              background: userMvVote === 'edited' ? 'rgba(251,146,60,0.22)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${userMvVote === 'edited' ? '#fb923c' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '6px', padding: '3px 7px',
              color: userMvVote === 'edited' ? '#fb923c' : '#cbd5e1',
              fontSize: '0.72rem', cursor: 'pointer',
              fontWeight: userMvVote === 'edited' ? 700 : 500,
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <Film size={11} />
            <span>非原版/剪輯</span>
            {editedCount > 0 && <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '0 4px', fontSize: '0.65rem' }}>{editedCount}</span>}
          </button>
        </div>
      </div>

      {/* ── 3. 點擊查看歌友對照比例條 ── */}
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
          <BarChart2 size={11} /> 點擊檢視歌友對照比例
        </span>
        <ChevronDown size={12} style={{ transform: showBreakdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {/* 展開比例條圖表 */}
      {showBreakdown && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '8px',
          padding: '8px 10px',
          marginTop: '2px',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          fontSize: '0.72rem',
        }}>
          {/* 歌曲收錄對照比例 */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0', marginBottom: '3px', fontWeight: 600 }}>
              <span>🎤 唱得到比例</span>
              <span>{songConfirmPct}% ({voteData.confirm} 唱得到 / {total} 總票)</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${songConfirmPct}%`, background: '#4ade80', transition: 'width 0.3s' }} />
              <div style={{ width: `${100 - songConfirmPct}%`, background: '#f87171', transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* MV 畫面類型比例 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0', marginBottom: '3px', fontWeight: 600 }}>
              <span>🎬 原版 MV 比例</span>
              <span>{mvOfficialPct}% ({officialCount} 原版 / {mvTotal} 總票)</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${mvOfficialPct}%`, background: '#38bdf8', transition: 'width 0.3s' }} />
              <div style={{ width: `${100 - mvOfficialPct}%`, background: '#fb923c', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
      )}

      {/* 社群驗證狀態標籤 */}
      {total >= 3 && voteData.confidence !== 'neutral' && (
        <div style={{ marginTop: '2px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: conf.bg,
            border: `1px solid ${conf.color}44`,
            borderRadius: '4px', padding: '2px 6px',
            color: conf.color, fontSize: '0.68rem', fontWeight: 700,
          }}>
            {conf.icon}
            {conf.label}
          </span>
        </div>
      )}
    </div>
  );
};


