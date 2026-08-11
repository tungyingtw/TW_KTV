import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const statsPath = path.join(rootDir, 'server', 'stats.json');
const visitRegionStatsPath = process.env.VISIT_REGION_STATS_PATH
  ? path.resolve(process.env.VISIT_REGION_STATS_PATH)
  : path.join(rootDir, 'server', 'visit_region_stats.json');
const redisTotalKey = 'ktv:totalVisits';
const seedWeightVersion = 'tw-population-metro-v1';
const statsVersion = 1;

const regions = [
  ['TWTPE', '台北市', 10.5],
  ['TWNWT', '新北市', 12.5],
  ['TWTAO', '桃園市', 9.5],
  ['TWHSQ', '新竹縣', 3.2],
  ['TWHSZ', '新竹市', 3.4],
  ['TWMIA', '苗栗縣', 3.0],
  ['TWTXG', '台中市', 11.5],
  ['TWCHA', '彰化縣', 4.2],
  ['TWNAN', '南投縣', 2.5],
  ['TWYUN', '雲林縣', 2.7],
  ['TWCYQ', '嘉義縣', 2.2],
  ['TWCYI', '嘉義市', 1.9],
  ['TWTNN', '台南市', 7.4],
  ['TWKHH', '高雄市', 10.2],
  ['TWPIF', '屏東縣', 3.7],
  ['TWILA', '宜蘭縣', 2.9],
  ['TWHUA', '花蓮縣', 2.4],
  ['TWTTT', '台東縣', 1.8],
  ['TWKEE', '基隆市', 2.2],
  ['TWPEN', '澎湖縣', 0.8],
  ['TWKIN', '金門縣', 0.7],
  ['TWLIE', '連江縣', 0.2],
];

function loadLocalEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const key = trimmed.slice(0, trimmed.indexOf('=')).trim();
    let value = trimmed.slice(trimmed.indexOf('=') + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = { dryRun: false, apply: false, force: false, topUp: false, baselineTotal: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--top-up') args.topUp = true;
    else if (arg === '--baseline-total') args.baselineTotal = argv[++i] || '';
    else if (arg.startsWith('--baseline-total=')) args.baselineTotal = arg.slice('--baseline-total='.length);
    else throw new Error(`未知參數：${arg}`);
  }
  if (args.dryRun === args.apply) throw new Error('請明確指定 --dry-run 或 --apply 其中一個。');
  if (args.apply && args.baselineTotal !== null) throw new Error('正式寫入不得使用 --baseline-total，必須讀取 production baseline。');
  if (args.topUp && !args.apply) throw new Error('--top-up 只能搭配 --apply 使用。');
  if (args.topUp && args.force) throw new Error('--top-up 與 --force 不得同時使用。');
  if (args.baselineTotal !== null) args.baselineTotal = parsePositiveInteger(args.baselineTotal, '--baseline-total');
  return args;
}

function parsePositiveInteger(value, label) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) throw new Error(`${label} 必須是正整數。`);
  return numberValue;
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

async function readUpstashTotalVisits() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) return null;

  const res = await fetch(`${redisUrl.replace(/\/+$/, '')}/GET/${encodeURIComponent(redisTotalKey)}`, {
    headers: { Authorization: `Bearer ${redisToken}` },
  });
  if (!res.ok) throw new Error(`Upstash Redis 讀取失敗：HTTP ${res.status}`);
  const data = await res.json();
  return {
    total: parsePositiveInteger(data.result, redisTotalKey),
    source: `upstash:${redisTotalKey}`,
  };
}

function readLocalStatsTotalVisits() {
  const data = readJsonFile(statsPath);
  return {
    total: parsePositiveInteger(data.totalVisits, 'server/stats.json totalVisits'),
    source: 'local:server/stats.json',
  };
}

async function readBaselineTotal(args) {
  if (args.baselineTotal !== null) return { total: args.baselineTotal, source: 'manual:--baseline-total' };
  const upstash = await readUpstashTotalVisits();
  if (upstash) return upstash;
  if (args.apply && process.env.SEED_VISIT_REGION_ALLOW_LOCAL_APPLY !== 'true') {
    throw new Error('正式寫入缺少 Upstash Redis 環境變數，已拒絕使用本機 stats.json 當 production baseline。');
  }
  return readLocalStatsTotalVisits();
}

function seededJitter(code) {
  const hash = crypto.createHash('sha256').update(`${seedWeightVersion}:${code}`).digest();
  const value = hash.readUInt16BE(0) / 65535;
  return 0.96 + value * 0.08;
}

