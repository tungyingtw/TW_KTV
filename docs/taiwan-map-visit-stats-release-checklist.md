# 全台歌友熱度上線檢查清單

此文件用於正式上線前與上線後 24 小時觀察。執行時必須依序處理，不得跳過資料保護、環境變數與回滾確認。

## 上線前阻擋項目

1. 確認地區熱度是否已和既有 `/api/stats/ping` 的 `tw_ktv_vid` 與 12 小時去重規則對齊。
2. 不要建立獨立的 IP 自動計數流程；累積查詢是主帳本，縣市熱度只能作為同一筆到訪的分布欄位。
3. 確認 `POST /api/visit-region-stats/record` 若要自動追加縣市，只能在 `/api/stats/ping` 實際讓累積查詢加 1 的同一事件後執行。
4. 若 `record` 尚未接入 GeoIP 自動判斷，不要啟用自動到訪追加；只允許使用者在 modal 內透過「我在這裡」手動修正同一個 `visitor_id` 的地區。
5. 確認正式環境已設定 `VISIT_STATS_HASH_SECRET`，且不得使用開發 fallback secret。
6. 確認正式環境已設定 `UPSTASH_REDIS_REST_URL` 與 `UPSTASH_REDIS_REST_TOKEN`。
7. 若要啟用自動 IP 推估，先設定 `GEOIP_CITY_DB_PATH` 指向可讀取的 MaxMind GeoLite2 City 或 GeoIP2 City MMDB。
8. 若未設定 `GEOIP_CITY_DB_PATH`，不得宣稱網站會自動判斷縣市；前端只能保留手動「我在這裡」修正流程。
9. 確認 `VISIT_REGION_STATS_PATH` 指向正式持久化位置；不得指到暫存資料夾。

## Seed 與 Top-Up

正式 seed 必須依照 `docs/taiwan-map-seed-runbook.md` 執行。

1. 讀取 `GET /api/stats/total`，確認可取得線上最新累積查詢總數，且此 API 不會遞增累積查詢。
2. 執行 dry-run，確認可讀取線上最新累積查詢總數：

```bash
node scripts/seedVisitRegionStats.js --dry-run
```

3. 檢查 dry-run 輸出的 `seedBaselineTotal` 是否等於目前線上最新累積查詢總數。
4. 若正式統計檔尚未 seed，執行正式 seed：

```bash
node scripts/seedVisitRegionStats.js --apply
```

5. 若正式統計檔已 seed，且線上累積查詢總數比 `seedBaselineTotal` 更高，執行 top-up：

```bash
node scripts/seedVisitRegionStats.js --apply --top-up
```

6. 不要在正式環境使用 `--baseline-total`。
7. 不要使用 `--force`，除非已先備份正式統計檔並確認要重建 seed。
8. 完成 seed 或 top-up 後，讀取 `GET /api/visit-region-stats`，確認 `total_seed_count` 與線上累積查詢基準一致。

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

## 回滾方式

1. 若 API 異常，先在前端隱藏或停用「我在這裡」，保留只讀地圖。
2. 若統計資料異常，停止 `POST /api/visit-region-stats/record` 與 `POST /api/visit-region-stats/correct-region`。
3. 若 GeoIP 對應錯誤，關閉自動記錄，只保留使用者手動修正。
4. 若統計檔損壞，使用 `visit_region_stats.json.backups` 中最近備份還原。
5. 若沒有可用備份，重新執行 seed，將 `live_count` 歸零並記錄處理時間。

## 上線後 24 小時觀察

1. 每 1 小時讀取一次 `GET /api/visit-region-stats`。
2. 記錄 `total_live_count`、Top 5 縣市與是否有單一縣市異常集中。
3. 若單一縣市在短時間內暴增，檢查去重 hash、proxy header 與 GeoIP 對應。
4. 若 `total_live_count` 完全不增加，檢查前端是否有送出修正或自動記錄是否被關閉。
5. 24 小時後彙整觀察結果，再決定是否啟用或調整自動 GeoIP 到訪追加。
