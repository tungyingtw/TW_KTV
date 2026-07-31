// 前台歌手別名、英文名、暱稱與雙聲母（注音/拼音）擴充對照表

export const DEFAULT_FRONTEND_ALIASES: Record<string, string[]> = {
  '周杰倫': ['jay', 'jay chou', 'chou jay', '周董', 'jay哥', 'zjl', 'ㄓㄐㄌ'],
  '蔡依林': ['jolin', 'jolin tsai', '呸姐', '怪美的', 'cyl', 'ㄘㄧㄌ'],
  '林俊傑': ['jj', 'jj lin', 'ljj', 'ㄌㄐㄐ'],
  '陳奕迅': ['eason', 'eason chan', 'e神', '吹神', 'cyx', 'ㄔㄧㄒ'],
  '五月天': ['mayday', 'wyt', 'ㄨㄩㄊ'],
  '告五人': ['accusefive', '告五', 'gwr', 'ㄍㄠㄨㄖ'],
  '草東沒有派對': ['no party for cao dong', 'nopartyforcaodong', '草東', 'cdmyd', 'ㄘㄠㄉㄇㄧㄆㄉ'],
  '鄧紫棋': ['gem', 'g.e.m.', '解解', 'dzq', 'ㄉㄗㄑ'],
  '張惠妹': ['amei', 'a-mei', '阿妹', '阿密特', 'amit', 'zhm', 'ㄓㄏㄇ'],
  '王心凌': ['cyndi', 'cyndi wang', '甜蜜教主', 'wxl', 'ㄨㄒㄌ'],
  '田馥甄': ['hebe', 'tfz', 'ㄊㄈㄓ'],
  '楊丞琳': ['rainie', 'rainie yang', 'ycl', 'ㄧㄔㄌ'],
  '蕭敬騰': ['jam', 'jam hsiao', '雨神', 'xjt', 'ㄒㄐㄊ'],
  '張震嶽': ['ayugmun', '海雅谷慕', 'zzy', 'ㄓㄓㄩ'],
  '韋禮安': ['weibird', 'wla', 'ㄨㄌㄢ'],
  '王力宏': ['leehom', 'leehom wang', 'wlh', 'ㄨㄌㄏ'],
  '陶喆': ['david tao', 'tz', 'ㄊㄓ'],
  '張學友': ['jacky', 'jacky cheung', '歌神', 'zxy', 'ㄓㄒㄧ'],
  '劉德華': ['andy', 'andy lau', '華仔', 'ldh', 'ㄌㄉㄏ'],
  '郭富城': ['aaron', 'aaron kwok', 'gfc', 'ㄍㄈㄔ'],
  '黎明': ['leon', 'leon lai', 'lm', 'ㄌㄇ'],
  '莫文蔚': ['karen', 'karen mok', 'mww', 'ㄇㄨㄨ'],
  '孫燕姿': ['stefanie', 'stefanie sun', 'syz', 'ㄙㄧㄗ'],
  '梁靜茹': ['fish', 'fish leong', '情歌天后', 'ljr', 'ㄌㄐㄖ'],
  '徐佳瑩': ['lala', 'lala hsu', '拉拉', 'xjy', 'ㄒㄐㄧ'],
  '王菲': ['faye', 'faye wong', '天后', 'wf', 'ㄨㄈ'],
  '高爾宣': ['osn', 'gex', 'ㄍㄦㄒ'],
  '瘦子': ['eso', 'e.so', '瘦子e.so', 'sz', 'ㄙㄗ'],
  '頑童': ['mj116', '頑童mj116', 'wt', 'ㄨㄊ'],
  '玖壹壹': ['911', 'nine one one', 'jyy', 'ㄐㄧㄧ'],
  '八三夭': ['831', 'bsy', 'ㄅㄙㄧ'],
  '動力火車': ['power station', 'dlhc', 'ㄉㄌㄏㄔ'],
  '蘇打綠': ['sodagreen', '魚丁糸', 'sdl', 'ㄙㄉㄌ'],
  '魚丁糸': ['sodagreen', '蘇打綠', 'ydm', 'ㄩㄉㄇ'],
  '茄子蛋': ['eggplantegg', 'qzd', 'ㄑㄗㄉ'],
  '落日飛車': ['sunset rollercoaster', 'lrfc', 'ㄌㄖㄈㄔ'],
  'SHE': ['s.h.e', 'she'],
  'S.H.E': ['she', 's.h.e'],
};

/**
 * 前台廣義查詢擴充：給定 rawQuery，傳回匹配歌手對照與衍生搜尋字詞 Set
 */
export function expandFrontendQuery(rawQuery: string): { matchedArtists: Set<string>; expandedTerms: string[] } {
  const q = rawQuery.trim().toLowerCase();
  const matchedArtists = new Set<string>();
  const expandedTerms = new Set<string>([q]);

  if (!q) return { matchedArtists, expandedTerms: [] };

  for (const [artistName, aliases] of Object.entries(DEFAULT_FRONTEND_ALIASES)) {
    const normArtist = artistName.toLowerCase();

    if (normArtist === q || normArtist.includes(q)) {
      matchedArtists.add(artistName);
      aliases.forEach(a => expandedTerms.add(a));
    }

    const isAliasMatch = aliases.some(alias => alias === q || (q.length >= 2 && alias.includes(q)));
    if (isAliasMatch) {
      matchedArtists.add(artistName);
      expandedTerms.add(normArtist);
      aliases.forEach(a => expandedTerms.add(a));
    }
  }

  return {
    matchedArtists,
    expandedTerms: Array.from(expandedTerms),
  };
}
