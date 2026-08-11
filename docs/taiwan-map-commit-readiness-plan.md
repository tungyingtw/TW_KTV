# 台灣地圖功能 Commit 前檢整計畫

此文件給 AI 接手執行 commit 前檢整。執行時必須依序處理，不得重新詢問已定案事項，除非遇到會破壞既有查歌功能或正式資料的阻擋條件。

## 已定案事項

1. 保留正式入口在既有「累積查詢」標籤上，不新增另一顆入口按鈕。
2. 本版先採用「手動我在這裡」修正流程，不啟用獨立 IP 自動計數。
3. 地區熱度必須配合既有 `/api/stats/ping` 的 `tw_ktv_vid` 與 12 小時去重邏輯。
4. 累積查詢是主帳本，縣市熱度只是同一筆到訪的分布欄位。
5. 上線前既有累積查詢數使用 seed/top-up 寫入 `seed_count`，上線後新資料進 `live_count`。
6. 若使用者把地區從 A 改到 B，後端必須扣 A 的 `live_count - 1`，並加 B 的 `live_count + 1`。
7. 正式 seed 不得使用 `--baseline-total`，必須讀取 production Redis 最新 `ktv:totalVisits`。
8. `/api/stats/total` 是累積查詢唯讀 API，不得造成累積查詢遞增。

## Commit 前必修項目

### 1. 修正文案亂碼

1. 檢查並修正以下檔案內所有使用者可見中文、`title`、`aria-label` 與錯誤訊息：
   - `src/components/VisitRegionHeatModal.tsx`
   - `src/components/TaiwanHeatMap.tsx`
   - `src/components/VisitStatsPanel.tsx`
   - `src/components/TaiwanMapDemo.tsx`
2. 不要在正式 UI 出現「demo」、「模擬資料」、「假資料」、「開發預覽」、「seed_count」、「live_count」、「GeoIP」、「IP 判斷」等字眼。
3. 使用以下正式文案方向：
   - 地圖標題：`歌友熱度分布`
   - 統計標題：`累積歌友到訪`
   - 操作按鈕：`我在這裡`
   - 已選狀態：`已在這裡`
   - 更新中：`更新中...`
   - 成功加入：`已加入你的所在城市`
   - 成功修正：`已更新你的所在城市`
   - 讀取失敗：`熱度暫時無法讀取`

### 2. 收斂 demo route

1. 不要讓 `/taiwan-map-demo` 在正式環境公開。
2. 將 `src/main.tsx` 的 demo route 改成只在 `import.meta.env.DEV` 時可進入。
3. 若不是 dev 環境且路徑是 `/taiwan-map-demo`，必須回到正式 `App`，不得渲染 demo。
4. 保留 `TaiwanMapDemo` 元件作為本機預覽，除非使用者明確要求刪除。

### 3. 避免唯讀 API 建立空統計檔

1. 檢查 `GET /api/visit-region-stats`。
2. 不要讓公開讀取 API 在正式 seed 前自動建立空的 `visit_region_stats.json`。
3. 若統計檔不存在，公開 API 必須回傳預設空統計 response，但不得寫檔。
4. 只有 `record`、`correct-region` 或 seed 腳本可以建立/寫入統計檔。
5. 保留壞檔備份與修復流程，但不得因單純讀取就覆蓋正式資料。

### 4. 修正版本控管例外

1. 調整 `.gitignore`，讓本功能必要文件與腳本可以被 commit。
2. 至少加入以下例外：
   - `!docs/taiwan-map-visit-stats-plan.md`
   - `!docs/taiwan-map-visit-stats-release-checklist.md`
   - `!docs/taiwan-map-seed-runbook.md`
   - `!docs/taiwan-map-commit-readiness-plan.md`
   - `!scripts/seedVisitRegionStats.js`
3. 不要解除整個 `docs/` 或整個 `scripts/` 的 ignore。
4. 不要 commit `.env`、正式 secret、正式資料 JSON 或暫存資料。

### 5. 處理 SVG 來源

1. 保留並 commit `public/MapSVG/TaiwanMap.svg`。
2. 不要 commit 根目錄 `MapSVG/`，除非使用者明確要求保留原始素材。
3. 若要保留原始素材，只能另外記錄用途，不得讓正式程式依賴根目錄 `MapSVG/`。

## 驗證項目

1. 執行 build：

```bash
npm run build
```

2. 執行 API smoke test，至少驗證：
   - `GET /api/stats/total` 連續讀取不會遞增累積查詢。
   - `GET /api/visit-region-stats` 可回傳 22 縣市。
   - 同一 `visitor_id` 第一次 `correct-region` 可建立縣市。
   - 同一 `visitor_id` 第二次改縣市會回傳 `from_city_code`，且總數不膨脹。
3. 執行瀏覽器互動測試，至少驗證：
   - 點「累積查詢」可開啟 modal。
   - 點縣市可選取。
   - 點「我在這裡」可更新資料。
   - modal 可關閉。
4. 檢查正式 UI 文案不得有亂碼。
5. 檢查 `git status --short`，確認必要檔案可被版本控管看見。

## 可延後項目

1. GeoIP 自動分配可以延後，不擋本版 commit。
2. production seed 可以延後到部署後，依 `docs/taiwan-map-seed-runbook.md` 執行。
3. 上線後 24 小時觀察可以延後到正式部署後。

## 停止條件

1. 若 build 失敗且不是 sandbox 權限造成，停止並修正。
2. 若 API smoke test 顯示修正地區會讓總數膨脹，停止。
3. 若正式 UI 仍有亂碼，停止。
4. 若 seed 腳本或 runbook 仍被 `.gitignore` 擋住，停止。
5. 若發現會影響查歌、收藏、篩選、回報或後台資料，停止並回報。
