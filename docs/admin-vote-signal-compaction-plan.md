# 後台投票訊號壓縮執行計畫

## 目標

降低 `votes` 在免費 Render 環境中無限制成長造成的風險。保留尚未處理、仍會影響前台顯示或後台待處理判斷的投票訊號；將已由後台採納或駁回的投票維度轉入輕量封存摘要。

## Render 免費環境限制

1. 不得設計需要長時間 CPU 掃描才能回應的後台列表。
2. 不得假設 JSON 主檔可以永久無限制成長。
3. 不得在一般使用者每次查詢時觸發大型資料整理。
4. 不得在封存失敗時刪除或縮減主檔資料。
5. 必須讓後台資料成長摘要顯示目前主檔量與封存量。

## 執行規則

1. 當管理者處理 `availability_vote:{key}` 後，只壓縮該 key 的 `confirm` 與 `deny`。
2. 當管理者處理 `guided_vote:{key}` 後，只壓縮該 key 的 `guidedVocal` 與 `noGuidedVocal`。
3. 當管理者處理 `mv_vote:{key}` 後，只壓縮該 key 的 `officialMv` 與 `editedMv`。
4. 若同一 key 還有其他未處理維度，必須保留該 key。
5. 若同一 key 所有投票維度都已歸零，必須從 `votes` 主檔移除。
6. 壓縮前必須先寫入 `votes_archived_signals`，寫入失敗時不得修改 `votes` 主檔。

## 驗證步驟

1. 執行 `node --check server/index.js`。
2. 執行 `npm run build`。
3. 建立含有收錄、導唱、MV 三種投票的測試資料。
4. 只處理收錄狀態，確認導唱與 MV 票數仍留在 `votes`。
5. 處理全部三種維度後，確認該 key 從 `votes` 主檔移除。
6. 確認 `votes_archived_signals` 具有被壓縮維度的摘要。
7. 確認後台資料成長摘要顯示 `activeEntries` 與 `archivedEntries`。

## 後續項目

1. 建立後台封存投票摘要查詢 API。
2. 將 review queue 改為使用預先整理的待處理索引，避免每次掃描完整 `votes`。
3. 規劃 Postgres 或更完整 Redis index，作為資料量成長後的升級路線。

## 2026-08-07 狀態覆核

本計畫的主要程式項目已完成。已處理投票訊號會轉入 `votes_archived_signals`，後台封存查詢與全站備份也已包含該封存資料。

後續暫不建立 review queue 永久索引。只有在線上資料量變大、待處理載入明顯變慢時，才依 `docs/admin-data-governance-status-2026-08-07.md` 重新評估。
