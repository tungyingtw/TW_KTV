# 舊計畫文件狀態索引

## 目的
後續 AI 或工程執行時，必須先看本文件、`docs/admin-data-governance-status-2026-08-07.md` 與 `docs/database-slimming-final-audit-2026-08-07.md`。舊計畫書中的「下一步」或「尚未完成」若與本文件衝突，一律視為歷史內容，不得重複執行。

## 資料瘦身文件

以下文件已完成主要任務，文件內較早的下一步不得再當成待辦：

1. `docs/database-slimming-semantic-audit-plan.md`
2. `docs/database-slimming-semantic-audit-result.md`
3. `docs/database-slimming-validation-runbook.md`
4. `docs/available-implicit-cleanup-result-2026-08-07.md`
5. `docs/auto-phonetics-cleanup-result-2026-08-07.md`
6. `docs/release-year-cleanup-result-2026-08-07.md`
7. `docs/reference-metadata-cleanup-result-2026-08-07.md`
8. `docs/generated-credits-cleanup-result-2026-08-07.md`
9. `docs/database-slimming-final-audit-2026-08-07.md`

目前資料瘦身主要項目已完成。`public/songs_catalog.bin` 約 19.30 MB。不得再直接刪除 `id`、`title`、`artist`、`language`、`brands`、`brand.code` 或衝突用 `brand.note`。

## 後台資料治理文件

以下文件已完成主要功能，文件內舊下一步不得重複建立同類功能：

1. `docs/admin-review-actions-archive-plan.md`
2. `docs/admin-reports-archive-plan.md`
3. `docs/admin-vote-signal-compaction-plan.md`
4. `docs/render-free-tier-system-governance-plan.md`
5. `docs/admin-review-workflow-second-pass.md`
6. `docs/admin-review-workflow-qa-audit.md`
7. `docs/admin-review-resolve-api-validation-runbook.md`

後台目前不得擴大重構。線上互動驗證已由使用者確認完成；後續只在出現具體異常時依 `docs/render-online-validation-checklist.md` 重現。

## 美化相關文件

以下文件保留為前台視覺與互動規格/歷史紀錄，不是資料治理待辦來源：

1. `docs/美化相關/ktv-visual-refresh-spec.md`
2. `docs/美化相關/ktv-visual-refresh-execution-plan.md`
3. `docs/美化相關/ktv-visual-refresh-ai-guardrails.md`
4. `docs/美化相關/frontstage-layout-filter-execution-plan.md`
5. `docs/美化相關/frontstage-layout-filter-validation-runbook.md`
6. `docs/美化相關/phase-5-frontstage-qa-summary.md`

若之後要繼續美化，必須由使用者指定新的視覺目標，不得依舊 Phase 自行擴大修改。

## 目前有效下一步

1. 不得重複執行已完成的資料瘦身、封存、投票壓縮與前台 Phase 5 修正。
2. 若使用者回報線上異常，先依 `docs/render-online-validation-checklist.md` 重現，再檢查靜態 catalog、Redis 覆寫與 API 回傳來源。
3. 若之後要新增資料匯入流程或繼續美化，必須另開新計畫並限定範圍。
