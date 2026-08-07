# 舊計畫文件狀態索引

## 目的
後續 AI 或工程執行時，必須先看本文件、`docs/admin-data-governance-status-2026-08-07.md` 與 `docs/database-slimming-final-audit-2026-08-07.md`。舊計畫書中的「下一步」或「尚未完成」若與本文件衝突，一律視為歷史內容，不得重複執行。

## 資料瘦身文件

舊版資料瘦身細部計畫與階段結果已從版本內清除。後續狀態以 `docs/database-slimming-final-audit-2026-08-07.md` 為準。

目前資料瘦身主要項目已完成。`public/songs_catalog.bin` 約 19.30 MB。不得再直接刪除 `id`、`title`、`artist`、`language`、`brands`、`brand.code` 或衝突用 `brand.note`。

## 後台資料治理文件

舊版後台封存、投票壓縮與第二輪巡檢細部計畫已從版本內清除。後續狀態以 `docs/admin-data-governance-status-2026-08-07.md` 為準。

後台目前不得擴大重構。線上互動驗證已由使用者確認完成；後續只在出現具體異常時依 `docs/render-online-validation-checklist.md` 重現。

## 美化相關文件

舊版前台 Phase 5 QA 摘要已從版本內清除。美化相關草稿若仍存在於本機 docs 目錄，視為歷史參考，不是目前資料治理待辦來源。

若之後要繼續美化，必須由使用者指定新的視覺目標，不得依舊 Phase 自行擴大修改。

## 目前有效下一步

1. 不得重複執行已完成的資料瘦身、封存、投票壓縮與前台 Phase 5 修正。
2. 若使用者回報線上異常，先依 `docs/render-online-validation-checklist.md` 重現，再檢查靜態 catalog、Redis 覆寫與 API 回傳來源。
3. 若之後要新增資料匯入流程或繼續美化，必須另開新計畫並限定範圍。
