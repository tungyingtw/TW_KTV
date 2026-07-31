import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALIASES_FILE_PATH = path.join(__dirname, 'artist_aliases_overrides.json');

// 預設熱門歌手別名、英文名、暱稱與團體/對照字典 (已大幅擴充至 80+ 組歌手)
export const DEFAULT_ARTIST_ALIASES = {
  // ── 1. 華語流行天王、天后與巨星 ──
  '周杰倫': {
    english: ['jay', 'jay chou', 'chou jay'],
    nickname: ['周董', 'Jay哥'],
    pinyinInitials: ['zjl'],
    zhuyinInitials: ['ㄓㄐㄌ'],
    groupOrAlt: [],
  },
  '蔡依林': {
    english: ['jolin', 'jolin tsai'],
    nickname: ['呸姐', '怪美的'],
    pinyinInitials: ['cyl'],
    zhuyinInitials: ['ㄘㄧㄌ'],
    groupOrAlt: [],
  },
  '林俊傑': {
    english: ['jj', 'jj lin'],
    nickname: ['JJ'],
    pinyinInitials: ['ljj'],
    zhuyinInitials: ['ㄌㄐㄐ'],
    groupOrAlt: [],
  },
  '陳奕迅': {
    english: ['eason', 'eason chan'],
    nickname: ['E神', '吹神'],
    pinyinInitials: ['cyx'],
    zhuyinInitials: ['ㄔㄧㄒ'],
    groupOrAlt: [],
  },
  '五月天': {
    english: ['mayday'],
    nickname: [],
    pinyinInitials: ['wyt'],
    zhuyinInitials: ['ㄨㄩㄊ'],
    groupOrAlt: [],
  },
  '告五人': {
    english: ['accusefive'],
    nickname: ['告五'],
    pinyinInitials: ['gwr'],
    zhuyinInitials: ['ㄍㄠㄨㄖ'],
    groupOrAlt: ['告五'],
  },
  '草東沒有派對': {
    english: ['no party for cao dong', 'nopartyforcaodong'],
    nickname: ['草東'],
    pinyinInitials: ['cdmyd'],
    zhuyinInitials: ['ㄘㄠㄉㄇㄧㄆㄉ'],
    groupOrAlt: ['草東'],
  },
  '鄧紫棋': {
    english: ['gem', 'g.e.m.'],
    nickname: ['解解'],
    pinyinInitials: ['dzq'],
    zhuyinInitials: ['ㄉㄗㄑ'],
    groupOrAlt: [],
  },
  '張惠妹': {
    english: ['amei', 'a-mei'],
    nickname: ['阿妹', '阿密特', 'amit'],
    pinyinInitials: ['zhm'],
    zhuyinInitials: ['ㄓㄏㄇ'],
    groupOrAlt: ['阿密特'],
  },
  '王心凌': {
    english: ['cyndi', 'cyndi wang'],
    nickname: ['甜蜜教主'],
    pinyinInitials: ['wxl'],
    zhuyinInitials: ['ㄨㄒㄌ'],
    groupOrAlt: [],
  },
  '田馥甄': {
    english: ['hebe'],
    nickname: ['Hebe'],
    pinyinInitials: ['tfz'],
    zhuyinInitials: ['ㄊㄈㄓ'],
    groupOrAlt: [],
  },
  '楊丞琳': {
    english: ['rainie', 'rainie yang'],
    nickname: [],
    pinyinInitials: ['ycl'],
    zhuyinInitials: ['ㄧㄔㄌ'],
    groupOrAlt: [],
  },
  '蕭敬騰': {
    english: ['jam', 'jam hsiao'],
    nickname: ['雨神'],
    pinyinInitials: ['xjt'],
    zhuyinInitials: ['ㄒㄐㄊ'],
    groupOrAlt: [],
  },
  '張震嶽': {
    english: ['ayugmun'],
    nickname: ['阿嶽'],
    pinyinInitials: ['zzy'],
    zhuyinInitials: ['ㄓㄓㄩ'],
    groupOrAlt: ['海雅谷慕'],
  },
  '韋禮安': {
    english: ['weibird'],
    nickname: [],
    pinyinInitials: ['wla'],
    zhuyinInitials: ['ㄨㄌㄢ'],
    groupOrAlt: [],
  },
  '王力宏': {
    english: ['leehom', 'leehom wang'],
    nickname: [],
    pinyinInitials: ['wlh'],
    zhuyinInitials: ['ㄨㄌㄏ'],
    groupOrAlt: [],
  },
  '陶喆': {
    english: ['david tao'],
    nickname: [],
    pinyinInitials: ['tz'],
    zhuyinInitials: ['ㄊㄓ'],
    groupOrAlt: [],
  },
  '張學友': {
    english: ['jacky', 'jacky cheung'],
    nickname: ['歌神'],
    pinyinInitials: ['zxy'],
    zhuyinInitials: ['ㄓㄒㄧ'],
    groupOrAlt: [],
  },
  '劉德華': {
    english: ['andy', 'andy lau'],
    nickname: ['華仔'],
    pinyinInitials: ['ldh'],
    zhuyinInitials: ['ㄌㄉㄏ'],
    groupOrAlt: [],
  },
  '郭富城': {
    english: ['aaron', 'aaron kwok'],
    nickname: [],
    pinyinInitials: ['gfc'],
    zhuyinInitials: ['ㄍㄈㄔ'],
    groupOrAlt: [],
  },
  '黎明': {
    english: ['leon', 'leon lai'],
    nickname: [],
    pinyinInitials: ['lm'],
    zhuyinInitials: ['ㄌㄇ'],
    groupOrAlt: [],
  },
  '莫文蔚': {
    english: ['karen', 'karen mok'],
    nickname: [],
    pinyinInitials: ['mww'],
    zhuyinInitials: ['ㄇㄨㄨ'],
    groupOrAlt: [],
  },
  '孫燕姿': {
    english: ['stefanie', 'stefanie sun'],
    nickname: [],
    pinyinInitials: ['syz'],
    zhuyinInitials: ['ㄙㄧㄗ'],
    groupOrAlt: [],
  },
  '梁靜茹': {
    english: ['fish', 'fish leong'],
    nickname: ['情歌天后'],
    pinyinInitials: ['ljr'],
    zhuyinInitials: ['ㄌㄐㄖ'],
    groupOrAlt: [],
  },
  '徐佳瑩': {
    english: ['lala', 'lala hsu'],
    nickname: ['拉拉'],
    pinyinInitials: ['xjy'],
    zhuyinInitials: ['ㄒㄐㄧ'],
    groupOrAlt: [],
  },
  '王菲': {
    english: ['faye', 'faye wong'],
    nickname: ['天后'],
    pinyinInitials: ['wf'],
    zhuyinInitials: ['ㄨㄈ'],
    groupOrAlt: [],
  },
  '高爾宣': {
    english: ['osn'],
    nickname: [],
    pinyinInitials: ['gex'],
    zhuyinInitials: ['ㄍㄦㄒ'],
    groupOrAlt: [],
  },
  '瘦子': {
    english: ['eso', 'e.so'],
    nickname: ['瘦子E.SO'],
    pinyinInitials: ['sz'],
    zhuyinInitials: ['ㄙㄗ'],
    groupOrAlt: ['瘦子E.SO'],
  },
  '頑童': {
    english: ['mj116'],
    nickname: ['頑童MJ116'],
    pinyinInitials: ['wt'],
    zhuyinInitials: ['ㄨㄊ'],
    groupOrAlt: ['頑童MJ116'],
  },
  '玖壹壹': {
    english: ['911'],
    nickname: ['Nine One One'],
    pinyinInitials: ['jyy'],
    zhuyinInitials: ['ㄐㄧㄧ'],
    groupOrAlt: ['911'],
  },
  '八三夭': {
    english: ['831'],
    nickname: ['831'],
    pinyinInitials: ['bsy'],
    zhuyinInitials: ['ㄅㄙㄧ'],
    groupOrAlt: ['831'],
  },
  '動力火車': {
    english: ['power station'],
    nickname: [],
    pinyinInitials: ['dlhc'],
    zhuyinInitials: ['ㄉㄌㄏㄔ'],
    groupOrAlt: [],
  },
  '蘇打綠': {
    english: ['sodagreen'],
    nickname: [],
    pinyinInitials: ['sdl'],
    zhuyinInitials: ['ㄙㄉㄌ'],
    groupOrAlt: ['魚丁糸'],
  },
  '魚丁糸': {
    english: ['sodagreen'],
    nickname: [],
    pinyinInitials: ['ydm'],
    zhuyinInitials: ['ㄩㄉㄇ'],
    groupOrAlt: ['蘇打綠'],
  },
  '茄子蛋': {
    english: ['eggplantegg'],
    nickname: [],
    pinyinInitials: ['qzd'],
    zhuyinInitials: ['ㄑㄗㄉ'],
    groupOrAlt: [],
  },
  '落日飛車': {
    english: ['sunset rollercoaster'],
    nickname: [],
    pinyinInitials: ['lrfc'],
    zhuyinInitials: ['ㄌㄖㄈㄔ'],
    groupOrAlt: [],
  },
  'SHE': {
    english: ['s.h.e', 'she'],
    nickname: ['S.H.E'],
    pinyinInitials: [],
    zhuyinInitials: [],
    groupOrAlt: ['S.H.E'],
  },
  'S.H.E': {
    english: ['she', 's.h.e'],
    nickname: ['SHE'],
    pinyinInitials: [],
    zhuyinInitials: [],
    groupOrAlt: ['SHE'],
  },

  // ── 2. 第二波新增：經典情歌巨星與熱門歌手 ──
  '張宇': {
    english: ['phil', 'phil chang'],
    nickname: ['宇哥'],
    pinyinInitials: ['zy'],
    zhuyinInitials: ['ㄓㄩ'],
    groupOrAlt: [],
  },
  '任賢齊': {
    english: ['richie', 'richie jen'],
    nickname: ['小齊'],
    pinyinInitials: ['rxq'],
    zhuyinInitials: ['ㄖㄒㄑ'],
    groupOrAlt: [],
  },
  '伍佰': {
    english: ['wu bai', 'wubai'],
    nickname: ['伍佰 & China Blue'],
    pinyinInitials: ['wb'],
    zhuyinInitials: ['ㄨㄅ'],
    groupOrAlt: ['伍佰 & China Blue'],
  },
  '羅志祥': {
    english: ['show', 'show lo'],
    nickname: ['小豬'],
    pinyinInitials: ['lzx'],
    zhuyinInitials: ['ㄌㄓㄒ'],
    groupOrAlt: [],
  },
  '潘瑋柏': {
    english: ['wilber', 'wilber pan'],
    nickname: ['潘帥'],
    pinyinInitials: ['pwb'],
    zhuyinInitials: ['ㄆㄨㄅ'],
    groupOrAlt: [],
  },
  '周興哲': {
    english: ['eric', 'eric chou'],
    nickname: ['情歌王子'],
    pinyinInitials: ['zxz'],
    zhuyinInitials: ['ㄓㄒㄓ'],
    groupOrAlt: [],
  },
  '周湯豪': {
    english: ['nick', 'nickthereal'],
    nickname: ['湯豪'],
    pinyinInitials: ['zth'],
    zhuyinInitials: ['ㄓㄊㄏ'],
    groupOrAlt: [],
  },
  '陳零九': {
    english: ['nine chen'],
    nickname: ['09', '零九'],
    pinyinInitials: ['clj'],
    zhuyinInitials: ['ㄔㄌㄐ'],
    groupOrAlt: [],
  },
  '邱鋒澤': {
    english: ['feng ze'],
    nickname: ['鋒澤'],
    pinyinInitials: ['qfz'],
    zhuyinInitials: ['ㄑㄈㄗ'],
    groupOrAlt: [],
  },
  '黃偉晉': {
    english: ['wayne huang'],
    nickname: ['偉晉'],
    pinyinInitials: ['hwj'],
    zhuyinInitials: ['ㄏㄨㄐ'],
    groupOrAlt: [],
  },
  '賴晏駒': {
    english: ['lai'],
    nickname: ['小賴'],
    pinyinInitials: ['lyj'],
    zhuyinInitials: ['ㄌㄧㄐ'],
    groupOrAlt: [],
  },
  '五堅情': {
    english: ['w0lf', 'w0lfs'],
    nickname: ['W0LF(S)'],
    pinyinInitials: ['wjq'],
    zhuyinInitials: ['ㄨㄐㄑ'],
    groupOrAlt: ['W0LF(S)'],
  },
  '李聖傑': {
    english: ['sam lee'],
    nickname: ['情歌王子'],
    pinyinInitials: ['lsj'],
    zhuyinInitials: ['ㄌㄙㄐ'],
    groupOrAlt: [],
  },
  '林宥嘉': {
    english: ['yoga', 'yoga lin'],
    nickname: ['宥嘉'],
    pinyinInitials: ['lyj'],
    zhuyinInitials: ['ㄌㄧㄐ'],
    groupOrAlt: [],
  },
  '盧廣仲': {
    english: ['crowd lu', 'crowd'],
    nickname: ['小隊長'],
    pinyinInitials: ['lgz'],
    zhuyinInitials: ['ㄌㄍㄓ'],
    groupOrAlt: [],
  },
  '吳青峰': {
    english: ['greeny'],
    nickname: ['青峰'],
    pinyinInitials: ['wqf'],
    zhuyinInitials: ['ㄨㄑㄈ'],
    groupOrAlt: [],
  },
  '戴佩妮': {
    english: ['penny', 'penny tai'],
    nickname: ['Penny'],
    pinyinInitials: ['dpn'],
    zhuyinInitials: ['ㄉㄆㄋ'],
    groupOrAlt: [],
  },
  'A-Lin': {
    english: ['a-lin', 'alin'],
    nickname: ['黃麗玲', '天生歌姬'],
    pinyinInitials: ['hll'],
    zhuyinInitials: ['ㄏㄌㄌ'],
    groupOrAlt: ['黃麗玲'],
  },
  '黃麗玲': {
    english: ['a-lin', 'alin'],
    nickname: ['A-Lin'],
    pinyinInitials: ['hll'],
    zhuyinInitials: ['ㄏㄌㄌ'],
    groupOrAlt: ['A-Lin'],
  },
  '彭佳慧': {
    english: ['julia', 'julia peng'],
    nickname: ['鐵肺歌后'],
    pinyinInitials: ['pjh'],
    zhuyinInitials: ['ㄆㄐㄏ'],
    groupOrAlt: [],
  },
  '范瑋琪': {
    english: ['fanfan', 'christine fan'],
    nickname: ['范范'],
    pinyinInitials: ['fwq'],
    zhuyinInitials: ['ㄈㄨㄑ'],
    groupOrAlt: [],
  },
  '張韶涵': {
    english: ['angela', 'angela zhang'],
    nickname: ['韶涵'],
    pinyinInitials: ['zsh'],
    zhuyinInitials: ['ㄓㄕㄏ'],
    groupOrAlt: [],
  },
  '郭靜': {
    english: ['claire', 'claire kuo'],
    nickname: ['純愛天后'],
    pinyinInitials: ['gj'],
    zhuyinInitials: ['ㄍㄐ'],
    groupOrAlt: [],
  },
  '丁噹': {
    english: ['della'],
    nickname: ['全民情歌天后'],
    pinyinInitials: ['dd'],
    zhuyinInitials: ['ㄉㄉ'],
    groupOrAlt: [],
  },
  '家家': {
    english: ['jiajia'],
    nickname: ['靈魂歌姬'],
    pinyinInitials: ['jj'],
    zhuyinInitials: ['ㄐㄐ'],
    groupOrAlt: [],
  },
  '閻奕格': {
    english: ['janice yan', 'janice'],
    nickname: ['格格'],
    pinyinInitials: ['yyg'],
    zhuyinInitials: ['ㄧㄧㄍ'],
    groupOrAlt: [],
  },
  '陳芳語': {
    english: ['kimberley', 'kimberley chen'],
    nickname: ['芳語'],
    pinyinInitials: ['cfy'],
    zhuyinInitials: ['ㄔㄈㄩ'],
    groupOrAlt: [],
  },
  '黃霄雲': {
    english: ['ghost'],
    nickname: ['麵包妹'],
    pinyinInitials: ['hxy'],
    zhuyinInitials: ['ㄏㄒㄩ'],
    groupOrAlt: [],
  },
  '汪蘇瀧': {
    english: ['silence wang', 'silence'],
    nickname: ['瀧瀧'],
    pinyinInitials: ['wsl'],
    zhuyinInitials: ['ㄨㄙㄌ'],
    groupOrAlt: [],
  },
  '許嵩': {
    english: ['vae'],
    nickname: ['嵩哥'],
    pinyinInitials: ['xs'],
    zhuyinInitials: ['ㄒㄙ'],
    groupOrAlt: [],
  },
  '薛之謙': {
    english: ['joker', 'joker xue'],
    nickname: ['老薛'],
    pinyinInitials: ['xzq'],
    zhuyinInitials: ['ㄒㄓㄑ'],
    groupOrAlt: [],
  },
  '毛不易': {
    english: ['mao buyi'],
    nickname: ['毛毛'],
    pinyinInitials: ['mby'],
    zhuyinInitials: ['ㄇㄅㄧ'],
    groupOrAlt: [],
  },
  '周深': {
    english: ['charlie', 'charlie zhou'],
    nickname: ['深深'],
    pinyinInitials: ['zs'],
    zhuyinInitials: ['ㄓㄕ'],
    groupOrAlt: [],
  },
  '華晨宇': {
    english: ['chenyu hua'],
    nickname: ['花花'],
    pinyinInitials: ['hcy'],
    zhuyinInitials: ['ㄏㄩ'],
    groupOrAlt: [],
  },

  // ── 3. 熱門獨立樂團與組合 ──
  '宇宙人': {
    english: ['cosmos people'],
    nickname: [],
    pinyinInitials: ['yzr'],
    zhuyinInitials: ['ㄩㄗㄖ'],
    groupOrAlt: [],
  },
  '麋先生': {
    english: ['mixer'],
    nickname: [],
    pinyinInitials: ['mxs'],
    zhuyinInitials: ['ㄇㄒㄙ'],
    groupOrAlt: [],
  },
  '理想混蛋': {
    english: ['bestards'],
    nickname: ['雞丁'],
    pinyinInitials: ['lxhd'],
    zhuyinInitials: ['ㄌㄒㄏㄉ'],
    groupOrAlt: [],
  },
  '美秀集團': {
    english: ['amazing show'],
    nickname: ['美秀'],
    pinyinInitials: ['mxjt'],
    zhuyinInitials: ['ㄇㄒㄐㄊ'],
    groupOrAlt: [],
  },
  '血肉果汁機': {
    english: ['flesh juicer'],
    nickname: ['血肉'],
    pinyinInitials: ['xrgzj'],
    zhuyinInitials: ['ㄒㄖㄍㄗㄐ'],
    groupOrAlt: [],
  },
  '老王樂隊': {
    english: ['your woman sleepwith others'],
    nickname: ['老王'],
    pinyinInitials: ['lwyd'],
    zhuyinInitials: ['ㄌㄨㄩㄉ'],
    groupOrAlt: [],
  },

  // ── 4. 熱門日韓與國際歌手 ──
  'YOASOBI': {
    english: ['yoasobi'],
    nickname: ['幾田莉子', 'Ayase'],
    pinyinInitials: [],
    zhuyinInitials: [],
    groupOrAlt: ['幾田莉子'],
  },
  'Ado': {
    english: ['ado'],
    nickname: ['Ado'],
    pinyinInitials: [],
    zhuyinInitials: [],
    groupOrAlt: [],
  },
  '米津玄師': {
    english: ['kenshi yonezu', 'hachi'],
    nickname: ['八爺'],
    pinyinInitials: ['mjxs'],
    zhuyinInitials: ['ㄇㄐㄒㄕ'],
    groupOrAlt: ['Hachi'],
  },
  'IU': {
    english: ['iu'],
    nickname: ['李知恩', '國民妹妹'],
    pinyinInitials: ['lze'],
    zhuyinInitials: ['ㄌㄓㄣ'],
    groupOrAlt: ['李知恩'],
  },
  'BLACKPINK': {
    english: ['blackpink', 'bp'],
    nickname: ['BLACKPINK'],
    pinyinInitials: [],
    zhuyinInitials: [],
    groupOrAlt: ['BP'],
  },
  'BTS': {
    english: ['bts'],
    nickname: ['防彈少年團', '防彈'],
    pinyinInitials: ['fdsnt'],
    zhuyinInitials: ['ㄈㄉㄕㄋㄊ'],
    groupOrAlt: ['防彈少年團'],
  },
};

