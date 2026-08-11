# 全台歌友熱度上線檢查清單

此文件用於正式上線前與上線後 24 小時觀察。執行時必須依序處理，不得跳過資料保護、環境變數與回滾確認。

## 上線前阻擋項目

1. 確認地區熱度是否已和既有 `/api/stats/ping` 的 `tw_ktv_vid` 與 12 小時去重規則對齊。
2. 不要建立獨立的 IP 自動計數流程；累積查詢是主帳本，縣市熱度只能作為同一筆到訪的分布欄位。
3. 確認 `POST /api/visit-region-stats/record` 若要自動追加縣市，只能在 `/api/stats/ping` 實際讓累積查詢加 1 的同一事件後執行。
4. 確認自動到訪追加只接在 `/api/stats/ping` 實際新增累積查詢的同一事件，不得建立獨立計數流程。
5. 確認正式環境已設定 `VISIT_STATS_HASH_SECRET`，且不得使用開發 fallback secret。
6. 確認正式環境已設定 `UPSTASH_REDIS_REST_URL` 與 `UPSTASH_REDIS_REST_TOKEN`。
7. 自動 IP 推估預設使用 ipwhois.io free endpoint；不得在失敗、timeout 或超量時阻塞查歌或累積查詢。
8. 若要停用自動推估，設定 `VISIT_REGION_AUTO_GEOIP=false`，前端仍保留手動「我在這裡」修正流程。
9. 境外 IP 必須記錄到「其他國家」，不得硬分配到台灣縣市。
10. 確認地區熱度使用 Upstash Redis key `ktv:visitRegionStats`；Render 免費方案不得要求 Persistent Disk。

## Seed 與 Top-Up

正式 seed 必須依照 `docs/taiwan-map-seed-runbook.md` 執行。

1. 讀取 `GET /api/stats/total`，確認可取得線上最新累積查詢總數，且此 API 不會遞增累積查詢。
2. 執行 dry-run，確認可讀取線上最新累積查詢總數：

```bash
node scripts/seedVisitRegionStats.js --dry-run
```

3. 檢查 dry-run 輸出的 `seedBaselineTotal` 是否等於目前線上最新累積查詢總數。
4. 若正式 Redis 統計資料尚未 seed，執行正式 seed：

```bash
node scripts/seedVisitRegionStats.js --apply
```

5. 若正式 Redis 統計資料已 seed，且線上累積查詢總數比 `seedBaselineTotal` 更高，執行 top-up：

```bash
node scripts/seedVisitRegionStats.js --apply --top-up
```

6. 不要在正式環境使用 `--baseline-total`。
7. 不要使用 `--force`，除非已先備份正式 Redis key `ktv:visitRegionStats` 並確認要重建 seed。
8. 完成 seed 或 top-up 後，確認腳本輸出的 `storage` 是 `redis`。
9. 讀取 `GET /api/visit-region-stats`，確認 `total_seed_count` 與線上累積查詢基準一致。

## 上線前功能驗證

1. 執行 build：

```bash
npm run build
```

2. 啟動 staging 或本機正式等效環境。
3. 點擊既有「累積查詢」標籤，確認可開啟全台歌友熱度 modal。
4. 點選任一縣市，確認縣市可浮起且側欄資料同步更新。
5. 點擊「我在這裡」，確認送出後顯示操作回饋。
6. 再次選擇另一縣市並送出，確認原縣市扣回、新縣市增加。
7. 重新讀取 `GET /api/visit-region-stats`，確認總數未因修正重複膨脹。
8. 在手機尺寸測試 modal 開啟、捲動、關閉與「我在這裡」按鈕可見性。
9. 確認新訪客觸發 `/api/stats/ping` 時，只有 Redis 12 小時去重成功新增累積查詢的同一事件會呼叫 GeoIP 並追加地區熱度。
10. 確認 GeoIP API 失敗時，`/api/stats/ping` 仍正常回傳累積查詢資料。

## 回滾方式

1. 若 API 異常，先在前端隱藏或停用「我在這裡」，保留只讀地圖。
2. 若統計資料異常，停止 `POST /api/visit-region-stats/record` 與 `POST /api/visit-region-stats/correct-region`。
3. 若 GeoIP 對應錯誤，關閉自動記錄，只保留使用者手動修正。
4. 若 Redis 統計資料異常，先備份目前 `ktv:visitRegionStats` 值，再依 seed runbook 重建。
5. 若沒有可用備份，重新執行 seed，將 `live_count` 歸零並記錄處理時間。

## 上線後 24 小時觀察

1. 每 1 小時讀取一次 `GET /api/visit-region-stats`。
2. 記錄 `total_live_count`、Top 5 縣市與是否有單一縣市異常集中。
3. 若單一縣市在短時間內暴增，檢查去重 hash、proxy header 與 GeoIP 對應。
4. 若 `total_live_count` 完全不增加，檢查前端是否有送出修正或自動記錄是否被關閉。
5. 24 小時後彙整觀察結果，再決定是否啟用或調整自動 GeoIP 到訪追加。
