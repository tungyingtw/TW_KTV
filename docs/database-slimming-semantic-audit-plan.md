# database.json 瘦身與語意校正計畫

## 目標

降低 `server/database.json` 與 `public/songs_catalog.bin` 在 Render 免費環境中的讀取、建置與傳輸壓力，同時修正可能由匯入預設值造成的前台誤導。

## 現況盤點

截至 2026-08-07，本機 `server/database.json` 統計如下：

1. 歌曲數：109,363。
2. 品牌收錄狀態數：268,640。
3. `brand.available`：268,640 筆皆為 `true`。
4. `brand.note`：268,640 筆皆有值，多數為匯入批次字串。
5. 清理前 `brand.audioType`：191,810 筆皆為舊版假音訊標記。
6. `brand.mvType`：191,810 筆皆為 `official_mv`。
7. `lyricsSnippet`、`youtubeUrl`、`lyricist`、`composer`、`zhuyin`、`pinyin`、`releaseYear` 目前仍被前台搜尋、排序或詳情頁使用，不得直接刪除。

估算可節省空間：

1. 移除 `brand.note`：約 8.80 MB。
2. 移除 `brand.audioType`：約 5.30 MB。
3. 移除 `brand.mvType`：約 4.21 MB。
4. 移除 `brand.available`：約 4.36 MB。

## 系統規則

1. 不得直接批次修改正式 `database.json`，必須先產生候選檔與 diff 摘要。
2. 不得刪除會影響搜尋、排序、詳情頁顯示或後台採納流程的欄位。
3. 不得把「缺少欄位」解讀為「確認沒有功能」，缺少欄位必須代表未知或未驗證。
4. `official_mv`、`reedited_mv`、`guided_vocal`、`backing_track` 必須只由明確資料來源、管理者採納或社群驗證流程寫入。
5. 若欄位目前只是匯入批次來源，必須改為批次層級 metadata 或後台匯入紀錄，不得逐首逐品牌重複存放。
6. 任何瘦身都必須保留還原方式，且必須能透過備份匯入或候選檔回復。

## Phase 1：只讀稽核

執行以下動作：

1. 統計所有 song 層級欄位的出現次數與非空值數。
2. 統計所有 brand 層級欄位的出現次數與非空值數。
3. 列出 `brand.note` 前 20 個高頻內容。
4. 列出 `brand.audioType` 與 `brand.mvType` 的值分布。
5. 比對前台與後台程式碼是否仍讀取這些欄位。
6. 產生 `docs/database-slimming-semantic-audit-result.md`，不得修改資料庫。

完成標準：

1. 文件必須列出每個候選欄位的保留、轉換或刪除建議。
2. 文件必須列出預估節省大小。
3. 文件必須列出使用者可見風險。

## Phase 2：建立候選轉換腳本

執行以下動作：

1. 建立只輸出候選檔的腳本，不得覆寫 `server/database.json`。
2. 將重複匯入來源型 `brand.note` 抽離或移除。
3. 將疑似預設灌入的 `brand.audioType` 與 `brand.mvType` 改為未驗證狀態。
4. 保留由後台採納、人工修正或明確來源產生的 `audioType` 與 `mvType`。
5. 若無法判斷來源，必須保留原值並標記為需人工確認。
6. 輸出候選檔大小、刪除欄位數量與保留欄位數量。

完成標準：

1. 候選檔必須可被 `scripts/buildCatalogBin.js` 打包。
2. 候選檔不得造成前台搜尋結果筆數異常下降。
3. 候選檔不得讓後台歌曲編輯 API 無法讀寫。

## Phase 3：前後台語意修正

執行以下動作：

1. 將前台顯示規則調整為「缺少 `mvType` 表示未確認」，不得顯示為沒有原版 MV。
2. 將前台顯示規則調整為「缺少 `audioType` 表示未確認」，不得顯示為無導唱。
3. 檢查篩選器：`原版 MV` 只能篩出 `official_mv`。
4. 檢查篩選器：`有導唱` 只能篩出 `guided_vocal`。
5. 後台編輯器必須允許管理者清空 `audioType` 與 `mvType`。
6. 後台採納流程必須只寫入使用者或管理者明確選定的值。

完成標準：

1. 使用者不會因缺少欄位看到錯誤肯定或錯誤否定。
2. 管理者可將錯誤預設值清回未標記。
3. 社群投票與建議新增歌曲仍可重新補齊資料。

## Phase 4：小批次套用

執行以下動作：

1. 先建立完整備份。
2. 只針對 `brand.note` 做第一批瘦身。
3. 建置並線上驗證。
4. 再評估 `audioType` 與 `mvType` 是否分批清理。
5. 最後才評估是否移除 `available: true`。

完成標準：

1. 每一批都必須有獨立 commit。
2. 每一批都必須可以回復。
3. 每一批都必須通過 `npm run build`。
4. 每一批都必須記錄線上驗證結果。

## 暫不處理

1. 暫不刪除 `lyricsSnippet` 與 `youtubeUrl`。
2. 暫不刪除 `zhuyin` 與 `pinyin`。
3. 暫不刪除 `lyricist`、`composer` 與 `releaseYear`。
4. 暫不把資料庫遷移到外部資料庫。
5. 暫不把 `available` 改成隱含規則，除非前後台讀取點都已完成相容調整。

