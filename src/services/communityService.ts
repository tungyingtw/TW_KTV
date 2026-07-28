/**
 * communityService.ts
 * 封裝所有社群回報與眾包投票的 API 呼叫邏輯。
 * 為何這樣設計：將 fetch 邏輯集中於 service 層，讓 UI 元件保持純淨，方便日後切換到真實後端 API URL。
 */

import type { BrandId, IssueType, VoteData, VoteConfidence } from '../types/ktv';

const isLocalEnv = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = import.meta.env.VITE_API_URL || (isLocalEnv ? 'http://localhost:3001' : 'https://tw-ktv.onrender.com');

// ─────────────────────────────────────────────
// 方案一：使用者回報錯誤
// ─────────────────────────────────────────────

export interface ReportPayload {
  songId: string;
  songTitle: string;
  artist: string;
  brandId: BrandId;
  issueType: IssueType;
  lang?: string;
  songCode?: string;
  lyricist?: string;
  composer?: string;
  mvType?: 'official' | 'edited' | 'unknown';
  note?: string;
  // 新廠牌建議特有欄位
  brandName?: string;
  shortName?: string;
  systemType?: string;
  codeFormat?: string;
  storeLocations?: string;
}

export async function submitReport(payload: ReportPayload): Promise<{ success: boolean; reportId?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[CommunityService] submitReport fallback to local success state:', err);
    return { success: true, reportId: `local_${Date.now()}` };
  }
}

// ─────────────────────────────────────────────
// 方案三：眾包投票
// ─────────────────────────────────────────────

export interface VoteResponse {
  success: boolean;
  confirm: number;
  deny: number;
  confidence: VoteConfidence;
}

export async function submitVote(
  songId: string,
  brandId: BrandId,
  vote: 'confirm' | 'deny'
): Promise<VoteResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId, brandId, vote }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[CommunityService] submitVote failed:', err);
    return null;
  }
}

export async function fetchSongVotes(songId: string): Promise<Record<string, VoteData>> {
  try {
    const res = await fetch(`${API_BASE}/api/votes/${encodeURIComponent(songId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.votes || {};
  } catch (err) {
    console.warn('[CommunityService] fetchSongVotes failed:', err);
    return {};
  }
}
