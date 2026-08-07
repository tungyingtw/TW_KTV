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
18. `brand.note` 第一批瘦身已正式套用，固定匯入 note 已移除，含 `點歌碼衝突` 的 note 已保留。

## 舊計畫書狀態

已完成的後台封存、投票壓縮、第二輪巡檢與前台 Phase 5 QA 細部文件已從版本內清除。後續判斷必須以本文件、`docs/legacy-plan-status-2026-08-07.md`、`docs/database-slimming-final-audit-2026-08-07.md` 與 `docs/render-online-validation-checklist.md` 為準。

## 仍需處理

1. 已完成線上 Render 驗證，前台與後台主要流程目前不再列為待驗證項目。
2. 若未來發現資料量或速度問題，必須先記錄 API、資料量、等待時間與操作步驟，再決定是否建立 review queue 永久索引。
3. 若未來要整理 `brand.note`，必須先建立衝突資訊的替代結構，不得直接刪除。

## 暫不處理

1. 暫不建立 review queue 永久索引。只有在線上資料量變大、待處理載入明顯變慢時才執行。
2. 暫不改成 Postgres 或其他資料庫。免費 Render 與 Upstash Redis 仍可先透過封存、快取、摘要與備份治理維持。
3. 暫不建立自動封存還原 UI。封存資料還原仍必須透過全站備份匯入或人工修復流程確認後執行。
4. 暫不直接刪除 `database.json` 欄位。必須先完成只讀稽核、候選檔、前後台驗證與可回復流程。

## 下一步

1. 維持目前資料治理規則，不要重複執行已完成的舊計畫。
2. 若使用者回報線上異常，先依 `docs/render-online-validation-checklist.md` 重現，再檢查靜態 catalog、Redis 覆寫與 API 回傳來源。
3. 若需要新增資料匯入流程，必須另開新計畫，不得直接改動既有瘦身結果。

## 2026-08-07 補充：資料瘦身收尾

已完成以下項目，後續不得重複執行同類清理：

1. 已將 `available:true` 改為隱含規則，只保留 `available:false`。
2. 已清除 `zhuyin:AUTO` 與 `pinyin:AUTO` 佔位值。
3. 已清除不可信 `releaseYear` 預設值，保留覆寫檔內 1 筆 2019。
4. 已清除樣板 `lyricsSnippet` 與批次 YouTube 搜尋 URL。
5. 已清除等同 artist 的批次 `lyricist` 與 `composer`。
6. 已清除 optional 欄位空字串與空 `brand.code`。
7. 已重建 `public/songs_catalog.bin`，目前輸出約 19.30 MB。

資料瘦身主要項目已完成，線上 Render 驗證已由使用者確認完成。舊計畫文件狀態已整理至 `docs/legacy-plan-status-2026-08-07.md`。
