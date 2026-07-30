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
  hasOriginalVocal?: boolean;
  lyricsSnippet?: string;
  youtubeUrl?: string;
  // 新廠牌建議特有欄位
  brandName?: string;
  shortName?: string;
  systemType?: string;
  codeFormat?: string;
  storeLocations?: string;
}

export async function submitReport(payload: ReportPayload): Promise<{ success: boolean; reportId?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[CommunityService] submitReport failed:', err);
    return { success: false, error: '回報送出失敗，請稍後再試。' };
  }
}

export async function submitSuggestSong(payload: {
  title: string;
  artist: string;
  lyricist?: string;
  composer?: string;
  language: string;
  songCode?: string;
  brandId: BrandId;
  hasOfficialMv?: boolean;
  hasOriginalVocal?: boolean;
  lyricsSnippet?: string;
  youtubeUrl?: string;
}): Promise<{ success: boolean; reportId?: string; error?: string }> {
  return submitReport({
    songId: 'suggest_new_song',
    songTitle: payload.title,
    artist: payload.artist,
    brandId: payload.brandId || 'cashbox',
    issueType: 'suggest_song',
    lang: payload.language,
    songCode: payload.songCode,
    lyricist: payload.lyricist,
    composer: payload.composer,
    mvType: payload.hasOfficialMv ? 'official' : 'unknown',
    hasOriginalVocal: payload.hasOriginalVocal,
    lyricsSnippet: payload.lyricsSnippet,
    youtubeUrl: payload.youtubeUrl,
    note: `[新歌建議] 語種:${payload.language} | MV:${payload.hasOfficialMv ? '有' : '無'} | 原唱:${payload.hasOriginalVocal ? '有' : '無'} | 歌詞:${payload.lyricsSnippet || ''} | URL:${payload.youtubeUrl || ''}`,
  });
}

export async function submitSuggestBrand(payload: {
  brandName: string;
  shortName: string;
  systemType?: string;
  codeFormat?: string;
  storeLocations?: string;
  note?: string;
}): Promise<{ success: boolean; reportId?: string; error?: string }> {
  return submitReport({
    songId: 'suggest_new_brand',
    songTitle: payload.brandName,
    artist: payload.shortName,
    brandId: 'cashbox',
    issueType: 'suggest_new_brand',
    brandName: payload.brandName,
    shortName: payload.shortName,
    systemType: payload.systemType,
    codeFormat: payload.codeFormat,
    storeLocations: payload.storeLocations,
    note: `[新廠牌建議] 系統:${payload.systemType || ''} | 格式:${payload.codeFormat || ''} | 據點:${payload.storeLocations || ''} | 備註:${payload.note || ''}`,
  });
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
