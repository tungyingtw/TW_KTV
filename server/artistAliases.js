import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALIASES_FILE_PATH = path.join(__dirname, 'artist_aliases_overrides.json');

// 預設熱門歌手別名、英文名、暱稱與團體/對照字典
export const DEFAULT_ARTIST_ALIASES = {
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
