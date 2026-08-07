/**
 * 台灣 KTV 點歌系統 — 全站統一語種莫蘭迪粉彩標籤色彩系統
 * 視覺規範：低彩度粉彩透明底色 (12% opacity) + 微光內鑲細邊框 (30% opacity border) + 專屬顏色
 * 與 KTV 門市/平台實心強對比標籤 100% 視覺風格區隔，絕不混淆！
 */

export interface LanguageStyle {
  color: string;
  bg: string;
  border: string;
}

const LANGUAGE_STYLE_MAP: Record<string, LanguageStyle> = {
  '全部': { color: '#f472b6', bg: 'rgba(244, 114, 182, 0.18)', border: 'rgba(244, 114, 182, 0.48)' },
  '國語': { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.32)' },
  '台語': { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.32)' },
  '粵語': { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.32)' },
  '英語': { color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.12)', border: 'rgba(45, 212, 191, 0.32)' },
  '日語': { color: '#f472b6', bg: 'rgba(244, 114, 182, 0.12)', border: 'rgba(244, 114, 182, 0.32)' },
  '韓語': { color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.32)' },
  '客語': { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)', border: 'rgba(74, 222, 128, 0.32)' },
  '陸歌': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.32)' },
  '兒歌': { color: '#facc15', bg: 'rgba(250, 204, 21, 0.12)', border: 'rgba(250, 204, 21, 0.32)' },
  '原住民語': { color: '#fb7185', bg: 'rgba(251, 113, 133, 0.12)', border: 'rgba(251, 113, 133, 0.32)' },
  '藏語': { color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.32)' },
};

const DEFAULT_STYLE: LanguageStyle = {
  color: '#94a3b8',
  bg: 'rgba(148, 163, 184, 0.12)',
  border: 'rgba(148, 163, 184, 0.28)',
};

/**
 * 取得語種對應之專屬莫蘭迪風格物件
 * @param lang 語種全名或單字縮寫 (如 '國語' 或 '國')
 */
export function getLanguageStyle(lang?: string): LanguageStyle {
  if (!lang) return DEFAULT_STYLE;

  const raw = String(lang).trim();
  const norm = raw === '國' ? '國語' :
               raw === '台' ? '台語' :
               raw === '粵' ? '粵語' :
               raw === '英' ? '英語' :
               raw === '日' ? '日語' :
               raw === '韓' ? '韓語' :
               raw === '客' ? '客語' :
               raw === '兒' ? '兒歌' :
               raw === '山' ? '原住民語' :
               raw === '藏' ? '藏語' : raw;

  return LANGUAGE_STYLE_MAP[norm] || DEFAULT_STYLE;
}
