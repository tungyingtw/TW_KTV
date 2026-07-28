# AGENTS.md - Agent 開發規範與指引

本文件定義 AI Agent 在本專案（KTV 系統）開發過程中的行為規範、程式碼風格、架構設計與驗證要求。

---

## 1. 通用開發原則 (General Principles)

- **嚴格驗證 (Strict Verification)**：修改或新增程式碼後，必須進行相應的建置與測試驗證（如 `npm run build` 或 `node --check`），切勿在未驗證的情況下宣告完成。
- **維護既有架構 (Preserve Architecture)**：遵循現有專案架構與命名規範，避免無意義的重構或引入不必要的依賴庫。
- **不假設與盲猜 (No Guessing)**：遭遇錯誤時必須讀取完整的錯誤日誌（Log/Stack Trace/DevTools Console），以實際數據為依據進行除錯。

---

## 2. 程式碼風格與規範 (Code Style & Standards)

### 2.1 命名規範
- **類別 / 介面**：使用 PascalCase（例：`PlayerManager`, `IKtvService`）
- **變數 / 區域變數**：使用 camelCase（例：`currentSongIndex`, `isPlaying`）
- **常數**：使用 UPPER_SNAKE_CASE（例：`MAX_QUEUE_LIMIT`, `ADMIN_TOKEN`）

### 2.2 註解與文件
- 保持必要的註解與 Docstring，說明「為什麼這樣做」而非「做了什麼」。
- 請勿刪除無關的既有註解與文件說明。

---

## 3. 測試與驗證規範 (Testing & Verification)

- **自動化測試**：任何核心邏輯變更均需執行或補充相應的單元測試 (Unit Test)。
- **建置檢查**：確保專案可正常 Compile / Build，無語法或型別錯誤。

---

## 4. 巨量歌庫效能與快取規範 (Performance & Big-Data Caching)

- **IndexedDB 本地快取 (Local Cache)**：針對超過 10 萬筆的大型歌冊數據，優先使用本機 IndexedDB 快取，實現 $<50\text{ms}$ 秒開。
- **串流進度體驗 (Streaming Progress)**：大檔案下載需配合 HTML5 `ReadableStream` 即時計算進度，並搭配平滑填滿動畫與過場，避免畫面跳變閃爍。

---

## 5. 後端資安與眾包自癒規範 (Backend Security & Auto-Consensus)

- **本機獨佔存取 (Localhost-Only Enforcement)**：管理後台 (`/sys-admin-panel`) 及管理員控制 API，必須過濾 `X-Forwarded-For` 與 IP 來源，**嚴禁開放外網連線直接存取**。
- **自動共識與自癒 (Auto-Consensus)**：現場勘誤與群眾投票 (`no_song`, `has_song`, 否決票) 優先交由伺服器共識演算法自動更新判定，降低管理員負擔。

---

## 6. Git 提交與變更規範 (Git & Commit Conventions)

- **Commit 訊息格式**：`type(scope): description`
  - `feat`: 新增功能
  - `fix`: 修復 Bug
  - `refactor`: 重構程式碼
  - `docs`: 修改文件
  - `test`: 新增或修改測試

### 6.1 Git 本機 Commit 與推送權限規範 (Strict Local-Commit-Only Directive)
- **僅限本機 Commit (Local Commit Only)**：AI Agent 完成程式碼修復或功能開發且驗證通過後，**僅允許執行本機 `git add` 與 `git commit`** 紀錄版本歷史。
- **嚴禁 AI Agent 執行 `git push` (No AI-Initiated Push)**：**推送上傳至 GitHub (`git push`) 100% 由使用者本人親自手動點擊執行**。AI Agent 嚴禁自動或請求執行 `git push` 指令。