function allocateSeedCounts(total) {
  const weighted = regions.map(([code, name, weight]) => ({ code, name, weight: weight * seededJitter(code) }));
  const weightTotal = weighted.reduce((sum, region) => sum + region.weight, 0);
  const floors = weighted.map(region => {
    const exact = total * region.weight / weightTotal;
    return { ...region, exact, seed_count: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = total - floors.reduce((sum, region) => sum + region.seed_count, 0);
  for (const region of floors.sort((a, b) => b.remainder - a.remainder || a.code.localeCompare(b.code))) {
    if (remaining <= 0) break;
    region.seed_count += 1;
    remaining -= 1;
  }
  return floors.sort((a, b) => b.seed_count - a.seed_count);
}

function createDefaultVisitRegionStats(nowIso) {
  return {
    version: statsVersion,
    seededAt: null,
    liveStartedAt: null,
    seedBaselineTotal: 0,
    seedBaselineCapturedAt: null,
    seedWeightVersion: '',
    totalSeedCount: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
    regions: Object.fromEntries(regions.map(([code, name]) => [code, { name, seed_count: 0, live_count: 0 }])),
    dailyDedup: {},
  };
}

function readVisitRegionStats(nowIso) {
  if (!fs.existsSync(visitRegionStatsPath)) return createDefaultVisitRegionStats(nowIso);
  const parsed = readJsonFile(visitRegionStatsPath);
  return {
    ...createDefaultVisitRegionStats(nowIso),
    ...(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}),
    regions: {
      ...createDefaultVisitRegionStats(nowIso).regions,
      ...((parsed?.regions && typeof parsed.regions === 'object' && !Array.isArray(parsed.regions)) ? parsed.regions : {}),
    },
  };
}

function countExistingRegionValues(stats) {
  return regions.reduce((acc, [code]) => {
    const region = stats.regions?.[code] || {};
    acc.seed += Number.isFinite(Number(region.seed_count)) ? Math.max(0, Math.floor(Number(region.seed_count))) : 0;
    acc.live += Number.isFinite(Number(region.live_count)) ? Math.max(0, Math.floor(Number(region.live_count))) : 0;
    return acc;
  }, { seed: 0, live: 0 });
}

function buildSeededStats(existingStats, allocations, baseline, capturedAt) {
  const allocationByCode = new Map(allocations.map(region => [region.code, region.seed_count]));
  return {
    ...existingStats,
    version: statsVersion,
    seededAt: capturedAt,
    seedBaselineTotal: baseline.total,
    seedBaselineCapturedAt: capturedAt,
    seedWeightVersion,
    totalSeedCount: baseline.total,
    updatedAt: capturedAt,
    regions: Object.fromEntries(regions.map(([code, name]) => [code, {
      name,
      seed_count: allocationByCode.get(code) || 0,
      live_count: 0,
    }])),
    dailyDedup: existingStats.dailyDedup && typeof existingStats.dailyDedup === 'object' && !Array.isArray(existingStats.dailyDedup) ? existingStats.dailyDedup : {},
  };
}

function buildTopUpStats(existingStats, allocations, baseline, capturedAt) {
  const allocationByCode = new Map(allocations.map(region => [region.code, region.seed_count]));
  const currentSeedTotal = parsePositiveInteger(existingStats.totalSeedCount || countExistingRegionValues(existingStats).seed, 'existing totalSeedCount');
  const delta = baseline.total - currentSeedTotal;
  if (delta <= 0) throw new Error(`不需要補分配：latest=${baseline.total}, currentSeed=${currentSeedTotal}`);
  const deltaAllocations = allocateSeedCounts(delta);
  const deltaByCode = new Map(deltaAllocations.map(region => [region.code, region.seed_count]));
  const nextRegions = Object.fromEntries(regions.map(([code, name]) => {
    const current = existingStats.regions?.[code] || {};
    return [code, {
      name,
      seed_count: (allocationByCode.has(code) ? Number(current.seed_count || 0) : 0) + (deltaByCode.get(code) || 0),
      live_count: 0,
    }];
  }));

  return {
    ...existingStats,
    version: statsVersion,
    seedBaselineTotal: baseline.total,
    seedBaselineCapturedAt: capturedAt,
    seedWeightVersion,
    totalSeedCount: baseline.total,
    updatedAt: capturedAt,
    regions: nextRegions,
    dailyDedup: existingStats.dailyDedup && typeof existingStats.dailyDedup === 'object' && !Array.isArray(existingStats.dailyDedup) ? existingStats.dailyDedup : {},
  };
}

function writeJsonAtomic(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.renameSync(tempPath, filePath);
}

async function main() {
  loadLocalEnv();
  const args = parseArgs(process.argv);
  const capturedAt = new Date().toISOString();
  const baseline = await readBaselineTotal(args);
  const allocations = allocateSeedCounts(baseline.total);
  const sum = allocations.reduce((acc, region) => acc + region.seed_count, 0);
  if (sum !== baseline.total) throw new Error(`分配總和錯誤：${sum} != ${baseline.total}`);

  let applied = false;
  let topUpDelta = 0;
  if (args.apply) {
    const existingStats = readVisitRegionStats(capturedAt);
    const existingCounts = countExistingRegionValues(existingStats);
    if (!args.force && existingCounts.live > 0) {
      throw new Error(`統計檔已有 live_count=${existingCounts.live}，已拒絕 seed。若確認要重跑，請明確加入 --force。`);
    }
    if (!args.force && existingCounts.seed > 0 && !args.topUp) {
      throw new Error(`統計檔已有 seed_count=${existingCounts.seed}，已拒絕重複 seed。若只是補上線前差額，請使用 --top-up；若確認重寫，請使用 --force。`);
    }
    const nextStats = args.topUp
      ? buildTopUpStats(existingStats, allocations, baseline, capturedAt)
      : buildSeededStats(existingStats, allocations, baseline, capturedAt);
    topUpDelta = args.topUp ? baseline.total - existingCounts.seed : 0;
    writeJsonAtomic(visitRegionStatsPath, nextStats);
    applied = true;
  }

  console.log(JSON.stringify({
    dryRun: args.dryRun,
    applied,
    topUp: args.topUp,
    topUpDelta,
    writesFile: args.apply,
    targetPath: args.apply ? visitRegionStatsPath : null,
    source: baseline.source,
    seedBaselineTotal: baseline.total,
    seedBaselineCapturedAt: capturedAt,
    seedWeightVersion,
    regionCount: allocations.length,
    totalSeedCount: sum,
    regions: allocations.map(region => ({
      city_code: region.code,
      city_name: region.name,
      seed_count: region.seed_count,
      live_count: 0,
    })),
  }, null, 2));
}

main().catch(err => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