let currentAliasesMap = null;

function normalizeAliasArray(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(item => String(item).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input.split(/[,，\s]+/).map(item => item.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

export function loadArtistAliases() {
  if (currentAliasesMap) return currentAliasesMap;

  let merged = {};
  for (const [artist, val] of Object.entries(DEFAULT_ARTIST_ALIASES)) {
    if (Array.isArray(val)) {
      merged[artist] = normalizeAliasArray(val);
    } else if (val && typeof val === 'object') {
      const combined = [
        ...normalizeAliasArray(val.english),
        ...normalizeAliasArray(val.nickname),
        ...normalizeAliasArray(val.pinyinInitials),
        ...normalizeAliasArray(val.zhuyinInitials),
        ...normalizeAliasArray(val.groupOrAlt),
      ];
      merged[artist] = Array.from(new Set(combined));
    }
  }

  if (fs.existsSync(ALIASES_FILE_PATH)) {
    try {
      const overrides = JSON.parse(fs.readFileSync(ALIASES_FILE_PATH, 'utf8'));
      if (overrides && typeof overrides === 'object') {
        for (const [artist, list] of Object.entries(overrides)) {
          merged[artist] = Array.from(new Set([
            ...(merged[artist] || []),
            ...normalizeAliasArray(list),
          ]));
        }
      }
    } catch (err) {
      console.warn('[ArtistAliases] 讀取別名覆寫檔失敗:', err.message);
    }
  }

  currentAliasesMap = merged;
  return currentAliasesMap;
}

export function saveArtistAlias(artistName, aliasList) {
  const normalizedArtist = String(artistName).trim();
  if (!normalizedArtist) throw new Error('歌手名稱不能為空');

  const aliases = Array.from(new Set(normalizeAliasArray(aliasList)));
  const map = loadArtistAliases();
  map[normalizedArtist] = aliases;

  let overrides = {};
  if (fs.existsSync(ALIASES_FILE_PATH)) {
    try {
      overrides = JSON.parse(fs.readFileSync(ALIASES_FILE_PATH, 'utf8'));
    } catch {}
  }
  overrides[normalizedArtist] = aliases;

  fs.writeFileSync(ALIASES_FILE_PATH, JSON.stringify(overrides, null, 2), 'utf8');
  currentAliasesMap = map;
  return aliases;
}

export function deleteArtistAlias(artistName) {
  const normalizedArtist = String(artistName).trim();
  const map = loadArtistAliases();
  delete map[normalizedArtist];

  let overrides = {};
  if (fs.existsSync(ALIASES_FILE_PATH)) {
    try {
      overrides = JSON.parse(fs.readFileSync(ALIASES_FILE_PATH, 'utf8'));
      delete overrides[normalizedArtist];
      fs.writeFileSync(ALIASES_FILE_PATH, JSON.stringify(overrides, null, 2), 'utf8');
    } catch {}
  }
  currentAliasesMap = map;
}

export function expandArtistQuery(rawQuery) {
  const q = String(rawQuery || '').trim().toLowerCase();
  if (!q) return { matchedArtists: [], expandedTerms: [] };

  const aliasesMap = loadArtistAliases();
  const matchedArtists = new Set();
  const expandedTerms = new Set([q]);

  for (const [artistName, aliases] of Object.entries(aliasesMap)) {
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
    query: q,
    matchedArtists: Array.from(matchedArtists),
    expandedTerms: Array.from(expandedTerms),
  };
}
