// 前台歌手別名、英文名、暱稱與雙聲母（注音/拼音）擴充對照表 (已大幅擴充至 80+ 組熱門歌手)

export const DEFAULT_FRONTEND_ALIASES: Record<string, string[]> = {
  // ── 1. 華語流行天王、天后與巨星 ──
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

  // ── 2. 第二波新增：經典情歌巨星與熱門歌手 ──
  '張宇': ['phil', 'phil chang', '宇哥', 'zy', 'ㄓㄩ'],
  '任賢齊': ['richie', 'richie jen', '小齊', 'rxq', 'ㄖㄒㄑ'],
  '伍佰': ['wu bai', 'wubai', '伍佰 & china blue', 'wb', 'ㄨㄅ'],
  '羅志祥': ['show', 'show lo', '小豬', 'lzx', 'ㄌㄓㄒ'],
  '潘瑋柏': ['wilber', 'wilber pan', '潘帥', 'pwb', 'ㄆㄨㄅ'],
  '周興哲': ['eric', 'eric chou', '情歌王子', 'zxz', 'ㄓㄒㄓ'],
  '周湯豪': ['nick', 'nickthereal', '湯豪', 'zth', 'ㄓㄊㄏ'],
  '陳零九': ['nine chen', '09', '零九', 'clj', 'ㄔㄌㄐ'],
  '邱鋒澤': ['feng ze', '鋒澤', 'qfz', 'ㄑㄈㄗ'],
  '黃偉晉': ['wayne huang', '偉晉', 'hwj', 'ㄏㄨㄐ'],
  '賴晏駒': ['lai', '小賴', 'lyj', 'ㄌㄧㄐ'],
  '五堅情': ['w0lf', 'w0lfs', 'w0lf(s)', 'wjq', 'ㄨㄐㄑ'],
  '李聖傑': ['sam lee', '情歌王子', 'lsj', 'ㄌㄙㄐ'],
  '林宥嘉': ['yoga', 'yoga lin', '宥嘉', 'lyj', 'ㄌㄧㄐ'],
  '盧廣仲': ['crowd lu', 'crowd', '小隊長', 'lgz', 'ㄌㄍㄓ'],
  '吳青峰': ['greeny', '青峰', 'wqf', 'ㄨㄑㄈ'],
  '戴佩妮': ['penny', 'penny tai', 'dpn', 'ㄉㄆㄋ'],
  'A-Lin': ['a-lin', 'alin', '黃麗玲', '天生歌姬', 'hll', 'ㄏㄌㄌ'],
  '黃麗玲': ['a-lin', 'alin', 'a-lin', 'hll', 'ㄏㄌㄌ'],
  '彭佳慧': ['julia', 'julia peng', '鐵肺歌后', 'pjh', 'ㄆㄐㄏ'],
  '范瑋琪': ['fanfan', 'christine fan', '范范', 'fwq', 'ㄈㄨㄑ'],
  '張韶涵': ['angela', 'angela zhang', '韶涵', 'zsh', 'ㄓㄕㄏ'],
  '郭靜': ['claire', 'claire kuo', '純愛天后', 'gj', 'ㄍㄐ'],
  '丁噹': ['della', '全民情歌天后', 'dd', 'ㄉㄉ'],
  '家家': ['jiajia', '靈魂歌姬', 'jj', 'ㄐㄐ'],
  '閻奕格': ['janice yan', 'janice', '格格', 'yyg', 'ㄧㄧㄍ'],
  '陳芳語': ['kimberley', 'kimberley chen', '芳語', 'cfy', 'ㄔㄈㄩ'],
  '黃霄雲': ['ghost', '麵包妹', 'hxy', 'ㄏㄒㄩ'],
  '汪蘇瀧': ['silence wang', 'silence', '瀧瀧', 'wsl', 'ㄨㄙㄌ'],
  '許嵩': ['vae', '嵩哥', 'xs', 'ㄒㄙ'],
  '薛之謙': ['joker', 'joker xue', '老薛', 'xzq', 'ㄒㄓㄑ'],
  '毛不易': ['mao buyi', '毛毛', 'mby', 'ㄇㄅㄧ'],
  '周深': ['charlie', 'charlie zhou', '深深', 'zs', 'ㄓㄕ'],
  '華晨宇': ['chenyu hua', '花花', 'hcy', 'ㄏㄩ'],

  // ── 3. 熱門獨立樂團與組合 ──
  '宇宙人': ['cosmos people', 'yzr', 'ㄩㄗㄖ'],
  '麋先生': ['mixer', 'mxs', 'ㄇㄒㄙ'],
  '理想混蛋': ['bestards', '雞丁', 'lxhd', 'ㄌㄒㄏㄉ'],
  '美秀集團': ['amazing show', '美秀', 'mxjt', 'ㄇㄒㄐㄊ'],
  '血肉果汁機': ['flesh juicer', '血肉', 'xrgzj', 'ㄒㄖㄍㄗㄐ'],
  '老王樂隊': ['your woman sleepwith others', '老王', 'lwyd', 'ㄌㄨㄩㄉ'],

  // ── 4. 熱門日韓與國際歌手 ──
  'YOASOBI': ['yoasobi', '幾田莉子', 'ayase'],
  'Ado': ['ado'],
  '米津玄師': ['kenshi yonezu', 'hachi', '八爺', 'mjxs', 'ㄇㄐㄒㄕ'],
  'IU': ['iu', '李知恩', '國民妹妹', 'lze', 'ㄌㄓㄣ'],
  'BLACKPINK': ['blackpink', 'bp'],
  'BTS': ['bts', '防彈少年團', '防彈', 'fdsnt', 'ㄈㄉㄕㄋㄊ'],
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
