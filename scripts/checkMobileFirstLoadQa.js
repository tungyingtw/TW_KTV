import fs from 'fs';
import path from 'path';

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function pass(message) {
  console.log(`✅ ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [Mobile First Load QA] ${message}`);
    process.exitCode = 1;
  } else {
    pass(message);
  }
}

function assertIncludes(content, expected, file) {
  assert(content.includes(expected), `${file} 包含必要防護：${expected}`);
}

console.log('🔍 [Mobile First Load QA] 檢查手機首載防護與 catalog 資源...');

const app = read('src/App.tsx');
const mobileSearch = read('src/components/mobile/MobileSearchBar.tsx');
const css = read('src/index.css');
const apiService = read('src/services/apiService.ts');
const manifestPath = path.join(root, 'public', 'songs_catalog.manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert(manifest.mode === 'chunked', 'catalog manifest 使用 chunked 模式');
assert(Array.isArray(manifest.chunks) && manifest.chunks.length > 1, 'catalog manifest 至少有兩個分片');

const totalBytes = manifest.chunks.reduce((sum, chunk) => {
  const chunkPath = path.join(root, 'public', chunk.file);
  assert(fs.existsSync(chunkPath), `catalog 分片存在：${chunk.file}`);
  const actualBytes = fs.statSync(chunkPath).size;
  assert(actualBytes === chunk.bytes, `catalog 分片 bytes 正確：${chunk.file}`);
  return sum + actualBytes;
}, 0);
assert(totalBytes === manifest.totalBytes, 'catalog 分片總 bytes 與 manifest 一致');

assertIncludes(app, 'catalogLoadRequestIdRef', 'src/App.tsx');
assertIncludes(app, 'visibilitychange', 'src/App.tsx');
assertIncludes(app, 'showCatalogRetryHint', 'src/App.tsx');
assertIncludes(app, 'handleCatalogRetry', 'src/App.tsx');
assertIncludes(app, 'forceRefresh', 'src/App.tsx');
assertIncludes(app, 'catalogOverrideSyncStatus', 'src/App.tsx');
assertIncludes(app, 'catalog-sync-notice', 'src/App.tsx');
assertIncludes(app, 'window.scrollTo({ top: Math.max(0, top - stickyOffset), behavior: \'smooth\' })', 'src/App.tsx');

assertIncludes(apiService, 'clearCachedCatalog', 'src/services/apiService.ts');
assertIncludes(apiService, 'CatalogOverrideSyncStatus', 'src/services/apiService.ts');
assertIncludes(apiService, 'onOverrideSync', 'src/services/apiService.ts');
assertIncludes(apiService, 'options.forceRefresh ? null : await getCachedCatalog()', 'src/services/apiService.ts');

assertIncludes(mobileSearch, 'isInteractionLocked', 'src/components/mobile/MobileSearchBar.tsx');
assertIncludes(mobileSearch, '資料載入完成後會自動搜尋', 'src/components/mobile/MobileSearchBar.tsx');

assertIncludes(css, '--mobile-sticky-offset', 'src/index.css');
assertIncludes(css, '.app-results-region', 'src/index.css');
assertIncludes(css, '.catalog-retry-button', 'src/index.css');
assertIncludes(css, '.catalog-sync-notice', 'src/index.css');

if (process.exitCode) {
  console.error('⛔ [Mobile First Load QA] 檢查失敗，請修正上述項目。');
  process.exit(process.exitCode);
}

console.log('✅ [Mobile First Load QA] 手機首載防護檢查通過。');
