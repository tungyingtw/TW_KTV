import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sourcePath = path.join(rootDir, 'server/database.json');
const defaultCandidatePath = path.join(os.tmpdir(), 'database.slim-note.json');

const removableNotes = new Set([
  '點碼對照更新',
  '台灣點歌王 20260730 匯入',
  '星○ KTV 歌單匯入',
  '名冊反查寫入',
]);

function parseArgs(argv) {
  const args = { candidatePath: defaultCandidatePath };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--candidate') args.candidatePath = path.resolve(rootDir, argv[++i] || '');
    else if (argv[i] === '--help') args.help = true;
    else throw new Error(`未知參數：${argv[i]}`);
  }
  return args;
}

function printHelp() {
  console.log([
    'Usage:',
    '  node scripts/validateSlimNoteCandidate.js',
    '  node scripts/validateSlimNoteCandidate.js --candidate C:\\tmp\\database.slim-note.json',
  ].join('\n'));
}

function isBrandAvailable(status) {
  return Boolean(status) && status.available !== false;
}

function getSearchablePhonetic(value) {
  const normalized = String(value || '').trim();
  return normalized && normalized.toUpperCase() !== 'AUTO' ? normalized : '';
}

function isGeneratedLyricsSnippet(value) {
  const text = String(value || '').trim();
  return text.includes('全台 10 大 KTV') || /^.+《.+》KTV 歌曲資料待校對。$/.test(text);
}

function getMeaningfulLyricsSnippet(value) {
  return isGeneratedLyricsSnippet(value) ? '' : String(value || '').trim();
}

function getMeaningfulYoutubeUrl(value) {
  const url = String(value || '').trim();
  return url.includes('youtube.com/results?search_query=') ? '' : url;
}

function readSongs(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`找不到檔案：${filePath}`);
  const songs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(songs)) throw new Error(`${filePath} 必須是歌曲陣列`);
  return songs;
}

function hashFrontendShape(songs) {
  const hash = crypto.createHash('sha256');
  for (const song of songs) {
    hash.update(JSON.stringify({
      id: song.id,
      title: song.title,
      artist: song.artist,
      lyricist: song.lyricist,
      composer: song.composer,
      language: song.language,
      zhuyin: getSearchablePhonetic(song.zhuyin),
      pinyin: getSearchablePhonetic(song.pinyin),
      releaseYear: song.releaseYear,
      lyricsSnippet: getMeaningfulLyricsSnippet(song.lyricsSnippet),
      youtubeUrl: getMeaningfulYoutubeUrl(song.youtubeUrl),
      isMainlandViral: song.isMainlandViral,
      brands: Object.fromEntries(Object.entries(song.brands || {}).map(([brandId, status]) => [brandId, {
        available: isBrandAvailable(status),
        code: status.code,
        audioType: status.audioType,
        mvType: status.mvType,
      }])),
    }));
  }
  return hash.digest('hex');
}

function getSearchableText(song) {
  return [
    song.title,
    song.artist,
    song.lyricist,
    song.composer,
    song.language,
    getSearchablePhonetic(song.zhuyin),
    getSearchablePhonetic(song.pinyin),
    getMeaningfulLyricsSnippet(song.lyricsSnippet),
  ].filter(Boolean).join(' ').toLowerCase();
}

function countSearchMatches(songs, query) {
  const cleanQuery = String(query).toLowerCase();
  return songs.reduce((count, song) => count + (getSearchableText(song).includes(cleanQuery) ? 1 : 0), 0);
}

function countFilterMatches(songs, predicate) {
  return songs.reduce((count, song) => count + (predicate(song) ? 1 : 0), 0);
}

