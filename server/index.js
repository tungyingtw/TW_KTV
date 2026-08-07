import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';
import { loadArtistAliases, expandArtistQuery, loadArtistAliasesOverridesFromDisk, saveArtistAliasesOverridesToDisk, applyArtistAliasesOverrides, normalizeAliasArray } from './artistAliases.js';

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
const DEFAULT_ALLOWED_ORIGINS = `${OFFICIAL_SITE_ORIGIN},https://tw-ktv.onrender.com`;
const ADMIN_ALLOWED_ORIGINS = (process.env.ADMIN_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const LOAD_STATIC_CATALOG = process.env.LOAD_STATIC_CATALOG === 'true';
const SKIP_STATIC_CATALOG = process.env.SKIP_STATIC_CATALOG === 'true' || (process.env.RENDER === 'true' && !LOAD_STATIC_CATALOG);
if (SKIP_STATIC_CATALOG) {
  console.warn('[Server] Static catalog preload disabled. Set LOAD_STATIC_CATALOG=true to enable full admin catalog search on larger instances.');
}
const BRAND_IDS = [
  'watering_hole',
  'golden_voice',
  'superstar',
  'starlight',
  'cashbox',
  'holiday',
  'singgo',
  'vmix',
  'silver_cabinet',
  'yinyuan',
  'hongyin',
];

function parseVoteKey(key) {
  const brandId = BRAND_IDS.find(id => key.endsWith(`_${id}`));
  if (!brandId) return { songId: key, brandId: '' };
  return { songId: key.slice(0, -(brandId.length + 1)), brandId };
}

async function parseVoteKeyDynamic(key) {
  try {
    const store = await loadBrandSettingsStore();
    const brandIds = Object.keys(store.brands || {}).sort((a, b) => b.length - a.length);
    const brandId = brandIds.find(id => key.endsWith(`_${id}`));
    if (!brandId) return parseVoteKey(key);
    return { songId: key.slice(0, -(brandId.length + 1)), brandId };
  } catch {
    return parseVoteKey(key);
  }
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
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SINGLE_ADMIN_ID = 'single_admin';

if (!ADMIN_TOKEN) {
  console.warn('[Server] ADMIN_TOKEN 未設定，管理員 API 將拒絕所有請求。');
}

if (!ADMIN_PASSWORD) {
  console.warn('[Server] ADMIN_PASSWORD/ADMIN_TOKEN 未設定，後台登入將無法使用。');
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
  const adminPath = path.join(__dirname, 'admin.html');
  if (fs.existsSync(adminPath)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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

// ─────────────────────────────────────────────
// 後台角色與權限系統 (RBAC & Multi-User Admin Auth System)
// ─────────────────────────────────────────────
function resolveDataPath(envVar, defaultFilename) {
  const customPath = process.env[envVar];
  const targetPath = customPath ? path.resolve(customPath) : path.join(__dirname, defaultFilename);
  try {
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
  } catch {}
  return targetPath;
}

const ADMIN_USERS_PATH = resolveDataPath('ADMIN_USERS_PATH', 'admin_users.json');
const ADMIN_SESSIONS_PATH = resolveDataPath('ADMIN_SESSIONS_PATH', 'admin_sessions.json');

const ALL_PERMISSIONS = [
  'dashboard.view',
  'reports.view',
  'reports.review',
  'votes.view',
  'songs.view',
  'songs.create',
  'songs.update',
  'songs.delete',
  'brand.update',
  'brands.view',
  'brands.manage',
  'mv.update',
  'aliases.view',
  'aliases.manage',
  'stats.reset',
  'logs.view',
  'backup.export',
  'backup.validate',
  'backup.import',
  'admins.view',
  'admins.manage',
  'roles.manage',
];

const DEFAULT_ADMIN_PERMISSIONS = [
  'dashboard.view',
  'reports.view',
  'reports.review',
  'votes.view',
  'songs.view',
  'songs.create',
  'songs.update',
  'brand.update',
  'brands.view',
  'brands.manage',
  'mv.update',
  'aliases.view',
  'aliases.manage',
];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  try {
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch {
    return false;
  }
}

function resolveAdminPermissions(user) {
  if (!user || user.status !== 'active') return [];
  if (user.role === 'super_admin' || user.role === 'single_admin') return ALL_PERMISSIONS;
  const customPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  return Array.from(new Set([...DEFAULT_ADMIN_PERMISSIONS, ...customPermissions]));
}

function safeCompareText(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function getSingleAdminUser() {
  if (!ADMIN_PASSWORD) return null;
  return {
    id: SINGLE_ADMIN_ID,
    username: ADMIN_USERNAME,
    displayName: process.env.ADMIN_DISPLAY_NAME || '後台管理者',
    role: 'single_admin',
    status: 'active',
    permissions: ALL_PERMISSIONS,
  };
}

function loadAdminUsersStore() {
  try {
    if (fs.existsSync(ADMIN_USERS_PATH)) {
      const data = JSON.parse(fs.readFileSync(ADMIN_USERS_PATH, 'utf8'));
      if (data && Array.isArray(data.users)) return data.users;
    }
  } catch (e) {
    console.error('[Admin Users Load Error]', e);
  }
  return [];
}

function saveAdminUsersStore(users) {
  try {
    fs.writeFileSync(ADMIN_USERS_PATH, JSON.stringify({ users }, null, 2), 'utf8');
  } catch (e) {
    console.error('[Admin Users Save Error]', e);
  }
}

function loadAdminSessionsStore() {
  try {
    if (fs.existsSync(ADMIN_SESSIONS_PATH)) {
      const data = JSON.parse(fs.readFileSync(ADMIN_SESSIONS_PATH, 'utf8'));
      if (data && Array.isArray(data.sessions)) return data.sessions;
    }
  } catch (e) {
    console.error('[Admin Sessions Load Error]', e);
  }
  return [];
}

function saveAdminSessionsStore(sessions) {
  try {
    fs.writeFileSync(ADMIN_SESSIONS_PATH, JSON.stringify({ sessions }, null, 2), 'utf8');
  } catch (e) {
    console.error('[Admin Sessions Save Error]', e);
  }
}

function getSessionTokenFromReq(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return req.headers['x-admin-session'] || '';
}

function requireSession(req, res, next) {
  if (!isAllowedAdminSource(req)) {
    return res.status(403).json({ error: '權限不足：此請求來源不被允許' });
  }

  const token = getSessionTokenFromReq(req);
  if (!token) {
    return res.status(401).json({ error: '未登入或 Session 已失效' });
  }

  const sessions = loadAdminSessionsStore();
  const now = new Date().toISOString();
  const session = sessions.find(s => s.sessionId === token);

  if (!session || session.expiresAt <= now) {
    return res.status(401).json({ error: '未登入或 Session 已過期' });
  }

  const user = session.adminId === SINGLE_ADMIN_ID ? getSingleAdminUser() : null;
  if (!user || user.status !== 'active') {
    return res.status(403).json({ error: '帳號無效或已被停用' });
  }

  session.lastSeenAt = now;
  saveAdminSessionsStore(sessions);

  req.adminSession = session;
  req.admin = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    permissions: resolveAdminPermissions(user),
  };
  next();
}

function requirePermission(permissionCode) {
  return (req, res, next) => {
    requireSession(req, res, () => {
      const permissions = req.admin?.permissions || [];
      if (!permissions.includes(permissionCode)) {
        return res.status(403).json({ error: `權限不足：缺少 ${permissionCode} 權限` });
      }
      req.permission = permissionCode;
      next();
    });
  };
}


// ─────────────────────────────────────────────
// 資料路徑
// ─────────────────────────────────────────────
const CATALOG_PATH = path.join(__dirname, '../public/songs_catalog.json');
const REPORTS_PATH = path.join(__dirname, 'reports.json');
const REPORTS_ARCHIVE_DIR = process.env.REPORTS_ARCHIVE_DIR
  ? path.resolve(process.env.REPORTS_ARCHIVE_DIR)
  : path.join(__dirname, 'reports_archive');
const REPORTS_ACTIVE_LIMIT = Math.max(300, parseInt(process.env.REPORTS_ACTIVE_LIMIT, 10) || 3000);
const VOTES_PATH   = path.join(__dirname, 'votes.json');
const VOTES_ARCHIVE_PATH = resolveDataPath('VOTES_ARCHIVE_PATH', 'votes_archived_signals.json');
const REVIEW_ACTIONS_PATH = path.join(__dirname, 'review_actions.json');
const REVIEW_ACTIONS_ARCHIVE_DIR = process.env.REVIEW_ACTIONS_ARCHIVE_DIR
  ? path.resolve(process.env.REVIEW_ACTIONS_ARCHIVE_DIR)
  : path.join(__dirname, 'review_actions_archive');
const REVIEW_ACTIONS_HANDLED_PATH = resolveDataPath('REVIEW_ACTIONS_HANDLED_PATH', 'review_actions_handled.json');
const REVIEW_ACTIONS_ACTIVE_LIMIT = Math.max(300, parseInt(process.env.REVIEW_ACTIONS_ACTIVE_LIMIT, 10) || 2000);
const REVIEW_QUEUE_CACHE_TTL_MS = Math.max(1000, parseInt(process.env.REVIEW_QUEUE_CACHE_TTL_MS, 10) || 10000);
const ADMIN_STATS_CACHE_TTL_MS = Math.max(1000, parseInt(process.env.ADMIN_STATS_CACHE_TTL_MS, 10) || 10000);
const ADMIN_LOG_PATH = resolveDataPath('ADMIN_ACTIONS_LOG_PATH', 'admin_actions.log');
const ADMIN_LOG_MAX_LINES = Math.max(200, parseInt(process.env.ADMIN_LOG_MAX_LINES, 10) || 1000);
const ADMIN_LOG_MAX_BYTES = Math.max(256 * 1024, parseInt(process.env.ADMIN_LOG_MAX_BYTES, 10) || 1024 * 1024);
const CATALOG_OVERRIDES_PATH = path.join(__dirname, 'catalog_overrides.json');
const BRAND_SETTINGS_PATH = path.join(__dirname, 'brand_settings.json');
const BRAND_SETTINGS_REDIS_KEY = 'ktv:brandSettings';

const DEFAULT_BRAND_SETTINGS = {
  brands: {
    cashbox: {
      id: 'cashbox',
      name: '錢○ Cashbox 收錄',
      shortName: '錢○',
      color: '#34d399',
      badgeBg: 'rgba(52, 211, 153, 0.16)',
      description: '錢○ 門市系統歌曲收錄',
      status: 'active',
      sortOrder: 1,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    holiday: {
      id: 'holiday',
      name: '好○迪 Holiday 收錄',
      shortName: '好○迪',
      color: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.16)',
      description: '好○迪 門市系統歌曲收錄',
      status: 'active',
      sortOrder: 2,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    watering_hole: {
      id: 'watering_hole',
      name: '享○馨 KTV 收錄',
      shortName: '享○馨',
      color: '#fbbf24',
      badgeBg: 'rgba(251, 191, 36, 0.16)',
      description: '享○馨 門市庭園包廂歌曲收錄',
      status: 'active',
      sortOrder: 3,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    starlight: {
      id: 'starlight',
      name: '星○點 收錄',
      shortName: '星○點',
      color: '#c084fc',
      badgeBg: 'rgba(192, 132, 252, 0.16)',
      description: '星○點 門市系統歌曲收錄',
      status: 'active',
      sortOrder: 4,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    singgo: {
      id: 'singgo',
      name: 'Sing○ 聚唱收錄',
      shortName: 'Sing○',
      color: '#f472b6',
      badgeBg: 'rgba(244, 114, 182, 0.16)',
      description: 'Sing○ 時尚包廂歌曲收錄',
      status: 'active',
      sortOrder: 5,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    vmix: {
      id: 'vmix',
      name: 'V-M○X 收錄',
      shortName: 'V-M○X',
      color: '#2dd4bf',
      badgeBg: 'rgba(45, 212, 191, 0.16)',
      description: 'V-M○X 門市系統歌曲收錄',
      status: 'active',
      sortOrder: 6,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    superstar: {
      id: 'superstar',
      name: '超○巨星 收錄',
      shortName: '超○巨星',
      color: '#fb923c',
      badgeBg: 'rgba(251, 146, 60, 0.16)',
      description: '超○巨星 門市系統歌曲收錄',
      status: 'active',
      sortOrder: 7,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    silver_cabinet: {
      id: 'silver_cabinet',
      name: '銀○ KTV 收錄',
      shortName: '銀○',
      color: '#eab308',
      badgeBg: 'rgba(234, 179, 8, 0.16)',
      description: '銀○ 門市系統歌曲收錄',
      status: 'active',
      sortOrder: 8,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    yinyuan: {
      id: 'yinyuan',
      name: '音○ 收錄',
      shortName: '音○',
      color: '#a3e635',
      badgeBg: 'rgba(163, 230, 53, 0.16)',
      description: '音○ 伴唱系統歌曲收錄',
      status: 'active',
      sortOrder: 9,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    golden_voice: {
      id: 'golden_voice',
      name: '金○ 收錄',
      shortName: '金○',
      color: '#2dd4bf',
      badgeBg: 'rgba(45, 212, 191, 0.16)',
      description: '金○ 伴唱系統歌曲收錄',
      status: 'active',
      sortOrder: 10,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    hongyin: {
      id: 'hongyin',
      name: '弘○ 收錄',
      shortName: '弘○',
      color: '#f43f5e',
      badgeBg: 'rgba(244, 63, 94, 0.16)',
      description: '弘○ 伴唱系統歌曲收錄',
      status: 'active',
      sortOrder: 11,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    datang: {
      id: 'datang',
      name: '大○系統 收錄',
      shortName: '大○',
      color: '#ec4899',
      badgeBg: 'rgba(236, 72, 153, 0.16)',
      description: '大○ 伴唱系統歌曲收錄',
      status: 'active',
      sortOrder: 12,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    ruiying: {
      id: 'ruiying',
      name: '瑞○系統 收錄',
      shortName: '瑞○',
      color: '#14b8a6',
      badgeBg: 'rgba(20, 184, 166, 0.16)',
      description: '瑞○ 伴唱系統歌曲收錄',
      status: 'active',
      sortOrder: 13,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    },
    meihua: {
      id: 'meihua',
      name: '美○系統 收錄',
      shortName: '美○',
      color: '#a855f7',
      badgeBg: 'rgba(168, 85, 247, 0.16)',
      description: '美○ 伴唱系統歌曲收錄',
      status: 'active',
      sortOrder: 14,
      source: 'system',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z'
    }
  },
  version: 1
};

function loadBrandSettingsFromDisk() {
  try {
    if (fs.existsSync(BRAND_SETTINGS_PATH)) {
      const data = JSON.parse(fs.readFileSync(BRAND_SETTINGS_PATH, 'utf8'));
      if (data && data.brands && typeof data.brands === 'object') {
        return data;
      }
    }
  } catch (err) {
    console.error('[BrandSettings Load Disk Error]', err);
  }
  safeAtomicWriteJson(BRAND_SETTINGS_PATH, DEFAULT_BRAND_SETTINGS);
  return DEFAULT_BRAND_SETTINGS;
}

function saveBrandSettingsToDisk(data) {
  try {
    const payload = {
      brands: data?.brands || {},
      version: data?.version || 1,
      updatedAt: new Date().toISOString()
    };
    safeAtomicWriteJson(BRAND_SETTINGS_PATH, payload);
  } catch (err) {
    console.error('[BrandSettings Save Disk Error]', err);
  }
}

async function loadBrandSettingsStore() {
  if (USE_REDIS) {
    try {
      const raw = await redisCmd('get', BRAND_SETTINGS_REDIS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.brands) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[BrandSettings Persistent Read Warning]:', err.message);
    }
  }
  return loadBrandSettingsFromDisk();
}

async function saveBrandSettingsStore(data, options = {}) {
  const { requirePersistent = false } = options;
  if (USE_REDIS) {
    try {
      await redisCmd('set', BRAND_SETTINGS_REDIS_KEY, JSON.stringify(data));
      try { saveBrandSettingsToDisk(data); } catch (err) {
        console.warn('[BrandSettings] Local JSON backup write failed:', err.message);
      }
      invalidateAdminDerivedCaches();
      return;
    } catch (err) {
      try { saveBrandSettingsToDisk(data); } catch (localErr) {
        console.warn('[BrandSettings] Local JSON backup write failed:', localErr.message);
      }
      console.warn('[BrandSettings Persistent Write Warning]:', err.message);
      if (requirePersistent) {
        throw new Error('品牌設定暫時無法持久化儲存，請稍後再試');
      }
      return;
    }
  }

  try { saveBrandSettingsToDisk(data); } catch (err) {
    console.warn('[BrandSettings] Local JSON write failed:', err.message);
  }
  invalidateAdminDerivedCaches();
}

async function getActiveBrands() {
  const store = await loadBrandSettingsStore();
  const brandsList = Object.values(store.brands || {});
  const activeBrands = [];
  for (const b of brandsList) {
    if (b && (await brandExists(b.id, { activeOnly: true }))) {
      activeBrands.push(b);
    }
  }
  return activeBrands.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
}

async function brandExists(brandId, options = {}) {
  const { activeOnly = true } = options;
  if (!brandId) return false;
  const store = await loadBrandSettingsStore();
  const brand = store.brands ? store.brands[brandId] : null;
  if (!brand) return false;
  if (activeOnly) return brand.status === 'active';
  return true;
}

async function getKnownVoteBrandIdsForSong(songId) {
  const ids = new Set();
  const song = songsDatabase.find(s => String(s.id) === String(songId));
  for (const brandId of Object.keys(song?.brands || {})) ids.add(brandId);
  try {
    const store = await loadBrandSettingsStore();
    for (const [brandId, brand] of Object.entries(store.brands || {})) {
      if (!brand || brand.status === 'active') ids.add(brandId);
    }
  } catch (err) {
    console.warn('[Votes] Brand lookup failed, using song brand keys only:', err.message);
  }
  return [...ids];
}

function buildBadgeBg(color) {
  let hex = String(color || '').trim();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = '#' + hex.slice(1).split('').map(ch => ch + ch).join('');
  }
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.16)`;
  }
  return 'rgba(56, 189, 248, 0.16)';
}

function isValidBrandColor(color) {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(color || '').trim());
}

function generateBrandId(existingBrands = {}) {
  const suffix = Date.now().toString(36);
  let id = `brand_${suffix}`;
  while (existingBrands[id]) {
    const rand = Math.random().toString(36).substring(2, 6);
    id = `brand_${suffix}_${rand}`;
  }
  return id;
}

// ─────────────────────────────────────────────
// 資料讀寫工具
// ─────────────────────────────────────────────
function safeAtomicWriteJson(filePath, data) {
  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch {
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}

function decodeBinaryCatalog(binPath) {
  try {
    const buffer = fs.readFileSync(binPath);
    return decodeBinaryCatalogBuffer(buffer, path.basename(binPath));
  } catch (err) {
    console.error(`[Server Error] 解密二進位檔 ${path.basename(binPath)} 失敗:`, err.message);
    return null;
  }
}

function decodeBinaryCatalogBuffer(buffer, label = 'songs_catalog.bin') {
  try {
    const MAGIC_HEADER = Buffer.from([0x54, 0x57, 0x4B, 0x54, 0x56, 0x42, 0x49, 0x4E]);
    const XOR_KEY = [0x9E, 0x4F, 0xC3, 0x8A, 0x27, 0x1B, 0x6D, 0xE5];

    if (buffer.length <= MAGIC_HEADER.length) return null;
    const header = buffer.subarray(0, MAGIC_HEADER.length);
    if (!header.equals(MAGIC_HEADER)) return null;

    const payload = buffer.subarray(MAGIC_HEADER.length);
    const jsonBytes = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) {
      jsonBytes[i] = payload[i] ^ XOR_KEY[i % XOR_KEY.length];
    }
    const parsed = JSON.parse(jsonBytes.toString('utf8'));
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.error(`[Server Error] 解密二進位歌庫 ${label} 失敗:`, err.message);
    return null;
  }
}

function decodeChunkedBinaryCatalog(manifestPath) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const chunks = Array.isArray(manifest.chunks) ? manifest.chunks : [];
    if (!chunks.length) return null;

    const dirPath = path.dirname(manifestPath);
    const buffers = chunks.map(chunk => fs.readFileSync(path.join(dirPath, chunk.file)));
    const combined = Buffer.concat(buffers);
    return decodeBinaryCatalogBuffer(combined, path.basename(manifestPath));
  } catch (err) {
    console.error(`[Server Error] 解密分片歌庫 ${path.basename(manifestPath)} 失敗:`, err.message);
    return null;
  }
}

function applyCatalogOverridesToSongs(songs, overridesData) {
  const deletedSet = new Set(overridesData?.deletedIds || []);
  const overridesMap = overridesData?.songs || {};

  if (deletedSet.size === 0 && Object.keys(overridesMap).length === 0) return songs;

  const existingMap = new Map(songs.filter(s => !deletedSet.has(s.id)).map(s => [s.id, s]));
  for (const [id, overrideSong] of Object.entries(overridesMap)) {
    if (overrideSong && overrideSong.id) {
      const current = existingMap.get(id) || {};
      existingMap.set(id, { ...current, ...overrideSong });
    }
  }

  return Array.from(existingMap.values());
}

function loadInitialSongsDatabase(options = {}) {
  const { applyLocalOverrides = true, forceLoad = false } = options;
  if (SKIP_STATIC_CATALOG && !forceLoad) {
    let songs = [];
    if (applyLocalOverrides) {
      try {
        songs = applyCatalogOverridesToSongs(songs, loadCatalogOverrides());
        console.log(`[Server] Static catalog skipped; loaded ${songs.length} local override songs only.`);
      } catch (err) {
        console.warn('[Server] Local catalog_overrides load failed while static catalog is skipped:', err.message);
      }
    }
    return songs;
  }

  let songs = null;

  // 1. 嘗試優先載入明文 JSON（本機開發環境）
  const jsonPaths = [
    CATALOG_PATH,
    path.join(__dirname, 'database.json'),
    path.join(process.cwd(), 'public/songs_catalog.json'),
    path.join(process.cwd(), 'server/database.json'),
  ];

  for (const jp of jsonPaths) {
    if (fs.existsSync(jp) && fs.statSync(jp).size > 1000) {
      try {
        songs = JSON.parse(fs.readFileSync(jp, 'utf8'));
        console.log(`[Server] 成功由明文 JSON (${path.basename(jp)}) 載入 ${songs.length} 首歌曲`);
        break;
      } catch {}
    }
  }

  // 2. 若無可用明文 JSON，針對二進位加密檔進行五重路徑尋檢與 XOR 串流解密
  if (!songs || songs.length === 0) {
    const binPaths = [
      path.join(__dirname, '../public/songs_catalog.bin'),
      path.join(__dirname, '../dist/songs_catalog.bin'),
      path.join(process.cwd(), 'public/songs_catalog.bin'),
      path.join(process.cwd(), 'dist/songs_catalog.bin'),
      path.join(__dirname, 'songs_catalog.bin'),
    ];

    for (const bp of binPaths) {
      if (fs.existsSync(bp) && fs.statSync(bp).size > 1000) {
        songs = decodeBinaryCatalog(bp);
        if (songs && songs.length > 0) {
          console.log(`[Server] 成功由二進位加密檔 (${path.basename(bp)}) 解密加載 ${songs.length} 首歌曲`);
          break;
        }
      }
    }
  }

  // 2b. 若無單一二進位檔，改讀 GitHub-safe 分片歌庫
  if (!songs || songs.length === 0) {
    const manifestPaths = [
      path.join(__dirname, '../public/songs_catalog.manifest.json'),
      path.join(__dirname, '../dist/songs_catalog.manifest.json'),
      path.join(process.cwd(), 'public/songs_catalog.manifest.json'),
      path.join(process.cwd(), 'dist/songs_catalog.manifest.json'),
      path.join(__dirname, 'songs_catalog.manifest.json'),
    ];

    for (const mp of manifestPaths) {
      if (fs.existsSync(mp) && fs.statSync(mp).size > 100) {
        songs = decodeChunkedBinaryCatalog(mp);
        if (songs && songs.length > 0) {
          console.log(`[Server] 成功由分片加密歌庫 (${path.basename(mp)}) 解密加載 ${songs.length} 首歌曲`);
          break;
        }
      }
    }
  }

  if (!Array.isArray(songs)) songs = [];

  // 3. 若未停用本機覆寫，疊加套用管理員本機持久化覆寫 (catalog_overrides.json)
  if (applyLocalOverrides) {
    try {
      const overridesData = loadCatalogOverrides();
      songs = applyCatalogOverridesToSongs(songs, overridesData);
      console.log(`[Server] 已成功套用本機覆寫與刪除紀錄（共 ${songs.length} 首可用歌曲）`);
    } catch (err) {
      console.warn('[Server] 套用 local catalog_overrides 失敗:', err.message);
    }
  }

  return songs;
}

let songsDatabase = loadInitialSongsDatabase();

function loadReports() {
  try { return JSON.parse(fs.readFileSync(REPORTS_PATH, 'utf8')); } catch { return []; }
}
function saveReports(data) {
  safeAtomicWriteJson(REPORTS_PATH, data);
}

function getReportArchiveMonth(report) {
  const raw = String(report?.reviewedAt || report?.resolvedAt || report?.timestamp || '');
  const match = raw.match(/^\d{4}-\d{2}/);
  return match ? match[0] : 'unknown';
}

function mergeReportsById(existing, incoming) {
  const merged = new Map();
  for (const report of Array.isArray(existing) ? existing : []) {
    if (report?.id) merged.set(String(report.id), report);
  }
  for (const report of Array.isArray(incoming) ? incoming : []) {
    if (report?.id) merged.set(String(report.id), report);
  }
  return [...merged.values()].sort((a, b) => String(b.reviewedAt || b.timestamp || '').localeCompare(String(a.reviewedAt || a.timestamp || '')));
}

function compactReports(data) {
  const reports = Array.isArray(data) ? data.filter(Boolean) : [];
  const pending = reports.filter(report => (report.status || 'pending') === 'pending');
  const handled = reports.filter(report => (report.status || 'pending') !== 'pending');
  const availableHandledLimit = Math.max(0, REPORTS_ACTIVE_LIMIT - pending.length);
  if (handled.length <= availableHandledLimit) return { active: reports, archived: [] };
  const sortedHandled = [...handled].sort((a, b) => String(b.reviewedAt || b.timestamp || '').localeCompare(String(a.reviewedAt || a.timestamp || '')));
  const activeHandledIds = new Set(sortedHandled.slice(0, availableHandledLimit).map(report => String(report.id || '')));
  return {
    active: reports.filter(report => (report.status || 'pending') === 'pending' || activeHandledIds.has(String(report.id || ''))),
    archived: reports.filter(report => (report.status || 'pending') !== 'pending' && !activeHandledIds.has(String(report.id || ''))),
  };
}

function archiveReportsLocal(reports) {
  if (!reports.length) return {};
  fs.mkdirSync(REPORTS_ARCHIVE_DIR, { recursive: true });
  const months = {};
  for (const report of reports) {
    const month = getReportArchiveMonth(report);
    if (!months[month]) months[month] = [];
    months[month].push(report);
  }
  for (const [month, monthReports] of Object.entries(months)) {
    const archivePath = path.join(REPORTS_ARCHIVE_DIR, `${month}.json`);
    let existing = [];
    try {
      const parsed = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      existing = Array.isArray(parsed) ? parsed : [];
    } catch {}
    safeAtomicWriteJson(archivePath, mergeReportsById(existing, monthReports));
  }
  return Object.fromEntries(Object.entries(months).map(([month, monthReports]) => [month, monthReports.length]));
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
  const { active, archived } = compactReports(data);
  let storeData = Array.isArray(data) ? data : [];
  if (archived.length) {
    try {
      archiveReportsLocal(archived);
      storeData = active;
      logAdminAction('ARCHIVE_REPORTS', { archived: archived.length, active: active.length, activeLimit: REPORTS_ACTIVE_LIMIT });
    } catch (err) {
      console.warn('[Reports] Archive failed; keeping full active store:', err.message);
    }
  }

  if (USE_REDIS) {
    try {
      await redisCmd('set', REPORTS_REDIS_KEY, JSON.stringify(storeData));
      try { saveReports(storeData); } catch (err) {
        console.warn('[Reports] Local JSON backup write failed:', err.message);
      }
      invalidateAdminDerivedCaches();
      return;
    } catch (err) {
      try { saveReports(storeData); } catch (localErr) {
        console.warn('[Reports] Local JSON backup write failed:', localErr.message);
      }
      throw new Error(`Reports persistent write failed: ${err.message}`);
    }
  }

  try { saveReports(storeData); } catch (err) {
    console.warn('[Reports] Local JSON backup write failed:', err.message);
  }
  invalidateAdminDerivedCaches();
}

function loadVotes() {
  try { return JSON.parse(fs.readFileSync(VOTES_PATH, 'utf8')); } catch { return {}; }
}
function saveVotes(data) {
  safeAtomicWriteJson(VOTES_PATH, data);
}

function loadVotesArchive() {
  try {
    const data = JSON.parse(fs.readFileSync(VOTES_ARCHIVE_PATH, 'utf8'));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

function saveVotesArchive(data) {
  safeAtomicWriteJson(VOTES_ARCHIVE_PATH, data && typeof data === 'object' ? data : {});
}

function loadReviewActions() {
  try {
    const data = JSON.parse(fs.readFileSync(REVIEW_ACTIONS_PATH, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function saveReviewActions(data) {
  safeAtomicWriteJson(REVIEW_ACTIONS_PATH, data);
}

function loadReviewActionsHandledState() {
  try {
    const data = JSON.parse(fs.readFileSync(REVIEW_ACTIONS_HANDLED_PATH, 'utf8'));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

function saveReviewActionsHandledState(data) {
  safeAtomicWriteJson(REVIEW_ACTIONS_HANDLED_PATH, data && typeof data === 'object' ? data : {});
}

function loadCatalogOverrides() {
  try {
    const data = JSON.parse(fs.readFileSync(CATALOG_OVERRIDES_PATH, 'utf8'));
    if (!data.songs || typeof data.songs !== 'object') data.songs = {};
    if (!Array.isArray(data.deletedIds)) data.deletedIds = [];
    return data;
  } catch {
    return { songs: {}, deletedIds: [] };
  }
}
function saveCatalogOverrides(data) {
  safeAtomicWriteJson(CATALOG_OVERRIDES_PATH, data);
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
      invalidateAdminDerivedCaches();
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
  invalidateAdminDerivedCaches();
}

async function loadVotesArchiveStore() {
  if (USE_REDIS) {
    try {
      const raw = await redisCmd('get', VOTES_ARCHIVE_REDIS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data === 'object' && !Array.isArray(data)) return data;
      }
    } catch (err) {
      console.warn('[Votes] Archive Redis read failed:', err.message);
    }
  }
  return loadVotesArchive();
}

async function saveVotesArchiveStore(data) {
  const archive = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  if (USE_REDIS) {
    try {
      await redisCmd('set', VOTES_ARCHIVE_REDIS_KEY, JSON.stringify(archive));
      try { saveVotesArchive(archive); } catch (err) {
        console.warn('[Votes] Archive local backup write failed:', err.message);
      }
      return;
    } catch (err) {
      try { saveVotesArchive(archive); } catch (localErr) {
        console.warn('[Votes] Archive local backup write failed:', localErr.message);
      }
      throw new Error(`Votes archive persistent write failed: ${err.message}`);
    }
  }
  saveVotesArchive(archive);
}

function getHandledVoteDimensions(source) {
  const dimensionsByKey = {};
  const reviewItemIds = Array.isArray(source)
    ? source
        .filter(action => action && ['adopted', 'rejected'].includes(action.status))
        .map(action => String(action.reviewItemId || ''))
    : Object.keys(source || {});
  for (const reviewItemId of reviewItemIds) {
    const match = String(reviewItemId).match(/^(availability_vote|guided_vote|mv_vote):(.+)$/);
    if (!match) continue;
    const [, sourceType, key] = match;
    const dimension = sourceType === 'availability_vote' ? 'availability' : (sourceType === 'guided_vote' ? 'guided' : 'mv');
    if (!dimensionsByKey[key]) dimensionsByKey[key] = new Set();
    dimensionsByKey[key].add(dimension);
  }
  return dimensionsByKey;
}

function hasAnyVoteSignal(data) {
  return ['confirm', 'deny', 'guidedVocal', 'noGuidedVocal', 'officialMv', 'editedMv']
    .some(field => (data?.[field] || 0) > 0);
}

function clearHandledVoteDimension(data, dimension) {
  const archived = {};
  if (dimension === 'availability') {
    archived.confirm = data.confirm || 0;
    archived.deny = data.deny || 0;
    data.confirm = 0;
    data.deny = 0;
  } else if (dimension === 'guided') {
    archived.guidedVocal = data.guidedVocal || 0;
    archived.noGuidedVocal = data.noGuidedVocal || 0;
    data.guidedVocal = 0;
    data.noGuidedVocal = 0;
  } else if (dimension === 'mv') {
    archived.officialMv = data.officialMv || 0;
    archived.editedMv = data.editedMv || 0;
    data.officialMv = 0;
    data.editedMv = 0;
  }
  return Object.values(archived).some(value => value > 0) ? archived : null;
}

async function compactHandledVoteSignalsStore(handledState) {
  const dimensionsByKey = getHandledVoteDimensions(handledState);
  const keys = Object.keys(dimensionsByKey);
  if (!keys.length) return { compactedEntries: 0, compactedDimensions: 0, removedEntries: 0 };

  const votes = await loadVotesStore();
  const archive = await loadVotesArchiveStore();
  let compactedEntries = 0;
  let compactedDimensions = 0;
  let removedEntries = 0;

  for (const key of keys) {
    const voteData = votes[key];
    if (!voteData) continue;
    let touched = false;
    if (!archive[key]) archive[key] = { dimensions: {}, updatedAt: '' };

    for (const dimension of dimensionsByKey[key]) {
      const archivedCounts = clearHandledVoteDimension(voteData, dimension);
      if (!archivedCounts) continue;
      archive[key].dimensions[dimension] = {
        ...(archive[key].dimensions[dimension] || {}),
        ...archivedCounts,
        compactedAt: new Date().toISOString(),
      };
      compactedDimensions++;
      touched = true;
    }

    if (!touched) continue;
    archive[key].updatedAt = new Date().toISOString();
    compactedEntries++;
    if (!hasAnyVoteSignal(voteData)) {
      delete votes[key];
      removedEntries++;
    }
  }

  if (!compactedEntries) return { compactedEntries: 0, compactedDimensions: 0, removedEntries: 0 };
  await saveVotesArchiveStore(archive);
  await saveVotesStore(votes);
  logAdminAction('COMPACT_HANDLED_VOTE_SIGNALS', { compactedEntries, compactedDimensions, removedEntries });
  return { compactedEntries, compactedDimensions, removedEntries };
}

async function loadReviewActionsStore() {
  if (USE_REDIS) {
    try {
      const raw = await redisCmd('get', REVIEW_ACTIONS_REDIS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Review actions persistent read failed: ${err.message}`);
    }
  }
  return loadReviewActions();
}

function getReviewActionMonth(action) {
  const raw = String(action?.reviewedAt || action?.createdAt || '');
  const match = raw.match(/^\d{4}-\d{2}/);
  return match ? match[0] : 'unknown';
}

function compactReviewActions(data) {
  const actions = Array.isArray(data) ? data.filter(Boolean) : [];
  if (actions.length <= REVIEW_ACTIONS_ACTIVE_LIMIT) return { active: actions, archived: [] };

  const sorted = [...actions].sort((a, b) => String(b.reviewedAt || '').localeCompare(String(a.reviewedAt || '')));
  const activeIds = new Set(sorted.slice(0, REVIEW_ACTIONS_ACTIVE_LIMIT).map(action => String(action.id || '')));
  return {
    active: actions.filter(action => activeIds.has(String(action.id || ''))),
    archived: actions.filter(action => !activeIds.has(String(action.id || ''))),
  };
}

function mergeReviewActionsById(existing, incoming) {
  const merged = new Map();
  for (const action of Array.isArray(existing) ? existing : []) {
    if (action?.id) merged.set(String(action.id), action);
  }
  for (const action of Array.isArray(incoming) ? incoming : []) {
    if (action?.id) merged.set(String(action.id), action);
  }
  return [...merged.values()].sort((a, b) => String(b.reviewedAt || '').localeCompare(String(a.reviewedAt || '')));
}

function archiveReviewActionsLocal(actions) {
  if (!actions.length) return {};
  fs.mkdirSync(REVIEW_ACTIONS_ARCHIVE_DIR, { recursive: true });
  const months = {};
  for (const action of actions) {
    const month = getReviewActionMonth(action);
    if (!months[month]) months[month] = [];
    months[month].push(action);
  }
  for (const [month, monthActions] of Object.entries(months)) {
    const archivePath = path.join(REVIEW_ACTIONS_ARCHIVE_DIR, `${month}.json`);
    let existing = [];
    try {
      const parsed = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      existing = Array.isArray(parsed) ? parsed : [];
    } catch {}
    safeAtomicWriteJson(archivePath, mergeReviewActionsById(existing, monthActions));
  }
  return Object.fromEntries(Object.entries(months).map(([month, monthActions]) => [month, monthActions.length]));
}

async function archiveReviewActionsRedis(actions) {
  if (!USE_REDIS || !actions.length) return;
  const months = {};
  for (const action of actions) {
    const month = getReviewActionMonth(action);
    if (!months[month]) months[month] = [];
    months[month].push(action);
  }
  for (const [month, monthActions] of Object.entries(months)) {
    const key = `${REVIEW_ACTIONS_ARCHIVE_REDIS_PREFIX}${month}`;
    const raw = await redisCmd('get', key);
    let existing = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        existing = Array.isArray(parsed) ? parsed : [];
      } catch {}
    }
    await redisCmd('set', key, JSON.stringify(mergeReviewActionsById(existing, monthActions)));
  }
}

async function loadReviewActionsHandledStateStore() {
  if (USE_REDIS) {
    try {
      const raw = await redisCmd('get', REVIEW_ACTIONS_HANDLED_REDIS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data === 'object' && !Array.isArray(data)) return data;
      }
    } catch (err) {
      console.warn('[ReviewActions] Handled state read failed:', err.message);
    }
  }
  return loadReviewActionsHandledState();
}

async function saveReviewActionsHandledStateStore(data) {
  const state = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  if (USE_REDIS) {
    try {
      await redisCmd('set', REVIEW_ACTIONS_HANDLED_REDIS_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('[ReviewActions] Handled state Redis write failed:', err.message);
    }
  }
  try { saveReviewActionsHandledState(state); } catch (err) {
    console.warn('[ReviewActions] Handled state local write failed:', err.message);
  }
}

async function syncReviewActionsHandledState(actions) {
  const state = await loadReviewActionsHandledStateStore();
  let changed = false;
  for (const action of Array.isArray(actions) ? actions : []) {
    const reviewItemId = String(action?.reviewItemId || '');
    if (!reviewItemId || !['adopted', 'rejected'].includes(action?.status)) continue;
    state[reviewItemId] = {
      status: action.status,
      actionId: action.id || '',
      reviewedAt: action.reviewedAt || '',
    };
    changed = true;
  }
  if (changed) await saveReviewActionsHandledStateStore(state);
  return state;
}

async function saveReviewActionsStore(data) {
  const state = await syncReviewActionsHandledState(data);
  try { await compactHandledVoteSignalsStore(data); } catch (err) {
    console.warn('[Votes] Handled signal compaction failed:', err.message);
  }
  const { active, archived } = compactReviewActions(data);
  let storeData = Array.isArray(data) ? data : [];
  if (archived.length) {
    try {
      if (USE_REDIS) {
        await archiveReviewActionsRedis(archived);
        try { archiveReviewActionsLocal(archived); } catch (err) {
          console.warn('[ReviewActions] Local archive backup write failed:', err.message);
        }
      } else {
        archiveReviewActionsLocal(archived);
      }
      storeData = active;
      logAdminAction('ARCHIVE_REVIEW_ACTIONS', { archived: archived.length, active: active.length, handled: Object.keys(state).length });
    } catch (err) {
      console.warn('[ReviewActions] Archive failed; keeping full active store:', err.message);
    }
  }

  if (USE_REDIS) {
    try {
      await redisCmd('set', REVIEW_ACTIONS_REDIS_KEY, JSON.stringify(storeData));
      try { saveReviewActions(storeData); } catch (err) {
        console.warn('[ReviewActions] Local JSON backup write failed:', err.message);
      }
      invalidateAdminDerivedCaches();
      return;
    } catch (err) {
      try { saveReviewActions(storeData); } catch (localErr) {
        console.warn('[ReviewActions] Local JSON backup write failed:', localErr.message);
      }
      throw new Error(`Review actions persistent write failed: ${err.message}`);
    }
  }

  try { saveReviewActions(storeData); } catch (err) {
    console.warn('[ReviewActions] Local JSON backup write failed:', err.message);
  }
  invalidateAdminDerivedCaches();
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

async function loadArtistAliasesOverridesStore() {
  if (USE_REDIS) {
    try {
      const raw = await redisCmd('get', ARTIST_ALIASES_OVERRIDES_REDIS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Artist aliases overrides persistent read failed: ${err.message}`);
    }
  }
  return loadArtistAliasesOverridesFromDisk();
}

async function saveArtistAliasesOverridesStore(data) {
  if (USE_REDIS) {
    try {
      await redisCmd('set', ARTIST_ALIASES_OVERRIDES_REDIS_KEY, JSON.stringify(data));
      try { saveArtistAliasesOverridesToDisk(data); } catch (err) {
        console.warn('[ArtistAliasesOverrides] Local JSON backup write failed:', err.message);
      }
      return;
    } catch (err) {
      try { saveArtistAliasesOverridesToDisk(data); } catch (localErr) {
        console.warn('[ArtistAliasesOverrides] Local JSON backup write failed:', localErr.message);
      }
      throw new Error(`Artist aliases overrides persistent write failed: ${err.message}`);
    }
  }

  try { saveArtistAliasesOverridesToDisk(data); } catch (err) {
    console.warn('[ArtistAliasesOverrides] Local JSON write failed:', err.message);
  }
}

async function saveCatalogOverrideSong(song) {
  const overrides = await loadCatalogOverridesStore();
  if (!overrides.songs || typeof overrides.songs !== 'object') overrides.songs = {};
  if (!Array.isArray(overrides.deletedIds)) overrides.deletedIds = [];
  overrides.deletedIds = overrides.deletedIds.filter(id => id !== song.id);
  overrides.songs[song.id] = song;
  await saveCatalogOverridesStore(overrides);
  invalidateAdminDerivedCaches();
}

async function saveCatalogDeletedSong(songId) {
  const overrides = await loadCatalogOverridesStore();
  if (!overrides.songs || typeof overrides.songs !== 'object') overrides.songs = {};
  if (!Array.isArray(overrides.deletedIds)) overrides.deletedIds = [];
  delete overrides.songs[songId];
  if (!overrides.deletedIds.includes(songId)) overrides.deletedIds.push(songId);
  await saveCatalogOverridesStore(overrides);
  invalidateAdminDerivedCaches();
}

async function loadCatalogOverrideSong(songId) {
  const overrides = await loadCatalogOverridesStore();
  return overrides?.songs?.[songId] || null;
}

let staticCatalogCacheMap = null;

async function getAdminSongById(songId) {
  if (!songId) return null;

  // 1. 記憶體 songsDatabase
  let song = songsDatabase.find(s => s.id === songId);
  if (song) return song;

  // 2. catalog_overrides
  song = await loadCatalogOverrideSong(songId);
  if (song) return song;

  // 3. 回報快照 (Report Snapshots)
  try {
    const reports = await loadReportsStore();
    const rep = reports.find(r => r.songSnapshot?.id === songId || r.songId === songId);
    if (rep) {
      const snap = rep.songSnapshot || {};
      return {
        id: songId,
        title: snap.title || rep.songTitle || '',
        artist: snap.artist || rep.artist || '',
        language: snap.language || rep.lang || '國語',
        brands: snap.brands || {},
      };
    }
  } catch {}

  // 4. 若開立 SKIP_STATIC_CATALOG，按需唯讀一次全量歌庫建立快照 Mapping
  if (SKIP_STATIC_CATALOG) {
    if (!staticCatalogCacheMap) {
      try {
        const fullSongs = loadInitialSongsDatabase({ applyLocalOverrides: false, forceLoad: true });
        staticCatalogCacheMap = new Map((fullSongs || []).map(s => [s.id, s]));
      } catch {
        staticCatalogCacheMap = new Map();
      }
    }
    const cached = staticCatalogCacheMap.get(songId);
    if (cached) return cached;
  }

  return null;
}

async function saveCatalog(catalog) {
  const dbPath = path.join(__dirname, 'database.json');
  fs.writeFileSync(dbPath, JSON.stringify(catalog), 'utf8');
  try {
    const { generateBinCatalog } = await import('../scripts/buildCatalogBin.js');
    generateBinCatalog();
  } catch (e) {
    console.warn('[Server] 自動同步加密 songs_catalog.bin 警告:', e.message);
  }
}

function logAdminAction(action, detail = {}, req = null) {
  const adminId = detail.adminId || req?.admin?.id || 'system';
  const username = detail.username || req?.admin?.username || 'system';
  const role = detail.role || req?.admin?.role || 'system';
  const permission = req?.permission || 'none';
  const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
  const userAgent = req?.headers?.['user-agent'] || 'system';
  const reason = String(detail.reason || req?.body?.reason || req?.query?.reason || '').trim();

  const sanitizedDetail = { ...detail };
  delete sanitizedDetail.password;
  delete sanitizedDetail.passwordHash;
  delete sanitizedDetail.sessionToken;
  delete sanitizedDetail.token;
  delete sanitizedDetail.reason;

  const logObj = {
    time: new Date().toISOString(),
    action,
    adminId,
    username,
    displayName: req?.admin?.displayName || username,
    role,
    permission,
    ip,
    userAgent,
    targetType: detail.targetType || 'system',
    targetId: String(detail.targetId || detail.songId || detail.reportId || ''),
    reason,
    before: detail.before !== undefined ? detail.before : null,
    after: detail.after !== undefined ? detail.after : null,
    detail: sanitizedDetail
  };

  const line = JSON.stringify(logObj) + '\n';
  try {
    fs.appendFileSync(ADMIN_LOG_PATH, line, 'utf8');
    rotateLocalAdminLogIfNeeded();
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
// 自動滾動備份與容量極限控管引擎 (Rolling Backup & Storage Quota Guard)
// ─────────────────────────────────────────────
function isBackupTestModeEnabled() {
  return process.env.NODE_ENV === 'test' || process.env.BACKUP_TEST_MODE === 'true';
}

function getBackupsDir(req = null) {
  if (isBackupTestModeEnabled() && req?.headers?.['x-test-backups-dir']) {
    return path.resolve(decodeURIComponent(req.headers['x-test-backups-dir']));
  }
  return process.env.BACKUPS_DIR_PATH
    ? path.resolve(process.env.BACKUPS_DIR_PATH)
    : path.join(__dirname, 'backups');
}

const MAX_BACKUP_RETENTION_COUNT = 7;
const MAX_BACKUPS_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB 硬上限
const REDIS_BACKUP_KEY = 'ktv:backup:snapshots';

function ensureBackupsDirExists(dirPath = getBackupsDir()) {
  if (!fs.existsSync(dirPath)) {
    try { fs.mkdirSync(dirPath, { recursive: true }); } catch {}
  }
}

async function buildSystemBackupPayload() {
  const catalogOverrides = await loadCatalogOverridesStore();
  const reports = await loadReportsStore();
  const votes = await loadVotesStore();

  return {
    app: 'TW_KTV_CATALOG_SYSTEM',
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      catalogOverrides: catalogOverrides || { songs: {}, deletedIds: [] },
      reports: Array.isArray(reports) ? reports : [],
      votes: votes || {}
    }
  };
}

function readLocalBackupSnapshots(dirPath = getBackupsDir()) {
  ensureBackupsDirExists(dirPath);
  try {
    const files = fs.readdirSync(dirPath)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => {
        const fullPath = path.join(dirPath, f);
        const stat = fs.statSync(fullPath);
        const dateMatch = f.match(/backup_(\d{4}-\d{2}-\d{2})\.json/);
        const date = dateMatch ? dateMatch[1] : new Date(stat.mtimeMs).toISOString().slice(0, 10);
        return {
          name: f,
          date,
          createdAt: new Date(stat.mtimeMs).toISOString(),
          source: 'scheduled_daily',
          storage: 'local_file',
          size: stat.size
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    return files;
  } catch {
    return [];
  }
}

async function loadBackupSnapshotsStore(dirPath = getBackupsDir()) {
  ensureBackupsDirExists(dirPath);
  if (USE_REDIS) {
    try {
      const raw = await redisCmd('GET', REDIS_BACKUP_KEY);
      if (raw) {
        const snapshots = JSON.parse(raw);
        if (Array.isArray(snapshots)) {
          return {
            snapshots,
            snapshotStorage: 'redis',
            snapshotPersistence: true,
            warning: null
          };
        }
      }
      return {
        snapshots: [],
        snapshotStorage: 'redis',
        snapshotPersistence: true,
        warning: null
      };
    } catch (e) {
      console.warn('[Backup Redis Load Warning]', e.message);
      const localSnapshots = readLocalBackupSnapshots(dirPath);
      return {
        snapshots: localSnapshots,
        snapshotStorage: 'local_fallback',
        snapshotPersistence: false,
        warning: 'Redis不可用；目前使用本機Fallback備份，Render重啟或重新部署時可能遺失。'
      };
    }
  }

  const localSnapshots = readLocalBackupSnapshots(dirPath);
  return {
    snapshots: localSnapshots,
    snapshotStorage: 'local_file',
    snapshotPersistence: false,
    warning: null
  };
}

async function saveBackupSnapshotsStore(snapshots, dirPath = getBackupsDir()) {
  ensureBackupsDirExists(dirPath);
  const sortedSnapshots = [...snapshots].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  let storage = USE_REDIS ? 'redis' : 'local_file';
  let warning = null;

  if (USE_REDIS) {
    try {
      await redisCmd('SET', REDIS_BACKUP_KEY, JSON.stringify(sortedSnapshots));
    } catch (e) {
      console.warn('[Backup Redis Save Warning]', e.message);
      storage = 'local_fallback';
      warning = 'Redis不可用；目前使用本機Fallback備份，Render重啟或重新部署時可能遺失。';
    }
  }

  for (const snap of sortedSnapshots) {
    if (snap.payload && snap.name) {
      const localFile = path.join(dirPath, snap.name);
      safeAtomicWriteJson(localFile, snap.payload);
    }
  }

  return { storage, warning };
}

function cleanupBackupSnapshots(snapshots, dirPath = getBackupsDir()) {
  const dailySnapshots = snapshots.filter(s => s.source === 'scheduled_daily' || !s.source);
  const otherSnapshots = snapshots.filter(s => s.source && s.source !== 'scheduled_daily');

  const mapByDate = new Map();
  dailySnapshots.forEach(s => {
    const existing = mapByDate.get(s.date);
    if (!existing || new Date(s.createdAt) > new Date(existing.createdAt)) {
      mapByDate.set(s.date, s);
    }
  });

  const uniqueDaily = Array.from(mapByDate.values()).sort((a, b) => b.date.localeCompare(a.date));
  const keptDaily = uniqueDaily.slice(0, MAX_BACKUP_RETENTION_COUNT);
  const deletedDaily = uniqueDaily.slice(MAX_BACKUP_RETENTION_COUNT);

  for (const del of deletedDaily) {
    const file = path.join(dirPath, del.name);
    if (fs.existsSync(file)) {
      try { fs.unlinkSync(file); } catch {}
    }
  }

  return [...keptDaily, ...otherSnapshots].sort((a, b) => b.date.localeCompare(a.date));
}

async function upsertDailyBackupSnapshot(targetDateStr, dirPath = getBackupsDir()) {
  const dateStr = targetDateStr || new Date().toISOString().slice(0, 10);
  const storeResult = await loadBackupSnapshotsStore(dirPath);
  let snapshots = storeResult.snapshots;

  const existing = snapshots.find(s => s.date === dateStr && (s.source === 'scheduled_daily' || !s.source));
  if (existing) {
    return { created: false, name: existing.name, storage: storeResult.snapshotStorage };
  }

  const payload = await buildSystemBackupPayload();
  const name = `backup_${dateStr}.json`;
  const createdAt = new Date().toISOString();

  const newSnapshot = {
    name,
    date: dateStr,
    createdAt,
    source: 'scheduled_daily',
    storage: USE_REDIS ? 'redis' : 'local_file',
    size: JSON.stringify(payload).length,
    payload
  };

  snapshots.push(newSnapshot);
  const cleanedSnapshots = cleanupBackupSnapshots(snapshots, dirPath);
  const saveRes = await saveBackupSnapshotsStore(cleanedSnapshots, dirPath);
  const finalStorage = saveRes.storage || storeResult.snapshotStorage;

  console.log(`[Backup] 每日自動快照已成功生成: ${name} (Storage: ${finalStorage})`);
  return { created: true, name, storage: finalStorage };
}

function startDailyBackupScheduler() {
  upsertDailyBackupSnapshot().catch(err => console.warn('[Backup Scheduler Error]', err.message));

  setInterval(() => {
    upsertDailyBackupSnapshot().catch(err => console.warn('[Backup Scheduler Error]', err.message));
  }, 60 * 60 * 1000);
}

async function getQuotaUsageStats(dirPath = getBackupsDir()) {
  const storeResult = await loadBackupSnapshotsStore(dirPath);
  const snapshots = cleanupBackupSnapshots(storeResult.snapshots, dirPath);
  await saveBackupSnapshotsStore(snapshots, dirPath);

  const currentOverridesSize = fs.existsSync(CATALOG_OVERRIDES_PATH)
    ? fs.statSync(CATALOG_OVERRIDES_PATH).size
    : 0;

  const totalBackupBytes = snapshots.reduce((acc, s) => acc + (s.size || 0), 0);
  const usagePercent = Number(((totalBackupBytes + currentOverridesSize) / MAX_BACKUPS_TOTAL_BYTES * 100).toFixed(2));
  let status = 'healthy';
  if (usagePercent > 80) status = 'warning';
  if (usagePercent > 95) status = 'critical';

  return {
    storageMode: USE_REDIS ? 'redis' : 'local',
    snapshotStorage: storeResult.snapshotStorage,
    snapshotPersistence: storeResult.snapshotPersistence,
    warning: storeResult.warning,
    currentOverridesSizeBytes: currentOverridesSize,
    totalBackupFilesCount: snapshots.length,
    totalBackupBytes: totalBackupBytes,
    backupRetentionLimit: MAX_BACKUP_RETENTION_COUNT,
    maxBackupSizeCapMB: 10,
    usagePercent,
    status,
    backups: snapshots.map(s => ({
      name: s.name,
      date: s.date,
      createdAt: s.createdAt,
      size: s.size,
      source: s.source || 'scheduled_daily',
      storage: s.storage || storeResult.snapshotStorage
    }))
  };
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

// ── 動態聚合社群共識票數 (Auto-Promote Consensus Votes to Public Catalog Overrides) ──
async function getAutoVoteCatalogOverrides() {
  const votes = await loadVotesStore();
  const autoSongsMap = {};

  for (const [key, data] of Object.entries(votes)) {
    const { songId, brandId } = await parseVoteKeyDynamic(key);
    if (!songId || !brandId) continue;

    const confirm = data.confirm || 0;
    const deny = data.deny || 0;
    const guided = data.guidedVocal || 0;
    const noGuided = data.noGuidedVocal || 0;
    const official = data.officialMv || 0;
    const edited = data.editedMv || 0;

    let brandPatch = null;

    // 1. 導唱自動標記門檻：只要「有導唱」>= 2 票且高於「無導唱」
    if (guided >= 2 && guided > noGuided) {
      if (!brandPatch) brandPatch = {};
      brandPatch.audioType = 'guided_vocal';
    }

    // 2. MV 類型自動標記門檻：只要「官方 MV」>= 2 票且高於「伴唱 MV」
    if (official >= 2 && official > edited) {
      if (!brandPatch) brandPatch = {};
      brandPatch.mvType = 'official_mv';
    } else if (edited >= 2 && edited > official) {
      if (!brandPatch) brandPatch = {};
      brandPatch.mvType = 'reedited_mv';
    }

    // 3. 社群高度驗證： confirm >= 3 且無大量否定
    if (confirm >= 3 && confirm > deny * 2) {
      if (!brandPatch) brandPatch = {};
      brandPatch.available = true;
    }

    if (brandPatch) {
      if (!autoSongsMap[songId]) {
        autoSongsMap[songId] = { id: songId, brands: {} };
      }
      autoSongsMap[songId].brands[brandId] = {
        ...(autoSongsMap[songId].brands[brandId] || {}),
        ...brandPatch,
      };
    }
  }

  return autoSongsMap;
}

app.get('/api/catalog-overrides', async (req, res) => {
  const overrides = await loadCatalogOverridesStore();
  const manualSongsMap = overrides?.songs || {};
  const autoSongsMap = await getAutoVoteCatalogOverrides();

  // 合併社群自動共識與手動覆蓋（手動覆蓋擁有最高優先權）
  const mergedSongsMap = { ...autoSongsMap };
  for (const [sId, mSong] of Object.entries(manualSongsMap)) {
    if (!mergedSongsMap[sId]) {
      mergedSongsMap[sId] = mSong;
    } else {
      mergedSongsMap[sId] = {
        ...mergedSongsMap[sId],
        ...mSong,
        brands: {
          ...(mergedSongsMap[sId].brands || {}),
          ...(mSong.brands || {}),
        },
      };
    }
  }

  const songs = Object.values(mergedSongsMap);
  const deletedIds = Array.isArray(overrides?.deletedIds) ? overrides.deletedIds : [];
  res.json({ songs, deletedIds });
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
const VOTES_ARCHIVE_REDIS_KEY = 'ktv:votesArchivedSignals';
const REPORTS_REDIS_KEY = 'ktv:reports';
const REVIEW_ACTIONS_REDIS_KEY = 'ktv:reviewActions';
const REVIEW_ACTIONS_HANDLED_REDIS_KEY = 'ktv:reviewActionsHandled';
const REVIEW_ACTIONS_ARCHIVE_REDIS_PREFIX = 'ktv:reviewActionsArchive:';
const ADMIN_LOG_REDIS_KEY = 'ktv:adminLogs';
const CATALOG_OVERRIDES_REDIS_KEY = 'ktv:catalogOverrides';
const ARTIST_ALIASES_OVERRIDES_REDIS_KEY = 'ktv:artistAliasesOverrides';

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
  initializeJsonStoreInRedis(REVIEW_ACTIONS_REDIS_KEY, loadReviewActions(), 'ReviewActions');
  initializeJsonStoreInRedis(CATALOG_OVERRIDES_REDIS_KEY, loadCatalogOverrides(), 'CatalogOverrides');
  initializeJsonStoreInRedis(ARTIST_ALIASES_OVERRIDES_REDIS_KEY, loadArtistAliasesOverridesFromDisk(), 'ArtistAliasesOverrides');

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

app.get('/api/health', async (req, res) => {
  if (!USE_REDIS) {
    return res.json({
      ok: true,
      storage: 'local',
      persistent: false,
      timestamp: Date.now(),
    });
  }

  try {
    await redisCmd('ping');
    return res.json({
      ok: true,
      storage: 'redis',
      persistent: true,
      timestamp: Date.now(),
    });
  } catch {
    return res.status(503).json({
      ok: false,
      storage: 'redis_unavailable',
      persistent: false,
      error: 'Redis connection or authentication failed',
      timestamp: Date.now(),
    });
  }
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

function sanitizeBrandStatusSnapshot(status) {
  if (!status || typeof status !== 'object') return null;
  const result = { available: Boolean(status.available) };
  const code = sanitizeText(status.code).slice(0, 50);
  const audioType = sanitizeText(status.audioType);
  const mvType = sanitizeText(status.mvType);
  const note = sanitizeText(status.note).slice(0, 200);
  if (code) result.code = code;
  if (['original_vocal', 'guided_vocal', 'backing_track'].includes(audioType)) result.audioType = audioType;
  if (['official_mv', 'live_mv', 'reedited_mv', 'anime_mv'].includes(mvType)) result.mvType = mvType;
  if (note) result.note = note;
  return result;
}

function sanitizeSongSnapshot(snapshot, fallback = {}) {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const id = sanitizeText(snapshot.id || fallback.songId);
  const title = sanitizeText(snapshot.title || fallback.songTitle);
  const artist = sanitizeText(snapshot.artist || fallback.artist);
  if (!id || !title) return null;

  const brands = {};
  if (snapshot.brands && typeof snapshot.brands === 'object') {
    for (const [brandId, status] of Object.entries(snapshot.brands)) {
      const cleanBrandId = sanitizeText(brandId).slice(0, 80);
      const cleanStatus = sanitizeBrandStatusSnapshot(status);
      if (cleanBrandId && cleanStatus) brands[cleanBrandId] = cleanStatus;
    }
  }

  return {
    id,
    title,
    artist,
    lyricist: sanitizeText(snapshot.lyricist).slice(0, 120),
    composer: sanitizeText(snapshot.composer).slice(0, 120),
    language: sanitizeText(snapshot.language || fallback.lang) || '??',
    zhuyin: sanitizeText(snapshot.zhuyin).slice(0, 120),
    pinyin: sanitizeText(snapshot.pinyin).slice(0, 120),
    releaseYear: Number.parseInt(String(snapshot.releaseYear || new Date().getFullYear()), 10) || new Date().getFullYear(),
    popularRank: Number.isFinite(Number(snapshot.popularRank)) ? Number(snapshot.popularRank) : undefined,
    lyricsSnippet: sanitizeText(snapshot.lyricsSnippet).slice(0, 500),
    youtubeUrl: sanitizeText(snapshot.youtubeUrl).slice(0, 500) || undefined,
    isMainlandViral: Boolean(snapshot.isMainlandViral),
    isNiche: Boolean(snapshot.isNiche),
    brands,
  };
}

function buildReportSongSnapshot(report) {
  const fromSnapshot = sanitizeSongSnapshot(report.songSnapshot, report);
  if (fromSnapshot) return fromSnapshot;
  if (!report.songId || !report.songTitle) return null;
  return {
    id: sanitizeText(report.songId),
    title: sanitizeText(report.songTitle),
    artist: sanitizeText(report.artist) || '未填寫',
    lyricist: sanitizeText(report.lyricist),
    composer: sanitizeText(report.composer),
    language: sanitizeText(report.lang) || '??',
    zhuyin: '',
    pinyin: '',
    releaseYear: new Date().getFullYear(),
    lyricsSnippet: sanitizeText(report.lyricsSnippet),
    youtubeUrl: sanitizeText(report.youtubeUrl) || undefined,
    brands: {},
  };
}

async function persistCatalogMutation(song) {
  if (!SKIP_STATIC_CATALOG && songsDatabase.length > 0) await saveCatalog(songsDatabase);
  await saveCatalogOverrideSong(song);
}

async function updateSongBrandStatus({ songId, brandId, available, audioType, mvType, note = '' }) {
  if (!brandId || typeof available !== 'boolean') {
    const err = new Error('Missing required fields: brandId, available');
    err.statusCode = 400;
    throw err;
  }

  const isBrandValid = await brandExists(brandId, { activeOnly: false });
  if (!isBrandValid) {
    const err = new Error('Invalid brand ID: ' + brandId);
    err.statusCode = 400;
    throw err;
  }

  const validAudioTypes = ['original_vocal', 'guided_vocal', 'backing_track', ''];
  const validMvTypes = ['official_mv', 'live_mv', 'reedited_mv', 'anime_mv', ''];
  if (audioType !== undefined && !validAudioTypes.includes(audioType)) {
    const err = new Error('Invalid audio type');
    err.statusCode = 400;
    throw err;
  }
  if (mvType !== undefined && !validMvTypes.includes(mvType)) {
    const err = new Error('Invalid MV type');
    err.statusCode = 400;
    throw err;
  }

  let idx = songsDatabase.findIndex(s => s.id === songId);
  let song;
  if (idx === -1) {
    const existing = await getAdminSongById(songId);
    song = existing ? JSON.parse(JSON.stringify(existing)) : {
      id: songId,
      title: 'Unknown title',
      artist: 'Unknown artist',
      language: '國語',
      brands: {},
    };
    songsDatabase.push(song);
    idx = songsDatabase.length - 1;
  } else {
    song = songsDatabase[idx];
  }

  const before = song.brands?.[brandId] ?? null;
  if (!song.brands) song.brands = {};
  const nextBrandStatus = {
    ...before,
    available,
    code: before?.code || (available ? 'OK' : 'N/A'),
  };

  if (audioType !== undefined) nextBrandStatus.audioType = audioType || undefined;
  else if (available && before?.audioType) nextBrandStatus.audioType = before.audioType;

  if (mvType !== undefined) nextBrandStatus.mvType = mvType || undefined;
  else if (available && before?.mvType) nextBrandStatus.mvType = before.mvType;

  if (!available) {
    nextBrandStatus.code = before?.code || 'N/A';
    delete nextBrandStatus.audioType;
    delete nextBrandStatus.mvType;
  }

  song.brands[brandId] = { ...nextBrandStatus };
  songsDatabase[idx] = song;
  await saveCatalogOverrideSong(song);
  return { song, before, after: song.brands[brandId], note };
}

async function updateSongBrandMvType({ songId, brandId, mvType, note = '' }) {
  if (!brandId) {
    const err = new Error('Missing required field: brandId');
    err.statusCode = 400;
    throw err;
  }

  const isBrandValid = await brandExists(brandId, { activeOnly: false });
  if (!isBrandValid) {
    const err = new Error('Invalid brand ID: ' + brandId);
    err.statusCode = 400;
    throw err;
  }

  const validMvTypes = ['official_mv', 'live_mv', 'reedited_mv', 'anime_mv', ''];
  if (mvType !== undefined && !validMvTypes.includes(mvType)) {
    const err = new Error('Invalid MV type');
    err.statusCode = 400;
    throw err;
  }

  let idx = songsDatabase.findIndex(s => s.id === songId);
  let song;
  if (idx === -1) {
    const existing = await getAdminSongById(songId);
    song = existing ? JSON.parse(JSON.stringify(existing)) : {
      id: songId,
      title: 'Unknown title',
      artist: 'Unknown artist',
      language: '國語',
      brands: {},
    };
    songsDatabase.push(song);
    idx = songsDatabase.length - 1;
  } else {
    song = songsDatabase[idx];
  }

  if (!song.brands) song.brands = {};
  const before = song.brands[brandId] ?? { available: false };
  const updatedBrandStatus = { ...before, mvType: mvType || undefined };
  if (!mvType) delete updatedBrandStatus.mvType;

  song.brands[brandId] = updatedBrandStatus;
  songsDatabase[idx] = song;
  await saveCatalogOverrideSong(song);
  return { song, before, after: song.brands[brandId], note };
}

async function createBrandFromReportRecord({ reportId, body = {} }) {
  const reports = await loadReportsStore();
  const reportIndex = reports.findIndex(r => String(r.id) === String(reportId));
  if (reportIndex === -1) {
    const err = new Error('Report not found: ' + reportId);
    err.statusCode = 404;
    throw err;
  }

  const report = reports[reportIndex];
  if (report.issueType !== 'suggest_new_brand') {
    const err = new Error('Report is not a new brand suggestion');
    err.statusCode = 400;
    throw err;
  }

  const rawId = String(body.id || report.shortName || report.brandName || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const finalId = rawId && /^[a-z0-9_]{2,32}$/.test(rawId) ? rawId : 'brand_' + Date.now();
  const name = String(body.name || report.brandName || report.brand || '').trim();
  const shortName = String(body.shortName || report.shortName || report.brand || '').trim();
  if (!name || !shortName) {
    const err = new Error('Missing brand name or short name');
    err.statusCode = 400;
    throw err;
  }

  const store = await loadBrandSettingsStore();
  if (store.brands && store.brands[finalId]) {
    const err = new Error('Brand ID already exists: ' + finalId);
    err.statusCode = 400;
    throw err;
  }

  const color = isValidBrandColor(String(body.color || '').trim()) ? String(body.color).trim() : '#38bdf8';
  const existingOrders = Object.values(store.brands || {}).map(b => Number(b.sortOrder) || 0);
  const maxSortOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : 0;
  const now = new Date().toISOString();
  const newBrand = {
    id: finalId,
    name,
    shortName,
    color,
    badgeBg: buildBadgeBg(color),
    description: String(body.description || report.note || report.description || '').trim(),
    status: 'active',
    sortOrder: maxSortOrder + 1,
    source: 'suggestion',
    sourceReportId: String(report.id),
    createdAt: now,
    updatedAt: now,
  };

  if (!store.brands) store.brands = {};
  store.brands[finalId] = newBrand;
  await saveBrandSettingsStore(store, { requirePersistent: true });

  reports[reportIndex] = {
    ...report,
    status: 'resolved',
    resolvedAt: now,
    reviewedAt: now,
    resolutionNote: 'Created brand on ' + now.slice(0, 10) + ' (ID: ' + finalId + ')',
  };
  await saveReportsStore(reports);
  return { brand: newBrand, report: reports[reportIndex], reports, reportIndex };
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
    songSnapshot,
  } = req.body;
  if (!songId || !brandId || !issueType) return res.status(400).json({ error: '缺少必要欄位' });

  const validTypes = ['no_song', 'has_song', 'missing_song', 'suggest_song', 'suggest_new_brand', 'wrong_info', 'other'];
  if (!validTypes.includes(issueType)) return res.status(400).json({ error: '無效的 issueType' });

  if (issueType !== 'suggest_new_brand') {
    const isBrandActive = await brandExists(brandId, { activeOnly: true });
    if (!isBrandActive) {
      return res.status(400).json({ error: `無效或已停用的品牌 ID: "${brandId}"` });
    }
  }

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
  const cleanSongSnapshot = sanitizeSongSnapshot(songSnapshot, { songId, songTitle, artist, lang });

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
    songSnapshot: cleanSongSnapshot || undefined,
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

app.get('/api/reports', requirePermission('reports.view'), async (req, res) => {
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

  const isBrandActive = await brandExists(brandId, { activeOnly: true });
  if (!isBrandActive) {
    return res.status(400).json({ error: `無效或已停用的品牌 ID: "${brandId}"` });
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

  const isBrandActive = await brandExists(brandId, { activeOnly: true });
  if (!isBrandActive) {
    return res.status(400).json({ error: `無效或已停用的品牌 ID: "${brandId}"` });
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

app.post('/api/vote/mv', async (req, res) => {
  const { songId, brandId, vote, previousVote, removeVote } = req.body;
  if (!songId || !brandId || !['official', 'edited'].includes(vote)) {
    return res.status(400).json({ error: '缺少必要欄位' });
  }
  if (previousVote && !['official', 'edited'].includes(previousVote)) {
    return res.status(400).json({ error: '無效的 previousVote' });
  }

  const isBrandActive = await brandExists(brandId, { activeOnly: true });
  if (!isBrandActive) {
    return res.status(400).json({ error: `無效或已停用的品牌 ID: "${brandId}"` });
  }

  const votes = await loadVotesStore();
  const key = `${songId}_${brandId}`;
  if (!votes[key]) votes[key] = { confirm: 0, deny: 0, guidedVocal: 0, noGuidedVocal: 0, officialMv: 0, editedMv: 0 };
  const voteKey = vote === 'official' ? 'officialMv' : 'editedMv';

  if (removeVote) {
    votes[key][voteKey] = Math.max(0, (votes[key][voteKey] || 0) - 1);
  } else {
    if (previousVote && previousVote !== vote) {
      const previousKey = previousVote === 'official' ? 'officialMv' : 'editedMv';
      votes[key][previousKey] = Math.max(0, (votes[key][previousKey] || 0) - 1);
    }
    votes[key][voteKey] = Math.max(0, (votes[key][voteKey] || 0) + 1);
  }

  try {
    await saveVotesStore(votes);
  } catch (err) {
    console.error('[Votes] MV persistent save failed:', err);
    return res.status(503).json({ error: 'MV 投票資料暫時無法儲存，請稍後再試' });
  }

  const d = votes[key];
  res.json({
    success: true,
    key,
    confirm: d.confirm || 0,
    deny: d.deny || 0,
    guidedVocal: d.guidedVocal || 0,
    noGuidedVocal: d.noGuidedVocal || 0,
    officialMv: d.officialMv || 0,
    editedMv: d.editedMv || 0,
    confidence: getVoteConfidence(d.confirm || 0, d.deny || 0),
  });
});

app.get('/api/votes/:songId', async (req, res) => {
  const { songId } = req.params;
  const votes = await loadVotesStore();
  const brandIds = await getKnownVoteBrandIdsForSong(songId);
  const result = {};
  for (const brandId of brandIds) {
    const data = votes[`${songId}_${brandId}`];
    if (!data) continue;
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
  res.json({ songId, votes: result });
});

// ═══════════════════════════════════════════════════════
// 管理員 RBAC & Auth API 路由 (管理憑證與身分權限驗證)
// ═══════════════════════════════════════════════════════

// ── 查詢系統初始化與 Bootstrap 狀態 ──
app.get('/api/admin/bootstrap/status', (req, res) => {
  res.json({
    hasSuperAdmin: Boolean(getSingleAdminUser()),
    bootstrapAvailable: false
  });
});

// ── 初始化第一位最高管理者 (Bootstrap Super Admin) ──
app.post('/api/admin/bootstrap/super-admin', (req, res) => {
  return res.status(410).json({ error: 'Single admin mode is configured from Render Environment.' });
});

/*
Legacy multi-admin bootstrap implementation is intentionally disabled.
  return res.status(410).json({ error: '目前使用單一管理者模式，請在 Render Environment 設定 ADMIN_USERNAME 與 ADMIN_PASSWORD。' });

  const expectedBootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN || ADMIN_TOKEN;
  const bootstrapToken = req.headers['x-bootstrap-token'] || req.body.bootstrapToken;
  if (!expectedBootstrapToken || bootstrapToken !== expectedBootstrapToken) {
    return res.status(401).json({ error: '初始化失敗：提供之 Bootstrap Token 無效' });
  }

  const users = loadAdminUsersStore();
  const activeSuperAdmin = users.find(u => u.role === 'super_admin' && u.status === 'active');
  if (activeSuperAdmin) {
    return res.status(400).json({ error: '初始化失敗：系統已存在最高管理者帳號' });
  }

  const username = String(req.body.username || 'owner').trim();
  const displayName = String(req.body.displayName || '最高管理者').trim();
  const password = String(req.body.password || '').trim();

  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: '資料未完整：請提供帳號與長度至少 6 碼之密碼' });
  }

  const superAdminUser = {
    id: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username,
    displayName,
    role: 'super_admin',
    passwordHash: hashPassword(password),
    status: 'active',
    permissions: ALL_PERMISSIONS,
    createdAt: new Date().toISOString(),
    createdBy: 'bootstrap_system',
    updatedAt: new Date().toISOString(),
    lastLoginAt: null,
    lastLoginIp: null,
    failedLoginCount: 0,
    lockedUntil: null
  };

  users.push(superAdminUser);
  saveAdminUsersStore(users);

  logAdminAction('BOOTSTRAP_SUPER_ADMIN', { adminId: superAdminUser.id, username, displayName }, req);
  res.json({ success: true, message: '已成功初始化最高管理者帳號', admin: { id: superAdminUser.id, username, displayName, role: 'super_admin' } });
});

// ── 管理者登入 ──
*/

app.post('/api/admin/auth/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '').trim();

  if (ADMIN_PASSWORD && username && password && safeCompareText(username, ADMIN_USERNAME)) {
    const user = getSingleAdminUser();
    const isUsernameValid = safeCompareText(username, ADMIN_USERNAME);
    const isPasswordValid = safeCompareText(password, ADMIN_PASSWORD);

    if (!user || !isUsernameValid || !isPasswordValid) {
      logAdminAction('LOGIN_FAILED', { username, reason: 'invalid_single_admin_credentials' }, req);
      return res.status(401).json({ error: '帳號或密碼不正確，請確認後再試。' });
    }

    const now = new Date();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    const permissionsSnapshot = resolveAdminPermissions(user);
    const sessions = loadAdminSessionsStore();

    sessions.push({
      sessionId: sessionToken,
      adminId: user.id,
      role: user.role,
      permissionsSnapshot,
      createdAt: now.toISOString(),
      expiresAt,
      lastSeenAt: now.toISOString(),
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'browser'
    });
    saveAdminSessionsStore(sessions);

    logAdminAction('LOGIN_SUCCESS', { adminId: user.id, username: user.username, role: user.role }, req);
    return res.json({ success: true, sessionToken, admin: { id: user.id, username: user.username, displayName: user.displayName, role: user.role, permissions: permissionsSnapshot }, expiresAt });
  }

  if (ADMIN_PASSWORD) {
    logAdminAction('LOGIN_FAILED', { username, reason: 'invalid_single_admin_credentials' }, req);
    return res.status(401).json({ error: '帳號或密碼錯誤，請確認 Render Environment 的 ADMIN_USERNAME 與 ADMIN_PASSWORD。' });
  }

  if (!username || !password) {
    return res.status(400).json({ error: '請輸入管理者帳號與密碼' });
  }

  const users = loadAdminUsersStore();
  const user = users.find(u => u.username === username);

  if (!user) {
    logAdminAction('LOGIN_FAILED', { username, reason: '帳號不存在' }, req);
    return res.status(401).json({ error: '帳號或密碼不正確，請確認後再試。' });
  }

  if (user.status !== 'active') {
    logAdminAction('LOGIN_FAILED', { username, reason: '帳號已被停用' }, req);
    return res.status(403).json({ error: '此帳號已被停用，請洽最高管理者。' });
  }

  const now = new Date();
  if (user.lockedUntil && new Date(user.lockedUntil) > now) {
    const lockMinutes = Math.ceil((new Date(user.lockedUntil) - now) / (60 * 1000));
    logAdminAction('LOGIN_FAILED', { username, reason: '帳號受鎖定保護中' }, req);
    return res.status(429).json({ error: `此帳號暫時鎖定，請於 ${lockMinutes} 分鐘後再試。` });
  }

  const isPasswordValid = verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    user.failedLoginCount = (user.failedLoginCount || 0) + 1;
    if (user.failedLoginCount >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }
    user.updatedAt = now.toISOString();
    saveAdminUsersStore(users);

    logAdminAction('LOGIN_FAILED', { username, reason: `密碼錯誤 (失敗 ${user.failedLoginCount} 次)` }, req);
    return res.status(401).json({ error: '帳號或密碼不正確，請確認後再試。' });
  }

  // 重置鎖定與失敗次數
  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.lastLoginAt = now.toISOString();
  user.lastLoginIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  user.updatedAt = now.toISOString();
  saveAdminUsersStore(users);

  // 產生 Session Token
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 小時有效期
  const permissionsSnapshot = resolveAdminPermissions(user);

  const sessions = loadAdminSessionsStore();
  const newSession = {
    sessionId: sessionToken,
    adminId: user.id,
    role: user.role,
    permissionsSnapshot,
    createdAt: now.toISOString(),
    expiresAt,
    lastSeenAt: now.toISOString(),
    ip: user.lastLoginIp,
    userAgent: req.headers['user-agent'] || 'browser'
  };

  sessions.push(newSession);
  saveAdminSessionsStore(sessions);

  const adminInfo = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    permissions: permissionsSnapshot,
  };

  logAdminAction('LOGIN_SUCCESS', { adminId: user.id, username: user.username, role: user.role }, req);
  res.json({ success: true, sessionToken, admin: adminInfo, expiresAt });
});

// ── 讀取當前登入者身分與權限 ──
app.get('/api/admin/auth/me', requireSession, (req, res) => {
  res.json({
    admin: req.admin,
    session: {
      expiresAt: req.adminSession.expiresAt,
      lastSeenAt: req.adminSession.lastSeenAt,
    }
  });
});

// ── 管理者登出 ──
app.post('/api/admin/auth/logout', requireSession, (req, res) => {
  const token = getSessionTokenFromReq(req);
  let sessions = loadAdminSessionsStore();
  sessions = sessions.filter(s => s.sessionId !== token);
  saveAdminSessionsStore(sessions);

  logAdminAction('LOGOUT', { adminId: req.admin.id, username: req.admin.username }, req);
  res.json({ success: true, message: '已成功登出後台' });
});

// ── 管理者列表 ──
app.get('/api/admin/admins', requirePermission('admins.view'), (req, res) => {
  const singleAdmin = getSingleAdminUser();
  if (singleAdmin) {
    return res.json({
      admins: [{
        id: singleAdmin.id,
        username: singleAdmin.username,
        displayName: singleAdmin.displayName,
        role: singleAdmin.role,
        status: singleAdmin.status,
        permissions: resolveAdminPermissions(singleAdmin),
        customPermissions: [],
        createdAt: null,
        lastLoginAt: null,
        lastLoginIp: null,
      }]
    });
  }

  const users = loadAdminUsersStore();
  const safeUsers = users.map(u => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    status: u.status,
    permissions: resolveAdminPermissions(u),
    customPermissions: u.permissions || [],
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
    lastLoginIp: u.lastLoginIp,
  }));
  res.json({ admins: safeUsers });
});

// ── 新增一般管理者 ──
app.post('/api/admin/admins', requirePermission('admins.manage'), (req, res) => {
  if (getSingleAdminUser()) {
    return res.status(410).json({ error: '目前使用單一管理者模式，不支援建立其他管理者。' });
  }

  const reason = String(req.body.reason || '').trim();
  if (!reason || reason.length < 4) {
    return res.status(400).json({ error: '此高風險操作需要填寫操作理由（至少 4 個字）' });
  }

  const username = String(req.body.username || '').trim();
  const displayName = String(req.body.displayName || username).trim();
  const password = String(req.body.password || '').trim();
  const role = req.body.role === 'super_admin' ? 'super_admin' : 'admin';
  const customPermissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];

  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: '請填寫帳號與長度至少 6 碼之密碼' });
  }

  const users = loadAdminUsersStore();
  if (users.some(u => u.username === username)) {
    return res.status(409).json({ error: '該管理者帳號已存在' });
  }

  const newUser = {
    id: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username,
    displayName,
    role,
    passwordHash: hashPassword(password),
    status: 'active',
    permissions: customPermissions,
    createdAt: new Date().toISOString(),
    createdBy: req.admin.username,
    updatedAt: new Date().toISOString(),
    lastLoginAt: null,
    lastLoginIp: null,
    failedLoginCount: 0,
    lockedUntil: null
  };

  users.push(newUser);
  saveAdminUsersStore(users);

  logAdminAction('CREATE_ADMIN', { targetId: newUser.id, username, displayName, role, before: null, after: { id: newUser.id, username, displayName, role, status: newUser.status }, reason }, req);
  res.json({ success: true, admin: { id: newUser.id, username, displayName, role } });
});

// ── 更新管理者狀態與權限 ──
app.patch('/api/admin/admins/:adminId', requirePermission('admins.manage'), (req, res) => {
  if (getSingleAdminUser()) {
    return res.status(410).json({ error: '目前使用單一管理者模式，不支援修改管理者權限。' });
  }

  const reason = String(req.body.reason || '').trim();
  if (!reason || reason.length < 4) {
    return res.status(400).json({ error: '此高風險操作需要填寫操作理由（至少 4 個字）' });
  }

  const { adminId } = req.params;
  const users = loadAdminUsersStore();
  const user = users.find(u => u.id === adminId);

  if (!user) {
    return res.status(404).json({ error: '找不到該管理者帳號' });
  }

  if (req.body.status === 'disabled' && user.id === req.admin.id) {
    return res.status(400).json({ error: '操作無效：最高管理者不可停用自己的帳號' });
  }

  if (req.body.status === 'disabled' && user.role === 'super_admin') {
    const activeSuperAdmins = users.filter(u => u.role === 'super_admin' && u.status === 'active' && u.id !== user.id);
    if (activeSuperAdmins.length === 0) {
      return res.status(400).json({ error: '操作無效：系統必須保留至少一位啟用的最高管理者' });
    }
  }

  const before = { displayName: user.displayName, role: user.role, status: user.status, permissions: user.permissions || [] };
  if (req.body.displayName) user.displayName = String(req.body.displayName).trim();
  if (req.body.role && (req.body.role === 'super_admin' || req.body.role === 'admin')) user.role = req.body.role;
  if (req.body.status && (req.body.status === 'active' || req.body.status === 'disabled')) user.status = req.body.status;
  if (Array.isArray(req.body.permissions)) user.permissions = req.body.permissions;
  user.updatedAt = new Date().toISOString();

  saveAdminUsersStore(users);

  // 若帳號停用，使該帳號所有既有 Session 立即失效
  if (user.status === 'disabled') {
    let sessions = loadAdminSessionsStore();
    sessions = sessions.filter(s => s.adminId !== user.id);
    saveAdminSessionsStore(sessions);
  }

  logAdminAction('UPDATE_ADMIN', { targetId: user.id, username: user.username, before, after: { displayName: user.displayName, role: user.role, status: user.status, permissions: user.permissions || [] }, reason }, req);
  res.json({ success: true, admin: { id: user.id, username: user.username, displayName: user.displayName, role: user.role, status: user.status } });
});

// ── 重設管理者密碼 ──
app.post('/api/admin/admins/:adminId/password', requirePermission('admins.manage'), (req, res) => {
  if (getSingleAdminUser()) {
    return res.status(410).json({ error: '目前使用單一管理者模式，請在 Render Environment 修改 ADMIN_PASSWORD。' });
  }

  const reason = String(req.body.reason || '').trim();
  if (!reason || reason.length < 4) {
    return res.status(400).json({ error: '此高風險操作需要填寫操作理由（至少 4 個字）' });
  }

  const { adminId } = req.params;
  const newPassword = String(req.body.password || '').trim();
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: '請提供長度至少 6 碼的新密碼' });
  }

  const users = loadAdminUsersStore();
  const user = users.find(u => u.id === adminId);
  if (!user) {
    return res.status(404).json({ error: '找不到該管理者帳號' });
  }

  user.passwordHash = hashPassword(newPassword);
  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.updatedAt = new Date().toISOString();

  saveAdminUsersStore(users);

  // 密碼重設後強制使該帳號所有 Session 失效重登
  let sessions = loadAdminSessionsStore();
  sessions = sessions.filter(s => s.adminId !== user.id);
  saveAdminSessionsStore(sessions);

  logAdminAction('RESET_ADMIN_PASSWORD', { targetId: user.id, username: user.username, before: { passwordReset: false }, after: { passwordResetAt: new Date().toISOString(), sessionInvalidated: true }, reason }, req);
  res.json({ success: true, message: `已成功重設管理者「${user.username}」之密碼` });
});

// ── 查看所有回報 ──
app.get('/api/admin/reports', requirePermission('reports.view'), async (req, res) => {
  const reports = await loadReportsStore();
  const { status, page = 1, limit = 50 } = req.query;
  const filtered = status ? reports.filter(r => r.status === status) : reports;
  const limitNum = Math.min(100, Math.max(10, Number.parseInt(String(limit), 10) || 50));
  const total = filtered.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const pageNum = Math.min(totalPages, Math.max(1, Number.parseInt(String(page), 10) || 1));
  const start = (pageNum - 1) * limitNum;
  res.json({ total, page: pageNum, limit: limitNum, totalPages, reports: [...filtered].reverse().slice(start, start + limitNum) });
});

// ── 更新回報狀態 ──
app.patch('/api/admin/report/:reportId', requirePermission('reports.review'), async (req, res) => {
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
        await persistCatalogMutation(existingSong);
      } else if (report.songId) {
        const sIdx = songsDatabase.findIndex(s => s.id === report.songId);
        const targetSong = sIdx !== -1 ? songsDatabase[sIdx] : buildReportSongSnapshot(report);
        if (targetSong) {
          if (!targetSong.brands) targetSong.brands = {};
          if (report.issueType === 'no_song') {
            targetSong.brands[report.brandId] = {
              ...targetSong.brands[report.brandId],
              available: false,
              note: '管理員審核更正為未收錄',
            };
          } else if (report.issueType === 'has_song') {
            targetSong.brands[report.brandId] = {
              ...targetSong.brands[report.brandId],
              available: true,
              code: report.songCode || targetSong.brands[report.brandId]?.code || 'OK',
              note: '管理員審核更正為有收錄',
            };
          }
          if (sIdx !== -1) songsDatabase[sIdx] = targetSong;
          else songsDatabase.push(targetSong);
          await persistCatalogMutation(targetSong);
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
  logAdminAction('UPDATE_REPORT_STATUS', { reportId, status, adminNote }, req);
  res.json({ success: true, report: reports[idx] });
});

// ── 後台管理 API：設定 / 自訂累積訪客計數器 (高風險操作：理由必填) ──
app.post('/api/admin/stats/reset', requirePermission('stats.reset'), async (req, res) => {
  const reason = String(req.body.reason || req.query.reason || '').trim();
  if (!reason || reason.length < 4) {
    return res.status(400).json({ error: '此高風險操作需要填寫操作理由（至少 4 個字）' });
  }

  const newCount = (typeof req.body.count === 'number' && req.body.count >= 0) ? req.body.count : 1;
  const beforeCount = currentStats.totalVisits;
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

  logAdminAction('RESET_STATS', { before: beforeCount, after: newCount, newCount, reason }, req);
  res.json({ success: true, totalVisits: currentStats.totalVisits });
});

// ── 查看爭議歌曲 ──
async function loadHandledReviewItemIds() {
  const reviewActions = await loadReviewActionsStore();
  const state = await loadReviewActionsHandledStateStore();
  return new Set([
    ...Object.keys(state || {}),
    ...reviewActions
      .filter(a => a && (a.status === 'adopted' || a.status === 'rejected'))
      .map(a => String(a.reviewItemId || ''))
      .filter(Boolean)
  ]);
}

const reviewQueueCache = new Map();
let adminStatsCache = null;

function getReviewQueueCacheKey(canViewReports, canViewVotes) {
  return `${canViewReports ? 'reports' : 'no-reports'}:${canViewVotes ? 'votes' : 'no-votes'}`;
}

function invalidateReviewQueueCache() {
  reviewQueueCache.clear();
}

function invalidateAdminStatsCache() {
  adminStatsCache = null;
}

function invalidateAdminDerivedCaches() {
  invalidateReviewQueueCache();
  invalidateAdminStatsCache();
}

async function buildReviewQueueItems({ canViewReports, canViewVotes }) {
  const items = [];
  const handledReviewItemIds = await loadHandledReviewItemIds();
  const pushItem = (item) => {
    if (handledReviewItemIds.has(String(item.id))) return;
    items.push({ status: 'pending', priority: 0, updatedAt: item.createdAt || new Date().toISOString(), ...item });
  };

  if (canViewReports) {
    const reports = await loadReportsStore();
    for (const report of reports.filter(r => r.status === 'pending')) {
      const itemType = report.issueType === 'suggest_new_brand'
        ? 'suggest_new_brand'
        : (report.issueType === 'suggest_song' || report.issueType === 'missing_song' ? 'suggest_song' : 'report');
      pushItem({
        id: `report:${report.id}`,
        sourceType: 'report',
        sourceId: report.id,
        itemType,
        songId: report.songId,
        songTitle: report.songTitle || report.songSnapshot?.title || '',
        artist: report.artist || report.songSnapshot?.artist || '',
        brandId: report.brandId,
        currentValue: null,
        suggestedValue: report.issueType,
        signalSummary: {
          issueType: report.issueType,
          songCode: report.songCode || '',
          note: report.note || '',
          brandName: report.brandName || '',
          shortName: report.shortName || '',
        },
        priority: itemType === 'suggest_new_brand' ? 95 : (itemType === 'suggest_song' ? 90 : 70),
        createdAt: report.timestamp,
        updatedAt: report.reviewedAt || report.timestamp,
      });
    }
  }

  if (canViewVotes) {
    const votes = await loadVotesStore();
    for (const [key, data] of Object.entries(votes)) {
      const { songId, brandId } = await parseVoteKeyDynamic(key);
      if (!songId || !brandId) continue;
      const song = await getAdminSongById(songId);
      const brandData = song?.brands?.[brandId] || null;
      const base = { songId, brandId, songTitle: song?.title || songId, artist: song?.artist || '' };

      const confirm = data.confirm || 0;
      const deny = data.deny || 0;
      const availabilityTotal = confirm + deny;
      if (availabilityTotal >= 3) {
        const confidence = getVoteConfidence(confirm, deny);
        const currentStatus = brandData?.available ?? null;
        const suggestedAvailability = confirm >= deny;
        const shouldQueueDisputed = (confidence === 'disputed' || confidence === 'uncertain') && currentStatus !== suggestedAvailability;
        const shouldQueueVerified = confidence === 'verified' && currentStatus !== true;
        if (shouldQueueDisputed || shouldQueueVerified) {
          pushItem({
            id: `availability_vote:${key}`,
            sourceType: 'availability_vote',
            sourceId: key,
            itemType: 'availability',
            ...base,
            currentValue: currentStatus,
            suggestedValue: suggestedAvailability,
            signalSummary: { confirm, deny, total: availabilityTotal, confidence },
            priority: (shouldQueueVerified ? 85 : 65) + Math.min(20, availabilityTotal),
          });
        }
      }

      const guided = data.guidedVocal || 0;
      const noGuided = data.noGuidedVocal || 0;
      const guidedTotal = guided + noGuided;
      if (guidedTotal > 0) {
        const suggestedAudioType = guided > noGuided ? 'guided_vocal' : (noGuided > guided ? 'backing_track' : 'needs_review');
        const currentAudioType = brandData?.audioType || 'unknown';
        const alreadyMatches = suggestedAudioType !== 'needs_review' && currentAudioType === suggestedAudioType;
        if (!alreadyMatches) {
          pushItem({
            id: `guided_vote:${key}`,
            sourceType: 'guided_vote',
            sourceId: key,
            itemType: 'guided',
            ...base,
            currentValue: currentAudioType,
            suggestedValue: suggestedAudioType,
            signalSummary: { guided, noGuided, total: guidedTotal },
            priority: 55 + Math.min(20, guidedTotal),
          });
        }
      }

      const official = data.officialMv || 0;
      const edited = data.editedMv || 0;
      const mvTotal = official + edited;
      if (mvTotal > 0) {
        const suggestedMvType = official > edited ? 'official_mv' : (edited > official ? 'reedited_mv' : 'needs_review');
        const currentMvType = brandData?.mvType || 'unknown';
        const alreadyMatches = suggestedMvType !== 'needs_review' && currentMvType === suggestedMvType;
        if (!alreadyMatches) {
          pushItem({
            id: `mv_vote:${key}`,
            sourceType: 'mv_vote',
            sourceId: key,
            itemType: 'mv',
            ...base,
            currentValue: currentMvType,
            suggestedValue: suggestedMvType,
            signalSummary: { official, edited, total: mvTotal },
            priority: 50 + Math.min(20, mvTotal),
          });
        }
      }
    }
  }

  items.sort((a, b) => (b.priority - a.priority) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  return items;
}

async function loadReviewQueueItemsCached({ canViewReports, canViewVotes }) {
  const cacheKey = getReviewQueueCacheKey(canViewReports, canViewVotes);
  const cached = reviewQueueCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return { items: cached.items, cache: 'hit' };
  const items = await buildReviewQueueItems({ canViewReports, canViewVotes });
  reviewQueueCache.set(cacheKey, { items, expiresAt: now + REVIEW_QUEUE_CACHE_TTL_MS });
  return { items, cache: 'miss' };
}

function summarizeReviewQueueFilters(items) {
  return {
    all: items.length,
    report: items.filter(i => i.itemType === 'report').length,
    availability: items.filter(i => i.itemType === 'availability').length,
    guided: items.filter(i => i.itemType === 'guided').length,
    mv: items.filter(i => i.itemType === 'mv').length,
    suggest_song: items.filter(i => i.itemType === 'suggest_song').length,
    suggest_new_brand: items.filter(i => i.itemType === 'suggest_new_brand').length,
  };
}

app.get('/api/admin/review-queue', requireSession, async (req, res) => {
  const permissions = req.admin?.permissions || [];
  const canViewReports = permissions.includes('reports.view');
  const canViewVotes = permissions.includes('votes.view');
  if (!canViewReports && !canViewVotes) return res.status(403).json({ error: '缺少待處理資料查看權限' });

  const typeFilter = String(req.query.type || 'all');
  const limit = Math.min(300, Math.max(10, Number.parseInt(String(req.query.limit || '120'), 10) || 120));
  const { items, cache } = await loadReviewQueueItemsCached({ canViewReports, canViewVotes });
  const filteredItems = typeFilter === 'all'
    ? items
    : items.filter(item => item.itemType === typeFilter || item.sourceType === typeFilter);
  res.json({
    total: filteredItems.length,
    items: filteredItems.slice(0, limit),
    filters: summarizeReviewQueueFilters(items),
    meta: { cache, ttlMs: REVIEW_QUEUE_CACHE_TTL_MS },
  });
});

function hasAnyPermission(permissions, allowed) {
  return allowed.some(permission => permissions.includes(permission));
}

function createReviewActionRecord({ reviewItemId, sourceType, sourceId, itemType, status, action, reason, snapshot, req, now }) {
  return {
    id: `${status === 'rejected' ? 'rvr' : 'rva'}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    reviewItemId,
    sourceType: String(sourceType || snapshot?.sourceType || ''),
    sourceId: String(sourceId || snapshot?.sourceId || ''),
    itemType: String(itemType || snapshot?.itemType || ''),
    status,
    action: String(action || (status === 'rejected' ? 'reject' : 'adopt')),
    reason: String(reason || '').trim(),
    snapshot: snapshot || {},
    adminId: req.admin?.id || 'unknown',
    adminName: req.admin?.displayName || req.admin?.username || 'unknown',
    reviewedAt: now,
  };
}

function getLocalFileSize(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  } catch {
    return 0;
  }
}

function rotateLocalAdminLogIfNeeded() {
  try {
    if (!fs.existsSync(ADMIN_LOG_PATH)) return;
    const size = fs.statSync(ADMIN_LOG_PATH).size;
    if (size <= ADMIN_LOG_MAX_BYTES) return;
    const lines = fs.readFileSync(ADMIN_LOG_PATH, 'utf8').trim().split('\n').filter(Boolean);
    const kept = lines.slice(-ADMIN_LOG_MAX_LINES);
    fs.writeFileSync(ADMIN_LOG_PATH, kept.join('\n') + (kept.length ? '\n' : ''), 'utf8');
  } catch (err) {
    console.warn('[AdminLog] Local log rotation failed:', err.message);
  }
}

function classifyDataGrowth(count, sizeBytes, warningCount, criticalCount) {
  if (count >= criticalCount || sizeBytes >= 5 * 1024 * 1024) return 'critical';
  if (count >= warningCount || sizeBytes >= 2 * 1024 * 1024) return 'warning';
  return 'healthy';
}

function countLocalLogLines(filePath) {
  try {
    if (!fs.existsSync(filePath)) return 0;
    const content = fs.readFileSync(filePath, 'utf8').trim();
    return content ? content.split('\n').length : 0;
  } catch {
    return 0;
  }
}

function getLocalDirStats(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return { files: 0, records: 0, sizeBytes: 0 };
    return fs.readdirSync(dirPath)
      .filter(name => name.endsWith('.json'))
      .reduce((acc, name) => {
        const filePath = path.join(dirPath, name);
        acc.files += 1;
        acc.sizeBytes += getLocalFileSize(filePath);
        try {
          const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (Array.isArray(parsed)) acc.records += parsed.length;
        } catch {}
        return acc;
      }, { files: 0, records: 0, sizeBytes: 0 });
  } catch {
    return { files: 0, records: 0, sizeBytes: 0 };
  }
}

async function markReportReviewed(reportId, status, adminNote = '') {
  if (!reportId) return null;
  const reports = await loadReportsStore();
  const idx = reports.findIndex(r => String(r.id) === String(reportId));
  if (idx === -1) return null;
  reports[idx] = {
    ...reports[idx],
    status,
    adminNote: adminNote || reports[idx].adminNote || '',
    reviewedAt: new Date().toISOString(),
  };
  if (status === 'resolved' && !reports[idx].resolvedAt) reports[idx].resolvedAt = reports[idx].reviewedAt;
  await saveReportsStore(reports);
  return reports[idx];
}

async function buildReviewItemSnapshotFromId(reviewItemId, fallback = {}) {
  if (fallback && fallback.id === reviewItemId && (fallback.songTitle || fallback.signalSummary || fallback.currentValue !== undefined)) return fallback;
  if (reviewItemId.startsWith('report:')) {
    const reportId = reviewItemId.slice('report:'.length);
    const reports = await loadReportsStore();
    const report = reports.find(r => String(r.id) === String(reportId));
    if (!report) return { id: reviewItemId, sourceType: 'report', sourceId: reportId, itemType: 'report' };
    const itemType = report.issueType === 'suggest_new_brand'
      ? 'suggest_new_brand'
      : (report.issueType === 'suggest_song' || report.issueType === 'missing_song' ? 'suggest_song' : 'report');
    return {
      id: reviewItemId,
      sourceType: 'report',
      sourceId: report.id,
      itemType,
      songId: report.songId,
      songTitle: report.songTitle || report.songSnapshot?.title || '',
      artist: report.artist || report.songSnapshot?.artist || '',
      brandId: report.brandId,
      currentValue: null,
      suggestedValue: report.issueType,
      signalSummary: {
        issueType: report.issueType,
        songCode: report.songCode || '',
        note: report.note || '',
        brandName: report.brandName || '',
        shortName: report.shortName || '',
      },
      createdAt: report.timestamp,
      updatedAt: report.reviewedAt || report.timestamp,
    };
  }

  const votePrefixes = [
    ['availability_vote:', 'availability_vote', 'availability'],
    ['guided_vote:', 'guided_vote', 'guided'],
    ['mv_vote:', 'mv_vote', 'mv'],
  ];
  const match = votePrefixes.find(([prefix]) => reviewItemId.startsWith(prefix));
  if (!match) return { ...fallback, id: reviewItemId };

  const [prefix, sourceType, itemType] = match;
  const key = reviewItemId.slice(prefix.length);
  const { songId, brandId } = await parseVoteKeyDynamic(key);
  const song = await getAdminSongById(songId);
  const brandData = song?.brands?.[brandId] || null;
  return {
    id: reviewItemId,
    sourceType,
    sourceId: key,
    itemType,
    songId,
    brandId,
    songTitle: song?.title || songId,
    artist: song?.artist || '',
    currentValue: itemType === 'availability'
      ? (brandData?.available ?? null)
      : (itemType === 'guided' ? (brandData?.audioType || 'unknown') : (brandData?.mvType || 'unknown')),
    signalSummary: fallback.signalSummary || {},
  };
}

app.post('/api/admin/review-queue/:reviewItemId/resolve', requireSession, async (req, res) => {
  const permissions = req.admin?.permissions || [];
  const { reviewItemId } = req.params;
  const { decision = 'adopt', action = '', reason = '', payload = {}, snapshot: requestSnapshot = {} } = req.body || {};
  const cleanDecision = String(decision || '').trim();
  const cleanAction = String(action || '').trim();
  const cleanReason = String(reason || '').trim();

  if (!['adopt', 'reject'].includes(cleanDecision)) {
    return res.status(400).json({ error: 'Invalid decision' });
  }
  if (cleanDecision === 'reject' && cleanReason.length < 4) {
    return res.status(400).json({ error: '駁回原因至少需要 4 個字' });
  }

  const actions = await loadReviewActionsStore();
  const existing = actions.find(a => String(a.reviewItemId) === String(reviewItemId) && (a.status === 'adopted' || a.status === 'rejected'));
  if (existing) return res.status(409).json({ error: '此項目已被處理', action: existing });

  const snapshot = await buildReviewItemSnapshotFromId(reviewItemId, requestSnapshot);
  const sourceType = snapshot.sourceType || payload.sourceType || '';
  const sourceId = snapshot.sourceId || payload.sourceId || '';
  const itemType = snapshot.itemType || payload.itemType || '';
  const songId = payload.songId || snapshot.songId;
  const brandId = payload.brandId || snapshot.brandId;
  const now = new Date().toISOString();

  const allowedByAction = {
    set_available: ['brand.update', 'reports.review'],
    set_unavailable: ['brand.update', 'reports.review'],
    set_guided_vocal: ['brand.update', 'reports.review'],
    set_backing_track: ['brand.update', 'reports.review'],
    set_official_mv: ['mv.update', 'brand.update'],
    set_reedited_mv: ['mv.update', 'brand.update'],
    create_brand: ['brands.manage'],
    resolve_report: ['reports.review'],
    reject: ['reports.review', 'brand.update', 'mv.update', 'brands.manage'],
  };
  const required = cleanDecision === 'reject' ? allowedByAction.reject : (allowedByAction[cleanAction] || []);
  if (!required.length) return res.status(400).json({ error: 'Invalid action' });
  if (!hasAnyPermission(permissions, required)) return res.status(403).json({ error: '缺少審核處理權限' });

  const updated = {};
  try {
    if (cleanDecision === 'reject') {
      if (sourceType === 'report' && sourceId) {
        updated.report = await markReportReviewed(sourceId, 'rejected', cleanReason);
      }
    } else if (cleanAction === 'set_available' || cleanAction === 'set_unavailable') {
      const result = await updateSongBrandStatus({
        songId,
        brandId,
        available: cleanAction === 'set_available',
        note: payload.note || cleanReason,
      });
      updated.songId = result.song.id;
      updated.brandId = brandId;
      updated.after = result.after;
      if (sourceType === 'report' && sourceId) updated.report = await markReportReviewed(sourceId, 'resolved', cleanReason);
    } else if (cleanAction === 'set_guided_vocal' || cleanAction === 'set_backing_track') {
      const audioType = cleanAction === 'set_guided_vocal' ? 'guided_vocal' : 'backing_track';
      const result = await updateSongBrandStatus({
        songId,
        brandId,
        available: true,
        audioType,
        note: payload.note || cleanReason,
      });
      updated.songId = result.song.id;
      updated.brandId = brandId;
      updated.after = result.after;
    } else if (cleanAction === 'set_official_mv' || cleanAction === 'set_reedited_mv') {
      const mvType = cleanAction === 'set_official_mv' ? 'official_mv' : 'reedited_mv';
      const result = await updateSongBrandMvType({
        songId,
        brandId,
        mvType,
        note: payload.note || cleanReason,
      });
      updated.songId = result.song.id;
      updated.brandId = brandId;
      updated.after = result.after;
    } else if (cleanAction === 'create_brand') {
      const reportId = sourceType === 'report' ? sourceId : payload.reportId;
      const result = await createBrandFromReportRecord({ reportId, body: payload.brand || payload });
      updated.brandIdCreated = result.brand.id;
      updated.brand = result.brand;
      updated.report = result.report;
    } else if (cleanAction === 'resolve_report') {
      updated.report = await markReportReviewed(sourceId || payload.reportId, 'resolved', cleanReason);
    }

    const record = createReviewActionRecord({
      reviewItemId,
      sourceType,
      sourceId,
      itemType,
      status: cleanDecision === 'reject' ? 'rejected' : 'adopted',
      action: cleanDecision === 'reject' ? 'reject' : cleanAction,
      reason: cleanReason,
      snapshot,
      req,
      now,
    });
    actions.push(record);
    await saveReviewActionsStore(actions);
    logAdminAction('RESOLVE_REVIEW_QUEUE_ITEM', { ...record, updated }, req);
    res.json({ success: true, reviewItemId, decision: cleanDecision, action: record.action, reviewAction: record, updated });
  } catch (err) {
    console.error('[Admin Review Resolve Error]', err);
    res.status(err.statusCode || 503).json({ error: err.message || '審核處理失敗' });
  }
});

app.get('/api/admin/review-actions', requireSession, async (req, res) => {
  const permissions = req.admin?.permissions || [];
  if (!permissions.includes('reports.view') && !permissions.includes('votes.view')) {
    return res.status(403).json({ error: '缺少審核紀錄查看權限' });
  }

  const status = String(req.query.status || '').trim();
  const limit = Math.min(300, Math.max(10, Number.parseInt(String(req.query.limit || '120'), 10) || 120));
  const actions = await loadReviewActionsStore();
  const filtered = status ? actions.filter(a => a.status === status) : actions;
  filtered.sort((a, b) => String(b.reviewedAt || '').localeCompare(String(a.reviewedAt || '')));
  res.json({ total: filtered.length, actions: filtered.slice(0, limit) });
});

app.post('/api/admin/review-queue/:reviewItemId/adopt', requireSession, async (req, res) => {
  const permissions = req.admin?.permissions || [];
  if (!permissions.includes('reports.review') && !permissions.includes('brand.update') && !permissions.includes('mv.update') && !permissions.includes('brands.manage')) {
    return res.status(403).json({ error: '缺少採納審核資料權限' });
  }

  const { reviewItemId } = req.params;
  const { sourceType, sourceId, itemType, action, reason = '', snapshot = {} } = req.body || {};
  const actions = await loadReviewActionsStore();
  const now = new Date().toISOString();
  const record = {
    id: `rva_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    reviewItemId,
    sourceType: String(sourceType || snapshot.sourceType || ''),
    sourceId: String(sourceId || snapshot.sourceId || ''),
    itemType: String(itemType || snapshot.itemType || ''),
    status: 'adopted',
    action: String(action || 'adopt'),
    reason: String(reason || '').trim(),
    snapshot,
    adminId: req.admin?.id || 'unknown',
    adminName: req.admin?.displayName || req.admin?.username || 'unknown',
    reviewedAt: now,
  };
  actions.push(record);
  await saveReviewActionsStore(actions);
  logAdminAction('ADOPT_REVIEW_QUEUE_ITEM', record, req);
  res.json({ success: true, action: record });
});

app.post('/api/admin/review-queue/:reviewItemId/reject', requireSession, async (req, res) => {
  const permissions = req.admin?.permissions || [];
  if (!permissions.includes('reports.review') && !permissions.includes('brand.update') && !permissions.includes('mv.update') && !permissions.includes('brands.manage')) {
    return res.status(403).json({ error: '缺少駁回審核資料權限' });
  }

  const { reviewItemId } = req.params;
  const { sourceType, sourceId, itemType, reason, snapshot = {} } = req.body || {};
  const cleanReason = String(reason || '').trim();
  if (cleanReason.length < 4) return res.status(400).json({ error: '請填寫至少 4 字的駁回原因' });

  const actions = await loadReviewActionsStore();
  const now = new Date().toISOString();
  const record = {
    id: `rvr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    reviewItemId,
    sourceType: String(sourceType || snapshot.sourceType || ''),
    sourceId: String(sourceId || snapshot.sourceId || ''),
    itemType: String(itemType || snapshot.itemType || ''),
    status: 'rejected',
    action: 'reject',
    reason: cleanReason,
    snapshot,
    adminId: req.admin?.id || 'unknown',
    adminName: req.admin?.displayName || req.admin?.username || 'unknown',
    reviewedAt: now,
  };
  actions.push(record);
  await saveReviewActionsStore(actions);
  if (record.sourceType === 'report' && record.sourceId) {
    const reports = await loadReportsStore();
    const idx = reports.findIndex(r => String(r.id) === String(record.sourceId));
    if (idx !== -1 && reports[idx].status === 'pending') {
      reports[idx] = {
        ...reports[idx],
        status: 'rejected',
        adminNote: cleanReason,
        reviewedAt: now,
      };
      await saveReportsStore(reports);
    }
  }
  logAdminAction('REJECT_REVIEW_QUEUE_ITEM', record, req);
  res.json({ success: true, action: record });
});

app.get('/api/admin/disputed', requirePermission('votes.view'), async (req, res) => {
  const votes = await loadVotesStore();
  const handledReviewItemIds = await loadHandledReviewItemIds();
  const minVotes = parseInt(req.query.minVotes) || 3;

  const disputed = [];
  for (const [key, data] of Object.entries(votes)) {
    if (handledReviewItemIds.has(`availability_vote:${key}`)) continue;
    const total = (data.confirm || 0) + (data.deny || 0);
    if (total < minVotes) continue;

    const confidence = getVoteConfidence(data.confirm || 0, data.deny || 0);
    if (confidence === 'disputed' || confidence === 'uncertain') {
      const { songId, brandId } = await parseVoteKeyDynamic(key);
      const song = await getAdminSongById(songId);
      const currentStatus = song?.brands?.[brandId]?.available ?? null;
      const suggestedAvailability = (data.confirm || 0) >= (data.deny || 0);
      if (currentStatus === suggestedAvailability) continue;
      disputed.push({
        key, songId, brandId,
        songTitle: song?.title || songId,
        artist: song?.artist || '',
        currentStatus,
        confirm: data.confirm || 0,
        deny: data.deny || 0,
        confidence,
        total,
      });
    }
  }

  disputed.sort((a, b) => b.deny - a.deny);
  res.json({ total: disputed.length, disputed });
});

// ── 查看高度確認歌曲 ──
app.get('/api/admin/verified', requirePermission('votes.view'), async (req, res) => {
  const votes = await loadVotesStore();
  const handledReviewItemIds = await loadHandledReviewItemIds();
  const verified = [];

  for (const [key, data] of Object.entries(votes)) {
    if (handledReviewItemIds.has(`availability_vote:${key}`)) continue;
    if (getVoteConfidence(data.confirm || 0, data.deny || 0) !== 'verified') continue;
    const { songId, brandId } = await parseVoteKeyDynamic(key);
    const song = await getAdminSongById(songId);
    const currentStatus = song?.brands?.[brandId]?.available ?? null;
    if (currentStatus === true) continue;
    verified.push({
      key, songId, brandId,
      songTitle: song?.title || songId,
      artist: song?.artist || '',
      currentStatus,
      confirm: data.confirm || 0,
      deny: data.deny || 0,
    });
  }
  verified.sort((a, b) => b.confirm - a.confirm);
  res.json({ total: verified.length, verified });
});

// ── 查看導唱投票 ──
app.get('/api/admin/guided-votes', requirePermission('votes.view'), async (req, res) => {
  const votes = await loadVotesStore();
  const handledReviewItemIds = await loadHandledReviewItemIds();
  const guidedVotes = [];

  for (const [key, data] of Object.entries(votes)) {
    if (handledReviewItemIds.has(`guided_vote:${key}`)) continue;
    const guided = data.guidedVocal || 0;
    const noGuided = data.noGuidedVocal || 0;
    const total = guided + noGuided;
    if (!total) continue;

    const { songId, brandId } = await parseVoteKeyDynamic(key);
    const song = await getAdminSongById(songId);
    const brandData = song?.brands?.[brandId] || null;
    const currentType = brandData?.audioType || 'unknown';

    // 若資料已與投票共識一致，代表已完成審核/採納，自動從待審清單隱藏
    if (guided > noGuided && currentType === 'guided_vocal') continue;
    if (noGuided > guided && currentType === 'backing_track') continue;

    guidedVotes.push({
      key,
      songId,
      brandId,
      songTitle: song?.title || songId,
      artist: song?.artist || '',
      currentAudioType: currentType,
      guided,
      noGuided,
      guidedPct: Math.round((guided / total) * 100),
      total,
    });
  }

  guidedVotes.sort((a, b) => (b.total - a.total) || (b.guided - a.guided));
  res.json({ total: guidedVotes.length, guidedVotes });
});

// ── 查看 MV 投票 ──
app.get('/api/admin/mv-votes', requirePermission('votes.view'), async (req, res) => {
  const votes = await loadVotesStore();
  const handledReviewItemIds = await loadHandledReviewItemIds();
  const mvVotes = [];
  const minTotal = req.query.minTotal !== undefined
    ? Math.max(1, parseInt(req.query.minTotal) || 1)
    : 3;
  const filterType = String(req.query.type || 'all').toLowerCase();
  const limit = Math.min(200, Math.max(5, parseInt(req.query.limit) || 50));

  for (const [key, data] of Object.entries(votes)) {
    if (handledReviewItemIds.has(`mv_vote:${key}`)) continue;
    const official = data.officialMv || 0;
    const edited = data.editedMv || 0;
    const total = official + edited;
    if (total < minTotal) continue;

    if (filterType === 'official' && official <= edited) continue;
    if (filterType === 'edited' && edited <= official) continue;

    const { songId, brandId } = await parseVoteKeyDynamic(key);
    const song = await getAdminSongById(songId);
    const brandData = song?.brands?.[brandId] || null;
    const currentMvType = brandData?.mvType || 'unknown';

    // 若資料已與投票共識一致，代表已完成審核/採納，自動從待審清單隱藏
    if (official > edited && currentMvType === 'official_mv') continue;
    if (edited > official && currentMvType === 'reedited_mv') continue;

    mvVotes.push({
      key,
      songId,
      brandId,
      songTitle: song?.title || songId,
      artist: song?.artist || '',
      currentAvailable: brandData?.available ?? false,
      currentMvType,
      official,
      edited,
      officialPct: Math.round((official / total) * 100),
      total,
      isLowSample: total < 3,
    });
  }

  mvVotes.sort((a, b) => (b.total - a.total) || (b.official - a.official));
  res.json({ total: mvVotes.length, mvVotes: mvVotes.slice(0, limit) });
});

async function createEmptyBrandStatuses() {
  const activeBrands = await getActiveBrands();
  const acc = {};
  for (const b of activeBrands) {
    if (b && b.id) {
      acc[b.id] = { available: false };
    }
  }
  return acc;
}

async function normalizeAdminSongPayload(body, existingSong = null) {
  const validLanguages = ['國語', '台語', '粵語', '英語', '日語', '韓語', '陸歌', '客語', '兒歌', '原住民語', '藏語', 'MV', '樂'];
  const validAudioTypes = ['original_vocal', 'guided_vocal', 'backing_track'];
  const validMvTypes = ['official_mv', 'live_mv', 'reedited_mv', 'anime_mv'];

  const title = String(body.title || '').trim();
  const artist = String(body.artist || '').trim();
  if (!title) throw new Error('請填寫歌名');
  if (!artist) throw new Error('請填寫歌手');

  const language = String(body.language || existingSong?.language || '國語').trim();
  if (!validLanguages.includes(language)) throw new Error('歌曲語言不正確');

  const defaultEmptyBrands = await createEmptyBrandStatuses();
  const brands = {
    ...defaultEmptyBrands,
    ...(existingSong?.brands || {}),
  };

  if (body.brands && typeof body.brands === 'object') {
    for (const brandId of Object.keys(body.brands)) {
      const isKnown = await brandExists(brandId, { activeOnly: false });
      if (!isKnown) continue;

      const incoming = body.brands[brandId];
      if (!incoming || typeof incoming !== 'object') continue;
      const status = {
        ...(brands[brandId] || { available: false }),
        available: Boolean(incoming.available),
      };

      const code = String(incoming.code || '').trim();
      if (code) status.code = code;
      else delete status.code;

      if (validAudioTypes.includes(incoming.audioType)) status.audioType = incoming.audioType;
      else delete status.audioType;

      if (validMvTypes.includes(incoming.mvType)) status.mvType = incoming.mvType;
      else delete status.mvType;

      const note = String(incoming.note || '').trim();
      if (note) status.note = note;
      else delete status.note;

      brands[brandId] = status;
    }
  }

  return {
    ...(existingSong || {}),
    id: existingSong?.id || String(body.id || `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).trim(),
    title,
    artist,
    lyricist: String(body.lyricist || '').trim(),
    composer: String(body.composer || '').trim(),
    language,
    zhuyin: String(body.zhuyin || existingSong?.zhuyin || 'AUTO').trim() || 'AUTO',
    pinyin: String(body.pinyin || existingSong?.pinyin || 'AUTO').trim() || 'AUTO',
    releaseYear: Number.parseInt(String(body.releaseYear || existingSong?.releaseYear || new Date().getFullYear()), 10) || new Date().getFullYear(),
    popularRank: body.popularRank ? Number.parseInt(String(body.popularRank), 10) : existingSong?.popularRank,
    lyricsSnippet: String(body.lyricsSnippet || '').trim(),
    youtubeUrl: String(body.youtubeUrl || '').trim() || undefined,
    isMainlandViral: Boolean(body.isMainlandViral),
    isNiche: Boolean(body.isNiche),
    brands,
  };
}

// ── 查詢歌曲列表 ──
app.get('/api/admin/songs', requirePermission('songs.view'), (req, res) => {
  const { query = '', language = '', page = 1, limit = 50, sort = 'relevance_len_asc' } = req.query;
  const q = String(query).trim().toLowerCase();
  const selectedLanguage = String(language).trim();
  const sortMode = String(sort).trim();
  let results = songsDatabase;

  const aliasExpansion = q ? expandArtistQuery(q) : { matchedArtists: [], expandedTerms: [] };
  const matchedArtists = new Set(aliasExpansion.matchedArtists.map(a => a.toLowerCase()));
  const expandedTerms = aliasExpansion.expandedTerms;

  if (q) {
    results = results.filter(song => {
      const art = String(song.artist || '').toLowerCase();
      if (matchedArtists.has(art)) return true;

      const title = String(song.title || '').toLowerCase();
      const idStr = String(song.id || '').toLowerCase();
      const pinyin = String(song.pinyin || '').toLowerCase();
      const zhuyin = String(song.zhuyin || '').toLowerCase();

      return expandedTerms.some(term => (
        idStr.includes(term) ||
        title.includes(term) ||
        art.includes(term) ||
        pinyin.includes(term) ||
        zhuyin.includes(term)
      ));
    });
  }

  if (selectedLanguage) {
    results = results.filter(song => song.language === selectedLanguage);
  }

  results = [...results].sort((a, b) => {
    const titleA = String(a.title || '');
    const titleB = String(b.title || '');

    if (sortMode === 'title_len_asc') {
      if (titleA.length !== titleB.length) return titleA.length - titleB.length;
      return titleA.localeCompare(titleB, 'zh-TW');
    }
    if (sortMode === 'title_len_desc') {
      if (titleA.length !== titleB.length) return titleB.length - titleA.length;
      return titleA.localeCompare(titleB, 'zh-TW');
    }
    if (sortMode === 'release_year_desc') {
      return (Number(b.releaseYear) || 0) - (Number(a.releaseYear) || 0);
    }
    if (sortMode === 'brands_desc') {
      const brandsA = Object.values(a.brands || {}).filter(s => s?.available).length;
      const brandsB = Object.values(b.brands || {}).filter(s => s?.available).length;
      return brandsB - brandsA;
    }

    if (q) {
      const getRelevance = (s) => {
        const t = String(s.title || '').toLowerCase();
        const art = String(s.artist || '').toLowerCase();
        const idStr = String(s.id || '').toLowerCase();

        if (matchedArtists.has(art)) return 1;
        if (t === q || art === q || idStr === q) return 1;
        if (t.startsWith(q) || art.startsWith(q)) return 2;
        return 3;
      };

      const relA = getRelevance(a);
      const relB = getRelevance(b);
      if (relA !== relB) return relA - relB;
    }

    if (titleA.length !== titleB.length) return titleA.length - titleB.length;
    return titleA.localeCompare(titleB, 'zh-TW');
  });

  const pageNum = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const limitNum = Math.min(500, Math.max(5, Number.parseInt(String(limit), 10) || 50));
  const total = results.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const validPage = Math.min(pageNum, totalPages);
  const start = (validPage - 1) * limitNum;

  res.json({
    total,
    page: validPage,
    limit: limitNum,
    totalPages,
    songs: results.slice(start, start + limitNum),
  });
});

// ── 歌手別名字典管理 API ──
app.get('/api/admin/aliases', requirePermission('aliases.view'), (req, res) => {
  res.json({ aliases: loadArtistAliases() });
});

app.post('/api/admin/alias', requirePermission('aliases.manage'), async (req, res) => {
  try {
    const { artist, aliases } = req.body;
    if (!artist) return res.status(400).json({ error: '缺少歌手名稱' });

    const currentOverrides = await loadArtistAliasesOverridesStore();
    const normalizedArtist = String(artist).trim();
    const aliasArr = Array.from(new Set(normalizeAliasArray(aliases)));
    currentOverrides[normalizedArtist] = aliasArr;

    await saveArtistAliasesOverridesStore(currentOverrides);
    applyArtistAliasesOverrides(currentOverrides);
    logAdminAction('UPDATE_ARTIST_ALIAS', { artist: normalizedArtist, aliases: aliasArr }, req);
    res.json({ success: true, artist: normalizedArtist, aliases: aliasArr });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/alias/:artistName', requirePermission('aliases.manage'), async (req, res) => {
  try {
    const artist = decodeURIComponent(req.params.artistName).trim();
    const currentOverrides = await loadArtistAliasesOverridesStore();
    delete currentOverrides[artist];

    await saveArtistAliasesOverridesStore(currentOverrides);
    applyArtistAliasesOverrides(currentOverrides);
    logAdminAction('DELETE_ARTIST_ALIAS', { artist }, req);
    res.json({ success: true, artist });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/alias/test', requirePermission('aliases.view'), (req, res) => {
  const q = String(req.query.q || '').trim();
  const resolution = expandArtistQuery(q);
  res.json(resolution);
});

app.get('/api/admin/song/:songId', requirePermission('songs.view'), async (req, res) => {
  const song = songsDatabase.find(s => s.id === req.params.songId) || await loadCatalogOverrideSong(req.params.songId);
  if (!song) return res.status(404).json({ error: '找不到歌曲' });
  res.json({ song });
});

app.post('/api/admin/song', requirePermission('songs.create'), async (req, res) => {
  try {
    const song = await normalizeAdminSongPayload(req.body);
    if (songsDatabase.some(item => item.id === song.id)) {
      return res.status(409).json({ error: '歌曲 ID 已存在' });
    }
    songsDatabase.push(song);
    await saveCatalogOverrideSong(song);
    logAdminAction('CREATE_SONG', { songId: song.id, title: song.title, artist: song.artist }, req);
    res.json({ success: true, song });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/song/:songId', requirePermission('songs.update'), async (req, res) => {
  try {
    const idx = songsDatabase.findIndex(s => s.id === req.params.songId);
    if (idx === -1) {
      const before = await loadCatalogOverrideSong(req.params.songId);
      const song = await normalizeAdminSongPayload(req.body, before);
      song.id = before?.id || req.params.songId;
      songsDatabase.push(song);
      await persistCatalogMutation(song);
      logAdminAction('UPDATE_SONG', {
        songId: song.id,
        before: before ? { title: before.title, artist: before.artist } : null,
        after: { title: song.title, artist: song.artist },
      }, req);
      return res.json({ success: true, song });
    }
    const before = songsDatabase[idx];
    const song = await normalizeAdminSongPayload(req.body, before);
    song.id = before.id;
    songsDatabase[idx] = song;
    await saveCatalogOverrideSong(song);
    logAdminAction('UPDATE_SONG', {
      songId: song.id,
      before: { title: before.title, artist: before.artist },
      after: { title: song.title, artist: song.artist },
    }, req);
    res.json({ success: true, song });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── 刪除歌曲 (高風險操作：理由必填) ──
app.delete('/api/admin/song/:songId', requirePermission('songs.delete'), async (req, res) => {
  const reason = String(req.body.reason || req.query.reason || '').trim();
  if (!reason || reason.length < 4) {
    return res.status(400).json({ error: '此高風險操作需要填寫操作理由（至少 4 個字）' });
  }

  const idx = songsDatabase.findIndex(s => s.id === req.params.songId);
  if (idx === -1) return res.status(404).json({ error: '找不到歌曲' });
  const [deleted] = songsDatabase.splice(idx, 1);
  try {
    await saveCatalogDeletedSong(deleted.id);
    logAdminAction('DELETE_SONG', {
      targetType: 'song',
      targetId: deleted.id,
      songId: deleted.id,
      title: deleted.title,
      artist: deleted.artist,
      before: { id: deleted.id, title: deleted.title, artist: deleted.artist, language: deleted.language },
      after: { deleted: true },
      reason,
    }, req);
    res.json({ success: true, deleted });
  } catch (err) {
    console.error('[Admin Song Delete Error]', err);
    res.status(503).json({ error: '歌曲刪除失敗，請稍後再試' });
  }
});

// ── 套用廠牌收錄狀態修正 ──
app.patch('/api/admin/song/:songId/brand', requirePermission('brand.update'), async (req, res) => {
  const { songId } = req.params;
  const { brandId, available, audioType, mvType, note } = req.body;

  if (!brandId || typeof available !== 'boolean') {
    return res.status(400).json({ error: '缺少必要欄位：brandId, available (boolean)' });
  }

  const isBrandValid = await brandExists(brandId, { activeOnly: false });
  if (!isBrandValid) {
    return res.status(400).json({ error: `無效或不存在的品牌 ID: "${brandId}"` });
  }

  const validAudioTypes = ['original_vocal', 'guided_vocal', 'backing_track', ''];
  const validMvTypes = ['official_mv', 'live_mv', 'reedited_mv', 'anime_mv', ''];
  if (audioType !== undefined && !validAudioTypes.includes(audioType)) {
    return res.status(400).json({ error: '音訊類型不正確' });
  }
  if (mvType !== undefined && !validMvTypes.includes(mvType)) {
    return res.status(400).json({ error: 'MV 類型不正確' });
  }

  let idx = songsDatabase.findIndex(s => s.id === songId);
  let song;
  if (idx === -1) {
    const existing = await getAdminSongById(songId);
    song = existing ? JSON.parse(JSON.stringify(existing)) : {
      id: songId,
      title: '未命名歌曲',
      artist: '未知歌手',
      language: '國語',
      brands: {},
    };
    songsDatabase.push(song);
    idx = songsDatabase.length - 1;
  } else {
    song = songsDatabase[idx];
  }
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
    await saveCatalogOverrideSong(song);
  } catch (err) {
    console.error('[Admin Catalog Override Save Error]', err);
    return res.status(503).json({ error: '歌庫修正暫時無法持久化儲存，請稍後再試' });
  }

  logAdminAction('FIX_BRAND_AVAILABILITY', {
    songId, songTitle: song.title, artist: song.artist,
    brandId, before, after: song.brands[brandId], note: note || '',
  }, req);

  res.json({
    success: true,
    songId, songTitle: song.title,
    brandId, available,
    before, after: song.brands[brandId],
  });
});

// ── 套用廠牌 MV 類型修正 ──
app.patch('/api/admin/song/:songId/brand/mv-type', requirePermission('mv.update'), async (req, res) => {
  const { songId } = req.params;
  const { brandId, mvType, note } = req.body;

  if (!brandId) {
    return res.status(400).json({ error: '缺少必要欄位：brandId' });
  }

  const isBrandValid = await brandExists(brandId, { activeOnly: false });
  if (!isBrandValid) {
    return res.status(400).json({ error: `無效或不存在的品牌 ID: "${brandId}"` });
  }

  const validMvTypes = ['official_mv', 'live_mv', 'reedited_mv', 'anime_mv', ''];
  if (mvType !== undefined && !validMvTypes.includes(mvType)) {
    return res.status(400).json({ error: 'MV 類型不正確' });
  }

  let idx = songsDatabase.findIndex(s => s.id === songId);
  let song;
  if (idx === -1) {
    const existing = await getAdminSongById(songId);
    song = existing ? JSON.parse(JSON.stringify(existing)) : {
      id: songId,
      title: '未命名歌曲',
      artist: '未知歌手',
      language: '國語',
      brands: {},
    };
    songsDatabase.push(song);
    idx = songsDatabase.length - 1;
  } else {
    song = songsDatabase[idx];
  }
  if (!song.brands) song.brands = {};
  const before = song.brands[brandId] ?? { available: false };

  const updatedBrandStatus = {
    ...before,
    mvType: mvType || undefined,
  };
  if (!mvType) delete updatedBrandStatus.mvType;

  song.brands[brandId] = updatedBrandStatus;
  songsDatabase[idx] = song;

  try {
    await saveCatalogOverrideSong(song);
  } catch (err) {
    console.error('[Admin Catalog Override Save Error]', err);
    return res.status(503).json({ error: 'MV 類型修正暫時無法持久化儲存，請稍後再試' });
  }

  logAdminAction('FIX_BRAND_MV_TYPE', {
    songId, songTitle: song.title, artist: song.artist,
    brandId, before: before.mvType || 'none', after: song.brands[brandId].mvType || 'none', note: note || '',
  }, req);

  res.json({
    success: true,
    songId, songTitle: song.title,
    brandId,
    before, after: song.brands[brandId],
  });
});

// ─────────────────────────────────────────────
// 品牌管理 API (Brand Management System Phase 1)
// ─────────────────────────────────────────────

// ── [公開] 前台取得 active 品牌清單 ──
app.get('/api/brands', async (req, res) => {
  try {
    const activeBrands = await getActiveBrands();
    res.json({
      brands: activeBrands,
      total: activeBrands.length,
    });
  } catch (err) {
    console.error('[Public Brands API Error]', err);
    res.status(500).json({ error: '品牌清單讀取失敗' });
  }
});

// ── [後台] 查看 active / inactive 全部品牌 ──
app.get('/api/admin/brands', requirePermission('brands.view'), async (req, res) => {
  try {
    const store = await loadBrandSettingsStore();
    const allBrands = Object.values(store.brands || {}).sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
    const activeCount = allBrands.filter(b => b.status === 'active').length;
    const inactiveCount = allBrands.filter(b => b.status === 'inactive').length;
    res.json({
      brands: allBrands,
      total: allBrands.length,
      activeCount,
      inactiveCount,
    });
  } catch (err) {
    console.error('[Admin Brands View Error]', err);
    res.status(500).json({ error: '品牌清單讀取失敗：' + err.message });
  }
});

// ── [後台] 新增品牌 ──
app.post('/api/admin/brand', requirePermission('brands.manage'), async (req, res) => {
  try {
    const { id, name, shortName, color, description, sortOrder, sourceReportId } = req.body || {};
    const rawName = String(name || '').trim();

    if (!rawName) {
      return res.status(400).json({ error: '請填寫品牌名稱' });
    }

    const store = await loadBrandSettingsStore();
    const providedId = String(id || '').trim().toLowerCase();
    const rawId = providedId || generateBrandId(store.brands || {});
    const rawShortName = String(shortName || '').trim() || rawName;

    if (!/^[a-z0-9_]{2,32}$/.test(rawId)) {
      return res.status(400).json({ error: '品牌 ID 格式不正確，請使用小寫英文、數字或底線' });
    }

    if (store.brands && store.brands[rawId]) {
      return res.status(400).json({ error: `品牌 ID "${rawId}" 已存在，請使用其他 ID` });
    }

    const rawColor = String(color || '').trim();
    const brandColor = isValidBrandColor(rawColor) ? rawColor : '#38bdf8';
    const brandBadgeBg = buildBadgeBg(brandColor);
    const existingOrders = Object.values(store.brands || {}).map(b => Number(b.sortOrder) || 0);
    const maxSortOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : 0;
    const finalSortOrder = Number.isInteger(Number(sortOrder)) ? Number(sortOrder) : maxSortOrder + 1;

    const newBrand = {
      id: rawId,
      name: rawName,
      shortName: rawShortName,
      color: brandColor,
      badgeBg: brandBadgeBg,
      description: String(description || '').trim(),
      status: 'active',
      sortOrder: finalSortOrder,
      source: sourceReportId ? 'suggestion' : 'admin',
      sourceReportId: sourceReportId ? String(sourceReportId) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!store.brands) store.brands = {};
    store.brands[rawId] = newBrand;
    await saveBrandSettingsStore(store, { requirePersistent: true });

    logAdminAction('CREATE_BRAND', { brandId: rawId, name: rawName, shortName: rawShortName }, req);
    res.status(201).json({ success: true, brand: newBrand });
  } catch (err) {
    console.error('[Admin Create Brand Error]', err);
    const statusCode = err.message.includes('無法持久化儲存') ? 503 : 500;
    res.status(statusCode).json({ error: '新增品牌失敗：' + err.message });
  }
});

// ── [後台] 編輯品牌 ──
app.put('/api/admin/brand/:brandId', requirePermission('brands.manage'), async (req, res) => {
  try {
    const { brandId } = req.params;
    const store = await loadBrandSettingsStore();
    if (!store.brands || !store.brands[brandId]) {
      return res.status(404).json({ error: `找不到品牌 ID: ${brandId}` });
    }

    const existingBrand = store.brands[brandId];
    const { name, shortName, color, description, sortOrder, status } = req.body || {};

    const nextName = name !== undefined ? String(name).trim() : existingBrand.name;
    if (!nextName) return res.status(400).json({ error: '品牌名稱不可空白' });

    let nextShortName = existingBrand.shortName;
    if (shortName !== undefined) {
      const trimmed = String(shortName).trim();
      nextShortName = trimmed || nextName;
    }

    const rawNextColor = color !== undefined ? String(color).trim() : existingBrand.color;
    const nextColor = isValidBrandColor(rawNextColor) ? rawNextColor : existingBrand.color;
    const nextBadgeBg = buildBadgeBg(nextColor);

    const updatedBrand = {
      ...existingBrand,
      name: nextName,
      shortName: nextShortName,
      color: nextColor,
      badgeBg: nextBadgeBg,
      description: description !== undefined ? String(description).trim() : existingBrand.description,
      sortOrder: Number.isInteger(Number(sortOrder)) ? Number(sortOrder) : existingBrand.sortOrder,
      status: (status === 'active' || status === 'inactive') ? status : existingBrand.status,
      updatedAt: new Date().toISOString(),
    };

    store.brands[brandId] = updatedBrand;
    await saveBrandSettingsStore(store, { requirePersistent: true });

    logAdminAction('UPDATE_BRAND', { brandId, before: existingBrand, after: updatedBrand }, req);
    res.json({ success: true, brand: updatedBrand });
  } catch (err) {
    console.error('[Admin Update Brand Error]', err);
    const statusCode = err.message.includes('無法持久化儲存') ? 503 : 500;
    res.status(statusCode).json({ error: '編輯品牌失敗：' + err.message });
  }
});

// ── [後台] 停用/啟用品牌 ──
app.patch('/api/admin/brand/:brandId/status', requirePermission('brands.manage'), async (req, res) => {
  try {
    const { brandId } = req.params;
    const { status } = req.body || {};
    if (status !== 'active' && status !== 'inactive') {
      return res.status(400).json({ error: '狀態必須為 "active" 或 "inactive"' });
    }

    const store = await loadBrandSettingsStore();
    if (!store.brands || !store.brands[brandId]) {
      return res.status(404).json({ error: `找不到品牌 ID: ${brandId}` });
    }

    const brand = store.brands[brandId];
    const prevStatus = brand.status;
    brand.status = status;
    brand.updatedAt = new Date().toISOString();

    store.brands[brandId] = brand;
    await saveBrandSettingsStore(store, { requirePersistent: true });

    logAdminAction('TOGGLE_BRAND_STATUS', { brandId, prevStatus, nextStatus: status }, req);
    res.json({ success: true, brand });
  } catch (err) {
    console.error('[Admin Toggle Brand Status Error]', err);
    const statusCode = err.message.includes('無法持久化儲存') ? 503 : 500;
    res.status(statusCode).json({ error: '更新品牌狀態失敗：' + err.message });
  }
});

// ── [後台] 從 suggest_new_brand 回報套用成正式品牌 ──
app.post('/api/admin/brand/from-report/:reportId', requirePermission('brands.manage'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const reports = await loadReportsStore();
    const reportIndex = reports.findIndex(r => String(r.id) === String(reportId));

    if (reportIndex === -1) {
      return res.status(404).json({ error: `找不到 ID 為 "${reportId}" 的回報` });
    }

    const report = reports[reportIndex];
    if (report.issueType !== 'suggest_new_brand') {
      return res.status(400).json({ error: '此回報類型非「建議新廠牌 (suggest_new_brand)」' });
    }

    const rawId = String(req.body.id || report.shortName || report.brandName || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const finalId = rawId && /^[a-z0-9_]{2,32}$/.test(rawId) ? rawId : `brand_${Date.now()}`;
    const name = String(req.body.name || report.brandName || report.brand || '').trim();
    const shortName = String(req.body.shortName || report.shortName || report.brand || '').trim();

    if (!name || !shortName) {
      return res.status(400).json({ error: '無法從回報自動提取有效品牌名稱/簡稱，請於 Request Body 提供' });
    }

    const store = await loadBrandSettingsStore();
    if (store.brands && store.brands[finalId]) {
      return res.status(400).json({ error: `品牌 ID "${finalId}" 已存在` });
    }

    const existingOrders = Object.values(store.brands || {}).map(b => Number(b.sortOrder) || 0);
    const maxSortOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : 0;

    const newBrand = {
      id: finalId,
      name,
      shortName,
      color: isValidBrandColor(String(req.body.color || '').trim()) ? String(req.body.color).trim() : '#38bdf8',
      badgeBg: buildBadgeBg(isValidBrandColor(String(req.body.color || '').trim()) ? String(req.body.color).trim() : '#38bdf8'),
      description: String(req.body.description || report.note || report.description || '').trim(),
      status: 'active',
      sortOrder: maxSortOrder + 1,
      source: 'suggestion',
      sourceReportId: String(report.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!store.brands) store.brands = {};
    store.brands[finalId] = newBrand;
    await saveBrandSettingsStore(store, { requirePersistent: true });

    // 將回報標記為 resolved
    reports[reportIndex] = {
      ...report,
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      resolutionNote: `已於 ${new Date().toISOString().slice(0,10)} 轉換為正式品牌 (ID: ${finalId})`,
    };
    await saveReportsStore(reports);

    logAdminAction('CREATE_BRAND_FROM_REPORT', { reportId, brandId: finalId, name }, req);
    res.status(201).json({
      success: true,
      brand: newBrand,
      report: reports[reportIndex],
    });
  } catch (err) {
    console.error('[Admin Brand From Report Error]', err);
    const statusCode = err.message.includes('無法持久化儲存') ? 503 : 500;
    res.status(statusCode).json({ error: '從回報建立品牌失敗：' + err.message });
  }
});

async function buildAdminStatsSummary() {
  const reports = await loadReportsStore();
  const votes = await loadVotesStore();

  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;

  let disputedCount = 0, verifiedCount = 0, totalVoteEntries = 0;
  let guidedVotesCount = 0, mvVotesCount = 0;

  for (const [, data] of Object.entries(votes)) {
    totalVoteEntries++;
    const conf = getVoteConfidence(data.confirm || 0, data.deny || 0);
    if (conf === 'disputed') disputedCount++;
    if (conf === 'verified') verifiedCount++;
    if ((data.guidedVocal || 0) + (data.noGuidedVocal || 0) > 0) guidedVotesCount++;
    if ((data.officialMv || 0) + (data.editedMv || 0) > 0) mvVotesCount++;
  }

  return {
    catalog: { total: songsDatabase.length },
    reports: { total: reports.length, pending: pendingReports, resolved: resolvedReports },
    votes: { totalEntries: totalVoteEntries, disputed: disputedCount, verified: verifiedCount, guided: guidedVotesCount, mv: mvVotesCount },
    storageMode: USE_REDIS ? 'redis' : 'local_json',
    storageLabel: USE_REDIS ? 'Upstash Redis persistent' : 'Local JSON snapshot',
  };
}

async function loadAdminStatsCached() {
  const now = Date.now();
  if (adminStatsCache && adminStatsCache.expiresAt > now) return { data: adminStatsCache.data, cache: 'hit' };
  const data = await buildAdminStatsSummary();
  adminStatsCache = { data, expiresAt: now + ADMIN_STATS_CACHE_TTL_MS };
  return { data, cache: 'miss' };
}

app.get('/api/admin/stats', requirePermission('dashboard.view'), async (req, res) => {
  const { data, cache } = await loadAdminStatsCached();
  res.json({ ...data, meta: { cache, ttlMs: ADMIN_STATS_CACHE_TTL_MS } });
});

app.get('/api/admin/logs', requirePermission('logs.view'), async (req, res) => {
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

// ── 系統容量配額與健康狀態 ──
app.get('/api/admin/quota-status', requirePermission('dashboard.view'), async (req, res) => {
  try {
    const dirPath = getBackupsDir(req);
    const stats = await getQuotaUsageStats(dirPath);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: '無法獲取容量狀態：' + err.message });
  }
});

app.get('/api/admin/data-growth-status', requirePermission('dashboard.view'), async (req, res) => {
  try {
    const reports = await loadReportsStore();
    const votes = await loadVotesStore();
    const votesArchive = await loadVotesArchiveStore();
    const reviewActions = await loadReviewActionsStore();
    const handledReviewActions = await loadReviewActionsHandledStateStore();
    const reportArchives = getLocalDirStats(REPORTS_ARCHIVE_DIR);
    const reviewActionArchives = getLocalDirStats(REVIEW_ACTIONS_ARCHIVE_DIR);
    const logBytes = getLocalFileSize(ADMIN_LOG_PATH);
    const logLines = countLocalLogLines(ADMIN_LOG_PATH);
    const reportStatusCounts = reports.reduce((acc, report) => {
      const status = report.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const voteEntries = Object.keys(votes || {}).length;
    const archivedVoteEntries = Object.keys(votesArchive || {}).length;
    const actionStatusCounts = reviewActions.reduce((acc, action) => {
      const status = action.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      generatedAt: new Date().toISOString(),
      stores: [
        {
          key: 'reports',
          label: '\u4f7f\u7528\u8005\u56de\u5831',
          count: reports.length,
          sizeBytes: getLocalFileSize(REPORTS_PATH) + reportArchives.sizeBytes,
          risk: classifyDataGrowth(reports.length, getLocalFileSize(REPORTS_PATH), Math.floor(REPORTS_ACTIVE_LIMIT * 0.8), REPORTS_ACTIVE_LIMIT),
          detail: { ...reportStatusCounts, activeLimit: REPORTS_ACTIVE_LIMIT, archivedFiles: reportArchives.files, archivedRecords: reportArchives.records },
          policy: `\u4e3b\u6a94\u4fdd\u7559 pending \u8207\u6700\u8fd1\u8655\u7406\u56de\u5831\uff0c\u4e0a\u9650 ${REPORTS_ACTIVE_LIMIT} \u7b46\uff1b\u8d85\u51fa\u5f8c\u5df2\u8655\u7406\u56de\u5831\u4f9d\u6708\u4efd\u5c01\u5b58\u3002`,
        },
        {
          key: 'votes',
          label: '\u7fa4\u773e\u6295\u7968\u8a0a\u865f',
          count: voteEntries,
          sizeBytes: getLocalFileSize(VOTES_PATH) + getLocalFileSize(VOTES_ARCHIVE_PATH),
          risk: classifyDataGrowth(voteEntries, getLocalFileSize(VOTES_PATH), 2000, 10000),
          detail: { activeEntries: voteEntries, archivedEntries: archivedVoteEntries },
          policy: '\u5df2\u7531\u5f8c\u53f0\u8655\u7406\u7684\u6295\u7968\u7dad\u5ea6\u6703\u8f49\u5165\u8f15\u91cf\u5c01\u5b58\u6458\u8981\uff1b\u4e3b\u6a94\u53ea\u4fdd\u7559\u4ecd\u53ef\u80fd\u5f71\u97ff\u524d\u53f0\u986f\u793a\u6216\u5f8c\u53f0\u5f85\u8655\u7406\u7684\u6295\u7968\u8a0a\u865f\u3002',
        },
        {
          key: 'review_actions',
          label: '\u5be9\u6838\u8655\u7406\u7d00\u9304',
          count: reviewActions.length,
          sizeBytes: getLocalFileSize(REVIEW_ACTIONS_PATH) + reviewActionArchives.sizeBytes,
          risk: classifyDataGrowth(reviewActions.length, getLocalFileSize(REVIEW_ACTIONS_PATH), Math.floor(REVIEW_ACTIONS_ACTIVE_LIMIT * 0.8), REVIEW_ACTIONS_ACTIVE_LIMIT),
          detail: { ...actionStatusCounts, activeLimit: REVIEW_ACTIONS_ACTIVE_LIMIT, handledIndexed: Object.keys(handledReviewActions || {}).length, archivedFiles: reviewActionArchives.files, archivedRecords: reviewActionArchives.records },
          policy: `\u4e3b\u6a94\u4fdd\u7559\u6700\u8fd1 ${REVIEW_ACTIONS_ACTIVE_LIMIT} \u7b46\u5b8c\u6574\u8655\u7406\u7d00\u9304\uff1b\u8d85\u51fa\u5f8c\u4f9d\u6708\u4efd\u5c01\u5b58\uff0c\u4e26\u4fdd\u7559\u5df2\u8655\u7406\u7d22\u5f15\u907f\u514d\u820a\u9805\u76ee\u56de\u5230\u5f85\u8655\u7406\u3002`,
        },
        {
          key: 'admin_logs',
          label: '管理操作日誌',
          count: logLines,
          sizeBytes: logBytes,
          risk: classifyDataGrowth(logLines, logBytes, Math.floor(ADMIN_LOG_MAX_LINES * 0.8), ADMIN_LOG_MAX_LINES),
          detail: { maxLocalLines: ADMIN_LOG_MAX_LINES, maxLocalBytes: ADMIN_LOG_MAX_BYTES, redisRetention: 500 },
          policy: `後台只顯示最近 100 筆；本機檔案超過 ${Math.round(ADMIN_LOG_MAX_BYTES / 1024)} KB 時自動保留最新 ${ADMIN_LOG_MAX_LINES} 行，Redis 保留最新 500 筆。`,
        },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: '無法獲取資料成長狀態：' + err.message });
  }
});

// ── 下載七日每日備份快照 ──
app.get('/api/admin/backup/snapshots/:name', requirePermission('backup.export'), async (req, res) => {
  const { name } = req.params;
  if (!/^backup_\d{4}-\d{2}-\d{2}\.json$/.test(name)) {
    return res.status(400).json({ error: '無效的備份檔名格式' });
  }

  try {
    const dirPath = getBackupsDir(req);
    const storeResult = await loadBackupSnapshotsStore(dirPath);
    const snap = storeResult.snapshots.find(s => s.name === name);

    if (snap && snap.payload) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
      return res.send(JSON.stringify(snap.payload, null, 2));
    }

    const localFilePath = path.join(dirPath, name);
    if (fs.existsSync(localFilePath)) {
      return res.download(localFilePath, name);
    }

    return res.status(404).json({ error: '找不到該備份快照檔案' });
  } catch (err) {
    console.error('[Admin Backup Download Error]', err);
    res.status(500).json({ error: '下載備份檔失敗：' + err.message });
  }
});

// ── 測試專用：建立/更新指定日期之每日快照（僅限 BACKUP_TEST_MODE=true 環境） ──
app.post('/api/admin/backup/test-upsert-daily', requirePermission('backup.export'), async (req, res) => {
  if (!isBackupTestModeEnabled()) {
    return res.status(404).json({ error: 'Not Found' });
  }

  const { date } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: '請提供合法的日期格式 (YYYY-MM-DD)' });
  }

  try {
    const dirPath = getBackupsDir(req);
    const result = await upsertDailyBackupSnapshot(date, dirPath);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: '測試建立快照失敗：' + err.message });
  }
});

// ── 匯出全站 JSON 備份包 ──
async function buildBackupExportPayload() {
  const overrides = await loadCatalogOverridesStore();
  const reports = await loadReportsStore();
  const votes = await loadVotesStore();
  const artistAliasesOverrides = await loadArtistAliasesOverridesStore();
  const brandSettings = await loadBrandSettingsStore();
  return {
    app: 'TW_KTV_CATALOG_SYSTEM',
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    data: { catalogOverrides: overrides, reports, votes, artistAliasesOverrides, brandSettings },
  };
}

function summarizeBackupExportPayload(payload) {
  const data = payload?.data || {};
  const counts = {
    catalogOverrides: Object.keys(data.catalogOverrides?.songs || {}).length,
    deletedSongs: Array.isArray(data.catalogOverrides?.deletedIds) ? data.catalogOverrides.deletedIds.length : 0,
    reports: Array.isArray(data.reports) ? data.reports.length : 0,
    votes: data.votes && typeof data.votes === 'object' ? Object.keys(data.votes).length : 0,
    artistAliasesOverrides: data.artistAliasesOverrides && typeof data.artistAliasesOverrides === 'object' ? Object.keys(data.artistAliasesOverrides).length : 0,
    brands: data.brandSettings && typeof data.brandSettings === 'object' ? Object.keys(data.brandSettings.brands || {}).length : 0,
  };
  const estimatedBytes = Buffer.byteLength(JSON.stringify(payload), 'utf8');
  return { generatedAt: new Date().toISOString(), estimatedBytes, counts, risk: estimatedBytes >= 8 * 1024 * 1024 ? 'warning' : 'healthy' };
}

app.get('/api/admin/backup/export', requirePermission('backup.export'), async (req, res) => {
  try {
    const exportPayload = await buildBackupExportPayload();
    const filename = `ktv_system_backup_${new Date().toISOString().slice(0,10)}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(exportPayload));
  } catch (err) {
    console.error('[Admin Backup Export Error]', err);
    res.status(503).json({ error: '備份匯出失敗：' + err.message });
  }
});

// ── 驗證系統 JSON 備份包 (匯入前預覽差異) ──
app.get('/api/admin/backup/export-summary', requirePermission('backup.export'), async (req, res) => {
  try {
    res.json(summarizeBackupExportPayload(await buildBackupExportPayload()));
  } catch (err) {
    console.error('[Admin Backup Export Summary Error]', err);
    res.status(503).json({ error: 'Backup export summary failed: ' + err.message });
  }
});

app.post('/api/admin/backup/validate', requirePermission('backup.validate'), (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ valid: false, error: '資料格式不正確：缺少備份物件' });
  }
  if (payload.app !== 'TW_KTV_CATALOG_SYSTEM' || !payload.data) {
    return res.status(400).json({ valid: false, error: '資料格式不正確：無效的系統備份檔標號或資料區塊' });
  }

  const { catalogOverrides, reports, votes, artistAliasesOverrides, brandSettings } = payload.data;
  const overridesCount = catalogOverrides && typeof catalogOverrides === 'object' ? Object.keys(catalogOverrides.songs || {}).length : 0;
  const reportsCount = Array.isArray(reports) ? reports.length : 0;
  const votesCount = votes && typeof votes === 'object' ? Object.keys(votes).length : 0;
  const aliasesOverridesCount = artistAliasesOverrides && typeof artistAliasesOverrides === 'object' ? Object.keys(artistAliasesOverrides).length : 0;
  const brandSettingsCount = brandSettings && typeof brandSettings === 'object' ? Object.keys(brandSettings.brands || {}).length : 0;

  res.json({
    valid: true,
    exportedAt: payload.exportedAt || '未知時間',
    diff: {
      catalogOverridesCount: overridesCount,
      reportsCount,
      votesCount,
      artistAliasesOverridesCount: aliasesOverridesCount,
      brandSettingsCount,
    }
  });
});

// ── 還原全站 JSON 備份包 (高風險操作：理由必填) ──
app.post('/api/admin/backup/import', requirePermission('backup.import'), async (req, res) => {
  try {
    const payload = req.body;
    const reason = String(req.body.reason || '').trim();
    if (!reason || reason.length < 4) {
      return res.status(400).json({ error: '此高風險操作需要填寫操作理由（至少 4 個字）' });
    }

    if (!payload || !payload.data || payload.app !== 'TW_KTV_CATALOG_SYSTEM') {
      return res.status(400).json({ error: '資料格式不正確：請提供有效的系統備份 JSON 檔案' });
    }

    const beforeCounts = {
      catalogOverridesCount: Object.keys((await loadCatalogOverridesStore()).songs || {}).length,
      reportsCount: (await loadReportsStore()).length,
      votesCount: Object.keys(await loadVotesStore()).length,
      artistAliasesOverridesCount: Object.keys(await loadArtistAliasesOverridesStore()).length,
      brandSettingsCount: Object.keys((await loadBrandSettingsStore()).brands || {}).length,
    };

    const { catalogOverrides, reports, votes, artistAliasesOverrides, brandSettings } = payload.data;
    if (catalogOverrides) {
      await saveCatalogOverridesStore(catalogOverrides);
      const baseSongs = loadInitialSongsDatabase({ applyLocalOverrides: !USE_REDIS });
      songsDatabase = applyCatalogOverridesToSongs(baseSongs, catalogOverrides);
    }
    if (reports && Array.isArray(reports)) {
      await saveReportsStore(reports);
    }
    if (votes && typeof votes === 'object') {
      await saveVotesStore(votes);
    }
    if (artistAliasesOverrides && typeof artistAliasesOverrides === 'object') {
      await saveArtistAliasesOverridesStore(artistAliasesOverrides);
      applyArtistAliasesOverrides(artistAliasesOverrides);
    }
    if (brandSettings && typeof brandSettings === 'object') {
      await saveBrandSettingsStore(brandSettings, { requirePersistent: true });
    }

    const afterCounts = {
      catalogOverridesCount: catalogOverrides && typeof catalogOverrides === 'object' ? Object.keys(catalogOverrides.songs || {}).length : 0,
      reportsCount: Array.isArray(reports) ? reports.length : 0,
      votesCount: votes && typeof votes === 'object' ? Object.keys(votes).length : 0,
      artistAliasesOverridesCount: artistAliasesOverrides && typeof artistAliasesOverrides === 'object' ? Object.keys(artistAliasesOverrides).length : 0,
      brandSettingsCount: brandSettings && typeof brandSettings === 'object' ? Object.keys(brandSettings.brands || {}).length : 0,
    };

    logAdminAction('IMPORT_SYSTEM_BACKUP', {
      targetType: 'backup',
      targetId: 'system',
      exportedAt: payload.exportedAt || 'unknown',
      before: beforeCounts,
      after: afterCounts,
      reason,
    }, req);
    res.json({ success: true, message: '系統備份資料已成功還原' });
  } catch (err) {
    console.error('[Admin Backup Import Error]', err);
    res.status(500).json({ error: '備份還原失敗：' + err.message });
  }
});

// ── 資料一致性檢查 API ──
app.get('/api/admin/consistency', requirePermission('dashboard.view'), async (req, res) => {
  try {
    const warnings = [];
    let redisAvailable = false;

    if (USE_REDIS) {
      try {
        await redisCmd('ping');
        redisAvailable = true;
      } catch (err) {
        warnings.push(`Redis 連線或驗證失敗: ${err.message}`);
      }
    }

    const overrides = await loadCatalogOverridesStore();
    const deletedSet = new Set(overrides.deletedIds || []);
    const catalogOverridesSongsCount = Object.keys(overrides.songs || {}).length;
    const deletedIdsCount = deletedSet.size;

    const visibleDeletedIds = [];
    for (const song of songsDatabase) {
      if (deletedSet.has(song.id)) {
        visibleDeletedIds.push(song.id);
      }
    }

    if (visibleDeletedIds.length > 0) {
      warnings.push(`發現 ${visibleDeletedIds.length} 首已標記刪除之歌曲仍出現在 runtime songsDatabase 中。`);
    }

    const aliasOverrides = await loadArtistAliasesOverridesStore();
    const aliasOverridesCount = Object.keys(aliasOverrides || {}).length;

    // 品牌 Consistency 檢查
    const brandStore = await loadBrandSettingsStore();
    const knownBrandsMap = brandStore.brands || {};
    const activeBrandsCount = Object.values(knownBrandsMap).filter(b => b && b.status === 'active').length;
    const inactiveBrandsCount = Object.values(knownBrandsMap).filter(b => b && b.status === 'inactive').length;

    // 1. 檢查 songsDatabase[*].brands 中的未知 brandId
    const unknownSongBrandIds = new Set();
    for (const song of songsDatabase) {
      if (song.brands && typeof song.brands === 'object') {
        for (const bId of Object.keys(song.brands)) {
          if (!knownBrandsMap[bId]) {
            unknownSongBrandIds.add(bId);
          }
        }
      }
    }

    // 2. 檢查 votes 中的未知 brandId
    const votesStore = await loadVotesStore();
    const unknownVoteBrandIds = new Set();
    for (const vKey of Object.keys(votesStore || {})) {
      const { brandId: bId } = await parseVoteKeyDynamic(vKey);
      if (bId && !knownBrandsMap[bId]) {
        unknownVoteBrandIds.add(bId);
      }
    }

    // 3. 檢查 reports 中的未知 brandId
    const reportsStore = await loadReportsStore();
    const unknownReportBrandIds = new Set();
    for (const r of (reportsStore || [])) {
      if (r.brandId && r.issueType !== 'suggest_new_brand' && !knownBrandsMap[r.brandId]) {
        unknownReportBrandIds.add(r.brandId);
      }
    }

    const hasUnknownBrandIds = unknownSongBrandIds.size > 0 || unknownVoteBrandIds.size > 0 || unknownReportBrandIds.size > 0;
    if (hasUnknownBrandIds) {
      warnings.push(`發現資料庫中含有未註冊或未知的品牌 ID (歌曲: ${unknownSongBrandIds.size}, 投票: ${unknownVoteBrandIds.size}, 回報: ${unknownReportBrandIds.size})。`);
    }

    if (USE_REDIS && !redisAvailable) {
      warnings.push('品牌設定降級運行為 local JSON fallback。');
    }

    const ok = visibleDeletedIds.length === 0 && (!USE_REDIS || redisAvailable) && !hasUnknownBrandIds;

    res.json({
      ok,
      storageMode: USE_REDIS ? 'redis' : 'local_json',
      redisAvailable: USE_REDIS ? redisAvailable : null,
      catalogOverridesCount: catalogOverridesSongsCount,
      deletedIdsCount,
      songsDatabaseCount: songsDatabase.length,
      deletedIdsStillVisibleCount: visibleDeletedIds.length,
      sampleDeletedIdsStillVisible: visibleDeletedIds.slice(0, 10),
      artistAliasesPersistence: USE_REDIS ? (redisAvailable ? 'redis' : 'degraded_local') : 'local_json',
      artistAliasesOverridesCount: aliasOverridesCount,
      brandSettingsPersistence: USE_REDIS ? (redisAvailable ? 'redis' : 'degraded_local') : 'local_json',
      activeBrandsCount,
      inactiveBrandsCount,
      unknownSongBrandIds: Array.from(unknownSongBrandIds).slice(0, 10),
      unknownVoteBrandIds: Array.from(unknownVoteBrandIds).slice(0, 10),
      unknownReportBrandIds: Array.from(unknownReportBrandIds).slice(0, 10),
      warnings,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: '資料一致性檢查失敗: ' + err.message });
  }
});

// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Unhandled API Error]', err);
  if (res.headersSent) return next(err);
  res.status(503).json({ error: '資料服務暫時無法使用，請稍後再試' });
});

try {
  const persistedOverrides = await loadCatalogOverridesStore();
  const baseSongs = loadInitialSongsDatabase({ applyLocalOverrides: !USE_REDIS });
  songsDatabase = applyCatalogOverridesToSongs(baseSongs, persistedOverrides);
  console.log(`[Server] Catalog ready with persistent overrides (${songsDatabase.length} songs)`);
} catch (err) {
  console.warn('[Server] Persistent catalog override preload failed:', err.message);
}

try {
  const persistedAliases = await loadArtistAliasesOverridesStore();
  applyArtistAliasesOverrides(persistedAliases);
  console.log('[Server] Artist aliases ready with persistent overrides');
} catch (err) {
  console.warn('[Server] Persistent artist aliases preload failed:', err.message);
}

try {
  const brandStore = await loadBrandSettingsStore();
  if (USE_REDIS) {
    try {
      const redisVal = await redisCmd('get', BRAND_SETTINGS_REDIS_KEY);
      if (!redisVal) {
        await redisCmd('set', BRAND_SETTINGS_REDIS_KEY, JSON.stringify(brandStore));
        console.log('[Server] Redis brandSettings initialized with default seed');
      }
    } catch (e) {
      console.warn('[Server] Seed Redis brandSettings check failed:', e.message);
    }
  }
  const activeCount = Object.values(brandStore.brands || {}).filter(b => b.status === 'active').length;
  console.log(`[Server] Brand settings ready with ${activeCount} active brands`);
} catch (err) {
  console.warn('[Server] Persistent brand settings preload failed:', err.message);
}

app.listen(PORT, () => {
  console.log(`[Server] KTV Song API 服務啟動於: http://localhost:${PORT}`);
  console.log(`[Server] Maintenance API token status: ${ADMIN_TOKEN ? 'set' : 'unset'}`);
  console.log(`[Server] Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`[Server] Single admin mode: ${getSingleAdminUser() ? 'configured' : 'not configured'}`);
  startDailyBackupScheduler();
});
