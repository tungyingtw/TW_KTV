# 後台使用者回報封存執行計畫

## 目標

避免 `reports` 主檔在 Render 免費環境中無限制成長。主檔必須保留所有 `pending` 回報與近期已處理回報；較舊的已處理回報必須依月份封存，讓後台列表與統計維持可接受的讀取量。

## 執行規則

1. `pending` 回報不得封存，必須留在主檔。
2. 已處理回報包含 `reviewed`、`resolved`、`rejected` 與其他非 `pending` 狀態。
3. 主檔預設保留最多 `REPORTS_ACTIVE_LIMIT=3000` 筆。
4. 若 `pending` 數量已超過上限，仍必須保留所有 `pending`，不得為了上限刪除待處理資料。
5. 超出上限的已處理回報必須依 `reviewedAt`、`resolvedAt` 或 `timestamp` 歸到 `reports_archive/YYYY-MM.json`。
6. 封存成功後才能縮減 `reports` 主檔。
7. 封存失敗時必須保留完整主檔並寫入 warning，不得截斷資料。
8. 後台資料成長摘要必須顯示主檔上限、封存檔數與封存筆數。

## 驗證步驟

1. 執行 `node --check server/index.js`。
2. 執行 `npm run build`。
3. 建立超過上限的已處理回報測試資料。
4. 確認 `pending` 回報仍全部留在主檔。
5. 確認舊已處理回報進入 `reports_archive/YYYY-MM.json`。
6. 確認後台資料成長摘要顯示 `activeLimit`、`archivedFiles`、`archivedRecords`。

## 後續項目

1. 建立封存回報查詢 API。
2. 建立封存回報匯出入口。
3. 為備份匯出加入資料量提示與等待狀態。

## 2026-08-07 狀態覆核

本計畫的主要程式項目已完成。`reports` 主檔已加入上限與月份封存，封存查詢與下載入口也已併入後台「系統維護」。

後續必須改以 `docs/admin-data-governance-status-2026-08-07.md` 作為最新狀態來源，並依 `docs/render-online-validation-checklist.md` 執行線上驗證。