function validate(source, candidate) {
  const sampleQueries = ['周杰倫', '五月天', '蔡依林', '陳奕迅', 'Selina', '國語', '台語'];
  const result = {
    sourceSongs: source.length,
    candidateSongs: candidate.length,
    sourceBrands: 0,
    candidateBrands: 0,
    frontendShapeMatches: hashFrontendShape(source) === hashFrontendShape(candidate),
    idTitleMismatches: 0,
    nonNoteBrandChanges: 0,
    removedNotes: 0,
    retainedNotes: 0,
    unexpectedRemovedNotes: {},
    removedByNote: {},
    sampleSearchMatches: {},
    sampleFilterMatches: {},
  };

  if (source.length !== candidate.length) throw new Error('歌曲數不一致');

  for (let i = 0; i < source.length; i++) {
    const srcSong = source[i];
    const candSong = candidate[i];
    if (srcSong.id !== candSong.id || srcSong.title !== candSong.title || srcSong.artist !== candSong.artist) result.idTitleMismatches++;

    const srcBrands = srcSong.brands || {};
    const candBrands = candSong.brands || {};
    const srcBrandIds = Object.keys(srcBrands).sort();
    const candBrandIds = Object.keys(candBrands).sort();
    result.sourceBrands += srcBrandIds.length;
    result.candidateBrands += candBrandIds.length;

    if (JSON.stringify(srcBrandIds) !== JSON.stringify(candBrandIds)) result.nonNoteBrandChanges++;

    for (const brandId of srcBrandIds) {
      const srcStatus = srcBrands[brandId] || {};
      const candStatus = candBrands[brandId] || {};
      const srcComparable = { ...srcStatus };
      const candComparable = { ...candStatus };
      delete srcComparable.note;
      delete candComparable.note;
      if (JSON.stringify(srcComparable) !== JSON.stringify(candComparable)) result.nonNoteBrandChanges++;

      if (srcStatus.note && !candStatus.note) {
        result.removedNotes++;
        result.removedByNote[srcStatus.note] = (result.removedByNote[srcStatus.note] || 0) + 1;
        if (!removableNotes.has(srcStatus.note)) result.unexpectedRemovedNotes[srcStatus.note] = (result.unexpectedRemovedNotes[srcStatus.note] || 0) + 1;
      } else if (candStatus.note) {
        result.retainedNotes++;
      }
    }
  }

  for (const query of sampleQueries) {
    result.sampleSearchMatches[query] = {
      source: countSearchMatches(source, query),
      candidate: countSearchMatches(candidate, query),
    };
  }

  result.sampleFilterMatches.officialMv = {
    source: countFilterMatches(source, song => Object.values(song.brands || {}).some(status => isBrandAvailable(status) && status.mvType === 'official_mv')),
    candidate: countFilterMatches(candidate, song => Object.values(song.brands || {}).some(status => isBrandAvailable(status) && status.mvType === 'official_mv')),
  };
  result.sampleFilterMatches.guidedVocal = {
    source: countFilterMatches(source, song => Object.values(song.brands || {}).some(status => isBrandAvailable(status) && status.audioType === 'guided_vocal')),
    candidate: countFilterMatches(candidate, song => Object.values(song.brands || {}).some(status => isBrandAvailable(status) && status.audioType === 'guided_vocal')),
  };

  return result;
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const source = readSongs(sourcePath);
  const candidate = readSongs(args.candidatePath);
  const result = validate(source, candidate);
  const errors = [];
  if (result.idTitleMismatches) errors.push('歌曲順序或基本識別欄位不一致');
  if (result.sourceBrands !== result.candidateBrands) errors.push('品牌狀態總數不一致');
  if (result.nonNoteBrandChanges) errors.push('除了 note 以外的品牌欄位發生變更');
  if (!result.frontendShapeMatches) errors.push('前台使用資料形狀發生變更');
  if (Object.keys(result.unexpectedRemovedNotes).length) errors.push('移除了不在白名單內的 note');
  if (Object.values(result.sampleSearchMatches).some(item => item.source !== item.candidate)) errors.push('搜尋樣本結果數不一致');
  if (Object.values(result.sampleFilterMatches).some(item => item.source !== item.candidate)) errors.push('篩選樣本結果數不一致');

  console.log(JSON.stringify({
    sourcePath,
    candidatePath: args.candidatePath,
    sourceMb: Number((fs.statSync(sourcePath).size / 1024 / 1024).toFixed(2)),
    candidateMb: Number((fs.statSync(args.candidatePath).size / 1024 / 1024).toFixed(2)),
    savedMb: Number(((fs.statSync(sourcePath).size - fs.statSync(args.candidatePath).size) / 1024 / 1024).toFixed(2)),
    ...result,
    success: errors.length === 0,
    errors,
  }, null, 2));

  if (errors.length) process.exit(1);
} catch (err) {
  console.error(`❌ [Validate Slim Note Candidate] ${err.message}`);
  process.exit(1);
}
