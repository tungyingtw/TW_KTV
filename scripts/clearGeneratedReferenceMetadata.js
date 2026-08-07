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
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}

function getSongEntries(payload) {
  if (Array.isArray(payload)) return payload.map((song, index) => [index, song]);
  if (payload?.songs && typeof payload.songs === 'object') return Object.entries(payload.songs);
  throw new Error('Data must be an array of songs or an object with a songs map');
}

function isGeneratedLyricsSnippet(value) {
  const text = String(value || '').trim();
  return text.includes('全台 10 大 KTV') || /^.+《.+》KTV 歌曲資料待校對。$/.test(text);
}

function isGeneratedYoutubeSearchUrl(value) {
  return String(value || '').includes('youtube.com/results?search_query=');
}

function processFile(filePath, apply) {
  const beforeMb = fs.statSync(filePath).size / 1024 / 1024;
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const stats = { filePath, songs: 0, removedSnippet: 0, keptSnippet: 0, removedYoutubeSearch: 0, keptYoutubeUrl: 0, missingBoth: 0 };

  for (const [, song] of getSongEntries(payload)) {
    stats.songs++;
    if (isGeneratedLyricsSnippet(song.lyricsSnippet)) {
      delete song.lyricsSnippet;
      stats.removedSnippet++;
    } else if (song.lyricsSnippet) stats.keptSnippet++;

    if (isGeneratedYoutubeSearchUrl(song.youtubeUrl)) {
      delete song.youtubeUrl;
      stats.removedYoutubeSearch++;
    } else if (song.youtubeUrl) stats.keptYoutubeUrl++;

    if (!song.lyricsSnippet && !song.youtubeUrl) stats.missingBoth++;
  }

  if (apply) fs.writeFileSync(filePath, JSON.stringify(payload), 'utf8');
  const afterMb = apply ? fs.statSync(filePath).size / 1024 / 1024 : beforeMb;
  return { ...stats, beforeMb: Number(beforeMb.toFixed(2)), afterMb: Number(afterMb.toFixed(2)), savedMb: Number((beforeMb - afterMb).toFixed(2)) };
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node scripts/clearGeneratedReferenceMetadata.js [--apply] [--target server/database.json]');
    process.exit(0);
  }

  console.log(JSON.stringify({
    mode: args.apply ? 'apply' : 'dry-run',
    results: args.targetPaths.map(filePath => processFile(filePath, args.apply)),
  }, null, 2));
} catch (err) {
  console.error(`[Clear Generated Reference Metadata] ${err.message}`);
  process.exit(1);
}
