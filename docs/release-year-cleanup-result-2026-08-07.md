# releaseYear 不可信預設值清理結果

## 目標
清除批次匯入造成的不可信 `releaseYear`。年份會影響前台詳情頁與「最新發行」排序，因此不得保留假年份誤導使用者。

## 稽核結論
1. `server/database.json` 只有兩種年份：2010 共 52,413 筆、2026 共 56,950 筆。
2. 2010 資料全部帶有「全台 10 大 KTV」樣板文與 YouTube 搜尋連結，判定為批次預設。
3. 2026 資料多數沒有補充資料，判定為批次匯入當年預設。
4. `server/catalog_overrides.json` 有 1 筆 2019，未納入清理，保留為可能可信的管理資料。

## 已執行
1. 將 `Song.releaseYear` 改為 optional。
2. 將後台歌曲儲存改為不再自動補入今年。
3. 新增 `scripts/clearUntrustedReleaseYears.js`，只清除 2010 與 2026。
4. 清除 `server/database.json` 的 109,363 個不可信年份。
5. 清除 `server/catalog_overrides.json` 的 11 個不可信年份，保留 1 個 2019。
6. 移除前台「最新發行」排序選項，避免使用者誤解資料有真實年份。
7. 重建 `public/songs_catalog.bin`。

## 驗證結果
1. 執行 `node scripts/clearUntrustedReleaseYears.js` dry-run，確認清理範圍。
2. 執行 `node scripts/clearUntrustedReleaseYears.js --apply`，主資料由 37.47 MB 降至 35.49 MB。
3. 執行 `node scripts/validateSlimNoteCandidate.js --candidate C:\tmp\database.slim-note.json`，結果 `success: true`。
4. 執行 `node --check server/index.js`，通過。
5. 執行後台 HTML script parse，通過。
6. 執行 `npm run build`，通過，catalog 輸出 35.49 MB。

## 後續規則
1. 不要自動補入今年作為歌曲發行年。
2. 只有管理者或可信來源提供明確年份時，才寫入 `releaseYear`。
3. 前台不得提供依年份排序，直到資料庫已有足夠可信年份。
4. 後台可保留年份排序，用於管理者檢查少量手動年份資料。

## 尚未完成
1. 請在線上 Render 環境驗證首頁、歌曲詳情與手機篩選排序是否正常。
2. 下一步請評估 `lyricsSnippet` 與 `youtubeUrl` 的資料策略；不得直接刪除，必須先決定是否改成按需顯示或外部搜尋連結。
