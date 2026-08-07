import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const defaultTargets = [
  path.join(rootDir, 'server/database.json'),
  path.join(rootDir, 'server/catalog_overrides.json'),
].filter(filePath => fs.existsSync(filePath));

function parseArgs(argv) {
  const args = { apply: false, targetPaths: defaultTargets };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') args.apply = true;
    else if (argv[i] === '--target') args.targetPaths = [path.resolve(rootDir, argv[++i] || '')];
    else if (argv[i] === '--help') args.help = true;
    else throw new Error(`未知參數：${argv[i]}`);
  }
  return args;
}

function printHelp() {
  console.log([
    'Usage:',
    '  node scripts/clearFakeMediaMetadata.js',
    '  node scripts/clearFakeMediaMetadata.js --apply',
    '  node scripts/clearFakeMediaMetadata.js --target server/database.json --apply',
    '',
    'Dry-run by default. Removes fake audioType/mvType markers only with --apply.',
  ].join('\n'));
}

function getSongEntries(payload) {
  if (Array.isArray(payload)) return payload.map((song, index) => [index, song]);
  if (payload?.songs && typeof payload.songs === 'object') return Object.entries(payload.songs);
  throw new Error('資料格式必須是歌曲陣列或 { songs } 物件');
}

function clearSongMediaMetadata(song, stats) {
  for (const status of Object.values(song.brands || {})) {
    stats.brandTotal++;
    if (status.audioType) {
      stats.removedAudioType[status.audioType] = (stats.removedAudioType[status.audioType] || 0) + 1;
      delete status.audioType;
    }
    if (status.mvType) {
      stats.removedMvType[status.mvType] = (stats.removedMvType[status.mvType] || 0) + 1;
      delete status.mvType;
    }
  }
}

function processFile(filePath, apply) {
  const beforeMb = fs.statSync(filePath).size / 1024 / 1024;
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const stats = { filePath, songs: 0, brandTotal: 0, removedAudioType: {}, removedMvType: {} };
  for (const [, song] of getSongEntries(payload)) {
    stats.songs++;
    clearSongMediaMetadata(song, stats);
  }
  if (apply) fs.writeFileSync(filePath, JSON.stringify(payload), 'utf8');
  const afterMb = apply ? fs.statSync(filePath).size / 1024 / 1024 : beforeMb;
  return { ...stats, beforeMb: Number(beforeMb.toFixed(2)), afterMb: Number(afterMb.toFixed(2)), savedMb: Number((beforeMb - afterMb).toFixed(2)) };
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  const results = args.targetPaths.map(filePath => processFile(filePath, args.apply));
  console.log(JSON.stringify({ mode: args.apply ? 'apply' : 'dry-run', results }, null, 2));
} catch (err) {
  console.error(`❌ [Clear Fake Media Metadata] ${err.message}`);
  process.exit(1);
}
