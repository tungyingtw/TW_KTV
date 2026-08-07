# 資料瘦身收尾盤點

## 目前狀態
`server/database.json` 已完成主要批次預設與空欄位清理。`public/songs_catalog.bin` 目前約 19.30 MB。

## 已完成清理
1. 清除樣板 `brand.note`，保留點歌碼衝突 note。
2. 清除假 `audioType` 與假 `mvType`。
3. 移除 `original_vocal` / 原聲原唱概念。
4. 將 `available:true` 改為隱含規則，只保留 `available:false`。
5. 清除 `zhuyin:AUTO` 與 `pinyin:AUTO`。
6. 清除不可信 `releaseYear`。
7. 清除樣板 `lyricsSnippet` 與批次 YouTube 搜尋 URL。
8. 清除等同 artist 的假 `lyricist` 與 `composer`。
9. 清除 optional 欄位的空字串與空 `brand.code`。

## 目前主要欄位
1. `id`、`title`、`artist`、`language`：前台搜尋、顯示與後台管理必需保留。
2. `brands`：核心 KTV 收錄矩陣，必需保留。
3. `brand.code`：點歌碼，必需保留。
4. `brand.note`：目前只剩點歌碼衝突與人工校正相關 note，暫時保留。
5. `isMainlandViral`：用於陸歌/熱門標記篩選，保留。

## 不建議繼續刪除
1. 不要刪除 `brand.code`，它是點歌核心資料。
2. 不要刪除 `language`，它影響前台語種篩選。
3. 不要刪除 `id`，它影響收藏、回報、投票與覆寫資料對應。
4. 不要刪除 `brand.note` 中的點歌碼衝突資訊，除非已有替代的衝突追蹤欄位。

## 可作為下一步的低風險項目
1. 線上 Render 驗證首頁載入、搜尋、品牌篩選、歌曲詳情與後台歌曲編輯。
2. 整理舊計畫文件，把已完成的過期「下一步」標記為歷史內容。
3. 評估是否需要替 `brand.note` 的衝突資訊建立結構化欄位；未建立前不得刪除 note。

## 驗證結果
1. 執行 `node scripts/clearEmptyOptionalFields.js --apply`，主資料由 22.20 MB 降至 19.30 MB。
2. 執行 `node scripts/validateSlimNoteCandidate.js --candidate C:\tmp\database.slim-note.json`，結果 `success: true`。
3. 執行 `node --check server/index.js`，通過。
4. 執行後台 HTML script parse，通過。
5. 執行 `npm run build`，通過，catalog 輸出 19.30 MB。

## 尚未完成
1. 尚未完成線上 Render 實機驗證。
2. 尚未整理舊計畫文件內過期的下一步文字。
