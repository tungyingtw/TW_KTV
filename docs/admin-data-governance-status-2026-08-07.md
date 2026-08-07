# 後台資料治理狀態總表

本文件統整截至 2026-08-07 的後台資料治理狀態。後續 AI 或工程執行時，必須先以本文件判斷哪些計畫已完成，避免重複執行舊計畫書中的過期「下一步」。

## 已完成

1. `reports` 主檔已加入上限與月份封存規則。
2. `reports` 必須保留所有 `pending` 回報，不得因上限而刪除待處理資料。
3. 已處理的 `reports` 超出主檔上限後，必須依月份進入 `reports_archive/YYYY-MM.json`。
4. `review_actions` 主檔已加入上限與月份封存規則。
5. `review_actions_handled` 已作為輕量已處理索引，必須避免封存後舊項目回到待處理列表。
6. 已處理投票訊號已加入壓縮規則，必須把已採納或已駁回的投票維度轉入 `votes_archived_signals`。
7. `admin_actions.log` 已加入本機輪替限制與 Redis 保留上限。
8. `/api/admin/stats` 已加入短 TTL 快取。
9. `/api/admin/review-queue` 已加入短 TTL 快取，資料變更時必須失效。
10. 後台「系統維護」已顯示資料成長摘要。
11. 後台「系統維護」已顯示備份匯出估算與匯出等待狀態。
12. 後台「系統維護」已新增封存資料查詢區。
13. `/api/admin/archives` 已提供封存摘要。
14. `/api/admin/archives/:type/:name` 已提供封存下載。
15. 全站備份 `exportVersion: 1.1` 已包含封存資料。
16. 備份匯入預覽已顯示封存資料總筆數。
17. 舊版 `exportVersion: 1.0` 備份仍必須可匯入；沒有封存欄位時，不得覆寫現有封存資料。

## 舊計畫書狀態

以下文件的主要程式項目已完成，但文件內可能仍保留過期的「下一步」文字。後續判斷必須以本文件為準：

1. `docs/admin-review-actions-archive-plan.md`
2. `docs/admin-reports-archive-plan.md`
3. `docs/admin-vote-signal-compaction-plan.md`
4. `docs/render-free-tier-system-governance-plan.md`

以下文件仍可作為操作驗證參考，但不代表還有同名功能必須重新實作：

1. `docs/admin-review-workflow-second-pass.md`
2. `docs/admin-review-workflow-qa-audit.md`
3. `docs/admin-review-resolve-api-validation-runbook.md`
4. `docs/美化相關/phase-5-frontstage-qa-summary.md`

## 仍需處理

1. 必須在線上 Render 環境執行完整驗證清單。
2. 必須確認後台登入帳號實際權限能正確看到或下載封存資料。
3. 必須實測「下載全站備份」後，JSON 是否包含 `data.archives`。
4. 必須實測「匯入備份預覽」是否顯示封存資料總筆數。
5. 必須確認冷啟動時，前台顯示載入/喚醒狀態，不得誤顯示為真正 0 筆結果。
6. 必須確認後台處理項目後，項目不會重新出現在待處理列表。
7. 必須執行 `docs/database-slimming-semantic-audit-plan.md`，先確認 `brand.note`、`brand.audioType`、`brand.mvType` 與 `brand.available` 是否可安全瘦身。
8. 必須依 `docs/database-slimming-validation-runbook.md` 產生候選檔並驗證，不得直接批次覆寫正式 `database.json`。
9. 必須依 `docs/database-slimming-semantic-audit-result.md` 的順序處理：先 `brand.note`，再審查 `audioType/mvType`，最後評估 `available`。
10. 必須用候選檔完成前台搜尋與後台編輯流程驗證後，才可正式套用 `brand.note` 第一批瘦身。
11. `brand.note` 候選檔已通過資料一致性、搜尋樣本與篩選樣本驗證；正式套用前仍必須確認是否接受移除固定匯入 note。

## 暫不處理

1. 暫不建立 review queue 永久索引。只有在線上資料量變大、待處理載入明顯變慢時才執行。
2. 暫不改成 Postgres 或其他資料庫。免費 Render 與 Upstash Redis 仍可先透過封存、快取、摘要與備份治理維持。
3. 暫不建立自動封存還原 UI。封存資料還原仍必須透過全站備份匯入或人工修復流程確認後執行。
4. 暫不直接刪除 `database.json` 欄位。必須先完成只讀稽核、候選檔、前後台驗證與可回復流程。

## 下一步

1. 執行 `docs/render-online-validation-checklist.md`。
2. 驗證完成後，更新本文件的「仍需處理」。
3. 若線上驗證發現資料量或速度問題，先記錄 API、資料量、等待時間與操作步驟，再決定是否建立 review queue 永久索引。
