# lyricsSnippet / youtubeUrl 樣板資料清理結果

## 目標
清除沒有實質辨識價值的樣板 `lyricsSnippet` 與批次產生的 YouTube 搜尋 URL。保留管理者或使用者提供的真辨識提示與真影片連結。

## 稽核結論
1. `server/database.json` 有 52,913 筆 `lyricsSnippet`。
2. 其中 52,413 筆是「全台 10 大 KTV」樣板文。
3. 另外 500 筆是「KTV 歌曲資料待校對」樣板文。
4. `server/database.json` 有 52,413 筆 `youtubeUrl`，全部都是 `youtube.com/results?search_query=` 搜尋頁，不是真影片 URL。
5. `server/catalog_overrides.json` 有 4 筆 `lyricsSnippet`，其中 2 筆樣板已清除，2 筆非樣板已保留。

## 已執行
1. 新增 `scripts/clearGeneratedReferenceMetadata.js`，只清除樣板 snippet 與 YouTube 搜尋 URL。
2. 清除 `server/database.json` 的 52,913 筆樣板 snippet。
3. 清除 `server/database.json` 的 52,413 筆 YouTube 搜尋 URL。
4. 清除 `server/catalog_overrides.json` 的 2 筆樣板 snippet 與 7 筆 YouTube 搜尋 URL。
5. 將前台改為動態產生 YouTube 搜尋 URL，不再依賴資料庫儲存搜尋頁。
6. 將前台搜尋改為只索引有意義的辨識提示。
7. 將 `Song.lyricsSnippet` 改為 optional。
8. 將後台/API 儲存空 snippet 或空 URL 時改為省略欄位。
9. 重建 `public/songs_catalog.bin`。

## 驗證結果
1. 執行 `node scripts/clearGeneratedReferenceMetadata.js` dry-run，確認清理範圍。
2. 執行 `node scripts/clearGeneratedReferenceMetadata.js --apply`，主資料由 35.49 MB 降至 24.61 MB。
3. 執行 `node scripts/validateSlimNoteCandidate.js --candidate C:\tmp\database.slim-note.json`，結果 `success: true`。
4. 執行 `node --check server/index.js`，通過。
5. 執行後台 HTML script parse，通過。
6. 執行 `npm run build`，通過，catalog 輸出 24.61 MB。

## 後續規則
1. 不要儲存 YouTube 搜尋頁 URL。
2. 只有真影片、官方頁面或使用者提供的明確參考連結才寫入 `youtubeUrl`。
3. 不要儲存樣板辨識提示。
4. 只有能幫助辨認歌曲版本、歌詞片段、別名或特殊版本的內容才寫入 `lyricsSnippet`。
5. 前台需要 YouTube 參考時，直接用歌手與歌名動態產生搜尋連結。

## 尚未完成
1. 請在線上 Render 環境驗證搜尋、歌曲卡片、歌曲詳情與矩陣列表的 YouTube 連結是否正常。
2. 下一步請重新盤點 `lyricist` 與 `composer` 是否大量等同 artist；若只是批次填入歌手名，需另開稽核，不得直接刪除。
