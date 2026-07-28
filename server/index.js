import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 靜態檔案服務與 /admin 路由
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../dist')));

// ─────────────────────────────────────────────
// Admin 密碼驗證與本機資安過濾 (Security & Localhost-Only Guard)
// 密碼已更新為高強度金鑰: KtvAdmin@2026!SecureKey
// ─────────────────────────────────────────────
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'KtvAdmin@2026!SecureKey';

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

function handleAdminPageServe(req, res) {
  if (!isLocalhostRequest(req)) {
    return res.status(403).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f87171; height: 100vh; box-sizing: border-box;">
        <h1 style="font-size: 2.5rem; margin-bottom: 10px;">🚫 403 Access Denied</h1>
        <p style="font-size: 1.1rem; color: #cbd5e1;">基於安全資安防護，管理後台網頁與管理員 API 僅限架設伺服器之「本機 (Localhost)」存取。</p>
        <p style="font-size: 0.9rem; color: #64748b; margin-top: 20px;">外網連線已自動隔絕阻擋，確保管理端安全。</p>
      </div>
    `);
  }
  const adminPath = path.join(__dirname, '../public/admin.html');
  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath);
  } else {
    res.status(404).send('Admin Panel HTML File Not Found');
  }
}

// 隱密後台路由（支援 /sys-admin-panel 與 /admin）
app.get('/sys-admin-panel', handleAdminPageServe);
app.get('/admin', handleAdminPageServe);

function requireAdmin(req, res, next) {
  if (!isLocalhostRequest(req)) {
    return res.status(403).json({ error: '拒絕存取：管理員 API 僅限伺服器本機 (Localhost) 存取，外網禁止連線。' });
  }
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: '未授權：需要管理員密碼 Token (預設 0000)' });
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

function loadVotes() {
  try { return JSON.parse(fs.readFileSync(VOTES_PATH, 'utf8')); } catch { return {}; }
}
function saveVotes(data) {
  fs.writeFileSync(VOTES_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function saveCatalog(catalog) {
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  const distCatalogPath = path.join(__dirname, '../dist/songs_catalog.json');
  if (fs.existsSync(path.dirname(distCatalogPath))) {
    try {
      fs.writeFileSync(distCatalogPath, JSON.stringify(catalog, null, 2), 'utf8');
    } catch (e) {}
  }
}

function logAdminAction(action, detail) {
  const line = `[${new Date().toISOString()}] ${action}: ${JSON.stringify(detail)}\n`;
  fs.appendFileSync(ADMIN_LOG_PATH, line, 'utf8');
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
    results = results.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      (s.zhuyin || '').toLowerCase().includes(q) ||
      (s.pinyin || '').toLowerCase().includes(q)
    );
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

// ── 字串模糊歸一化工具 (String Normalizer for Auto-Consensus) ──
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
    .replace(/[\《\》\〈\〉\『\』\「\」\(\)（）\[\]【】\s\-\_\.\,\!\?]/g, '')
    .trim();
}

// ─────────────────────────────────────────────
// 公開 API：真實訪客線上人數統計與心跳 (Real-Time Visitor Tracking)
// ─────────────────────────────────────────────
const activeVisitors = new Map();
const STATS_PATH = path.join(__dirname, 'stats.json');

function loadStats() {
  try { return JSON.parse(fs.readFileSync(STATS_PATH, 'utf8')); } catch { return { totalVisits: 0 }; }
}
function saveStats(data) {
  try { fs.writeFileSync(STATS_PATH, JSON.stringify(data, null, 2), 'utf8'); } catch (e) {}
}

let currentStats = loadStats();

app.get('/api/stats/ping', (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!activeVisitors.has(clientIp)) {
    currentStats.totalVisits = (currentStats.totalVisits || 0) + 1;
    saveStats(currentStats);
  }
  activeVisitors.set(clientIp, now);

  // 清理超過 60 秒未發送心跳的離線 Session
  for (const [ip, lastPing] of activeVisitors.entries()) {
    if (now - lastPing > 60000) {
      activeVisitors.delete(ip);
    }
  }

  res.json({
    online: activeVisitors.size,
    totalVisits: currentStats.totalVisits,
    timestamp: now
  });
});

// ─────────────────────────────────────────────
// 公開 API：使用者回報與缺歌建議
// ─────────────────────────────────────────────
app.post('/api/report', (req, res) => {
  const { songId, songTitle, artist, brandId, issueType, lang, songCode, lyricist, composer, mvType, note } = req.body;
  if (!songId || !brandId || !issueType) return res.status(400).json({ error: '缺少必要欄位' });

  const validTypes = ['no_song', 'has_song', 'missing_song', 'wrong_info', 'other'];
  if (!validTypes.includes(issueType)) return res.status(400).json({ error: '無效的 issueType' });

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const reports = loadReports();

  const newReport = {
    id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    songId,
    songTitle: songTitle || '',
    artist: artist || '',
    brandId,
    issueType,
    lang: lang || '',
    songCode: songCode || '',
    lyricist: lyricist || '',
    composer: composer || '',
    mvType: mvType || 'unknown',
    note: note ? String(note).slice(0, 500) : '',
    timestamp: new Date().toISOString(),
    ip: clientIp,
    status: 'pending',
  };

  // ── 自動處理回報單與缺歌自動上架機制 (Auto-Consensus & Auto-Inject Engine) ──
  let isAutoResolved = false;
  try {
    if (issueType === 'missing_song' && songTitle) {
      // 1. 對輸入字串進行模糊歸一化指紋比對
      const normTitle = normalizeString(songTitle);
      const normArtist = normalizeString(artist);
      const fingerprint = `${normTitle}__${normArtist}`;

      // 2. 尋找歷史缺歌回報中指紋相符的記錄
      const matchingReports = reports.filter(r => {
        if (r.issueType !== 'missing_song') return false;
        const t = normalizeString(r.songTitle);
        const a = normalizeString(r.artist);
        return `${t}__${a}` === fingerprint;
      });

      const totalMatching = matchingReports.length + 1; // 包含本次提交

      // 3. 達標（≥ 2 筆相同建議）自動寫入全台歌庫 (songs_catalog.json)！
      if (totalMatching >= 2) {
        let existingSong = songsDatabase.find(s => {
          return normalizeString(s.title) === normTitle && normalizeString(s.artist) === normArtist;
        });

        if (!existingSong) {
          const autoSongId = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          existingSong = {
            id: autoSongId,
            title: songTitle.trim(),
            artist: artist.trim() || '未填寫',
            lang: lang || '國語',
            lyricist: lyricist || '',
            composer: composer || '',
            brands: {
              [brandId]: {
                available: true,
                code: songCode || '',
                officialMv: mvType === 'official',
              }
            },
            confidence: 'verified',
          };
          songsDatabase.push(existingSong);
        } else {
          if (!existingSong.brands) existingSong.brands = {};
          existingSong.brands[brandId] = {
            available: true,
            code: songCode || existingSong.brands[brandId]?.code || '',
            officialMv: mvType === 'official' || existingSong.brands[brandId]?.officialMv || false,
          };
        }

        saveCatalog(songsDatabase);
        isAutoResolved = true;
        newReport.status = 'resolved';
        newReport.adminNote = `[自動共識觸發] 累積 ${totalMatching} 筆歸一化模糊相符建議 (Fingerprint: ${fingerprint})，系統已自動寫入全台歌庫！`;
        console.log(`[Auto-Consensus Inject] 歌名《${songTitle}》— ${artist} 累積 ${totalMatching} 筆相符建議，已自動寫入全台歌庫！`);
      }
    } else {
      // 既有歌曲修正共識
      const sameReports = reports.filter(r => r.songId === songId && r.brandId === brandId && r.issueType === issueType);
      const reportCount = sameReports.length + 1;

      const idx = songsDatabase.findIndex(s => s.id === songId);
      if (idx !== -1) {
        if (issueType === 'no_song' && reportCount >= 2) {
          if (!songsDatabase[idx].brands) songsDatabase[idx].brands = {};
          songsDatabase[idx].brands[brandId] = {
            ...songsDatabase[idx].brands[brandId],
            available: false,
            note: `社群多人現場回報點不到歌 (Auto-Resolved: ${reportCount}筆回報)`,
          };
          saveCatalog(songsDatabase);
          isAutoResolved = true;
          newReport.status = 'resolved';
          newReport.adminNote = '系統自動觸發：多位歌友回報現場無此歌，自動更正為未收錄';
          console.log(`[Auto-Report] 《${songTitle}》(${brandId}) 累積 ${reportCount} 筆「無歌曲」回報，自動更正為未收錄！`);
        } else if (issueType === 'has_song' && reportCount >= 2) {
          if (!songsDatabase[idx].brands) songsDatabase[idx].brands = {};
          songsDatabase[idx].brands[brandId] = {
            ...songsDatabase[idx].brands[brandId],
            available: true,
            note: `社群多人現場回報確認有歌 (Auto-Resolved: ${reportCount}筆回報)`,
          };
          saveCatalog(songsDatabase);
          isAutoResolved = true;
          newReport.status = 'resolved';
          newReport.adminNote = '系統自動觸發：多位歌友回報現場有此歌，自動更正為有收錄';
          console.log(`[Auto-Report] 《${songTitle}》(${brandId}) 累積 ${reportCount} 筆「有歌曲」回報，自動更正為有收錄！`);
        }
      }
    }
  } catch (e) {
    console.error('[Auto-Report Resolution Error]', e);
  }

  reports.push(newReport);
  saveReports(reports);
  console.log(`[回報] ${songTitle} (${brandId}) - ${issueType} (AutoResolved: ${isAutoResolved})`);
  res.json({ success: true, reportId: newReport.id, autoResolved: isAutoResolved });
});

app.get('/api/reports', (req, res) => {
  const reports = loadReports();
  const { status } = req.query;
  const filtered = status ? reports.filter(r => r.status === status) : reports;
  res.json({ total: filtered.length, reports: filtered.slice(-200).reverse() });
});

// ─────────────────────────────────────────────
// 公開 API：眾包投票
// ─────────────────────────────────────────────
app.post('/api/vote', (req, res) => {
  const { songId, brandId, vote } = req.body;
  if (!songId || !brandId || !['confirm', 'deny'].includes(vote)) {
    return res.status(400).json({ error: '缺少必要欄位' });
  }

  const votes = loadVotes();
  const key = `${songId}_${brandId}`;
  if (!votes[key]) votes[key] = { confirm: 0, deny: 0 };
  votes[key][vote] = Math.max(0, votes[key][vote] + 1);
  saveVotes(votes);

  const d = votes[key];
  const confidence = getVoteConfidence(d.confirm, d.deny);

  // ── 自動共識引擎 (Auto-Consensus Engine) ──
  // 若否決票 >= 3 且 否決票超過確認票 2 倍，系統自動變更 catalog 廠牌狀態為未收錄 (false)
  // 若確認票 >= 3 且 確認票超過否決票 3 倍，系統自動變更 catalog 廠牌狀態為有收錄 (true)
  try {
    const idx = songsDatabase.findIndex(s => s.id === songId);
    if (idx !== -1) {
      const currentAvailable = songsDatabase[idx].brands?.[brandId]?.available;
      if (confidence === 'disputed' && currentAvailable !== false) {
        if (!songsDatabase[idx].brands) songsDatabase[idx].brands = {};
        songsDatabase[idx].brands[brandId] = {
          ...songsDatabase[idx].brands[brandId],
          available: false,
          note: '社群現場多位回報點不到歌 (Auto-Updated)',
        };
        saveCatalog(songsDatabase);
        console.log(`[Auto-Consensus] 《${songsDatabase[idx].title}》(${brandId}) 因社群眾包否決票達標，自動標記為未收錄`);
      } else if (confidence === 'verified' && currentAvailable !== true) {
        if (!songsDatabase[idx].brands) songsDatabase[idx].brands = {};
        songsDatabase[idx].brands[brandId] = {
          ...songsDatabase[idx].brands[brandId],
          available: true,
          note: '社群現場多位確認有收錄 (Auto-Updated)',
        };
        saveCatalog(songsDatabase);
        console.log(`[Auto-Consensus] 《${songsDatabase[idx].title}》(${brandId}) 因社群眾包確認票達標，自動標記為有收錄`);
      }
    }
  } catch (e) {
    console.error('[Auto-Consensus Error]', e);
  }

  res.json({
    success: true, key,
    confirm: d.confirm, deny: d.deny,
    confidence,
  });
});

app.get('/api/votes/:songId', (req, res) => {
  const { songId } = req.params;
  const votes = loadVotes();
  const result = {};
  for (const [key, data] of Object.entries(votes)) {
    if (key.startsWith(`${songId}_`)) {
      const brandId = key.slice(songId.length + 1);
      result[brandId] = { ...data, confidence: getVoteConfidence(data.confirm, data.deny) };
    }
  }
  res.json({ songId, votes: result });
});

// ═══════════════════════════════════════════════════════
// 管理員 API（需要 x-admin-token header）
// ═══════════════════════════════════════════════════════

// ── 查看所有回報 ──
app.get('/api/admin/reports', requireAdmin, (req, res) => {
  const reports = loadReports();
  const { status } = req.query;
  const filtered = status ? reports.filter(r => r.status === status) : reports;
  res.json({ total: filtered.length, reports: filtered.reverse() });
});

// ── 更新回報狀態（pending → reviewed / resolved）──
app.patch('/api/admin/report/:reportId', requireAdmin, (req, res) => {
  const { reportId } = req.params;
  const { status, adminNote } = req.body;
  const validStatus = ['pending', 'reviewed', 'resolved', 'rejected'];
  if (!validStatus.includes(status)) return res.status(400).json({ error: '無效的 status' });

  const reports = loadReports();
  const idx = reports.findIndex(r => r.id === reportId);
  if (idx === -1) return res.status(404).json({ error: '找不到此回報' });

  const report = reports[idx];
  report.status = status;
  report.adminNote = adminNote || '';
  report.reviewedAt = new Date().toISOString();

  // ── 管理員審核動態寫入連通 (Admin Manual Approval -> Live Catalog Injection) ──
  if (status === 'resolved') {
    try {
      if (report.issueType === 'missing_song' && report.songTitle) {
        const normTitle = normalizeString(report.songTitle);
        const normArtist = normalizeString(report.artist);
        let existingSong = songsDatabase.find(s => normalizeString(s.title) === normTitle && normalizeString(s.artist) === normArtist);

        if (!existingSong) {
          const autoSongId = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          existingSong = {
            id: autoSongId,
            title: report.songTitle.trim(),
            artist: report.artist.trim() || '未填寫',
            lang: report.lang || '國語',
            lyricist: report.lyricist || '',
            composer: report.composer || '',
            brands: {
              [report.brandId]: {
                available: true,
                code: report.songCode || '',
                officialMv: report.mvType === 'official',
              }
            },
            confidence: 'verified',
          };
          songsDatabase.push(existingSong);
        } else {
          if (!existingSong.brands) existingSong.brands = {};
          existingSong.brands[report.brandId] = {
            available: true,
            code: report.songCode || existingSong.brands[report.brandId]?.code || '',
            officialMv: report.mvType === 'official' || existingSong.brands[report.brandId]?.officialMv || false,
          };
        }
        saveCatalog(songsDatabase);
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
          saveCatalog(songsDatabase);
          console.log(`[Admin Update] 管理員審核更正《${report.songTitle}》(${report.brandId}) 收錄狀態`);
        }
      }
    } catch (err) {
      console.error('[Admin Report Approval Error]', err);
    }
  }

  saveReports(reports);
  logAdminAction('UPDATE_REPORT_STATUS', { reportId, status, adminNote });
  res.json({ success: true, report: reports[idx] });
});

// ── 查看爭議歌曲（deny 票多的）──
app.get('/api/admin/disputed', requireAdmin, (req, res) => {
  const votes = loadVotes();
  const minVotes = parseInt(req.query.minVotes) || 3;

  const disputed = [];
  for (const [key, data] of Object.entries(votes)) {
    const total = data.confirm + data.deny;
    if (total < minVotes) continue;

    const confidence = getVoteConfidence(data.confirm, data.deny);
    if (confidence === 'disputed' || confidence === 'uncertain') {
      const [songId, brandId] = key.split('_');
      const song = songsDatabase.find(s => s.id === songId);
      disputed.push({
        key, songId, brandId,
        songTitle: song?.title || '(歌曲已不存在)',
        artist: song?.artist || '',
        currentStatus: song?.brands?.[brandId]?.available ?? null,
        confirm: data.confirm,
        deny: data.deny,
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
app.get('/api/admin/verified', requireAdmin, (req, res) => {
  const votes = loadVotes();
  const verified = [];

  for (const [key, data] of Object.entries(votes)) {
    if (getVoteConfidence(data.confirm, data.deny) !== 'verified') continue;
    const [songId, brandId] = key.split('_');
    const song = songsDatabase.find(s => s.id === songId);
    verified.push({
      key, songId, brandId,
      songTitle: song?.title || '(歌曲已不存在)',
      artist: song?.artist || '',
      currentStatus: song?.brands?.[brandId]?.available ?? null,
      confirm: data.confirm, deny: data.deny,
    });
  }
  verified.sort((a, b) => b.confirm - a.confirm);
  res.json({ total: verified.length, verified });
});

// ── 套用廠牌收錄狀態修正（核心管理功能）──
// PATCH /api/admin/song/:songId/brand
// body: { brandId, available: true/false, note }
app.patch('/api/admin/song/:songId/brand', requireAdmin, (req, res) => {
  const { songId } = req.params;
  const { brandId, available, audioType, mvType, note } = req.body;

  if (!brandId || typeof available !== 'boolean') {
    return res.status(400).json({ error: '缺少必要欄位：brandId, available (boolean)' });
  }

  const idx = songsDatabase.findIndex(s => s.id === songId);
  if (idx === -1) return res.status(404).json({ error: `找不到歌曲 ID: ${songId}` });

  const song = songsDatabase[idx];
  const before = song.brands?.[brandId] ?? null;

  // 更新廠牌狀態
  if (!song.brands) song.brands = {};
  song.brands[brandId] = {
    available,
    code: available ? 'OK' : 'N/A',
    audioType: audioType || (available ? 'original_vocal' : undefined),
    mvType: mvType || (available ? 'official_mv' : undefined),
  };

  songsDatabase[idx] = song;
  saveCatalog(songsDatabase);

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
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const reports = loadReports();
  const votes = loadVotes();

  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;

  let disputedCount = 0, verifiedCount = 0, totalVoteEntries = 0;
  for (const [, data] of Object.entries(votes)) {
    totalVoteEntries++;
    const conf = getVoteConfidence(data.confirm, data.deny);
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
app.get('/api/admin/logs', requireAdmin, (req, res) => {
  try {
    const log = fs.existsSync(ADMIN_LOG_PATH)
      ? fs.readFileSync(ADMIN_LOG_PATH, 'utf8').trim().split('\n').slice(-100).reverse()
      : [];
    res.json({ logs: log });
  } catch {
    res.json({ logs: [] });
  }
});

// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] KTV Song API 服務啟動於: http://localhost:${PORT}`);
  console.log(`[Server] 管理後台 API Token: ${ADMIN_TOKEN}`);
  console.log(`[Server] Admin Panel: http://localhost:${PORT}/admin`);
});
