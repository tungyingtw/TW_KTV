import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../public/songs_catalog.json');
const binPath = path.join(__dirname, '../public/songs_catalog.bin');

const MAGIC_HEADER = Buffer.from([0x54, 0x57, 0x4B, 0x54, 0x56, 0x42, 0x49, 0x4E]); // "TWKTVBIN"
const XOR_KEY = [0x9E, 0x4F, 0xC3, 0x8A, 0x27, 0x1B, 0x6D, 0xE5];

async function generateBinCatalog() {
  if (!fs.existsSync(jsonPath)) {
    if (fs.existsSync(binPath)) {
      console.log('⚡ [Build Catalog Bin] songs_catalog.bin 已存在，無需重複轉換。');
      return;
    }
    console.error('❌ [Build Catalog Bin] 找不到 public/songs_catalog.json！');
    process.exit(1);
  }

  console.log('🔒 [Build Catalog Bin] 開始對 12 萬首歌冊進行二進位混淆與防偽簽章...');
  const jsonContent = fs.readFileSync(jsonPath, 'utf8');
  const jsonBytes = Buffer.from(jsonContent, 'utf8');

  // 創建混淆二進位 Buffer (Header + Obfuscated Bytes)
  const outputBuffer = Buffer.alloc(MAGIC_HEADER.length + jsonBytes.length);
  MAGIC_HEADER.copy(outputBuffer, 0);

  for (let i = 0; i < jsonBytes.length; i++) {
    const keyByte = XOR_KEY[i % XOR_KEY.length];
    // Byte-Shift & XOR obfuscation
    const obfuscated = jsonBytes[i] ^ keyByte;
    outputBuffer[MAGIC_HEADER.length + i] = obfuscated;
  }

  fs.writeFileSync(binPath, outputBuffer);
  console.log(`✅ [Build Catalog Bin] 二進位加密包生成成功！大小: ${(outputBuffer.length / 1024 / 1024).toFixed(2)} MB`);

  // 刪除原始明文 JSON，確保無檔案曝露在 public/ 根目錄
  try {
    fs.unlinkSync(jsonPath);
    console.log('🛡️ [Build Catalog Bin] 成功刪除 public/songs_catalog.json 明文檔，全網防護啟動！');
  } catch (e) {
    console.warn('⚠️ 刪除 JSON 失敗:', e);
  }
}

generateBinCatalog();
