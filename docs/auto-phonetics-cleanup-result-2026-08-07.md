# AUTO 注音拼音佔位值清理結果

## 目標
清除 `zhuyin` 與 `pinyin` 欄位中的 `AUTO` 佔位值。缺少注音或拼音時，資料應省略欄位；前後台搜尋必須把缺值視為空字串。

## 已執行
1. 將 `Song.zhuyin` 與 `Song.pinyin` 改為 optional。
2. 將後台歌曲儲存改為不再補入 `AUTO`。
3. 將星聚點匯入腳本改為輸出空字串，不再輸出 `AUTO`。
4. 新增 `scripts/clearAutoPhonetics.js`，用於 dry-run 與正式清理。
5. 清除 `server/database.json` 的 100,761 個 `zhuyin:AUTO` 與 100,761 個 `pinyin:AUTO`。
6. 清除 `server/catalog_overrides.json` 的 12 個 `zhuyin:AUTO` 與 12 個 `pinyin:AUTO`。
7. 重建 `public/songs_catalog.bin`。

## 驗證結果
1. 執行 `node scripts/clearAutoPhonetics.js` dry-run，確認沒有真實注音或拼音資料被清除。
2. 執行 `node scripts/clearAutoPhonetics.js --apply`，主資料由 40.55 MB 降至 37.47 MB。
3. 執行 `node scripts/validateSlimNoteCandidate.js --candidate C:\tmp\database.slim-note.json`，結果 `success: true`。
4. 執行 `node --check server/index.js`，通過。
5. 執行後台 HTML script parse，通過。
6. 執行 `npm run build`，通過，catalog 輸出 37.47 MB。

## 後續規則
1. 不要把空注音或空拼音寫成 `AUTO`。
2. 搜尋時必須將缺少的 `zhuyin` 與 `pinyin` 視為空字串。
3. 若未來要加入真實注音或拼音，必須只寫入真實可搜尋值。

## 尚未完成
1. 請在線上 Render 環境驗證搜尋、首頁載入與後台歌曲編輯是否正常。
2. 下一步請評估 `releaseYear` 是否存在大量批次預設值，以及是否應改成 optional 或只保留可信年份。
3. 不要直接移除 `lyricsSnippet` 或 `youtubeUrl`，因為它們會影響搜尋、詳情頁與參考連結。
