import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPublicPath = path.join(__dirname, '../public/songs_catalog.json');
const jsonServerPath = path.join(__dirname, '../server/database.json');
const binPath = path.join(__dirname, '../public/songs_catalog.bin');
const distBinPath = path.join(__dirname, '../dist/songs_catalog.bin');
const chunkPrefix = 'songs_catalog.part';
const maxGitSafeChunkSize = 50 * 1024 * 1024;

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

function writeChunkedCatalog(outputBuffer, targetDir) {
  removeGeneratedCatalogFiles(targetDir);
  const chunks = [];
  for (let offset = 0, index = 0; offset < outputBuffer.length; offset += maxGitSafeChunkSize, index++) {
    const fileName = `${chunkPrefix}${String(index).padStart(3, '0')}.bin`;
    const part = outputBuffer.subarray(offset, Math.min(offset + maxGitSafeChunkSize, outputBuffer.length));
    fs.writeFileSync(path.join(targetDir, fileName), part);
    chunks.push({ file: fileName, bytes: part.length });
  }
  fs.writeFileSync(path.join(targetDir, 'songs_catalog.manifest.json'), JSON.stringify({
    version: 1,
    format: 'twktv-xor-bin-chunks',
    totalBytes: outputBuffer.length,
    chunkSize: maxGitSafeChunkSize,
    chunks
  }, null, 2), 'utf8');
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
  const jsonContent = fs.readFileSync(sourceJsonPath, 'utf8');
  const jsonBytes = Buffer.from(jsonContent, 'utf8');

  // 同步更新備份 server/database.json 為開發主要資料庫
  if (sourceJsonPath === jsonPublicPath) {
    try {
      fs.writeFileSync(jsonServerPath, jsonContent, 'utf8');
      console.log('💾 [Build Catalog Bin] 成功同步開發主要資料庫至 server/database.json');
    } catch (e) {}
  }

  // Create the obfuscated binary payload.
  const outputBuffer = Buffer.alloc(MAGIC_HEADER.length + jsonBytes.length);
  MAGIC_HEADER.copy(outputBuffer, 0);

  for (let i = 0; i < jsonBytes.length; i++) {
    const keyByte = XOR_KEY[i % XOR_KEY.length];
    outputBuffer[MAGIC_HEADER.length + i] = jsonBytes[i] ^ keyByte;
  }

  if (outputBuffer.length > 95 * 1024 * 1024) {
    const chunks = writeChunkedCatalog(outputBuffer, path.dirname(binPath));
    console.log(`✅ [Build Catalog Bin] 加密包分片生成成功！總大小: ${(outputBuffer.length / 1024 / 1024).toFixed(2)} MB，分片數: ${chunks.length}`);
  } else {
    removeGeneratedCatalogFiles(path.dirname(binPath));
    fs.writeFileSync(binPath, outputBuffer);
    console.log(`✅ [Build Catalog Bin] 加密包生成成功！檔案大小: ${(outputBuffer.length / 1024 / 1024).toFixed(2)} MB`);
  }

  if (fs.existsSync(path.dirname(distBinPath))) {
    try {
      if (outputBuffer.length > 95 * 1024 * 1024) writeChunkedCatalog(outputBuffer, path.dirname(distBinPath));
      else {
        removeGeneratedCatalogFiles(path.dirname(distBinPath));
        fs.writeFileSync(distBinPath, outputBuffer);
      }
    } catch (e) {}
  }

  // 移除 public/ 下之明文 JSON，確保對外部署輸出完全無明文曝露
  if (fs.existsSync(jsonPublicPath)) {
    try {
      fs.unlinkSync(jsonPublicPath);
      console.log('🛡️ [Build Catalog Bin] 已安全移除 public/songs_catalog.json 明文檔。');
    } catch (e) {}
  }
}

// 支援直接命令列執行
if (process.argv[1] && process.argv[1].endsWith('buildCatalogBin.js')) {
  generateBinCatalog();
}
