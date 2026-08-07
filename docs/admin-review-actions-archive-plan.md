# 後台審核處理紀錄封存執行計畫

## 目標

將 `review_actions` 從無限制累積改為可長期營運的資料流：主檔保留近期完整紀錄，舊紀錄依月份封存，並保留輕量已處理索引，避免封存後資料重新回到待處理列表。

## 執行項目

1. 新增 `REVIEW_ACTIONS_ACTIVE_LIMIT`，固定主檔最多保留近期完整處理紀錄。
2. 新增 `review_actions_archive/YYYY-MM.json`，將超出主檔上限的舊紀錄依月份封存。
3. 新增 `review_actions_handled.json` 與 Redis 對應 key，保存已處理項目的 `reviewItemId`、狀態、處理時間。
4. 修改待處理清單判斷，必須同時檢查近期完整紀錄與已處理索引。
5. 修改資料成長摘要，必須顯示主檔上限、已處理索引數、封存檔數與封存筆數。
6. 封存失敗時不得截短主檔，必須保留完整 `review_actions` 並寫入警告 log。

## 驗證步驟

1. 執行 `node --check server/index.js`，確認後端語法正確。
2. 執行 `npm run build`，確認前後端打包流程通過。
3. 在後台處理一筆待處理資料，確認該項目不會回到待處理列表。
4. 將測試環境的 `REVIEW_ACTIONS_ACTIVE_LIMIT` 調低，建立超量資料，確認封存檔出現且主檔縮小。
5. 確認資料成長摘要顯示 `activeLimit`、`handledIndexed`、`archivedFiles`、`archivedRecords`。

## 後續項目

1. 建立管理者匯出封存紀錄的 API。
2. 建立封存月份查詢頁，讓管理者能查舊處理紀錄。
3. 建立 `votes` 已處理訊號壓縮策略，降低投票資料長期堆疊。
4. 建立 `reports` 依日期封存或匯出策略，避免已處理回報永久留在主列表。

## 2026-08-07 狀態覆核

本計畫的主要程式項目已完成。後續不得依本文件舊版「下一步」重複建立封存查詢、封存下載、votes 壓縮或 reports 封存功能。

後續必須改以 `docs/admin-data-governance-status-2026-08-07.md` 作為最新狀態來源，並依 `docs/render-online-validation-checklist.md` 執行線上驗證。
