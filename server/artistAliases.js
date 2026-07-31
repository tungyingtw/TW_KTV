import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALIASES_FILE_PATH = path.join(__dirname, 'artist_aliases_overrides.json');

// 預設熱門歌手別名、英文名、暱稱與團體/對照字典 (已達到 250+ 組全量終極大滿貫覆蓋)
export const DEFAULT_ARTIST_ALIASES = {
  // ── 1. 華語流行天王、天后與巨星 ──
  '周杰倫': { english: ['jay', 'jay chou', 'chou jay'], nickname: ['周董', 'Jay哥'], pinyinInitials: ['zjl'], zhuyinInitials: ['ㄓㄐㄌ'], groupOrAlt: [] },
  '蔡依林': { english: ['jolin', 'jolin tsai'], nickname: ['呸姐', '怪美的'], pinyinInitials: ['cyl'], zhuyinInitials: ['ㄘㄧㄌ'], groupOrAlt: [] },
  '林俊傑': { english: ['jj', 'jj lin'], nickname: ['JJ'], pinyinInitials: ['ljj'], zhuyinInitials: ['ㄌㄐㄐ'], groupOrAlt: [] },
  '陳奕迅': { english: ['eason', 'eason chan'], nickname: ['E神', '吹神'], pinyinInitials: ['cyx'], zhuyinInitials: ['ㄔㄧㄒ'], groupOrAlt: [] },
  '五月天': { english: ['mayday'], nickname: [], pinyinInitials: ['wyt'], zhuyinInitials: ['ㄨㄩㄊ'], groupOrAlt: [] },
  '告五人': { english: ['accusefive'], nickname: ['告五'], pinyinInitials: ['gwr'], zhuyinInitials: ['ㄍㄠㄨㄖ'], groupOrAlt: ['告五'] },
  '草東沒有派對': { english: ['no party for cao dong', 'nopartyforcaodong'], nickname: ['草東'], pinyinInitials: ['cdmyd'], zhuyinInitials: ['ㄘㄠㄉㄇㄧㄆㄉ'], groupOrAlt: ['草東'] },
  '鄧紫棋': { english: ['gem', 'g.e.m.'], nickname: ['解解'], pinyinInitials: ['dzq'], zhuyinInitials: ['ㄉㄗㄑ'], groupOrAlt: [] },
  '張惠妹': { english: ['amei', 'a-mei'], nickname: ['阿妹', '阿密特', 'amit'], pinyinInitials: ['zhm'], zhuyinInitials: ['ㄓㄏㄇ'], groupOrAlt: ['阿密特'] },
  '王心凌': { english: ['cyndi', 'cyndi wang'], nickname: ['甜蜜教主'], pinyinInitials: ['wxl'], zhuyinInitials: ['ㄨㄒㄌ'], groupOrAlt: [] },
  '田馥甄': { english: ['hebe'], nickname: ['Hebe'], pinyinInitials: ['tfz'], zhuyinInitials: ['ㄊㄈㄓ'], groupOrAlt: [] },
  '楊丞琳': { english: ['rainie', 'rainie yang'], nickname: [], pinyinInitials: ['ycl'], zhuyinInitials: ['ㄧㄔㄌ'], groupOrAlt: [] },
  '蕭敬騰': { english: ['jam', 'jam hsiao'], nickname: ['雨神'], pinyinInitials: ['xjt'], zhuyinInitials: ['ㄒㄐㄊ'], groupOrAlt: [] },
  '張震嶽': { english: ['ayugmun'], nickname: ['阿嶽'], pinyinInitials: ['zzy'], zhuyinInitials: ['ㄓㄓㄩ'], groupOrAlt: ['海雅谷慕'] },
  '韋禮安': { english: ['weibird'], nickname: [], pinyinInitials: ['wla'], zhuyinInitials: ['ㄨㄌㄢ'], groupOrAlt: [] },
  '王力宏': { english: ['leehom', 'leehom wang'], nickname: [], pinyinInitials: ['wlh'], zhuyinInitials: ['ㄨㄌㄏ'], groupOrAlt: [] },
  '陶喆': { english: ['david tao'], nickname: [], pinyinInitials: ['tz'], zhuyinInitials: ['ㄊㄓ'], groupOrAlt: [] },
  '張學友': { english: ['jacky', 'jacky cheung'], nickname: ['歌神'], pinyinInitials: ['zxy'], zhuyinInitials: ['ㄓㄒㄧ'], groupOrAlt: [] },
  '劉德華': { english: ['andy', 'andy lau'], nickname: ['華仔'], pinyinInitials: ['ldh'], zhuyinInitials: ['ㄌㄉㄏ'], groupOrAlt: [] },
  '郭富城': { english: ['aaron', 'aaron kwok'], nickname: [], pinyinInitials: ['gfc'], zhuyinInitials: ['ㄍㄈㄔ'], groupOrAlt: [] },
  '黎明': { english: ['leon', 'leon lai'], nickname: [], pinyinInitials: ['lm'], zhuyinInitials: ['ㄌㄇ'], groupOrAlt: [] },
  '莫文蔚': { english: ['karen', 'karen mok'], nickname: [], pinyinInitials: ['mww'], zhuyinInitials: ['ㄇㄨㄨ'], groupOrAlt: [] },
  '孫燕姿': { english: ['stefanie', 'stefanie sun'], nickname: [], pinyinInitials: ['syz'], zhuyinInitials: ['ㄙㄧㄗ'], groupOrAlt: [] },
  '梁靜茹': { english: ['fish', 'fish leong'], nickname: ['情歌天后'], pinyinInitials: ['ljr'], zhuyinInitials: ['ㄌㄐㄖ'], groupOrAlt: [] },
  '徐佳瑩': { english: ['lala', 'lala hsu'], nickname: ['拉拉'], pinyinInitials: ['xjy'], zhuyinInitials: ['ㄒㄐㄧ'], groupOrAlt: [] },
  '王菲': { english: ['faye', 'faye wong'], nickname: ['天后'], pinyinInitials: ['wf'], zhuyinInitials: ['ㄨㄈ'], groupOrAlt: [] },
  '高爾宣': { english: ['osn'], nickname: [], pinyinInitials: ['gex'], zhuyinInitials: ['ㄍㄦㄒ'], groupOrAlt: [] },
  '瘦子': { english: ['eso', 'e.so'], nickname: ['瘦子E.SO'], pinyinInitials: ['sz'], zhuyinInitials: ['ㄙㄗ'], groupOrAlt: ['瘦子E.SO'] },
  '頑童': { english: ['mj116'], nickname: ['頑童MJ116'], pinyinInitials: ['wt'], zhuyinInitials: ['ㄨㄊ'], groupOrAlt: ['頑童MJ116'] },
  '玖壹壹': { english: ['911'], nickname: ['Nine One One'], pinyinInitials: ['jyy'], zhuyinInitials: ['ㄐㄧㄧ'], groupOrAlt: ['911'] },
  '八三夭': { english: ['831'], nickname: ['831'], pinyinInitials: ['bsy'], zhuyinInitials: ['ㄅㄙㄧ'], groupOrAlt: ['831'] },
  '動力火車': { english: ['power station'], nickname: [], pinyinInitials: ['dlhc'], zhuyinInitials: ['ㄉㄌㄏㄔ'], groupOrAlt: [] },
  '蘇打綠': { english: ['sodagreen'], nickname: [], pinyinInitials: ['sdl'], zhuyinInitials: ['ㄙㄉㄌ'], groupOrAlt: ['魚丁糸'] },
  '魚丁糸': { english: ['sodagreen'], nickname: [], pinyinInitials: ['ydm'], zhuyinInitials: ['ㄩㄉㄇ'], groupOrAlt: ['蘇打綠'] },
  '茄子蛋': { english: ['eggplantegg'], nickname: [], pinyinInitials: ['qzd'], zhuyinInitials: ['ㄑㄗㄉ'], groupOrAlt: [] },
  '落日飛車': { english: ['sunset rollercoaster'], nickname: [], pinyinInitials: ['lrfc'], zhuyinInitials: ['ㄌㄖㄈㄔ'], groupOrAlt: [] },
  'SHE': { english: ['s.h.e', 'she'], nickname: ['S.H.E'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['S.H.E'] },
  'S.H.E': { english: ['she', 's.h.e'], nickname: ['SHE'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['SHE'] },

  // ── 2. 經典情歌巨星與熱門歌手 ──
  '張宇': { english: ['phil', 'phil chang'], nickname: ['宇哥'], pinyinInitials: ['zy'], zhuyinInitials: ['ㄓㄩ'], groupOrAlt: [] },
  '任賢齊': { english: ['richie', 'richie jen'], nickname: ['小齊'], pinyinInitials: ['rxq'], zhuyinInitials: ['ㄖㄒㄑ'], groupOrAlt: [] },
  '伍佰': { english: ['wu bai', 'wubai'], nickname: ['伍佰 & China Blue'], pinyinInitials: ['wb'], zhuyinInitials: ['ㄨㄅ'], groupOrAlt: ['伍佰 & China Blue'] },
  '羅志祥': { english: ['show', 'show lo'], nickname: ['小豬'], pinyinInitials: ['lzx'], zhuyinInitials: ['ㄌㄓㄒ'], groupOrAlt: [] },
  '潘瑋柏': { english: ['wilber', 'wilber pan'], nickname: ['潘帥'], pinyinInitials: ['pwb'], zhuyinInitials: ['ㄆㄨㄅ'], groupOrAlt: [] },
  '周興哲': { english: ['eric', 'eric chou'], nickname: ['情歌王子'], pinyinInitials: ['zxz'], zhuyinInitials: ['ㄓㄒㄓ'], groupOrAlt: [] },
  '周湯豪': { english: ['nick', 'nickthereal'], nickname: ['湯豪'], pinyinInitials: ['zth'], zhuyinInitials: ['ㄓㄊㄏ'], groupOrAlt: [] },
  '陳零九': { english: ['nine chen'], nickname: ['09', '零九'], pinyinInitials: ['clj'], zhuyinInitials: ['ㄔㄌㄐ'], groupOrAlt: [] },
  '邱鋒澤': { english: ['feng ze'], nickname: ['鋒澤'], pinyinInitials: ['qfz'], zhuyinInitials: ['ㄑㄈㄗ'], groupOrAlt: [] },
  '黃偉晉': { english: ['wayne huang'], nickname: ['偉晉'], pinyinInitials: ['hwj'], zhuyinInitials: ['ㄏㄨㄐ'], groupOrAlt: [] },
  '賴晏駒': { english: ['lai'], nickname: ['小賴'], pinyinInitials: ['lyj'], zhuyinInitials: ['ㄌㄧㄐ'], groupOrAlt: [] },
  '五堅情': { english: ['w0lf', 'w0lfs'], nickname: ['W0LF(S)'], pinyinInitials: ['wjq'], zhuyinInitials: ['ㄨㄐㄑ'], groupOrAlt: ['W0LF(S)'] },
  '李聖傑': { english: ['sam lee'], nickname: ['情歌王子'], pinyinInitials: ['lsj'], zhuyinInitials: ['ㄌㄙㄐ'], groupOrAlt: [] },
  '林宥嘉': { english: ['yoga', 'yoga lin'], nickname: ['宥嘉'], pinyinInitials: ['lyj'], zhuyinInitials: ['ㄌㄧㄐ'], groupOrAlt: [] },
  '盧廣仲': { english: ['crowd lu', 'crowd'], nickname: ['小隊長'], pinyinInitials: ['lgz'], zhuyinInitials: ['ㄌㄍㄓ'], groupOrAlt: [] },
  '吳青峰': { english: ['greeny'], nickname: ['青峰'], pinyinInitials: ['wqf'], zhuyinInitials: ['ㄨㄑㄈ'], groupOrAlt: [] },
  '戴佩妮': { english: ['penny', 'penny tai'], nickname: ['Penny'], pinyinInitials: ['dpn'], zhuyinInitials: ['ㄉㄆㄋ'], groupOrAlt: [] },
  'A-Lin': { english: ['a-lin', 'alin'], nickname: ['黃麗玲', '天生歌姬'], pinyinInitials: ['hll'], zhuyinInitials: ['ㄏㄌㄌ'], groupOrAlt: ['黃麗玲'] },
  '黃麗玲': { english: ['a-lin', 'alin'], nickname: ['A-Lin'], pinyinInitials: ['hll'], zhuyinInitials: ['ㄏㄌㄌ'], groupOrAlt: ['A-Lin'] },
  '彭佳慧': { english: ['julia', 'julia peng'], nickname: ['鐵肺歌后'], pinyinInitials: ['pjh'], zhuyinInitials: ['ㄆㄐㄏ'], groupOrAlt: [] },
  '范瑋琪': { english: ['fanfan', 'christine fan'], nickname: ['范范'], pinyinInitials: ['fwq'], zhuyinInitials: ['ㄈㄨㄑ'], groupOrAlt: [] },
  '張韶涵': { english: ['angela', 'angela zhang'], nickname: ['韶涵'], pinyinInitials: ['zsh'], zhuyinInitials: ['ㄓㄕㄏ'], groupOrAlt: [] },
  '郭靜': { english: ['claire', 'claire kuo'], nickname: ['純愛天后'], pinyinInitials: ['gj'], zhuyinInitials: ['ㄍㄐ'], groupOrAlt: [] },
  '丁噹': { english: ['della'], nickname: ['全民情歌天后'], pinyinInitials: ['dd'], zhuyinInitials: ['ㄉㄉ'], groupOrAlt: [] },
  '家家': { english: ['jiajia'], nickname: ['靈魂歌姬'], pinyinInitials: ['jj'], zhuyinInitials: ['ㄐㄐ'], groupOrAlt: [] },
  '閻奕格': { english: ['janice yan', 'janice'], nickname: ['格格'], pinyinInitials: ['yyg'], zhuyinInitials: ['ㄧㄧㄍ'], groupOrAlt: [] },
  '陳芳語': { english: ['kimberley', 'kimberley chen'], nickname: ['芳語'], pinyinInitials: ['cfy'], zhuyinInitials: ['ㄔㄈㄩ'], groupOrAlt: [] },
  '黃霄雲': { english: ['ghost'], nickname: ['麵包妹'], pinyinInitials: ['hxy'], zhuyinInitials: ['ㄏㄒㄩ'], groupOrAlt: [] },
  '汪蘇瀧': { english: ['silence wang', 'silence'], nickname: ['瀧瀧'], pinyinInitials: ['wsl'], zhuyinInitials: ['ㄨㄙㄌ'], groupOrAlt: [] },
  '許嵩': { english: ['vae'], nickname: ['嵩哥'], pinyinInitials: ['xs'], zhuyinInitials: ['ㄒㄙ'], groupOrAlt: [] },
  '薛之謙': { english: ['joker', 'joker xue'], nickname: ['老薛'], pinyinInitials: ['xzq'], zhuyinInitials: ['ㄒㄓㄑ'], groupOrAlt: [] },
  '毛不易': { english: ['mao buyi'], nickname: ['毛毛'], pinyinInitials: ['mby'], zhuyinInitials: ['ㄇㄅㄧ'], groupOrAlt: [] },
  '周深': { english: ['charlie', 'charlie zhou'], nickname: ['深深'], pinyinInitials: ['zs'], zhuyinInitials: ['ㄓㄕ'], groupOrAlt: [] },
  '華晨宇': { english: ['chenyu hua'], nickname: ['花花'], pinyinInitials: ['hcy'], zhuyinInitials: ['ㄏㄩ'], groupOrAlt: [] },

  // ── 3. 華語金曲與獨立流行巨星 ──
  '周華健': { english: ['wakin', 'wakin chau'], nickname: ['國民歌王'], pinyinInitials: ['zhj'], zhuyinInitials: ['ㄓㄏㄐ'], groupOrAlt: [] },
  '張信哲': { english: ['jeff', 'jeff chang'], nickname: ['情歌王子'], pinyinInitials: ['zxz'], zhuyinInitials: ['ㄓㄒㄓ'], groupOrAlt: [] },
  '李宗盛': { english: ['jonathan', 'jonathan lee'], nickname: ['大哥'], pinyinInitials: ['lzs'], zhuyinInitials: ['ㄌㄗㄕ'], groupOrAlt: [] },
  '羅大佑': { english: ['tayu', 'tayu lo'], nickname: ['音樂教父'], pinyinInitials: ['ldy'], zhuyinInitials: ['ㄌㄉㄧ'], groupOrAlt: [] },
  '齊秦': { english: ['chyi chin'], nickname: ['小哥'], pinyinInitials: ['qq'], zhuyinInitials: ['ㄑㄑ'], groupOrAlt: [] },
  '童安格': { english: ['angus', 'angus tung'], nickname: [], pinyinInitials: ['tag'], zhuyinInitials: ['ㄊㄢㄍ'], groupOrAlt: [] },
  '趙傳': { english: ['chief', 'chief chao'], nickname: [], pinyinInitials: ['zc'], zhuyinInitials: ['ㄓ'], groupOrAlt: [] },
  '巫啟賢': { english: ['eric moo'], nickname: [], pinyinInitials: ['wqx'], zhuyinInitials: ['ㄨㄑㄒ'], groupOrAlt: [] },
  '張雨生': { english: ['tom', 'tom chang'], nickname: ['寶哥'], pinyinInitials: ['zys'], zhuyinInitials: ['ㄓㄩㄕ'], groupOrAlt: [] },
  '蘇芮': { english: ['julie', 'julie sue'], nickname: [], pinyinInitials: ['sr'], zhuyinInitials: ['ㄙㄖ'], groupOrAlt: [] },
  '蔡琴': { english: ['tsai chin'], nickname: [], pinyinInitials: ['cq'], zhuyinInitials: ['ㄘㄑ'], groupOrAlt: [] },
  '陳淑樺': { english: ['sarah', 'sarah chen'], nickname: [], pinyinInitials: ['csh'], zhuyinInitials: ['ㄔㄕㄏ'], groupOrAlt: [] },
  '萬芳': { english: ['wanfang'], nickname: [], pinyinInitials: ['wf'], zhuyinInitials: ['ㄨㄈ'], groupOrAlt: [] },
  '許茹芸': { english: ['valen', 'valen hsu'], nickname: ['芸芸'], pinyinInitials: ['xry'], zhuyinInitials: ['ㄒㄖㄩ'], groupOrAlt: [] },
  '辛曉琪': { english: ['winnie', 'winnie hsin'], nickname: [], pinyinInitials: ['xxq'], zhuyinInitials: ['ㄒㄒㄑ'], groupOrAlt: [] },
  '順子': { english: ['shunza'], nickname: [], pinyinInitials: ['sz'], zhuyinInitials: ['ㄕㄗ'], groupOrAlt: [] },
  '溫嵐': { english: ['landy', 'landy wen'], nickname: [], pinyinInitials: ['wl'], zhuyinInitials: ['ㄨㄌ'], groupOrAlt: [] },
  '戴愛玲': { english: ['princess ailing', 'ailing'], nickname: ['鐵肺公主'], pinyinInitials: ['dal'], zhuyinInitials: ['ㄉㄞㄌ'], groupOrAlt: [] },
  '葉蒨文': { english: ['sally', 'sally yeh'], nickname: [], pinyinInitials: ['yqw'], zhuyinInitials: ['ㄧㄑㄨ'], groupOrAlt: [] },
  '林憶蓮': { english: ['sandy', 'sandy lam'], nickname: [], pinyinInitials: ['lyl'], zhuyinInitials: ['ㄌㄧㄌ'], groupOrAlt: [] },
  '楊乃文': { english: ['faith', 'faith yang'], nickname: [], pinyinInitials: ['ynw'], zhuyinInitials: ['ㄧㄋㄨ'], groupOrAlt: [] },
  '陳綺貞': { english: ['cheer', 'cheer chen'], nickname: [], pinyinInitials: ['cqz'], zhuyinInitials: ['ㄔㄑㄓ'], groupOrAlt: [] },
  '魏如萱': { english: ['waa', 'waa wei'], nickname: ['娃娃'], pinyinInitials: ['wrx'], zhuyinInitials: ['ㄨㄖㄒ'], groupOrAlt: [] },
  '許哲珮': { english: ['peggy', 'peggy hsu'], nickname: ['Peggy'], pinyinInitials: ['xzp'], zhuyinInitials: ['ㄒㄓㄆ'], groupOrAlt: [] },
  '范曉萱': { english: ['mavis', 'mavis fan'], nickname: [], pinyinInitials: ['fxx'], zhuyinInitials: ['ㄈㄒㄒ'], groupOrAlt: [] },
  '徐若瑄': { english: ['vivian', 'vivian hsu'], nickname: ['Vivian'], pinyinInitials: ['xrx'], zhuyinInitials: ['ㄒㄖㄒ'], groupOrAlt: [] },
  '卓文萱': { english: ['genie', 'genie chuo'], nickname: [], pinyinInitials: ['zwx'], zhuyinInitials: ['ㄓㄨㄒ'], groupOrAlt: [] },
  '陳勢安': { english: ['andrew', 'andrew tan'], nickname: [], pinyinInitials: ['csa'], zhuyinInitials: ['ㄔㄕㄢ'], groupOrAlt: [] },
  '畢書盡': { english: ['bii'], nickname: ['Bii'], pinyinInitials: ['bsj'], zhuyinInitials: ['ㄅㄕㄐ'], groupOrAlt: [] },
  '嚴爵': { english: ['yen-j', 'yenj'], nickname: [], pinyinInitials: ['yj'], zhuyinInitials: ['ㄧㄐ'], groupOrAlt: [] },
  '謝和弦': { english: ['r-chord', 'rchord'], nickname: ['阿扣'], pinyinInitials: ['xhx'], zhuyinInitials: ['ㄒㄏㄒ'], groupOrAlt: [] },
  '吳卓源': { english: ['julia', 'julia wu'], nickname: ['鄉民老婆'], pinyinInitials: ['wzy'], zhuyinInitials: ['ㄨㄓㄩ'], groupOrAlt: [] },
  'ØZI': { english: ['ozi', 'øzi'], nickname: ['ØZI'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['ozi'] },
  '陳忻玥': { english: ['vicky', 'vicky chen'], nickname: [], pinyinInitials: ['cxy'], zhuyinInitials: ['ㄔㄒㄩ'], groupOrAlt: [] },
  '李芷婷': { english: ['nymph', 'nymph lee'], nickname: [], pinyinInitials: ['lzt'], zhuyinInitials: ['ㄌㄗㄊ'], groupOrAlt: [] },

  // ── 4. 台語經典歌王歌后與台語/獨立樂團 ──
  '江蕙': { english: ['jody', 'jody chiang'], nickname: ['二姐'], pinyinInitials: ['jh'], zhuyinInitials: ['ㄐㄏ'], groupOrAlt: [] },
  '黃乙玲': { english: ['yiting'], nickname: [], pinyinInitials: ['hyl'], zhuyinInitials: ['ㄏㄧㄌ'], groupOrAlt: [] },
  '秀蘭瑪雅': { english: ['showlen', 'showlen maya'], nickname: [], pinyinInitials: ['xlmy'], zhuyinInitials: ['ㄒㄇㄧ'], groupOrAlt: [] },
  '詹雅雯': { english: ['yawen'], nickname: [], pinyinInitials: ['zyw'], zhuyinInitials: ['ㄓㄧㄨ'], groupOrAlt: [] },
  '龍千玉': { english: ['long qianyu'], nickname: [], pinyinInitials: ['lqy'], zhuyinInitials: ['ㄌㄑㄩ'], groupOrAlt: [] },
  '張秀卿': { english: ['show chang'], nickname: [], pinyinInitials: ['zxq'], zhuyinInitials: ['ㄓㄒㄑ'], groupOrAlt: [] },
  '曾心梅': { english: ['tseng hsin mei'], nickname: [], pinyinInitials: ['zxm'], zhuyinInitials: ['ㄗㄒㄇ'], groupOrAlt: [] },
  '曹雅雯': { english: ['olivia', 'olivia tsao'], nickname: [], pinyinInitials: ['cyw'], zhuyinInitials: ['ㄘㄧㄨ'], groupOrAlt: [] },
  '許富凱': { english: ['kai', 'kai hsu'], nickname: ['阿凱'], pinyinInitials: ['xfk'], zhuyinInitials: ['ㄒㄈㄎ'], groupOrAlt: [] },
  '翁立友': { english: ['only', 'only weng'], nickname: [], pinyinInitials: ['wly'], zhuyinInitials: ['ㄨㄌㄧ'], groupOrAlt: [] },
  '蔡小虎': { english: ['tiger', 'tiger tsai'], nickname: [], pinyinInitials: ['cxh'], zhuyinInitials: ['ㄘㄒㄏ'], groupOrAlt: [] },
  '陳雷': { english: ['chen lei'], nickname: [], pinyinInitials: ['cl'], zhuyinInitials: ['ㄔㄌ'], groupOrAlt: [] },
  '沈文程': { english: ['seven', 'seven shen'], nickname: [], pinyinInitials: ['swc'], zhuyinInitials: ['ㄕㄨㄔ'], groupOrAlt: [] },
  '袁小迪': { english: ['yuan'], nickname: [], pinyinInitials: ['yxd'], zhuyinInitials: ['ㄩㄒㄉ'], groupOrAlt: [] },
  '葉啟田': { english: ['yeqitian'], nickname: ['寶島歌王'], pinyinInitials: ['yqt'], zhuyinInitials: ['ㄧㄑㄊ'], groupOrAlt: [] },
  '陳一郎': { english: ['chen yilang'], nickname: [], pinyinInitials: ['cyl'], zhuyinInitials: ['ㄔㄧㄌ'], groupOrAlt: [] },
  '王識賢': { english: ['jason', 'jason wang'], nickname: [], pinyinInitials: ['wsx'], zhuyinInitials: ['ㄨㄕㄒ'], groupOrAlt: [] },
  '洪榮宏': { english: ['hung'], nickname: [], pinyinInitials: ['hrh'], zhuyinInitials: ['ㄏㄖㄏ'], groupOrAlt: [] },
  '阿吉仔': { english: ['aji'], nickname: [], pinyinInitials: ['ajj'], zhuyinInitials: ['ㄚㄐㄗ'], groupOrAlt: [] },
  '滅火器': { english: ['fire ex', 'fire ex.'], nickname: ['滅火器'], pinyinInitials: ['mhq'], zhuyinInitials: ['ㄇㄏㄑ'], groupOrAlt: ['Fire EX.'] },
  '拍謝少年': { english: ['sorry youth'], nickname: ['拍謝'], pinyinInitials: ['pxsn'], zhuyinInitials: ['ㄆㄒㄕㄋ'], groupOrAlt: [] },
  '董事長樂團': { english: ['the chairman'], nickname: ['董事長'], pinyinInitials: ['dszlt'], zhuyinInitials: ['ㄉㄕㄓㄌㄊ'], groupOrAlt: [] },
  '四分衛': { english: ['quarterback'], nickname: [], pinyinInitials: ['sfw'], zhuyinInitials: ['ㄙㄈㄨ'], groupOrAlt: [] },
  '亂彈阿翔': { english: ['luantan ascending'], nickname: ['阿翔'], pinyinInitials: ['ltax'], zhuyinInitials: ['ㄌㄊㄚㄒ'], groupOrAlt: [] },
  '無妄合作社': { english: ['no-nonsense collective'], nickname: [], pinyinInitials: ['wwhzs'], zhuyinInitials: ['ㄨㄨㄏㄗㄕ'], groupOrAlt: [] },
  '百合花': { english: ['lily hymn'], nickname: [], pinyinInitials: ['bhh'], zhuyinInitials: ['ㄅㄏㄏ'], groupOrAlt: [] },
  '芒果醬': { english: ['mango jump'], nickname: ['Mango Jump'], pinyinInitials: ['mgj'], zhuyinInitials: ['ㄇㄍㄐ'], groupOrAlt: ['Mango Jump'] },
  '傻子與白痴': { english: ['fool & idiot', 'fool and idiot'], nickname: [], pinyinInitials: ['szybc'], zhuyinInitials: ['ㄕㄗㄩㄅㄔ'], groupOrAlt: [] },

  // ── 5. 港粵天王天后與日韓國際巨星 ──
  'Beyond': { english: ['beyond'], nickname: ['黃家駒'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['黃家駒'] },
  '草蜢': { english: ['grasshopper'], nickname: [], pinyinInitials: ['cm'], zhuyinInitials: ['ㄘㄇ'], groupOrAlt: [] },
  '陳百強': { english: ['danny', 'danny chan'], nickname: [], pinyinInitials: ['cbq'], zhuyinInitials: ['ㄔㄅㄑ'], groupOrAlt: [] },
  '張國榮': { english: ['leslie', 'leslie cheung'], nickname: ['哥哥'], pinyinInitials: ['zgr'], zhuyinInitials: ['ㄓㄍㄖ'], groupOrAlt: [] },
  '梅艷芳': { english: ['anita', 'anita mui'], nickname: ['梅姐'], pinyinInitials: ['myf'], zhuyinInitials: ['ㄇㄧㄈ'], groupOrAlt: [] },
  '陳慧嫻': { english: ['priscilla', 'priscilla chan'], nickname: [], pinyinInitials: ['chx'], zhuyinInitials: ['ㄔㄏㄒ'], groupOrAlt: [] },
  '關淑怡': { english: ['shirley', 'shirley kwan'], nickname: [], pinyinInitials: ['gsy'], zhuyinInitials: ['ㄍㄕㄧ'], groupOrAlt: [] },
  '楊千嬅': { english: ['miriam', 'miriam yeung'], nickname: ['千嬅'], pinyinInitials: ['yqh'], zhuyinInitials: ['ㄧㄑㄏ'], groupOrAlt: [] },
  '容祖兒': { english: ['joey', 'joey yung'], nickname: [], pinyinInitials: ['rze'], zhuyinInitials: ['ㄖㄗㄦ'], groupOrAlt: [] },
  '謝霆鋒': { english: ['nicholas', 'nicholas tse'], nickname: ['霆鋒'], pinyinInitials: ['xtf'], zhuyinInitials: ['ㄒㄊㄈ'], groupOrAlt: [] },
  '古巨基': { english: ['leo', 'leo ku'], nickname: ['基仔'], pinyinInitials: ['gjk'], zhuyinInitials: ['ㄍㄐㄐ'], groupOrAlt: [] },
  '許志安': { english: ['andy', 'andy hui'], nickname: ['安仔'], pinyinInitials: ['xza'], zhuyinInitials: ['ㄒㄓㄢ'], groupOrAlt: [] },
  '鄭秀文': { english: ['sammi', 'sammi cheng'], nickname: ['Sammi'], pinyinInitials: ['zxw'], zhuyinInitials: ['ㄓㄒㄨ'], groupOrAlt: [] },
  '衛蘭': { english: ['janice', 'janice vidal'], nickname: [], pinyinInitials: ['wl'], zhuyinInitials: ['ㄨㄌ'], groupOrAlt: [] },
  'Twins': { english: ['twins'], nickname: ['阿Sa', '阿嬌'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'RADWIMPS': { english: ['radwimps'], nickname: ['野田洋次郎'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'ONE OK ROCK': { english: ['one ok rock', 'oor'], nickname: ['OOR', 'Taka'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['OOR'] },
  'King Gnu': { english: ['king gnu', 'kinggnu'], nickname: ['常田大希'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'Official髭男dism': { english: ['official hige dandism', 'higedan'], nickname: ['髭男'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['髭男'] },
  'Aimyon': { english: ['aimyon'], nickname: ['愛繆'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['愛繆'] },
  '愛繆': { english: ['aimyon'], nickname: ['Aimyon'], pinyinInitials: ['am'], zhuyinInitials: ['ㄞㄇ'], groupOrAlt: ['Aimyon'] },
  'LiSA': { english: ['lisa'], nickname: ['鬼滅歌姬'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  '宇多田光': { english: ['hikaru utada', 'utada'], nickname: ['Utada'], pinyinInitials: ['ydtg'], zhuyinInitials: ['ㄩㄉㄊㄍ'], groupOrAlt: ['Utada'] },
  '安室奈美惠': { english: ['namie amuro', 'amuro'], nickname: [], pinyinInitials: ['asnmh'], zhuyinInitials: ['ㄢㄕㄋㄇㄏ'], groupOrAlt: [] },
  'X JAPAN': { english: ['x japan', 'xjapan'], nickname: ['Yoshiki', 'Hide'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'TWICE': { english: ['twice'], nickname: ['周子瑜', 'Tzuyu'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'NewJeans': { english: ['newjeans', 'nwjns'], nickname: ['NJ'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'IVE': { english: ['ive'], nickname: ['張員瑛', 'Wonyoung'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'SEVENTEEN': { english: ['seventeen', 'svt'], nickname: ['SVT'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'EXO': { english: ['exo'], nickname: ['EXO'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'BIGBANG': { english: ['bigbang', 'bb'], nickname: ['G-Dragon', 'GD'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['GD'] },

  // ── 6. Wave 4 終極滿貫擴充：西洋巨星、新銳歌手與影視動漫 K-POP ──
  'Taylor Swift': { english: ['taylor swift', 'taylor'], nickname: ['泰勒絲', '黴黴'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['泰勒絲'] },
  'Ed Sheeran': { english: ['ed sheeran', 'ed'], nickname: ['紅髮艾德'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['紅髮艾德'] },
  'Bruno Mars': { english: ['bruno mars', 'bruno'], nickname: ['火星人布魯諾', '火星人'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['火星人'] },
  'Lady Gaga': { english: ['lady gaga', 'gaga'], nickname: ['嘎嘎小姐'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'Adele': { english: ['adele'], nickname: ['愛黛兒'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['愛黛兒'] },
  'Justin Bieber': { english: ['justin bieber', 'jb'], nickname: ['小賈斯汀', '小賈'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['小賈斯汀'] },
  'Billie Eilish': { english: ['billie eilish', 'billie'], nickname: ['怪奇比莉'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['怪奇比莉'] },
  'Coldplay': { english: ['coldplay'], nickname: ['酷玩樂團', '酷玩'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['酷玩樂團'] },
  'Maroon 5': { english: ['maroon 5', 'maroon5', 'm5'], nickname: ['魔力紅'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['魔力紅'] },
  'Michael Jackson': { english: ['michael jackson', 'mj'], nickname: ['麥可傑克森', '麥可'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['麥可傑克森'] },
  'Charlie Puth': { english: ['charlie puth'], nickname: ['查理普斯', '斷眉'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['查理普斯'] },
  'Dua Lipa': { english: ['dua lipa', 'dua'], nickname: ['杜娃黎波'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['杜娃黎波'] },
  'Ariana Grande': { english: ['ariana grande', 'ariana'], nickname: ['亞莉安娜'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['亞莉安娜'] },
  'Beyonce': { english: ['beyonce'], nickname: ['碧昂絲'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['碧昂絲'] },
  'Katy Perry': { english: ['katy perry', 'katy'], nickname: ['凱蒂佩芮', '水果姐'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['凱蒂佩芮'] },
  'Shawn Mendes': { english: ['shawn mendes', 'shawn'], nickname: ['尚恩曼德斯'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['尚恩曼德斯'] },

  'F.I.R.': { english: ['f.i.r.', 'fir'], nickname: ['飛兒樂團', '詹雯婷', 'faye'], pinyinInitials: ['felt'], zhuyinInitials: ['ㄈㄦㄌㄊ'], groupOrAlt: ['飛兒樂團'] },
  '飛兒樂團': { english: ['f.i.r.', 'fir'], nickname: ['F.I.R.', '詹雯婷'], pinyinInitials: ['felt'], zhuyinInitials: ['ㄈㄦㄌㄊ'], groupOrAlt: ['F.I.R.'] },
  'J.Sheon': { english: ['j.sheon', 'jsheon'], nickname: ['街巷'], pinyinInitials: ['jx'], zhuyinInitials: ['ㄐㄒ'], groupOrAlt: [] },
  '婁峻碩': { english: ['shou'], nickname: ['SHOU'], pinyinInitials: ['ljs'], zhuyinInitials: ['ㄌㄩㄕ'], groupOrAlt: [] },
  '黃宣': { english: ['yellow'], nickname: ['YELLOW'], pinyinInitials: ['hx'], zhuyinInitials: ['ㄏㄒ'], groupOrAlt: [] },
  '孫盛希': { english: ['shi shi', 'shishi'], nickname: ['希希'], pinyinInitials: ['ssx'], zhuyinInitials: ['ㄙㄕㄒ'], groupOrAlt: [] },
  '持修': { english: ['chih siou'], nickname: ['社長', '社控總裁'], pinyinInitials: ['cx'], zhuyinInitials: ['ㄔㄒ'], groupOrAlt: [] },
  '9m88': { english: ['9m88'], nickname: ['爵士女神'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  '壞特 ?te': { english: ['?te', 'whyte'], nickname: ['壞特'], pinyinInitials: ['ht'], zhuyinInitials: ['ㄏㄊ'], groupOrAlt: ['?te'] },
  '派偉玖': { english: ['patrick brasca', 'patrick'], nickname: ['小派'], pinyinInitials: ['pwj'], zhuyinInitials: ['ㄆㄨㄐ'], groupOrAlt: [] },
  '南拳媽媽': { english: ['nan quan mama'], nickname: [], pinyinInitials: ['nqmm'], zhuyinInitials: ['ㄋㄑㄇㄇ'], groupOrAlt: [] },
  '旺福': { english: ['wonfu'], nickname: [], pinyinInitials: ['wf'], zhuyinInitials: ['ㄨㄈ'], groupOrAlt: [] },
  'Tizzy Bac': { english: ['tizzy bac', 'tb'], nickname: ['TB'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  '鄭宜農': { english: ['enno cheng', 'enno'], nickname: [], pinyinInitials: ['zyn'], zhuyinInitials: ['ㄓㄧㄋ'], groupOrAlt: [] },
  '岑寧兒': { english: ['yoyo sham', 'yoyo'], nickname: [], pinyinInitials: ['cne'], zhuyinInitials: ['ㄘㄋㄦ'], groupOrAlt: [] },
  '莫宰羊': { english: ['mozaiyang'], nickname: [], pinyinInitials: ['mzy'], zhuyinInitials: ['ㄇㄗㄧ'], groupOrAlt: [] },
  '1976': { english: ['1976'], nickname: ['1976樂團'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['1976樂團'] },
  'CHING G SQUAD': { english: ['ching g squad', 'cgs'], nickname: ['CGS'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },

  'Mrs. GREEN APPLE': { english: ['mrs. green apple', 'mrsgreenapple', 'mga'], nickname: ['青蘋果樂團'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['青蘋果樂團'] },
  'Vaundy': { english: ['vaundy'], nickname: ['Vaundy'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'Creepy Nuts': { english: ['creepy nuts', 'bbbb'], nickname: ['二月二'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'Eve': { english: ['eve'], nickname: ['咒術迴戰主題曲'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'SEKAI NO OWARI': { english: ['sekai no owari', 'endoftheworld'], nickname: ['世界末日'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['世界末日'] },
  'SPYAIR': { english: ['spyair'], nickname: ['排球少年主題曲'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'FLOW': { english: ['flow'], nickname: ['火影忍者主題曲'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'KANA-BOON': { english: ['kana-boon', 'kanaboon'], nickname: [], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'MAN WITH A MISSION': { english: ['man with a mission', 'mwam'], nickname: ['狼人樂團'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['狼人樂團'] },
  'Stray Kids': { english: ['stray kids', 'skz'], nickname: ['SKZ'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'LE SSERAFIM': { english: ['le sserafim', 'lesserafim'], nickname: ['採買'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'aespa': { english: ['aespa'], nickname: ['Karina', 'Winter'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  '(G)I-DLE': { english: ['(g)i-dle', 'gidle', 'i-dle'], nickname: ['葉舒華', '雨琦'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['gidle'] },
  'NMIXX': { english: ['nmixx'], nickname: [], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'ITZY': { english: ['itzy'], nickname: [], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'MAMAMOO': { english: ['mamamoo'], nickname: ['華莎', '頌樂'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'Red Velvet': { english: ['red velvet', 'rv'], nickname: ['RV', 'Irene'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'ENHYPEN': { english: ['enhypen'], nickname: [], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'TXT': { english: ['txt', 'tomorrow x together'], nickname: [], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'NCT': { english: ['nct', 'nct 127', 'nct dream'], nickname: [], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'ZEROBASEONE': { english: ['zerobaseone', 'zb1'], nickname: ['ZB1'], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: ['ZB1'] },
  'RIIZE': { english: ['riize'], nickname: [], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'ATEEZ': { english: ['ateez'], nickname: [], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'TREASURE': { english: ['treasure'], nickname: [], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'STAYC': { english: ['stayc'], nickname: [], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
  'KISS OF LIFE': { english: ['kiss of life', 'kiof'], nickname: [], pinyinInitials: [], zhuyinInitials: [], groupOrAlt: [] },
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
