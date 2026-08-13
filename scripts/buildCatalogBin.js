import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPublicPath = path.join(__dirname, '../public/songs_catalog.json');
const jsonServerPath = path.join(__dirname, '../server/database.json');
const binPath = path.join(__dirname, '../public/songs_catalog.bin');
const distBinPath = path.join(__dirname, '../dist/songs_catalog.bin');
const chunkPrefix = 'songs_catalog.part';
const chunkSizeBytes = 8 * 1024 * 1024;
const chunkedCatalogThresholdBytes = 8 * 1024 * 1024;

const MAGIC_HEADER = Buffer.from([0x54, 0x57, 0x4B, 0x54, 0x56, 0x42, 0x49, 0x4E]); // "TWKTVBIN"
const XOR_KEY = [0x9E, 0x4F, 0xC3, 0x8A, 0x27, 0x1B, 0x6D, 0xE5];

function removeGeneratedCatalogFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const file of fs.readdirSync(dirPath)) {
    if (file === 'songs_catalog.bin' || file === 'songs_catalog.manifest.json' || /^songs_catalog\.part\d+\.bin$/.test(file)) {
      try { fs.unlinkSync(path.join(dirPath, file)); } catch {}
    }
  }
}

function getSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function writeCatalogManifest(targetDir, manifest) {
  fs.writeFileSync(path.join(targetDir, 'songs_catalog.manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
}

function createBaseManifest(outputBuffer, mode, chunks) {
  return {
    version: getSha256(outputBuffer).slice(0, 16),
    format: 'twktv-xor-bin',
    mode,
    totalBytes: outputBuffer.length,
    chunkSize: mode === 'chunked' ? chunkSizeBytes : outputBuffer.length,
    sha256: getSha256(outputBuffer),
    chunks,
  };
}

function writeSingleCatalog(outputBuffer, targetDir) {
  removeGeneratedCatalogFiles(targetDir);
  fs.writeFileSync(path.join(targetDir, 'songs_catalog.bin'), outputBuffer);
  writeCatalogManifest(targetDir, createBaseManifest(outputBuffer, 'single', [
    { file: 'songs_catalog.bin', bytes: outputBuffer.length, sha256: getSha256(outputBuffer) },
  ]));
}

function writeChunkedCatalog(outputBuffer, targetDir) {
  removeGeneratedCatalogFiles(targetDir);
  const chunks = [];
  for (let offset = 0, index = 0; offset < outputBuffer.length; offset += chunkSizeBytes, index++) {
    const fileName = `${chunkPrefix}${String(index).padStart(3, '0')}.bin`;
    const part = outputBuffer.subarray(offset, Math.min(offset + chunkSizeBytes, outputBuffer.length));
    fs.writeFileSync(path.join(targetDir, fileName), part);
    chunks.push({ file: fileName, bytes: part.length, sha256: getSha256(part) });
  }
  writeCatalogManifest(targetDir, createBaseManifest(outputBuffer, 'chunked', chunks));
  return chunks;
}

function hasValidChunkedCatalog(dirPath) {
  const manifestFile = path.join(dirPath, 'songs_catalog.manifest.json');
  if (!fs.existsSync(manifestFile) || fs.statSync(manifestFile).size <= 100) return false;
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    const chunks = Array.isArray(manifest.chunks) ? manifest.chunks : [];
    return chunks.length > 0 && chunks.every(chunk => {
      const chunkPath = path.join(dirPath, chunk.file);
      return fs.existsSync(chunkPath) && fs.statSync(chunkPath).size === Number(chunk.bytes);
    });
  } catch {
    return false;
  }
}

function stripSongCodesFromCatalog(catalog) {
  if (!Array.isArray(catalog)) return { catalog, removed: 0, noteUpdates: 0 };
  let removed = 0;
  let noteUpdates = 0;
  const cleaned = catalog.map(song => {
    if (!song || typeof song !== 'object' || !song.brands || typeof song.brands !== 'object') return song;
    const cleanSong = { ...song, brands: {} };
    for (const [brandId, status] of Object.entries(song.brands)) {
      if (status && typeof status === 'object') {
        const cleanStatus = { ...status };
        if (Object.prototype.hasOwnProperty.call(cleanStatus, 'code')) {
          delete cleanStatus.code;
          removed++;
        }
        if (typeof cleanStatus.note === 'string') {
          const cleanNote = cleanStatus.note
            .replace(/[；;]?\s*點歌碼衝突已清空，待使用者回報或管理者校正/g, '')
            .replace(/點碼對照更新/g, '資料對照更新')
            .replace(/點歌碼|點歌編號|歌曲編號/g, '現場編號');
          if (cleanNote !== cleanStatus.note) {
            cleanStatus.note = cleanNote.trim();
            noteUpdates++;
          }
        }
        cleanSong.brands[brandId] = cleanStatus;
      } else {
        cleanSong.brands[brandId] = status;
      }
    }
    return cleanSong;
  });
  return { catalog: cleaned, removed, noteUpdates };
}

export function generateBinCatalog() {
  let sourceJsonPath = null;

  if (fs.existsSync(jsonPublicPath) && fs.statSync(jsonPublicPath).size > 1000) {
    sourceJsonPath = jsonPublicPath;
  } else if (fs.existsSync(jsonServerPath) && fs.statSync(jsonServerPath).size > 1000) {
    sourceJsonPath = jsonServerPath;
  }

  if (!sourceJsonPath) {
    if (fs.existsSync(binPath) && fs.statSync(binPath).size > 1000) {
      console.log('⚡ [Build Catalog Bin] songs_catalog.bin 已是最新，無需重新打包。');
      return;
    }
    if (hasValidChunkedCatalog(path.dirname(binPath))) {
      console.log('⚡ [Build Catalog Bin] songs_catalog 分片已存在，無需重新打包。');
      return;
    }
    console.error('❌ [Build Catalog Bin] 找不到可用的歌冊 JSON (public/songs_catalog.json 或 server/database.json)！');
    process.exit(1);
  }

  console.log(`🔒 [Build Catalog Bin] 讀取 ${path.basename(sourceJsonPath)} 開始進行二進位混淆與加密打包...`);
  let jsonContent = fs.readFileSync(sourceJsonPath, 'utf8');
  try {
    const parsedCatalog = JSON.parse(jsonContent);
    const stripped = stripSongCodesFromCatalog(parsedCatalog);
    jsonContent = JSON.stringify(stripped.catalog);
    if (stripped.removed > 0) {
      console.log(`🧹 [Build Catalog Bin] 已移除公開歌庫點歌碼欄位：${stripped.removed} 筆`);
    }
    if (stripped.noteUpdates > 0) {
      console.log(`🧹 [Build Catalog Bin] 已清理公開歌庫點歌碼相關備註：${stripped.noteUpdates} 筆`);
    }
  } catch (err) {
    console.warn('[Build Catalog Bin] 公開歌庫點歌碼清理略過：JSON 解析失敗', err.message);
  }
  const jsonBytes = Buffer.from(jsonContent, 'utf8');

  // 同步更新備份 server/database.json 為開發主要資料庫
  if (sourceJsonPath === jsonPublicPath) {
    try {
      fs.writeFileSync(jsonServerPath, jsonContent, 'utf8');
      console.log('💾 [Build Catalog Bin] 成功同步開發主要資料庫至 server/database.json');
    } catch {}
  }

  // Create the obfuscated binary payload.
  const outputBuffer = Buffer.alloc(MAGIC_HEADER.length + jsonBytes.length);
  MAGIC_HEADER.copy(outputBuffer, 0);

  for (let i = 0; i < jsonBytes.length; i++) {
    const keyByte = XOR_KEY[i % XOR_KEY.length];
    outputBuffer[MAGIC_HEADER.length + i] = jsonBytes[i] ^ keyByte;
  }

  if (outputBuffer.length > chunkedCatalogThresholdBytes) {
    const chunks = writeChunkedCatalog(outputBuffer, path.dirname(binPath));
    console.log(`✅ [Build Catalog Bin] 加密包分片生成成功！總大小: ${(outputBuffer.length / 1024 / 1024).toFixed(2)} MB，分片數: ${chunks.length}`);
  } else {
    writeSingleCatalog(outputBuffer, path.dirname(binPath));
    console.log(`✅ [Build Catalog Bin] 加密包 manifest 單檔生成成功！檔案大小: ${(outputBuffer.length / 1024 / 1024).toFixed(2)} MB`);
  }

  if (fs.existsSync(path.dirname(distBinPath))) {
    try {
      if (outputBuffer.length > chunkedCatalogThresholdBytes) writeChunkedCatalog(outputBuffer, path.dirname(distBinPath));
      else writeSingleCatalog(outputBuffer, path.dirname(distBinPath));
    } catch {}
  }

  // 移除 public/ 下之明文 JSON，確保對外部署輸出完全無明文曝露
  if (fs.existsSync(jsonPublicPath)) {
    try {
      fs.unlinkSync(jsonPublicPath);
      console.log('🛡️ [Build Catalog Bin] 已安全移除 public/songs_catalog.json 明文檔。');
    } catch {}
  }
}

// 支援直接命令列執行
if (process.argv[1] && process.argv[1].endsWith('buildCatalogBin.js')) {
  generateBinCatalog();
}

