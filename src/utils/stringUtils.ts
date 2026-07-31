/**
 * 移除標點符號與多餘空白，便於歌曲資訊模糊比對
 */
export function stripPunctuation(str: string): string {
  if (!str) return '';
  return str.replace(/[^\w\u4e00-\u9fa5]/g, '').toLowerCase();
}

/**
 * 簡易繁簡中文及字串正規化轉換 (用於搜尋比對)
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  let normalized = str.trim().toLowerCase();
  
  // 常見搜尋關鍵字繁簡對照表 (Simp -> Trad)
  const simpMap: Record<string, string> = {
    '爱': '愛', '国': '國', '听': '聽', '欢': '歡', '风': '風',
    '梦': '夢', '亲': '親', '头': '頭', '话': '話', '远': '遠',
    '让': '讓', '离': '離', '时': '時', '长': '長', '声': '聲',
    '乐': '樂', '书': '書', '门': '門', '见': '見', '对': '對',
    '难': '難', '过': '過', '还': '還', '动': '動', '飞': '飛',
  };

  let result = '';
  for (const char of normalized) {
    result += simpMap[char] || char;
  }
  return result;
}

/**
 * 在文字中高亮顯示與搜尋關鍵字匹配的子字串
 */
export function getHighlightedParts(text: string, query: string): { text: string; isMatch: boolean }[] {
  if (!query.trim() || !text) {
    return [{ text, isMatch: false }];
  }

  const normalizedQuery = stripPunctuation(query);
  const normalizedText = stripPunctuation(text);

  if (!normalizedQuery || !normalizedText.includes(normalizedQuery)) {
    return [{ text, isMatch: false }];
  }

  const parts: { text: string; isMatch: boolean }[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.trim().toLowerCase();

  let startIndex = 0;
  let matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    // 若精確比對不到但正規化能比對到，全段作輕微高亮
    return [{ text, isMatch: true }];
  }

  while (matchIndex !== -1) {
    if (matchIndex > startIndex) {
      parts.push({ text: text.substring(startIndex, matchIndex), isMatch: false });
    }
    parts.push({ text: text.substring(matchIndex, matchIndex + lowerQuery.length), isMatch: true });
    startIndex = matchIndex + lowerQuery.length;
    matchIndex = lowerText.indexOf(lowerQuery, startIndex);
  }

  if (startIndex < text.length) {
    parts.push({ text: text.substring(startIndex), isMatch: false });
  }

  return parts;
}
