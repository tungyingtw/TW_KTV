# lyricist / composer 批次預設清理結果

## 目標
清除批次產生且等同 `artist` 的 `lyricist` 與 `composer`。保留管理者或使用者未來提供的真作詞、真作曲資料。

## 稽核結論
1. `server/database.json` 有 52,913 筆 `lyricist`，全部等於 `artist`。
2. `server/database.json` 有 52,913 筆 `composer`，全部等於 `artist`。
3. 沒有任何 `lyricist` 或 `composer` 不等於 `artist` 的主資料樣本。
4. `server/catalog_overrides.json` 有 4 筆 `lyricist` 與 4 筆 `composer`，皆不等於 `artist`，判定應保留。

## 已執行
1. 新增 `scripts/clearGeneratedCredits.js`，只清除等同 artist 的詞曲欄位。
2. 清除 `server/database.json` 的 52,913 筆假 `lyricist`。
3. 清除 `server/database.json` 的 52,913 筆假 `composer`。
4. 保留 `server/catalog_overrides.json` 的 4 筆真 `lyricist` 與 4 筆真 `composer`。
5. 將 `Song.lyricist` 與 `Song.composer` 改為 optional。
6. 將前台搜尋與顯示改為只使用有意義的詞曲資料。
7. 將後台/API 儲存空詞曲時改為省略欄位。
8. 重建 `public/songs_catalog.bin`。

## 驗證結果
1. 執行 `node scripts/clearGeneratedCredits.js` dry-run，確認清理範圍。
2. 執行 `node scripts/clearGeneratedCredits.js --apply`，主資料由 24.61 MB 降至 22.20 MB。
3. 執行 `node scripts/validateSlimNoteCandidate.js --candidate C:\tmp\database.slim-note.json`，結果 `success: true`。
4. 執行 `node --check server/index.js`，通過。
5. 執行後台 HTML script parse，通過。
6. 執行 `npm run build`，通過，catalog 輸出 22.20 MB。

## 後續規則
1. 不要把歌手名自動寫入 `lyricist` 或 `composer`。
2. 只有可信來源提供明確作詞或作曲資訊時，才寫入欄位。
3. 前台顯示與搜尋必須忽略等同 `artist` 的詞曲欄位。

## 尚未完成
1. 請在線上 Render 環境驗證搜尋、歌曲卡片、歌曲詳情與矩陣列表是否正常。
2. 下一步請重新盤點剩餘可疑欄位與文件待辦，確認是否已無大型資料瘦身項目。
