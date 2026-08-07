import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sourcePath = path.join(rootDir, 'server/database.json');
const defaultOutputPath = path.join(rootDir, 'scratch/database.slim-note.json');

const removableNotes = new Set([
  '點碼對照更新',
  '台灣點歌王 20260730 匯入',
  '星○ KTV 歌單匯入',
  '名冊反查寫入',
]);

function parseArgs(argv) {
  const args = { outputPath: defaultOutputPath, apply: false, pretty: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') args.outputPath = path.resolve(rootDir, argv[++i] || '');
    else if (argv[i] === '--apply') args.apply = true;
    else if (argv[i] === '--pretty') args.pretty = true;
    else if (argv[i] === '--help') args.help = true;
    else throw new Error(`未知參數：${argv[i]}`);
  }
  return args;
}

function printHelp() {
  console.log([
    'Usage:',
    '  node scripts/createSlimNoteCandidate.js',
    '  node scripts/createSlimNoteCandidate.js --out scratch/database.slim-note.json',
    '  node scripts/createSlimNoteCandidate.js --pretty',
    '  node scripts/createSlimNoteCandidate.js --apply',
    '',
    'Default mode only writes a candidate file. Use --apply only after validation.',
  ].join('\n'));
}

function getBrandStats(songs) {
  let brandTotal = 0;
  let noteTotal = 0;
  for (const song of songs) {
    for (const status of Object.values(song.brands || {})) {
      brandTotal++;
      if (status.note) noteTotal++;
    }
  }
  return { songs: songs.length, brandTotal, noteTotal };
}

function slimNotes(songs) {
  let removedNotes = 0;
  const removedByNote = {};
  for (const song of songs) {
    for (const status of Object.values(song.brands || {})) {
      if (!removableNotes.has(status.note)) continue;
      removedByNote[status.note] = (removedByNote[status.note] || 0) + 1;
      delete status.note;
      removedNotes++;
    }
  }
  return { removedNotes, removedByNote };
}

function fileSizeMb(filePath) {
  return fs.statSync(filePath).size / 1024 / 1024;
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!fs.existsSync(sourcePath)) throw new Error(`找不到來源資料庫：${sourcePath}`);

  const sourceMb = fileSizeMb(sourcePath);
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const songs = JSON.parse(raw);
  if (!Array.isArray(songs)) throw new Error('database.json 必須是歌曲陣列');

  const before = getBrandStats(songs);
  const result = slimNotes(songs);
  const after = getBrandStats(songs);
  const targetPath = args.apply ? sourcePath : args.outputPath;

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(songs, null, args.pretty ? 2 : 0), 'utf8');

  const targetMb = fileSizeMb(targetPath);

  console.log(JSON.stringify({
    mode: args.apply ? 'apply' : 'candidate',
    sourcePath,
    outputPath: targetPath,
    pretty: args.pretty,
    sourceMb: Number(sourceMb.toFixed(2)),
    outputMb: Number(targetMb.toFixed(2)),
    savedMb: Number((sourceMb - targetMb).toFixed(2)),
    before,
    after,
    ...result,
  }, null, 2));
} catch (err) {
  console.error(`❌ [Slim Note Candidate] ${err.message}`);
  process.exit(1);
}
