import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const optionalSongFields = ['lyricist', 'composer', 'lyricsSnippet', 'youtubeUrl', 'zhuyin', 'pinyin'];
const optionalBrandFields = ['code', 'note', 'audioType', 'mvType'];
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
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}

function getSongEntries(payload) {
  if (Array.isArray(payload)) return payload.map((song, index) => [index, song]);
  if (payload?.songs && typeof payload.songs === 'object') return Object.entries(payload.songs);
  throw new Error('Data must be an array of songs or an object with a songs map');
}

function isEmpty(value) {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

function processFile(filePath, apply) {
  const beforeMb = fs.statSync(filePath).size / 1024 / 1024;
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const stats = { filePath, songs: 0, removedSongFields: {}, removedBrandFields: {} };

  for (const [, song] of getSongEntries(payload)) {
    stats.songs++;
    for (const field of optionalSongFields) {
      if (Object.prototype.hasOwnProperty.call(song, field) && isEmpty(song[field])) {
        delete song[field];
        stats.removedSongFields[field] = (stats.removedSongFields[field] || 0) + 1;
      }
    }

    for (const status of Object.values(song.brands || {})) {
      for (const field of optionalBrandFields) {
        if (Object.prototype.hasOwnProperty.call(status, field) && isEmpty(status[field])) {
          delete status[field];
          stats.removedBrandFields[field] = (stats.removedBrandFields[field] || 0) + 1;
        }
      }
    }
  }

  if (apply) fs.writeFileSync(filePath, JSON.stringify(payload), 'utf8');
  const afterMb = apply ? fs.statSync(filePath).size / 1024 / 1024 : beforeMb;
  return { ...stats, beforeMb: Number(beforeMb.toFixed(2)), afterMb: Number(afterMb.toFixed(2)), savedMb: Number((beforeMb - afterMb).toFixed(2)) };
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node scripts/clearEmptyOptionalFields.js [--apply] [--target server/database.json]');
    process.exit(0);
  }
  console.log(JSON.stringify({ mode: args.apply ? 'apply' : 'dry-run', results: args.targetPaths.map(filePath => processFile(filePath, args.apply)) }, null, 2));
} catch (err) {
  console.error(`[Clear Empty Optional Fields] ${err.message}`);
  process.exit(1);
}
