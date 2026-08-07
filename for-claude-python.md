> **狀態（2026-08-06，Claude Code補註）**：此提案未採用。經確認使用者沒有 Gemini API Key、也不打算另外申請付費的 API 額度，改回 Antigravity IDE 對話委託方式（維持既有「Gemini出題、Claude Code審查」流程，見 `question-writing-template.md`）。國中2000字題庫的擴充改成：Claude Code 從官方課綱PDF擷取字表存成 `junior-2000-wordlist.json`，每次算出「還沒出過的字」交給 Gemini 對話出題，不透過API自動化腳本。

# bw-grammar-daily 擴充 2000 單字題庫：API 批次腳本自動化規格

## 背景與目標
目前國中單字題庫僅 35 題，距離 2000 字目標落差極大。為避免在聊天視窗中消耗過多昂貴的高階 Token，並快速產出大量題目，決議交由 Claude Code 撰寫「API 批次腳本自動化」方案。

## 腳本規格設計（請 Claude Code 照此實作 Python 腳本）

1. **環境與套件準備**
   - 使用官方 API 套件（如 `google-genai`，呼叫較低成本的模型如 Gemini 1.5 Flash）。
   - 務必從 `.env` 讀取 API Key，嚴禁將金鑰明碼寫入程式碼。

2. **資料輸入處理**
   - 讀取準備好的單字純文字檔（如：國中 2000 字表）。
   - 設定合適的批次大小，例如 `BATCH_SIZE = 50`。

3. **Prompt 組合與 API 呼叫**
   - 讀取既有的 `question-writing-template.md` 取得 JSON 格式規範。
   - 將每批單字組合成 Prompt 傳送給 API，並要求回傳 JSON 陣列格式。
   - **防漏要求**：務必在 Prompt 中提醒模型，讓選項正確答案位置 `answerIndex` (0~3) 盡量平均分布。

4. **資料驗證（自動防護機制）**
   - 收到回傳資料並解析 JSON 後，程式需自動檢查以下絕對標準：
     - `options` 陣列長度是否剛好為 4。
     - `answerIndex` 的值是否介於 0 到 3 之間。
     - `question`（題幹）字串中是否確實含有挖空符號 `______`。
   - 若該批次解析失敗或格式不符上述條件，觸發自動重試（最多重試 3 次）。

5. **輸出與合併**
   - 將所有驗證通過的批次合併成單一 JSON 陣列。
   - 輸出存檔至暫存區：`D:\Users\bw5418\projects\english-study\00-自學\_drafts\junior-vocab-batch.json`。
   - 產出草稿後，後續的「語意與難度」抽樣審查、以及合併至正式題庫 `data/junior-vocab.json` 的動作，維持現有工作流處理。
