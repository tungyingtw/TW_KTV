import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadLocalEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadLocalEnv();

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────
// 安全設定
// ─────────────────────────────────────────────
app.disable('x-powered-by');
app.use(cors());

// 速率限制（防 DDoS / 暴力掃描）
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 120;

app.use((req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  if (!requestCounts.has(clientIp)) {
    requestCounts.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  } else {
    const record = requestCounts.get(clientIp);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + RATE_LIMIT_WINDOW_MS;
    } else {
      record.count += 1;
      if (record.count > MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ error: '請求過於頻繁。 Too Many Requests.' });
      }
    }
  }
  next();
});

app.use(express.json({ limit: '2mb' }));

// 告訴搜尋引擎爬蟲：此伺服器為後端 API，請集中索引 https://tungyingtw.github.io/ 正式網站
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// 後端專用 robots.txt 路由：一律拒絕搜尋引擎索引此 API 伺服器
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /\n');
});

// ─────────────────────────────────────────────
// 301 永久重導向：將 Render 根目錄與所有前端路由導向正式 GitHub Pages
// 目的：讓 Google PageRank 完全傳遞給正式網站，防止 Render 搶佔 SEO 排名
// ─────────────────────────────────────────────
const OFFICIAL_SITE = 'https://tungyingtw.github.io/TW_KTV/';
const OFFICIAL_SITE_ORIGIN = new URL(OFFICIAL_SITE).origin;
const ADMIN_ACCESS_MODE = process.env.ADMIN_ACCESS_MODE || 'official_site';
const ADMIN_ALLOWED_ORIGINS = (process.env.ADMIN_ALLOWED_ORIGINS || OFFICIAL_SITE_ORIGIN)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const BRAND_IDS = [
  'watering_hole',
  'golden_voice',
  'superstar',
  'starlight',
  'cashbox',
  'holiday',
  'singgo',
  'vmix',
  'yinyuan',
  'hongyin',
];

function parseVoteKey(key) {
  const brandId = BRAND_IDS.find(id => key.endsWith(`_${id}`));
  if (!brandId) return { songId: key, brandId: '' };
  return { songId: key.slice(0, -(brandId.length + 1)), brandId };
}

app.get('/', (req, res) => {
  res.redirect(301, OFFICIAL_SITE);
});

// 所有前端 HTML 靜態頁面存取一律 301 重導向到正式 GitHub Pages（含 index.html 直接存取）
// 這樣 Google 就不會索引 Render 備份站的任何頁面
app.get('/index.html', (req, res) => res.redirect(301, OFFICIAL_SITE));
app.get('/privacy.html', (req, res) => res.redirect(301, `${OFFICIAL_SITE}privacy.html`));
app.get('/terms.html', (req, res) => res.redirect(301, `${OFFICIAL_SITE}terms.html`));
app.get('/about.html', (req, res) => res.redirect(301, `${OFFICIAL_SITE}about.html`));
app.get('/contact.html', (req, res) => res.redirect(301, `${OFFICIAL_SITE}contact.html`));

// /admin 與 /sys-admin-panel 僅限本機，不重導向（後面另有路由處理）
// /api/* 路由也不重導向（後面另有 API 路由處理）

// ─────────────────────────────────────────────
// Admin 密碼驗證與本機資安過濾 (Security & Localhost-Only Guard)
// ─────────────────────────────────────────────
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.warn('[Server] ADMIN_TOKEN 未設定，管理員 API 將拒絕所有請求。');
}

function isLocalhostRequest(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    // 判斷轉發的第一層 IP 是否為本機
    const isLocalForwarded = firstIp === '127.0.0.1' || firstIp === '::1' || firstIp === '::ffff:127.0.0.1' || firstIp === 'localhost';
    if (!isLocalForwarded) return false; // 來自外網 IP 者拒絕
  }
  const ip = req.socket.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
}

function getRequestSourceOrigin(req) {
  const origin = req.headers.origin;
  if (origin) return origin;

  const referer = req.headers.referer;
  if (!referer) return '';

  try {
    return new URL(referer).origin;
  } catch {
    return '';
  }
}

function isAllowedAdminSource(req) {
  if (isLocalhostRequest(req)) return true;
  if (ADMIN_ACCESS_MODE === 'localhost') return false;

  const sourceOrigin = getRequestSourceOrigin(req);
  return Boolean(sourceOrigin && ADMIN_ALLOWED_ORIGINS.includes(sourceOrigin));
}

function handleAdminPageServe(req, res) {
  if (!isLocalhostRequest(req)) {
    return res.status(403).send('Access Denied: Admin panel is strictly restricted to localhost connection.');
  }
  const adminPath = path.join(__dirname, 'admin.html');
  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath);
  } else {
    res.status(404).send('Admin Panel HTML File Not Found');
  }
}

// 隱密後台路由（支援 /sys-admin-panel 與 /admin）
app.get('/sys-admin-panel', handleAdminPageServe);
app.get('/admin', handleAdminPageServe);
app.get('/admin.html', handleAdminPageServe);

// Render sitemap requests should point crawlers to the official GitHub Pages sitemap.
app.get('/sitemap.xml', (req, res) => {
  res.redirect(301, `${OFFICIAL_SITE}sitemap.xml`);
});

// 靜態檔案服務（僅供本機開發用，Render 線上不再直接 serve 前端頁面）
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../dist')));

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: '未授權：需要高強度管理員密碼 Token' });
  }
  if (!isAllowedAdminSource(req)) {
    return res.status(403).json({ error: '未授權：此管理請求來源不被允許' });
  }
  next();
}

