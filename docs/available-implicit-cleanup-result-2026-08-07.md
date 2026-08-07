# available 隱含規則清理結果

## 目標
將 `available:true` 改為隱含狀態：品牌 key 存在且 `available !== false` 即代表有收錄。只保留 `available:false`，用來表示管理者明確判定未收錄。

## 已執行
1. 將前台列表、卡片、收藏、歌曲詳情篩選改用 `isBrandAvailable(status)`。
2. 將後台列表、歌曲編輯器、統計與 API 判斷改用 `available !== false`。
3. 清除 `server/database.json` 的 268,640 個 `available:true`。
4. 清除 `server/catalog_overrides.json` 的 17 個 `available:true`，保留 116 個 `available:false`。
5. 調整後台歌曲編輯器：不要送出沒有勾選、沒有內容、也不是既有狀態的品牌。
6. 調整單品牌更新 API：有收錄時不要寫入 `available:true`，未收錄時才寫入 `available:false`。
7. 重建 `public/songs_catalog.bin`。

## 驗證結果
1. 執行 `node scripts/clearRedundantAvailableTrue.js` dry-run，確認清理範圍。
2. 執行 `node scripts/clearRedundantAvailableTrue.js --apply`，主資料由 44.90 MB 降至 40.55 MB。
3. 執行 `node scripts/validateSlimNoteCandidate.js --candidate C:\tmp\database.slim-note.json`，結果 `success: true`。
4. 執行 `node --check server/index.js`，通過。
5. 執行後台 HTML script parse，通過。
6. 執行 `npm run build`，通過，catalog 輸出 40.55 MB。

## 後續規則
1. 寫入收錄狀態時，不要儲存 `available:true`。
2. 寫入未收錄狀態時，必須儲存 `available:false`。
3. 讀取收錄狀態時，必須使用「品牌 key 存在且 `available !== false`」判斷。
4. 如果後續新增資料匯入腳本，必須在輸出前移除所有 `available:true`。

## 尚未完成
1. 請在線上 Render 環境驗證首頁歌曲數、品牌篩選、後台歌曲編輯與單品牌狀態更新是否正常。
2. `zhuyin:AUTO` 與 `pinyin:AUTO` 已於 `docs/auto-phonetics-cleanup-result-2026-08-07.md` 處理完成。
3. 下一步請評估 `releaseYear` 是否存在大量批次預設值，以及是否應改成 optional 或只保留可信年份。
