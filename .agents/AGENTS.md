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

---

## 7. 資安隔離與內部維護腳本規範 (Security & Internal Script Isolation)

- **內部維護腳本嚴格隔離 (Strict Script Isolation)**：本機開發、資料清洗與爬蟲測試腳本 (`scripts/*.py` 等)，必須全數保持在 `.gitignore` 隔離範疇中，**嚴禁將內部採集工具與明文數據檔 (`public/songs_catalog.json`) Commit 上傳至遠端倉庫**。
- **歌冊二進位加密發布 (Binary Encrypted Catalog Only)**：對對外發布與生產環境只允許使用 `songs_catalog.bin` 二進位加密包，防範數據被全盤下載或抄襲。

---

## 8. 商業廠牌名稱圓圈遮蔽與 UI 淨化規範 (Strict Brand Name Masking & Clean UI Directive)

- **商業廠牌 100% 強制圓圈遮蔽 (`○`)**：為保護專案隱私與避免商標爭議，**所有 UI 元件、說明指南、Modal 視窗、HTML 靜態頁面、SEO Meta 標籤及 Schema.org JSON-LD 中的廠牌名稱，必須一律進行圓圈遮蔽**：
  - 錢櫃 ➔ **`錢○`**
  - 好樂迪 ➔ **`好○迪`**
  - 享溫馨 ➔ **`享○馨`**
  - 星聚點 ➔ **`星○點`**
  - 超級巨星 ➔ **`超○巨星`**
  - 音圓 ➔ **`音○`**
  - 金嗓 ➔ **`金○`**
  - 弘音 ➔ **`弘○`**
  - SingGo ➔ **`Sing○`**
  - V-MIX / V-Mix ➔ **`V-M○X`**
- **嚴禁未遮蔽全稱對外發布**：AI Agent 新增或修改任何功能、導覽專題或 Modal 時，**嚴禁將上述品牌之無遮蔽全稱硬編碼寫入 UI**。
- **全站 UI 淨化與表情符號控制**：符合 Google AdSense 規範，UI 介面與按鈕內嚴禁過度堆疊 Emoji 符號（如 📢, 🎤, 🎬, 🏷️, 🎵, 💡, 🎯, ❓, ✨, ⚑, 🔒, ✅, 📖, ℹ️）與多餘驚嘆號 `！`，保持企業級專業乾淨排版。
- **自動化防護攔截**：專案已配置 `scripts/checkBrandMasking.js`，每次執行 `npm run build` 時會自動進行靜態掃描。若發現未遮蔽廠牌名稱，打包程序將強制終止。

---

## 9. AI 開發者自我檢查與品質驗證規範 (AI Self-Inspection Checklist Directive)

在每次完成程式碼修改、UI 元件新增或功能重構後，AI Agent **必須強制自主執行以下 6 大品質維度檢驗**，確認零瑕疵後方可回報完成：

### 9.1 視覺佈局穩定度檢驗 (Layout Shift Prevention Check)
- [ ] **固定版型保護**：Table 或 Grid 在「無過濾」、「全過濾」、「關鍵字搜尋」時，欄位與容器寬度是否會發生任何跳動、偏移或位移？（必須配置 `tableLayout: 'fixed'`、`scrollbarGutter: 'stable'` 或固定 CSS `width` / `minWidth`）。

### 9.2 跨平台與尺寸一致性檢驗 (Responsive & Badge Uniformity Check)
- [ ] **膠囊與標籤高寬齊平**：所有狀態（有收錄/未收錄/MV/原唱）下的膠囊標籤高度 (`height`) 與最小寬度 (`minWidth`) 是否 100% 齊平一致？
- [ ] **桌面與行動端對齊**：網頁版 (`Desktop`) 與手機版 (`Mobile`) 的元件色彩、專屬代表色、透光彩框與字體主題是否 100% 雙向對齊？

### 9.3 防溢出與防破版檢驗 (Overflow & Wrap Safeguard Check)
- [ ] **極端文字邊界防護**：當出現極長廠牌名稱、位數龐大的數字、極長歌名或創作者姓名時，組件是否配置 `width: 'max-content'`、`whiteSpace: 'nowrap'` 或 `textOverflow: 'ellipsis'`，100% 確保文字絕不溢出組件外框？

### 9.4 全站名詞與文案統一檢驗 (Terminology Consistency Check)
- [ ] **文案一致性**：頁尾 (Footer)、Modal 標題 (Modal Header)、分頁 Tab、按鈕導航中的名詞定義是否 100% 統一？（例如：統一使用 `關於本站` 而非混用 `關於我們`；統一使用 `點歌代碼` 而非 `點歌號碼`）。

### 9.5 數據邊界與語意對映檢驗 (Filter Logic & Schema Boundary Check)
- [ ] **語意與縮寫對應**：UI 呈現的全稱標籤（如 `國語`, `台語`, `粵語`）與資料庫 Schema 中的簡寫代碼（如 `'國'`, `'台'`, `'粵'`）是否建立完整雙向匹配映射？
- [ ] **Empty State 邊界體驗**：當過濾條件無任何結果時，是否提供溫馨明確的無資料提示，並保留回報與重置按鈕？

### 9.6 程式碼與品牌遮蔽自動驗證 (Build & Brand Masking Audit)
- [ ] **靜態型別零錯誤**：執行 `npx tsc --noEmit` 0 錯誤。
- [ ] **自動遮蔽靜態掃描**：執行 `npm run build` 通過 `checkBrandMasking.js` 驗證。
