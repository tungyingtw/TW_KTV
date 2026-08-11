export type BrandId = 
  | 'cashbox' 
  | 'holiday' 
  | 'watering_hole' 
  | 'starlight' 
  | 'singgo' 
  | 'vmix' 
  | 'superstar' 
  | 'silver_cabinet'
  | 'yinyuan' 
  | 'golden_voice' 
  | 'hongyin'
  | (string & {});

export interface BrandInfo {
  id: BrandId;
  name: string;
  shortName: string;
  color: string;
  badgeBg: string;
  description: string;
}

export type AudioType = 'guided_vocal' | 'backing_track';
export type MvType = 'official_mv' | 'live_mv' | 'reedited_mv' | 'anime_mv';
export type Language =
  | '國語'
  | '台語'
  | '粵語'
  | '英語'
  | '日語'
  | '韓語'
  | '陸歌'
  | '客語'
  | '兒歌'
  | '原住民語'
  | '藏語';

export interface BrandSongStatus {
  available?: boolean;
  audioType?: AudioType;
  mvType?: MvType;
  note?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  lyricist?: string;
  composer?: string;
  language: Language;
  zhuyin?: string;
  pinyin?: string;
  releaseYear?: number;
  popularRank?: number;
  lyricsSnippet?: string;
  youtubeUrl?: string;
  isMainlandViral?: boolean;
  isNiche?: boolean; // 新增：是否為冷門/獨立/特定廠牌獨家歌曲
  brands: Record<BrandId, BrandSongStatus>;
}

// ─────────────────────────────────────────────
// 社群投票 & 回報系統型別
// ─────────────────────────────────────────────

/** 社群置信度狀態 */
export type VoteConfidence = 'neutral' | 'verified' | 'disputed' | 'uncertain';

/** MV 類型社群投票選項 */
export type MvVoteType = 'official' | 'edited';

/** 單一廠牌的投票資料 */
export interface VoteData {
  confirm: number;       // 確認「唱得到 (有此歌)」的票數
  deny: number;          // 否定「點不到 (無此歌)」的票數
  officialMv?: number;   // 實測「原版 MV」票數
  editedMv?: number;     // 實測「非原版/剪輯 MV」票數
  confidence: VoteConfidence;
  guidedVocal?: number;
  noGuidedVocal?: number;
  userVote?: 'confirm' | 'deny';
  userMvVote?: 'official' | 'edited';
  userGuideVote?: 'guided' | 'none';
}

/** 一首歌所有廠牌的投票集合 */
export type SongVotes = Partial<Record<BrandId, VoteData>>;

/** 回報問題類型 */
export type IssueType =
  | 'no_song'            // 實際上沒有此歌
  | 'has_song'           // 實際上有此歌（系統標為未收錄）
  | 'missing_song'       // 資料庫根本缺少這首歌
  | 'suggest_song'       // 使用者建議新增歌曲，需後台審核
  | 'suggest_new_brand'  // KTV 新廠牌或新系統建議
  | 'wrong_info'         // 歌名/歌手/年分等資訊有誤
  | 'other';             // 其他

export type TitleLengthFilter = 'all' | '1' | '2' | '3' | '4' | '5' | '6' | '7+';

export interface FilterOptions {
  searchQuery: string;
  selectedBrand: BrandId | 'all';
  selectedBrands: BrandId[]; // 支援複選多家廠牌比對
  brandFilterMode: 'any' | 'all_of_them'; // 'any'=任一家有收錄，'all_of_them'=所選廠牌全部都有收錄
  selectedLanguages: Language[];
  selectedTitleLength: TitleLengthFilter;
  onlyOfficialMv: boolean;
  onlyGuidedVocal: boolean;
  onlyMainlandViral: boolean;
  onlyNicheSongs: boolean; // 僅看冷門/獨立私房對照歌曲
  viewMode: 'matrix' | 'cards';
  sortBy: 'length' | 'stroke' | 'popular' | 'title';
}
