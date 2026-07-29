import fs from 'fs';
import path from 'path';

// 定義禁止出現在對外 UI / HTML / TSX 檔案中的未遮蔽商業品牌全稱
const FORBIDDEN_BRANDS = [
  '錢櫃',
  '好樂迪',
  '享溫馨',
  '星聚點',
  '超級巨星',
  '音圓',
  '金嗓',
  '弘音',
  'SingGo',
  'V-MIX',
  'V-Mix'
];

// 需要檢查的檔案或目錄
const TARGET_FILES = [
  'index.html',
];

const TARGET_DIRS = [
  'src/components',
  'src/data',
  'src/services',
  'src/types',
  'src',
];

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        getAllFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

console.log('🔍 [Brand Masking Check] 開始自動掃描專案檔案是否符合圓圈遮蔽規範...');

let filesToCheck = [...TARGET_FILES];
TARGET_DIRS.forEach(d => {
  if (fs.statSync(d).isDirectory()) {
    getAllFiles(d, filesToCheck);
  }
});

// 轉為唯一列表
filesToCheck = [...new Set(filesToCheck)];

let hasError = false;

for (const filePath of filesToCheck) {
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');

  for (const brand of FORBIDDEN_BRANDS) {
    if (content.includes(brand)) {
      console.error(`❌ [品牌遮蔽檢核失敗] 檔案 ${filePath} 包含未遮蔽的廠牌全稱: "${brand}"！請替換為帶有 ○ 的遮蔽格式。`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('⛔ 建置已被系統中斷：請修正上述未遮蔽的廠牌名稱後再重新打包。');
  process.exit(1);
} else {
  console.log('✅ [Brand Masking Check] 所有 UI 與標籤完全符合品牌圓圈遮蔽規範！');
}
