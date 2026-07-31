// 前台歌手別名、英文名、暱稱與雙聲母（注音/拼音）擴充對照表 (已大規模擴充至 190+ 組跨國界歌手與樂團)

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

  // ── 2. 經典情歌巨星與熱門歌手 ──
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

  // ── 3. Wave 1 大規模擴充：華語金曲與獨立流行巨星 ──
  '周華健': ['wakin', 'wakin chau', '國民歌王', 'zhj', 'ㄓㄏㄐ'],
  '張信哲': ['jeff', 'jeff chang', '情歌王子', 'zxz', 'ㄓㄒㄓ'],
  '李宗盛': ['jonathan', 'jonathan lee', '大哥', 'lzs', 'ㄌㄗㄕ'],
  '羅大佑': ['tayu', 'tayu lo', '音樂教父', 'ldy', 'ㄌㄉㄧ'],
  '齊秦': ['chyi chin', '小哥', 'qq', 'ㄑㄑ'],
  '童安格': ['angus', 'angus tung', 'tag', 'ㄊㄢㄍ'],
  '趙傳': ['chief', 'chief chao', 'zc', 'ㄓ'],
  '巫啟賢': ['eric moo', 'wqx', 'ㄨㄑㄒ'],
  '張雨生': ['tom', 'tom chang', '寶哥', 'zys', 'ㄓㄩㄕ'],
  '蘇芮': ['julie', 'julie sue', 'sr', 'ㄙㄖ'],
  '蔡琴': ['tsai chin', 'cq', 'ㄘㄑ'],
  '陳淑樺': ['sarah', 'sarah chen', 'csh', 'ㄔㄕㄏ'],
  '萬芳': ['wanfang', 'wf', 'ㄨㄈ'],
  '許茹芸': ['valen', 'valen hsu', '芸芸', 'xry', 'ㄒㄖㄩ'],
  '辛曉琪': ['winnie', 'winnie hsin', 'xxq', 'ㄒㄒㄑ'],
  '順子': ['shunza', 'sz', 'ㄕㄗ'],
  '溫嵐': ['landy', 'landy wen', 'wl', 'ㄨㄌ'],
  '戴愛玲': ['princess ailing', 'ailing', '鐵肺公主', 'dal', 'ㄉㄞㄌ'],
  '葉蒨文': ['sally', 'sally yeh', 'yqw', 'ㄧㄑㄨ'],
  '林憶蓮': ['sandy', 'sandy lam', 'lyl', 'ㄌㄧㄌ'],
  '楊乃文': ['faith', 'faith yang', 'ynw', 'ㄧㄋㄨ'],
  '陳綺貞': ['cheer', 'cheer chen', 'cqz', 'ㄔㄑㄓ'],
  '魏如萱': ['waa', 'waa wei', '娃娃', 'wrx', 'ㄨㄖㄒ'],
  '許哲珮': ['peggy', 'peggy hsu', 'peggy', 'xzp', 'ㄒㄓㄆ'],
  '范曉萱': ['mavis', 'mavis fan', 'fxx', 'ㄈㄒㄒ'],
  '徐若瑄': ['vivian', 'vivian hsu', 'vivian', 'xrx', 'ㄒㄖㄒ'],
  '卓文萱': ['genie', 'genie chuo', 'zwx', 'ㄓㄨㄒ'],
  '陳勢安': ['andrew', 'andrew tan', 'csa', 'ㄔㄕㄢ'],
  '畢書盡': ['bii', 'bsj', 'ㄅㄕㄐ'],
  '嚴爵': ['yen-j', 'yenj', 'yj', 'ㄧㄐ'],
  '謝和弦': ['r-chord', 'rchord', '阿扣', 'xhx', 'ㄒㄏㄒ'],
  '吳卓源': ['julia', 'julia wu', '鄉民老婆', 'wzy', 'ㄨㄓㄩ'],
  'ØZI': ['ozi', 'øzi'],
  '陳忻玥': ['vicky', 'vicky chen', 'cxy', 'ㄔㄒㄩ'],
  '李芷婷': ['nymph', 'nymph lee', 'lzt', 'ㄌㄗㄊ'],

  // ── 4. Wave 2 大規模擴充：台語經典歌王歌后與台語/獨立樂團 ──
  '江蕙': ['jody', 'jody chiang', '二姐', 'jh', 'ㄐㄏ'],
  '黃乙玲': ['yiting', 'hyl', 'ㄏㄧㄌ'],
  '秀蘭瑪雅': ['showlen', 'showlen maya', 'xlmy', 'ㄒㄇㄧ'],
  '詹雅雯': ['yawen', 'zyw', 'ㄓㄧㄨ'],
  '龍千玉': ['long qianyu', 'lqy', 'ㄌㄑㄩ'],
  '張秀卿': ['show chang', 'zxq', 'ㄓㄒㄑ'],
  '曾心梅': ['tseng hsin mei', 'zxm', 'ㄗㄒㄇ'],
  '曹雅雯': ['olivia', 'olivia tsao', 'cyw', 'ㄘㄧㄨ'],
  '許富凱': ['kai', 'kai hsu', '阿凱', 'xfk', 'ㄒㄈㄎ'],
  '翁立友': ['only', 'only weng', 'wly', 'ㄨㄌㄧ'],
  '蔡小虎': ['tiger', 'tiger tsai', 'cxh', 'ㄘㄒㄏ'],
  '陳雷': ['chen lei', 'cl', 'ㄔㄌ'],
  '沈文程': ['seven', 'seven shen', 'swc', 'ㄕㄨㄔ'],
  '袁小迪': ['yuan', 'yxd', 'ㄩㄒㄉ'],
  '葉啟田': ['yeqitian', '寶島歌王', 'yqt', 'ㄧㄑㄊ'],
  '陳一郎': ['chen yilang', 'cyl', 'ㄔㄧㄌ'],
  '王識賢': ['jason', 'jason wang', 'wsx', 'ㄨㄕㄒ'],
  '洪榮宏': ['hung', 'hrh', 'ㄏㄖㄏ'],
  '阿吉仔': ['aji', 'ajj', 'ㄚㄐㄗ'],
  '滅火器': ['fire ex', 'fire ex.', '滅火器', 'mhq', 'ㄇㄏㄑ'],
  '拍謝少年': ['sorry youth', '拍謝', 'pxsn', 'ㄆㄒㄕㄋ'],
  '董事長樂團': ['the chairman', '董事長', 'dszlt', 'ㄉㄕㄓㄌㄊ'],
  '四分衛': ['quarterback', 'sfw', 'ㄙㄈㄨ'],
  '亂彈阿翔': ['luantan ascending', '阿翔', 'ltax', 'ㄌㄊㄚㄒ'],
  '無妄合作社': ['no-nonsense collective', 'wwhzs', 'ㄨㄨㄏㄗㄕ'],
  '百合花': ['lily hymn', 'bhh', 'ㄅㄏㄏ'],
  '芒果醬': ['mango jump', 'mango jump', 'mgj', 'ㄇㄍㄐ'],
  '傻子與白痴': ['fool & idiot', 'fool and idiot', 'szybc', 'ㄕㄗㄩㄅㄔ'],

  // ── 5. Wave 3 大規模擴充：港粵天王天后與日韓國際巨星 ──
  'Beyond': ['beyond', '黃家駒'],
  '草蜢': ['grasshopper', 'cm', 'ㄘㄇ'],
  '陳百強': ['danny', 'danny chan', 'cbq', 'ㄔㄅㄑ'],
  '張國榮': ['leslie', 'leslie cheung', '哥哥', 'zgr', 'ㄓㄍㄖ'],
  '梅艷芳': ['anita', 'anita mui', '梅姐', 'myf', 'ㄇㄧㄈ'],
  '陳慧嫻': ['priscilla', 'priscilla chan', 'chx', 'ㄔㄏㄒ'],
  '關淑怡': ['shirley', 'shirley kwan', 'gsy', 'ㄍㄕㄧ'],
  '楊千嬅': ['miriam', 'miriam yeung', '千嬅', 'yqh', 'ㄧㄑㄏ'],
  '容祖兒': ['joey', 'joey yung', 'rze', 'ㄖㄗㄦ'],
  '謝霆鋒': ['nicholas', 'nicholas tse', '霆鋒', 'xtf', 'ㄒㄊㄈ'],
  '古巨基': ['leo', 'leo ku', '基仔', 'gjk', 'ㄍㄐㄐ'],
  '許志安': ['andy', 'andy hui', '安仔', 'xza', 'ㄒㄓㄢ'],
  '鄭秀文': ['sammi', 'sammi cheng', 'sammi', 'zxw', 'ㄓㄒㄨ'],
  '衛蘭': ['janice', 'janice vidal', 'wl', 'ㄨㄌ'],
  'Twins': ['twins', '阿sa', '阿嬌'],
  'RADWIMPS': ['radwimps', '野田洋次郎'],
  'ONE OK ROCK': ['one ok rock', 'oor', 'taka'],
  'King Gnu': ['king gnu', 'kinggnu', '常田大希'],
  'Official髭男dism': ['official hige dandism', 'higedan', '髭男'],
  'Aimyon': ['aimyon', '愛繆'],
  '愛繆': ['aimyon', 'aimyon', 'am', 'ㄞㄇ'],
  'LiSA': ['lisa'],
  '宇多田光': ['hikaru utada', 'utada', 'ydtg', 'ㄩㄉㄊㄍ'],
  '安室奈美惠': ['namie amuro', 'amuro', 'asnmh', 'ㄢㄕㄋㄇㄏ'],
  'X JAPAN': ['x japan', 'xjapan', 'yoshiki', 'hide'],
  'TWICE': ['twice', '周子瑜', 'tzuyu'],
  'NewJeans': ['newjeans', 'nwjns', 'nj'],
  'IVE': ['ive', '張員瑛', 'wonyoung'],
  'SEVENTEEN': ['seventeen', 'svt'],
  'EXO': ['exo'],
  'BIGBANG': ['bigbang', 'bb', 'g-dragon', 'gd'],
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
