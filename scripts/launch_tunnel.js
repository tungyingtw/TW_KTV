import { exec, spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5173;
const API_PORT = 3001;
let viteChild = null;
let apiChild = null;
let tunnelChild = null;

async function checkPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
  });
}

function cleanupAndExit() {
  console.log('\n[資訊] 正在關閉所有伺服器與外網通道...');
  if (viteChild) {
    try { viteChild.kill(); } catch (e) {}
  }
  if (apiChild) {
    try { apiChild.kill(); } catch (e) {}
  }
  if (tunnelChild) {
    try { tunnelChild.kill(); } catch (e) {}
  }
  exec('taskkill /F /IM node.exe > nul 2>&1');
  exec('taskkill /F /IM cloudflared.exe > nul 2>&1');
  process.exit(0);
}

process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);
process.on('exit', cleanupAndExit);

async function startTunnel() {
  console.log('====================================================');
  console.log('🎤 台灣 KTV 歌曲索引與管理後台 — 伺服器啟動器');
  console.log('====================================================');

  // 1. 檢查並啟動 Express 後端 API 服務 (Port 3001)
  const isApiRunning = await checkPortOpen(API_PORT);
  if (!isApiRunning) {
    console.log('[資訊] 正在啟動 Express 後端 API 與管理後台服務 (Port 3001)...');
    apiChild = spawn('npx', ['tsx', 'server/index.js'], { stdio: 'ignore', shell: true });
    await new Promise(r => setTimeout(r, 1500));
  }

  // 2. 檢查並啟動 Vite 前端服務 (Port 5173)
  const isServerRunning = await checkPortOpen(PORT);
  if (!isServerRunning) {
    console.log('[資訊] 正在啟動 Vite 前端服務 (Port 5173)...');
    viteChild = spawn('npx', ['vite', '--host', '0.0.0.0'], { stdio: 'ignore', shell: true });
    await new Promise(r => setTimeout(r, 2500));
  }

  console.log('[資訊] 正在向 Cloudflare 申請免密碼外網直連網址...');

  const cloudflaredBin = path.join(__dirname, 'cloudflared.exe');

  tunnelChild = spawn(cloudflaredBin, ['tunnel', '--url', `http://127.0.0.1:${PORT}`], { shell: true });

  let urlFound = false;

  const handleOutput = (data) => {
    const output = data.toString();
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !urlFound) {
      urlFound = true;
      const url = match[0];
      console.log('\n====================================================');
      console.log('🎉 伺服器啟動成功！連線資訊如下：');
      console.log('');
      console.log(`   👉 歌友主站網址 (外網/手機): ${url}`);
      console.log(`   👉 本機管理後台 (僅限本機):  http://localhost:3001/sys-admin-panel`);
      console.log('');
      console.log('====================================================');
      console.log('🔑 管理員登入密碼: 0000');
      console.log('🛡️ 資安防護：後端已啟用「本機獨佔過濾」，外網無法開啟或連線管理後台！');
      console.log('🔴 關閉此視窗時，所有伺服器將自動安全停止！');
      console.log('====================================================\n');

      exec(`echo | set /p="${url}" | clip`);
      // 主動自動開啟歌友主站與本機管理後台
      exec(`start "" "${url}"`);
      exec(`start "" "http://localhost:3001/sys-admin-panel"`);
    }
  };

  tunnelChild.stdout.on('data', handleOutput);
  tunnelChild.stderr.on('data', handleOutput);

  await new Promise(() => {});
}

startTunnel();