// ─────────────────────────────────────────────
// 資料路徑
// ─────────────────────────────────────────────
const CATALOG_PATH = path.join(__dirname, '../public/songs_catalog.json');
const REPORTS_PATH = path.join(__dirname, 'reports.json');
const VOTES_PATH   = path.join(__dirname, 'votes.json');
const ADMIN_LOG_PATH = path.join(__dirname, 'admin_actions.log');
const CATALOG_OVERRIDES_PATH = path.join(__dirname, 'catalog_overrides.json');

// ─────────────────────────────────────────────
// 資料讀寫工具
// ─────────────────────────────────────────────
let songsDatabase = [];
try {
  // 載入資料庫（優先讀取 public/songs_catalog.json，較新）
  if (fs.existsSync(CATALOG_PATH)) {
    songsDatabase = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    console.log(`[Server] 成功載入 ${songsDatabase.length} 首 KTV 歌曲資料庫`);
  } else {
    const dbPath = path.join(__dirname, 'database.json');
    if (fs.existsSync(dbPath)) {
      songsDatabase = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      console.log(`[Server] 使用 database.json，共 ${songsDatabase.length} 首`);
    }
  }
} catch (err) {
  console.error('[Server Error] 讀取資料庫失敗:', err);
}

function loadReports() {
  try { return JSON.parse(fs.readFileSync(REPORTS_PATH, 'utf8')); } catch { return []; }
}
function saveReports(data) {
  fs.writeFileSync(REPORTS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

async function loadReportsStore() {
  if (USE_REDIS) {
    try {
      const raw = await redisCmd('get', REPORTS_REDIS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Reports persistent read failed: ${err.message}`);
    }
  }
  return loadReports();
}

async function saveReportsStore(data) {
  if (USE_REDIS) {
    try {
      await redisCmd('set', REPORTS_REDIS_KEY, JSON.stringify(data));
      try { saveReports(data); } catch (err) {
        console.warn('[Reports] Local JSON backup write failed:', err.message);
      }
      return;
    } catch (err) {
      try { saveReports(data); } catch (localErr) {
        console.warn('[Reports] Local JSON backup write failed:', localErr.message);
      }
      throw new Error(`Reports persistent write failed: ${err.message}`);
    }
  }

  try { saveReports(data); } catch (err) {
    console.warn('[Reports] Local JSON backup write failed:', err.message);
  }
}

function loadVotes() {
  try { return JSON.parse(fs.readFileSync(VOTES_PATH, 'utf8')); } catch { return {}; }
}
function saveVotes(data) {
  fs.writeFileSync(VOTES_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function loadCatalogOverrides() {
  try { return JSON.parse(fs.readFileSync(CATALOG_OVERRIDES_PATH, 'utf8')); } catch { return { songs: {} }; }
}
function saveCatalogOverrides(data) {
  fs.writeFileSync(CATALOG_OVERRIDES_PATH, JSON.stringify(data, null, 2), 'utf8');
}

async function loadVotesStore() {
  if (USE_REDIS) {
    try {
      const raw = await redisCmd('get', VOTES_REDIS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Votes persistent read failed: ${err.message}`);
    }
  }
  return loadVotes();
}

async function saveVotesStore(data) {
  if (USE_REDIS) {
    try {
      await redisCmd('set', VOTES_REDIS_KEY, JSON.stringify(data));
      try { saveVotes(data); } catch (err) {
        console.warn('[Votes] Local JSON backup write failed:', err.message);
      }
      return;
    } catch (err) {
      try { saveVotes(data); } catch (localErr) {
        console.warn('[Votes] Local JSON backup write failed:', localErr.message);
      }
      throw new Error(`Votes persistent write failed: ${err.message}`);
    }
  }

  try { saveVotes(data); } catch (err) {
    console.warn('[Votes] Local JSON backup write failed:', err.message);
  }
}

async function loadCatalogOverridesStore() {
  if (USE_REDIS) {
    try {
      const raw = await redisCmd('get', CATALOG_OVERRIDES_REDIS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Catalog overrides persistent read failed: ${err.message}`);
    }
  }
  return loadCatalogOverrides();
}

async function saveCatalogOverridesStore(data) {
  if (USE_REDIS) {
    try {
      await redisCmd('set', CATALOG_OVERRIDES_REDIS_KEY, JSON.stringify(data));
      try { saveCatalogOverrides(data); } catch (err) {
        console.warn('[CatalogOverrides] Local JSON backup write failed:', err.message);
      }
      return;
    } catch (err) {
      try { saveCatalogOverrides(data); } catch (localErr) {
        console.warn('[CatalogOverrides] Local JSON backup write failed:', localErr.message);
      }
      throw new Error(`Catalog overrides persistent write failed: ${err.message}`);
    }
  }

  try { saveCatalogOverrides(data); } catch (err) {
    console.warn('[CatalogOverrides] Local JSON write failed:', err.message);
  }
}

async function saveCatalogOverrideSong(song) {
  const overrides = await loadCatalogOverridesStore();
  if (!overrides.songs || typeof overrides.songs !== 'object') overrides.songs = {};
  overrides.songs[song.id] = song;
  await saveCatalogOverridesStore(overrides);
}

async function saveCatalog(catalog) {
  const dbPath = path.join(__dirname, 'database.json');
  fs.writeFileSync(dbPath, JSON.stringify(catalog, null, 2), 'utf8');
  try {
    const { generateBinCatalog } = await import('../scripts/buildCatalogBin.js');
    generateBinCatalog();
  } catch (e) {
    console.warn('[Server] 自動同步加密 songs_catalog.bin 警告:', e.message);
  }
}

function logAdminAction(action, detail) {
  const line = `[${new Date().toISOString()}] ${action}: ${JSON.stringify(detail)}\n`;
  try {
    fs.appendFileSync(ADMIN_LOG_PATH, line, 'utf8');
  } catch (err) {
    console.warn('[AdminLog] Local log write failed:', err.message);
  }

  if (USE_REDIS) {
    redisCmd('lpush', ADMIN_LOG_REDIS_KEY, line.trim())
      .then(() => redisCmd('ltrim', ADMIN_LOG_REDIS_KEY, 0, 499))
      .catch(err => console.warn('[AdminLog] Redis log write failed:', err.message));
  }
}

function getVoteConfidence(confirm, deny) {
  const total = confirm + deny;
  if (total < 3) return 'neutral';
  if (deny >= 5 && deny > confirm * 2) return 'disputed';
  if (confirm >= 5 && confirm > deny * 3) return 'verified';
  return 'uncertain';
}

// ─────────────────────────────────────────────
// 公開 API：歌曲搜尋
// ─────────────────────────────────────────────
app.get('/api/songs', (req, res) => {
  const { query, brand, lang, page = 1, limit = 40 } = req.query;
  let results = songsDatabase;

  if (query) {
    const q = String(query).toLowerCase();
    results = results.filter(s => {
      const zhuyin = getSearchablePhonetic(s.zhuyin).toLowerCase();
      const pinyin = getSearchablePhonetic(s.pinyin).toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (zhuyin && zhuyin.includes(q)) ||
        (pinyin && pinyin.includes(q))
      );
    });
  }
  if (brand && brand !== 'all') {
    results = results.filter(s => s.brands[brand]?.available);
  }
  if (lang) {
    const langs = String(lang).split(',');
    results = results.filter(s => langs.includes(s.language));
  }

  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = Math.min(parseInt(String(limit), 10) || 40, 200);
  const start = (pageNum - 1) * limitNum;

  res.json({ total: results.length, page: pageNum, limit: limitNum, songs: results.slice(start, start + limitNum) });
});

function getSearchablePhonetic(value) {
  const normalized = String(value || '').trim();
  return normalized && normalized.toUpperCase() !== 'AUTO' ? normalized : '';
}

app.get('/api/catalog-overrides', async (req, res) => {
  const overrides = await loadCatalogOverridesStore();
  const songs = overrides?.songs && typeof overrides.songs === 'object'
    ? Object.values(overrides.songs)
    : [];
  res.json({ songs });
});

// ── 字串模糊歸一化工具 ──
function normalizeString(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    // 全形數字/英文字元轉半形
    .replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, ' ')
    // 數字轉習慣用語 (例: 5月天 -> 五月天)
    .replace(/\b5月天\b/g, '五月天')
    // 移除常見符號、括號與空白
    .replace(/[《》〈〉『』「」()（）[\]【】\s\-_.,!?]/g, '')
    .trim();
}

// ─────────────────────────────────────────────
// 公開 API：真實訪客線上人數統計與心跳 (Real-Time Visitor Tracking)
// 使用 Upstash Redis REST API 實現跨重啟持久化計數
// 本機開發時自動 fallback 回 in-memory Map（無需額外 npm 套件）
// ─────────────────────────────────────────────
const activeVisitors = new Map();

// 本機 fallback 用（伺服器有 Redis 時不使用）
const visitorCooldowns = new Map();
const VISIT_COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 小時冷卻期

const STATS_PATH = path.join(__dirname, 'stats.json');
const BASE_INITIAL_VISITS = 1;

// ── Upstash Redis 環境設定 ──
const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_REDIS   = !!(REDIS_URL && REDIS_TOKEN);
const STATS_REDIS_TOTAL_KEY = 'ktv:totalVisits';
const VOTES_REDIS_KEY = 'ktv:votes';
const REPORTS_REDIS_KEY = 'ktv:reports';
const ADMIN_LOG_REDIS_KEY = 'ktv:adminLogs';
const CATALOG_OVERRIDES_REDIS_KEY = 'ktv:catalogOverrides';

if (USE_REDIS) {
  console.log('[Stats] Upstash Redis 已啟用：累積查詢人數將持久化儲存');
} else {
  console.log('[Stats] 未設定 Redis 環境變數，使用本機記憶體計數（僅限開發環境）');
}

/**
 * 呼叫 Upstash Redis REST API（無需任何 SDK，純 fetch）
 * 指令格式：GET {REDIS_URL}/{command}/{arg1}/{arg2}/...
 */
async function redisCmd(command, ...args) {
  const urlParts = [REDIS_URL, command, ...args.map(a => encodeURIComponent(String(a)))];
  const res = await fetch(urlParts.join('/'), {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Upstash Redis HTTP ${res.status}`);
  const json = await res.json();
  return json.result;
}

function loadStats() {
  try {
    const data = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
    return { totalVisits: typeof data.totalVisits === 'number' ? Math.max(1, data.totalVisits) : BASE_INITIAL_VISITS };
  } catch {
    return { totalVisits: BASE_INITIAL_VISITS };
  }
}
function saveStats(data) {
  try { fs.writeFileSync(STATS_PATH, JSON.stringify(data, null, 2), 'utf8'); } catch {}
}

let currentStats = loadStats();

async function initializeJsonStoreInRedis(redisKey, localData, label) {
  if (!USE_REDIS) return;

  try {
    const existing = await redisCmd('get', redisKey);
    if (existing !== null && existing !== undefined) return;

    const hasLocalData = Array.isArray(localData)
      ? localData.length > 0
      : localData && typeof localData === 'object' && Object.keys(localData).length > 0;

    if (!hasLocalData) return;

    await redisCmd('set', redisKey, JSON.stringify(localData));
    console.log(`[${label}] Redis 初始化：已從本機 JSON 匯入既有資料`);
  } catch (err) {
    console.warn(`[${label}] Redis 初始化同步失敗:`, err.message);
  }
}

// ── 啟動時從 Redis 同步初始值（確保重啟後數字連續）──
if (USE_REDIS) {
  initializeJsonStoreInRedis(REPORTS_REDIS_KEY, loadReports(), 'Reports');
  initializeJsonStoreInRedis(VOTES_REDIS_KEY, loadVotes(), 'Votes');
  initializeJsonStoreInRedis(CATALOG_OVERRIDES_REDIS_KEY, loadCatalogOverrides(), 'CatalogOverrides');

  redisCmd('get', STATS_REDIS_TOTAL_KEY).then(val => {
    if (val !== null && val !== undefined) {
      const n = parseInt(String(val), 10);
      if (!isNaN(n) && n > currentStats.totalVisits) {
        currentStats.totalVisits = n;
        console.log(`[Stats] 從 Redis 同步累積人數：${n}`);
      }
    } else {
      // 首次部署：把 stats.json 的基數寫入 Redis
      redisCmd('set', STATS_REDIS_TOTAL_KEY, currentStats.totalVisits)
        .then(() => console.log(`[Stats] Redis 初始化累積人數基數：${currentStats.totalVisits}`))
        .catch(e => console.error('[Stats] Redis 初始化失敗:', e.message));
    }
  }).catch(e => console.error('[Stats] Redis 啟動同步失敗:', e.message));
}

app.get('/api/stats/ping', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const visitorId = (req.query.vid && typeof req.query.vid === 'string') ? req.query.vid : clientIp;
  const now = Date.now();

  // 1. 即時線上人數心跳紀錄（以裝置 UUID 為 Key）
  activeVisitors.set(visitorId, now);

  // 清理超過 45 秒未發送心跳的離線 Session
  for (const [vId, lastPing] of activeVisitors.entries()) {
    if (now - lastPing > 45000) activeVisitors.delete(vId);
  }

  let totalVisits = currentStats.totalVisits;

  if (USE_REDIS) {
    // ── Redis 模式：原子化計數 + TTL 去重，完全持久化 ──
    try {
      const VISIT_KEY = `ktv:visit:${visitorId}`;
      const TOTAL_KEY = STATS_REDIS_TOTAL_KEY;
      const COOLDOWN_SEC = 12 * 60 * 60; // 12 小時 TTL

      // 檢查此訪客在 12 小時內是否已計算過（Redis key 有 TTL，自動過期）
      const alreadyVisited = await redisCmd('exists', VISIT_KEY);

      if (!alreadyVisited) {
        // 新訪客（或冷卻已過）：原子遞增，並設定 12h TTL 去重 key
        const newTotal = await redisCmd('incr', TOTAL_KEY);
        await redisCmd('setex', VISIT_KEY, COOLDOWN_SEC, 1);
        totalVisits = typeof newTotal === 'number' ? newTotal : parseInt(String(newTotal), 10);
      } else {
        // 已訪問過：只讀取當前累積值，不重複計數
        const val = await redisCmd('get', TOTAL_KEY);
        totalVisits = val !== null ? parseInt(String(val), 10) : currentStats.totalVisits;
      }

      // 同步本機快取（作為 Redis 短暫故障時的緊急 fallback）
      if (!isNaN(totalVisits)) currentStats.totalVisits = totalVisits;

    } catch (err) {
      console.warn('[Stats] Redis 暫時不可用，拒絕產生非持久化累積數字:', err.message);
      return res.status(503).json({
        error: '累積查詢人數暫時無法更新',
        onlineVisitors: activeVisitors.size,
        totalVisits: currentStats.totalVisits,
        persistent: false,
      });
    }

  } else {
    // ── 本機開發模式：使用記憶體 Map 去重（伺服器重啟後重置屬正常）──
    const lastVisit = visitorCooldowns.get(visitorId);
    if (!lastVisit || (now - lastVisit > VISIT_COOLDOWN_MS)) {
      currentStats.totalVisits = (currentStats.totalVisits || 0) + 1;
      visitorCooldowns.set(visitorId, now);
      saveStats(currentStats);
    }
    totalVisits = currentStats.totalVisits;

    // 清理過期的 Cooldown 快取避免 RAM 佔用
    for (const [vId, time] of visitorCooldowns.entries()) {
      if (now - time > VISIT_COOLDOWN_MS * 2) visitorCooldowns.delete(vId);
    }
  }

  res.json({
    online: activeVisitors.size,
    totalVisits: isNaN(totalVisits) ? 1 : totalVisits,
    persistent: USE_REDIS,
    timestamp: now
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    storage: USE_REDIS ? 'redis' : 'local',
    persistent: USE_REDIS,
    timestamp: Date.now(),
  });
});

// XSS 與 HTML 注入安全過濾器 (Anti-XSS & Injection Guard)
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/javascript:/gi, '')
    .replace(/onload=/gi, '')
    .replace(/onerror=/gi, '')
    .trim();
}

// ─────────────────────────────────────────────
// 公開 API：使用者回報與缺歌建議
// ─────────────────────────────────────────────
app.post('/api/report', async (req, res) => {
  const {
    songId,
    songTitle,
    artist,
    brandId,
    issueType,
    lang,
    songCode,
    lyricist,
    composer,
    mvType,
    note,
    hasOriginalVocal,
    lyricsSnippet,
    youtubeUrl,
    brandName,
    shortName,
    systemType,
    codeFormat,
    storeLocations,
  } = req.body;
  if (!songId || !brandId || !issueType) return res.status(400).json({ error: '缺少必要欄位' });

  const validTypes = ['no_song', 'has_song', 'missing_song', 'suggest_song', 'suggest_new_brand', 'wrong_info', 'other'];
  if (!validTypes.includes(issueType)) return res.status(400).json({ error: '無效的 issueType' });

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const reports = await loadReportsStore();

  // 100% 進行 XSS 與惡意 script 安全清處過濾
  const cleanTitle = sanitizeText(songTitle);
  const cleanArtist = sanitizeText(artist);
  const cleanCode = sanitizeText(songCode);
  const cleanLyricist = sanitizeText(lyricist);
  const cleanComposer = sanitizeText(composer);
  const cleanBrandName = sanitizeText(brandName);
  const cleanShortName = sanitizeText(shortName);
  const cleanSystemType = sanitizeText(systemType);
  const cleanCodeFormat = sanitizeText(codeFormat);
  const cleanStoreLocations = sanitizeText(storeLocations);
  const cleanNote = sanitizeText(note).slice(0, 500);
  const cleanLyricsSnippet = sanitizeText(lyricsSnippet).slice(0, 500);
  const cleanYoutubeUrl = sanitizeText(youtubeUrl).slice(0, 500);

  const newReport = {
    id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    songId: sanitizeText(songId),
    songTitle: cleanTitle,
    artist: cleanArtist,
    brandId: sanitizeText(brandId),
    issueType,
    lang: sanitizeText(lang),
    songCode: cleanCode,
    lyricist: cleanLyricist,
    composer: cleanComposer,
    mvType: mvType || 'unknown',
    hasOriginalVocal: !!hasOriginalVocal,
    lyricsSnippet: cleanLyricsSnippet,
    youtubeUrl: cleanYoutubeUrl,
    brandName: cleanBrandName,
    shortName: cleanShortName,
    systemType: cleanSystemType,
    codeFormat: cleanCodeFormat,
    storeLocations: cleanStoreLocations,
    note: cleanNote,
    timestamp: new Date().toISOString(),
    ip: clientIp,
    status: 'pending',
  };

  let isAutoResolved = false;
  try {
    if (issueType === 'missing_song' && songTitle) {
      const normTitle = normalizeString(songTitle);
      const normArtist = normalizeString(artist);
      const fingerprint = `${normTitle}__${normArtist}`;

      const matchingReports = reports.filter(r => {
        if (r.issueType !== 'missing_song') return false;
        const t = normalizeString(r.songTitle);
        const a = normalizeString(r.artist);
        return `${t}__${a}` === fingerprint;
      });

      const totalMatching = matchingReports.length + 1;
      if (totalMatching >= 2) newReport.adminNote = `累積 ${totalMatching} 筆相似新歌建議，建議優先人工審查。Fingerprint: ${fingerprint}`;
    } else {
      const sameReports = reports.filter(r => r.songId === songId && r.brandId === brandId && r.issueType === issueType);
      const reportCount = sameReports.length + 1;
      if ((issueType === 'no_song' || issueType === 'has_song') && reportCount >= 2) {
        newReport.adminNote = `累積 ${reportCount} 筆相同收錄狀態回報，建議優先人工驗證。`;
      }
    }
  } catch (e) {
    console.error('[Report Consensus Check Error]', e);
  }

  reports.push(newReport);
  try {
    await saveReportsStore(reports);
  } catch (err) {
    console.error('[Reports] Persistent save failed:', err);
    return res.status(503).json({ error: '回報資料暫時無法儲存，請稍後再試' });
  }
  console.log(`[回報] ${songTitle} (${brandId}) - ${issueType} (AutoResolved: ${isAutoResolved})`);
  res.json({ success: true, reportId: newReport.id, autoResolved: isAutoResolved });
});

app.get('/api/reports', requireAdmin, async (req, res) => {
  const reports = await loadReportsStore();
  const { status } = req.query;
  const filtered = status ? reports.filter(r => r.status === status) : reports;
  res.json({ total: filtered.length, reports: filtered.slice(-200).reverse() });
});

// ─────────────────────────────────────────────
// 公開 API：眾包投票
// ─────────────────────────────────────────────
app.post('/api/vote', async (req, res) => {
  const { songId, brandId, vote, previousVote, removeVote } = req.body;
  if (!songId || !brandId || !['confirm', 'deny'].includes(vote)) {
    return res.status(400).json({ error: '缺少必要欄位' });
  }
  if (previousVote && !['confirm', 'deny'].includes(previousVote)) {
    return res.status(400).json({ error: '無效的 previousVote' });
  }

  const votes = await loadVotesStore();
  const key = `${songId}_${brandId}`;
  if (!votes[key]) votes[key] = { confirm: 0, deny: 0, guidedVocal: 0, noGuidedVocal: 0 };

  if (removeVote) {
    votes[key][vote] = Math.max(0, (votes[key][vote] || 0) - 1);
  } else {
    if (previousVote && previousVote !== vote) {
      votes[key][previousVote] = Math.max(0, (votes[key][previousVote] || 0) - 1);
    }
    votes[key][vote] = Math.max(0, (votes[key][vote] || 0) + 1);
  }

  try {
    await saveVotesStore(votes);
  } catch (err) {
    console.error('[Votes] Persistent save failed:', err);
    return res.status(503).json({ error: '投票資料暫時無法儲存，請稍後再試' });
  }

  const d = votes[key];
  const confidence = getVoteConfidence(d.confirm || 0, d.deny || 0);

  res.json({
    success: true, key,
    confirm: d.confirm || 0,
    deny: d.deny || 0,
    guidedVocal: d.guidedVocal || 0,
    noGuidedVocal: d.noGuidedVocal || 0,
    confidence,
  });
});

app.post('/api/vote/guided', async (req, res) => {
  const { songId, brandId, vote, previousVote, removeVote } = req.body;
  if (!songId || !brandId || !['guided', 'none'].includes(vote)) {
    return res.status(400).json({ error: '缺少必要欄位' });
  }
  if (previousVote && !['guided', 'none'].includes(previousVote)) {
    return res.status(400).json({ error: '無效的 previousVote' });
  }

  const votes = await loadVotesStore();
  const key = `${songId}_${brandId}`;
  if (!votes[key]) votes[key] = { confirm: 0, deny: 0, guidedVocal: 0, noGuidedVocal: 0 };
  const voteKey = vote === 'guided' ? 'guidedVocal' : 'noGuidedVocal';

  if (removeVote) {
    votes[key][voteKey] = Math.max(0, (votes[key][voteKey] || 0) - 1);
  } else {
    if (previousVote && previousVote !== vote) {
      const previousKey = previousVote === 'guided' ? 'guidedVocal' : 'noGuidedVocal';
      votes[key][previousKey] = Math.max(0, (votes[key][previousKey] || 0) - 1);
    }
    votes[key][voteKey] = Math.max(0, (votes[key][voteKey] || 0) + 1);
  }

  try {
    await saveVotesStore(votes);
  } catch (err) {
    console.error('[Votes] Guided persistent save failed:', err);
    return res.status(503).json({ error: '導唱投票資料暫時無法儲存，請稍後再試' });
  }

  const d = votes[key];
  res.json({
    success: true,
    key,
    confirm: d.confirm || 0,
    deny: d.deny || 0,
    guidedVocal: d.guidedVocal || 0,
    noGuidedVocal: d.noGuidedVocal || 0,
    confidence: getVoteConfidence(d.confirm || 0, d.deny || 0),
  });
});

app.get('/api/votes/:songId', async (req, res) => {
  const { songId } = req.params;
  const votes = await loadVotesStore();
  const result = {};
  for (const [key, data] of Object.entries(votes)) {
    if (key.startsWith(`${songId}_`)) {
      const brandId = key.slice(songId.length + 1);
      result[brandId] = {
        confirm: data.confirm || 0,
        deny: data.deny || 0,
        guidedVocal: data.guidedVocal || 0,
        noGuidedVocal: data.noGuidedVocal || 0,
        officialMv: data.officialMv || 0,
        editedMv: data.editedMv || 0,
        confidence: getVoteConfidence(data.confirm || 0, data.deny || 0),
      };
    }
  }
  res.json({ songId, votes: result });
});

// ═══════════════════════════════════════════════════════
// 管理員 API（需要 x-admin-token header）
// ═══════════════════════════════════════════════════════

// ── 查看所有回報 ──
app.get('/api/admin/reports', requireAdmin, async (req, res) => {
  const reports = await loadReportsStore();
  const { status } = req.query;
  const filtered = status ? reports.filter(r => r.status === status) : reports;
  res.json({ total: filtered.length, reports: filtered.reverse() });
});

// ── 更新回報狀態（pending → reviewed / resolved）──
app.patch('/api/admin/report/:reportId', requireAdmin, async (req, res) => {
  const { reportId } = req.params;
  const { status, adminNote } = req.body;
  const validStatus = ['pending', 'reviewed', 'resolved', 'rejected'];
  if (!validStatus.includes(status)) return res.status(400).json({ error: '無效的 status' });

  const reports = await loadReportsStore();
  const idx = reports.findIndex(r => r.id === reportId);
  if (idx === -1) return res.status(404).json({ error: '找不到此回報' });

  const report = reports[idx];
  report.status = status;
  report.adminNote = adminNote || '';
  report.reviewedAt = new Date().toISOString();

  // ── 管理員審核動態寫入連通 (Admin Manual Approval -> Live Catalog Injection) ──
  if (status === 'resolved') {
    try {
      if ((report.issueType === 'missing_song' || report.issueType === 'suggest_song') && report.songTitle) {
        const normTitle = normalizeString(report.songTitle);
        const normArtist = normalizeString(report.artist);
        let existingSong = songsDatabase.find(s => normalizeString(s.title) === normTitle && normalizeString(s.artist) === normArtist);

        if (!existingSong) {
          const autoSongId = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          existingSong = {
            id: autoSongId,
            title: report.songTitle.trim(),
            artist: report.artist.trim() || '未填寫',
            lyricist: report.lyricist || '',
            composer: report.composer || '',
            language: report.lang || '國語',
            zhuyin: '',
            pinyin: '',
            releaseYear: new Date().getFullYear(),
            lyricsSnippet: report.lyricsSnippet || '',
            youtubeUrl: report.youtubeUrl || undefined,
            brands: {
              [report.brandId]: {
                available: true,
                code: report.songCode || '',
                audioType: report.hasOriginalVocal ? 'original_vocal' : undefined,
                mvType: report.mvType === 'official' ? 'official_mv' : undefined,
              }
            },
          };
          songsDatabase.push(existingSong);
        } else {
          if (!existingSong.brands) existingSong.brands = {};
          existingSong.brands[report.brandId] = {
            available: true,
            code: report.songCode || existingSong.brands[report.brandId]?.code || '',
            audioType: report.hasOriginalVocal ? 'original_vocal' : existingSong.brands[report.brandId]?.audioType,
            mvType: report.mvType === 'official' ? 'official_mv' : existingSong.brands[report.brandId]?.mvType,
          };
        }
        await saveCatalog(songsDatabase);
        await saveCatalogOverrideSong(existingSong);
        console.log(`[Admin Inject] 管理員審核完成，寫入新歌《${report.songTitle}》— ${report.artist}`);
      } else if (report.songId && songsDatabase.length > 0) {
        const sIdx = songsDatabase.findIndex(s => s.id === report.songId);
        if (sIdx !== -1) {
          if (!songsDatabase[sIdx].brands) songsDatabase[sIdx].brands = {};
          if (report.issueType === 'no_song') {
            songsDatabase[sIdx].brands[report.brandId] = {
              ...songsDatabase[sIdx].brands[report.brandId],
              available: false,
              note: '管理員審核更正為未收錄',
            };
          } else if (report.issueType === 'has_song') {
            songsDatabase[sIdx].brands[report.brandId] = {
              ...songsDatabase[sIdx].brands[report.brandId],
              available: true,
              note: '管理員審核更正為有收錄',
            };
          }
          await saveCatalog(songsDatabase);
          await saveCatalogOverrideSong(songsDatabase[sIdx]);
          console.log(`[Admin Update] 管理員審核更正《${report.songTitle}》(${report.brandId}) 收錄狀態`);
        }
      }
    } catch (err) {
      console.error('[Admin Report Approval Error]', err);
      return res.status(503).json({ error: '審核修正無法持久化儲存，請稍後再試' });
    }
  }

  try {
    await saveReportsStore(reports);
  } catch (err) {
    console.error('[Admin Reports] Persistent save failed:', err);
    return res.status(503).json({ error: '回報狀態暫時無法持久化儲存，請稍後再試' });
  }
  logAdminAction('UPDATE_REPORT_STATUS', { reportId, status, adminNote });
  res.json({ success: true, report: reports[idx] });
});

// ── 後台管理 API：一鍵重置 / 自訂累積訪客計數器 ──
app.post('/api/admin/stats/reset', requireAdmin, async (req, res) => {
  const newCount = (typeof req.body.count === 'number' && req.body.count >= 0) ? req.body.count : 1;
  currentStats.totalVisits = newCount;
  saveStats(currentStats);

  if (USE_REDIS) {
    try {
      await redisCmd('set', STATS_REDIS_TOTAL_KEY, newCount);
    } catch (err) {
      console.warn('[Stats] Redis reset sync failed:', err.message);
      return res.status(503).json({ error: '累積查詢人數持久化儲存失敗，請稍後再試' });
    }
  }

  logAdminAction('RESET_STATS', { newCount, adminIp: req.ip });
  res.json({ success: true, totalVisits: currentStats.totalVisits });
});

// ── 查看爭議歌曲（deny 票多的）──
app.get('/api/admin/disputed', requireAdmin, async (req, res) => {
  const votes = await loadVotesStore();
  const minVotes = parseInt(req.query.minVotes) || 3;

  const disputed = [];
  for (const [key, data] of Object.entries(votes)) {
    const total = (data.confirm || 0) + (data.deny || 0);
    if (total < minVotes) continue;

    const confidence = getVoteConfidence(data.confirm || 0, data.deny || 0);
    if (confidence === 'disputed' || confidence === 'uncertain') {
      const { songId, brandId } = parseVoteKey(key);
      const song = songsDatabase.find(s => s.id === songId);
      disputed.push({
        key, songId, brandId,
        songTitle: song?.title || '(歌曲已不存在)',
        artist: song?.artist || '',
        currentStatus: song?.brands?.[brandId]?.available ?? null,
        confirm: data.confirm || 0,
        deny: data.deny || 0,
        confidence,
        total,
      });
    }
  }

  // 依爭議程度排序（deny 越多越前面）
  disputed.sort((a, b) => b.deny - a.deny);
  res.json({ total: disputed.length, disputed });
});

// ── 查看高度確認歌曲（confirm 票多的）──
app.get('/api/admin/verified', requireAdmin, async (req, res) => {
  const votes = await loadVotesStore();
  const verified = [];

  for (const [key, data] of Object.entries(votes)) {
    if (getVoteConfidence(data.confirm || 0, data.deny || 0) !== 'verified') continue;
    const { songId, brandId } = parseVoteKey(key);
    const song = songsDatabase.find(s => s.id === songId);
    verified.push({
      key, songId, brandId,
      songTitle: song?.title || '(歌曲已不存在)',
      artist: song?.artist || '',
      currentStatus: song?.brands?.[brandId]?.available ?? null,
      confirm: data.confirm || 0,
      deny: data.deny || 0,
    });
  }
  verified.sort((a, b) => b.confirm - a.confirm);
  res.json({ total: verified.length, verified });
});

app.get('/api/admin/guided-votes', requireAdmin, async (req, res) => {
  const votes = await loadVotesStore();
  const guidedVotes = [];

  for (const [key, data] of Object.entries(votes)) {
    const guided = data.guidedVocal || 0;
    const noGuided = data.noGuidedVocal || 0;
    const total = guided + noGuided;
    if (!total) continue;

    const { songId, brandId } = parseVoteKey(key);
    const song = songsDatabase.find(s => s.id === songId);
    const brandData = song?.brands?.[brandId] || null;

    guidedVotes.push({
      key,
      songId,
      brandId,
      songTitle: song?.title || '(歌曲已不存在)',
      artist: song?.artist || '',
      currentAudioType: brandData?.audioType || 'unknown',
      guided,
      noGuided,
      guidedPct: Math.round((guided / total) * 100),
      total,
    });
  }

  guidedVotes.sort((a, b) => (b.total - a.total) || (b.guided - a.guided));
  res.json({ total: guidedVotes.length, guidedVotes });
});

// ── 套用廠牌收錄狀態修正（核心管理功能）──
// PATCH /api/admin/song/:songId/brand
// body: { brandId, available: true/false, note }
app.patch('/api/admin/song/:songId/brand', requireAdmin, async (req, res) => {
  const { songId } = req.params;
  const { brandId, available, audioType, mvType, note } = req.body;

  if (!brandId || typeof available !== 'boolean') {
    return res.status(400).json({ error: '缺少必要欄位：brandId, available (boolean)' });
  }

  const validAudioTypes = ['original_vocal', 'guided_vocal', 'backing_track', ''];
  const validMvTypes = ['official_mv', 'live_mv', 'reedited_mv', 'anime_mv', ''];
  if (audioType !== undefined && !validAudioTypes.includes(audioType)) {
    return res.status(400).json({ error: '音訊類型不正確' });
  }
  if (mvType !== undefined && !validMvTypes.includes(mvType)) {
    return res.status(400).json({ error: 'MV 類型不正確' });
  }

  const idx = songsDatabase.findIndex(s => s.id === songId);
  if (idx === -1) return res.status(404).json({ error: `找不到歌曲 ID: ${songId}` });

  const song = songsDatabase[idx];
  const before = song.brands?.[brandId] ?? null;

  if (!song.brands) song.brands = {};
  const nextBrandStatus = {
    ...before,
    available,
    code: before?.code || (available ? 'OK' : 'N/A'),
  };

  if (audioType !== undefined) {
    nextBrandStatus.audioType = audioType || undefined;
  } else if (available && before?.audioType) {
    nextBrandStatus.audioType = before.audioType;
  }

  if (mvType !== undefined) {
    nextBrandStatus.mvType = mvType || undefined;
  } else if (available && before?.mvType) {
    nextBrandStatus.mvType = before.mvType;
  }

  if (!available) {
    nextBrandStatus.code = before?.code || 'N/A';
    delete nextBrandStatus.audioType;
    delete nextBrandStatus.mvType;
  }

  song.brands[brandId] = {
    ...nextBrandStatus,
  };

  songsDatabase[idx] = song;
  try {
    await saveCatalog(songsDatabase);
    await saveCatalogOverrideSong(song);
  } catch (err) {
    console.error('[Admin Catalog Override Save Error]', err);
    return res.status(503).json({ error: '歌庫修正暫時無法持久化儲存，請稍後再試' });
  }

  // 記錄管理員操作
  logAdminAction('FIX_BRAND_AVAILABILITY', {
    songId, songTitle: song.title, artist: song.artist,
    brandId, before, after: song.brands[brandId], note: note || '',
  });

  console.log(`[管理員修正] 《${song.title}》(${brandId}): ${before?.available} → ${available}`);

  res.json({
    success: true,
    songId, songTitle: song.title,
    brandId, available,
    before, after: song.brands[brandId],
  });
});

// ── 管理員儀表板統計 ──
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  const reports = await loadReportsStore();
  const votes = await loadVotesStore();

  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;

  let disputedCount = 0, verifiedCount = 0, totalVoteEntries = 0;
  for (const [, data] of Object.entries(votes)) {
    totalVoteEntries++;
    const conf = getVoteConfidence(data.confirm || 0, data.deny || 0);
    if (conf === 'disputed') disputedCount++;
    if (conf === 'verified') verifiedCount++;
  }

  res.json({
    catalog: { total: songsDatabase.length },
    reports: { total: reports.length, pending: pendingReports, resolved: resolvedReports },
    votes: { totalEntries: totalVoteEntries, disputed: disputedCount, verified: verifiedCount },
  });
});

// ── 管理員操作日誌 ──
app.get('/api/admin/logs', requireAdmin, async (req, res) => {
  try {
    if (USE_REDIS) {
      const redisLogs = await redisCmd('lrange', ADMIN_LOG_REDIS_KEY, 0, 99);
      if (Array.isArray(redisLogs)) return res.json({ logs: redisLogs });
    }

    const log = fs.existsSync(ADMIN_LOG_PATH)
      ? fs.readFileSync(ADMIN_LOG_PATH, 'utf8').trim().split('\n').slice(-100).reverse()
      : [];
    res.json({ logs: log });
  } catch (err) {
    console.error('[AdminLog] Read failed:', err);
    res.status(503).json({ error: '管理操作日誌暫時無法讀取' });
  }
});

// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Unhandled API Error]', err);
  if (res.headersSent) return next(err);
  res.status(503).json({ error: '資料服務暫時無法使用，請稍後再試' });
});

app.listen(PORT, () => {
  console.log(`[Server] KTV Song API 服務啟動於: http://localhost:${PORT}`);
  console.log(`[Server] Maintenance API token status: ${ADMIN_TOKEN ? 'set' : 'unset'}`);
  console.log(`[Server] Admin Panel: http://localhost:${PORT}/admin`);
});
