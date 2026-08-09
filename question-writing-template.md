# 題目撰寫範本（給其他 AI 使用）

> 用途：bw-grammar-daily 擴充題庫時，把這份文件連同下面「本次任務」欄位的具體需求一起貼給其他 AI（Gemini/ChatGPT），
> 請它們照格式寫出題目，寫好後交給 Claude Code 檢視、修正、實際上線。
> Claude Code 不會照單全收，會逐題核對格式、正確性、難度、原創性後才會用。
> 設計決策依據見 [[english-study/00-自學/bw-grammar-daily/spec|spec.md]]。

---

## 零、輸出方式

題目寫好後，優先存成檔案交接，不要只貼在對話視窗（內容一多容易超過對話框長度貼不完整）：

- 存到 `D:\Users\bw5418\projects\english-study\00-自學\_drafts\{題庫代碼}.json`（例如 `_drafts\toeic-vocab.json`）
- 這個資料夾在 bw-grammar-daily 的 git repo **外面**，只是暫存交接用，不是正式題庫檔案，不會有版本控制或上線的疑慮
- 存完之後跟使用者回報「已存到 _drafts\{題庫代碼}.json」即可，正式的審查、修正、合併進 `data/{題庫代碼}.json` 一律由 Claude Code 負責，這裡只是暫存草稿

如果你的環境沒有檔案寫入權限，才退而求其次直接把 JSON 貼在對話裡。

---

## 一、寫題目時的注意事項

1. **原創性參考（[L4]，我未查證台灣個案判例，這是一般著作權常識的推論，不是法律定論，最終要不要在意由使用者自己判斷）**：著作權保護的是「具體的表達方式」，不是句型結構——主詞+動詞+受詞這種文法框架、常見單字、通用情境本來就不受著作權保護，不需要為了「換句話說」而刻意繞路。相對比較可能有疑慮的，是照抄某個特定來源明顯可辨識的具體情境、獨特故事情節、或解析文字，或整批照抄某個來源的選字清單/題目排列方式。
   - **多益/雅思這類考試題庫特別適用**：「這個考試常考什麼句型/情境」（例如多益商業email固定用語 please find the attached、by the 5th of each month 這種截止期限說法）是這個考試本身的公開特徵，不屬於任何一本教材獨創，可以放心使用這些真實、公認的慣用句型，這樣寫出來的題目才貼近真實考試。
2. **只能輸出純 JSON 陣列**，不要加任何說明文字、不要用 ```json 包起來，就是一個可以直接被程式解析的 JSON array。
3. **每一題都要有正確答案，且只有一個正確答案**，其餘三個選項必須明確錯誤（不能有爭議、模稜兩可）。
4. **不能跟「已有內容」清單重複**——每個題庫下面都列了目前已經用過的目標單字或文法點範例，新題目的目標單字/句型不能重複出現。**但這個限制只看「同一個題庫內部」**：`junior-vocab` 跟 `senior-vocab` 可以出現同一個目標字（例如兩邊都出 achieve），因為國中考基礎字義、高中考進階用法/同義字辨析，深度本來就該不同，不用刻意避開對方已經用過的字。
5. **正確答案的位置（answerIndex）要平均分散在0~3，不要每題都放在同一個位置**（例如每題都放第一個選項）。這是實際發生過的問題：整批15題全部 answerIndex:0，等於「每題都選A」就能拿高分，選項排序本身洩題。寫完一批後自己檢查一次這批題目的 answerIndex 有沒有集中在少數幾個數字。
6. **解析（`explanation`）視情況補充延伸知識，不用每題都硬湊**：
   - 有明顯同義字/反義字/常用搭配詞時，解析結尾補一句，例如測 borrow 時帶一句「反義：lend（借出）」
   - 如果解析剛好用到另一個知識點（例如單字題解析提到「過去分詞當形容詞」這個文法概念），明確點出來，例如加一句「（順便複習：分詞構句）」，讓使用者意識到自己不只學到這題答案

---

## 二、JSON 格式規範

### 文法題／單字題（type: "mc"）共用格式

```json
{
  "id": "{題庫代碼}-{兩位數字流水號，接續現有最大號碼}",
  "category": "{文法點分類，或詞性：動詞/名詞/形容詞/副詞，片語則填「片語」}",
  "question": "英文句子，空格處用 ______（6個底線）標示",
  "chinese": "整句話的中文翻譯",
  "options": ["選項A", "選項B", "選項C", "選項D"],
  "answerIndex": 0,
  "explanation": "解釋為什麼正確答案符合語境/文法規則，並簡短說明為什麼其他選項不對（尤其是為什麼容易被搞混）",
  "optionNotes": ["選項A的詞性・中文意思", "選項B的詞性・中文意思", "選項C的詞性・中文意思", "選項D的詞性・中文意思"],
  "etymology": "（選填，只用在單字題庫）字根字首拆解，例如「bene-(好) + -volent(意願) → 心懷善意的」；沒有好拆的字根就不寫這個欄位，不用硬湊"
}
```

**出題核心原則**：四個選項要「看起來都合理」，最好是字形相似、詞性相同、或意思相近容易混淆的字，不要出現一眼就能刪掉的無關選項（例如用「香蕉」當文法題的錯誤選項）。這樣才能真正測出理解程度，不是用消去法猜答案。

**一句裡有兩個空格時，答案要依實際情況用固定分隔符號寫，程式才能正確把答案填回空格**：
- 兩個空格是**各自獨立**的答案（例如時態一致：「goes / is」）→ 用「 / 」分隔，前後各一個空格
- 兩個空格是**同一個片語被隔開**（例如take...for granted中間夾了受詞，題目寫成「______ their health ______」）→ 用「 ... 」分隔（例如「take ... for granted」），前後各一個空格
- 只有一個空格的題目不用管這條規則，正常寫就好

**單字題庫（`junior-vocab`／`senior-vocab`／`toeic-vocab`／`ielts-vocab`）專屬規則**：
- `junior-vocab` 依教育部十二年國教課綱「國中常用2000字參考詞彙表」（基本1200字+挑戰800字）依序或分級挑字，不要自由發揮想到什麼字就出
- `senior-vocab` 依大考中心《高中英文參考詞彙表》（分基礎2200/核心2201-4400/進階4401-7000三級）依級數挑字
- `toeic-vocab` 沒有官方字表，維持依常見職場/商用情境自行判斷選字
- `ielts-vocab` 維持自訂學術字彙；`etymology` 欄位除了字根字首，也可以填語源親緣連結（格林法則p→f/t→th/k→h等音變規律，連結日耳曼語源常用字跟拉丁/希臘語源學術字，例如「foot(日耳曼) 與 pedal/pedestrian(拉丁ped-)同源，格林法則 p→f」）
- 片語內容（look forward to、give up 這種）直接當一般題目出，`category` 填「片語」，目標字改成整串片語；多益情境的固定片語（in charge of、be eligible for）放進 `toeic-grammar`（多益 Part 5）而不是 `toeic-vocab`，因為那邊本來就是文法+字彙混合出題

**範例**（實際上線的題目，照這個難度/風格寫）：

```json
{
  "id": "tv-01",
  "category": "動詞",
  "question": "The company will ______ employees for any travel expenses related to business trips.",
  "chinese": "公司會退還員工出差相關的所有旅費。",
  "options": ["reimburse", "resign", "reserve", "resume"],
  "answerIndex": 0,
  "explanation": "reimburse（退還費用、補償）符合「公司會退還員工出差旅費」；resign辭職、reserve保留/預訂、resume恢復/履歷，都是常見商務字但語意不合。",
  "optionNotes": ["動詞・退還費用、補償", "動詞・辭職", "動詞・保留、預訂", "動詞・恢復；名詞・履歷"]
}
```

### 中翻英題（type: "translate"）格式

```json
{ "id": "{題庫代碼}-{兩位數字流水號}", "chinese": "中文句子", "reference": "對應的英文參考答案（自然道地的表達，不要逐字直譯）" }
```

**範例**：
```json
{ "id": "st-01", "chinese": "要不是老師的鼓勵，他早就放棄學英文了。", "reference": "If it had not been for the teacher's encouragement, he would have given up learning English long ago." }
```

### 多益 Part 6 短文填空（`toeic-part6`專用，格式跟上面兩種完全不同）

一篇文章＋4小題，不是單句：

```json
{
  "id": "{兩位數字流水號，如p6-01}",
  "passageType": "email／memo／notice／article 四選一",
  "passage": "文章全文，4個空格用 ______(1)______、______(2)______、______(3)______、______(4)______ 標記",
  "chinese": "整篇中文翻譯（可選）",
  "questions": [
    { "blankType": "詞性判斷", "options": [...4個], "answerIndex": 0, "explanation": "...", "optionNotes": [...4個] },
    { "blankType": "時態", "options": [...], "answerIndex": 0, "explanation": "...", "optionNotes": [...] },
    { "blankType": "動詞或名詞或形容詞（依實際考的字選一個當分類）", "options": [...], "answerIndex": 0, "explanation": "...", "optionNotes": [...] },
    { "blankType": "段落邏輯", "options": ["四個完整句子，不是單字"], "answerIndex": 0, "explanation": "必須明確指出線索是「指示代名詞／邏輯轉折詞／詞彙關聯性」三者中的哪一個，具體點出是哪一句提供的線索" }
  ]
}
```

**這個格式的專屬規則**：
- 4小題固定順序：前3題是詞性/時態/單字片語類型（`blankType`盡量對應現有文法題庫已經在用的分類名稱：時態、詞性判斷、介系詞、連接詞等），第4題固定是「段落邏輯」句子插入題
- 句子插入題的4個選項是**完整句子**，不是單字，`answerIndex`一樣是0~3
- 文章開頭依體裁慣例寫：email/letter開頭直接說明目的；memo要交代收件對象/主旨/施行日期；notice/article要交代Event/When/Action Required
- 情境內容全部自創虛構（虛構公司/人物/數據），不照抄任何具體來源的文章內容；可以參考 toeic.com.tw（多益官方台灣代理機構）釋出的官方範例確認格式，但一樣不照抄其例句
- 句子插入題的線索類型（指示代名詞／邏輯轉折詞／詞彙關聯性）盡量整批分散，不要同一批大多集中在同一種——第一批5篇20題全部答對，但5題裡有4題都用「詞彙關聯性」，只有1題用「指示代名詞」，沒有用到「邏輯轉折詞」，之後幾批麻煩刻意平衡一下三種都出現

### 句子結構／分類辨識題（沿用mc格式，`junior-grammar`／`senior-grammar`／`toeic-grammar`專用）

跟一般填空題schema完全一樣（`id`/`category`/`question`/`chinese`/`options`/`answerIndex`/`explanation`/`optionNotes`），差別只在 **`question`放完整句子（不挖空），`options`放分類標籤或句子片段，不是單字**。目的是明著考「先判斷這是什麼類型再回答」的能力（詳見 [[english-study/00-自學/bw-grammar-daily/spec|spec.md]] 第18節）。

**三種出題角度**：

1. **句子結構（子句判斷）**——`category`固定填`"句子結構"`：
   ```json
   {
     "id": "sg-XX",
     "category": "句子結構",
     "question": "The manager who arrived late apologized to the client for the delay.",
     "chinese": "遲到的經理向客戶為延誤道歉。",
     "options": ["The manager", "who arrived late", "apologized to the client for the delay", "for the delay"],
     "answerIndex": 2,
     "explanation": "哪個片段是主要子句/名詞子句/形容詞子句/副詞子句，並說明為什麼"
   }
   ```
   同一句話要考多個子句類型，**拆成多題各自問**，不要做成一題考多個答案。
   **深化變化**：也可以先標出某個子句、問它在句中的**功能**（主詞/受詞/主詞補語/同位語），例如「名詞子句 that the project was delayed 在這句話中扮演什麼角色？」選項：主詞／受詞／主詞補語／同位語。

2. **時態判斷**——`category`沿用既有的`"時態"`（不開新分類）：
   問法可以是「這句話用的是什麼時態」（選項是時態名稱標籤），也可以是**深化版**「哪個片段（時間線索詞）決定了這裡必須用這個時態」（選項是句子片段，例如by the time/since/for the past這類線索詞），後者更貼近多益Part 5實際解題技巧。

3. **假設語氣類型判斷**——`category`沿用既有的`"假設語氣"`（不開新分類）：
   ```json
   {
     "id": "sg-XX",
     "category": "假設語氣",
     "question": "If I had studied harder, I would have passed the exam.",
     "chinese": "要是我更用功讀書，就會通過考試了。",
     "options": ["與現在事實相反", "與過去事實相反", "真實條件句", "與未來事實相反"],
     "answerIndex": 1,
     "explanation": "..."
   }
   ```
   **深化變化**：也可以反問「這句話暗示的實際客觀事實是什麼」（例如上例反推：考試當時沒通過），確保理解語意而非死背句型公式。

**這個格式的專屬規則**：
- **分類歸屬要對**：只有「句子結構（子句判斷）」是全新分類；「時態」「假設語氣」判斷題**沿用既有分類名稱**，不要另開新分類，否則會讓文法錯誤類型統計把同一個知識點拆成兩條
- 句子結構（子句判斷）子句嵌套對國中生偏難，只用在`senior-grammar`／`toeic-grammar`；時態/假設語氣判斷題三個文法題庫都可以用
- `options`是句子片段時字數會比單字選項長，不用特別縮短，但避免整句過長（建議一句不超過25個字），避免手機小螢幕排版問題

---

## 三、本次任務（每次委託時，把下面表格換成實際要做的題庫）

| 題庫代碼 | 名稱 | 類型 | 程度 | 這次要加幾題 | id流水號從幾號接續 |
|---|---|---|---|---|---|
| junior-vocab | 國中單字 | mc | 國中（依教育部官方2000字參考詞彙表） | 200（小規模試行，先確認品質穩定再擴大批次） | jv-36 開始 |

**這次額外要求**：
- 目標字**不用自己挑**，直接依序使用 `_drafts\junior-vocab-batch2-words.txt` 裡列好的200個字，一個字一題，不用擔心重複（這份清單已經跟官方2000字表＋現有題庫比對過，保證沒出過）
- 官方字表原始資料在 `junior-2000-wordlist.json`（含 `content_words`／`skipped_function_words` 兩份清單，後者是代名詞/助動詞這類不適合單字選擇題的功能詞，已經排除，不用管）；來源與判斷邏輯見知識庫筆記 [[官方詞彙表PDF擷取與單字出題判斷]]
- 這次規模較大，**先出前50題存檔回報**，確認品質穩定後再繼續剩下150題，不要一次生完200題才回報（降低整批出問題才發現的風險）
- 其餘規則（片語可以有、etymology選填、延伸同義字反義字搭配詞、國高中可重複用字）仍適用，見第一、二節

**已有內容清單（避免重複，貼上對應題庫的清單）**：

- `junior-grammar`（國中文法）已用文法點：時態×5、主詞動詞一致×1、比較級×2、連接詞×2、助動詞×1、介系詞×2、不定詞/動名詞×2、附加問句×1、代名詞×1、數量詞×1、關係子句×1、感官動詞×1、使役/被動×1、祈使句×1、連綴動詞×1、疑問詞×1、花費動詞×1（共25題，id到jg-25）
- `senior-grammar`（高中/學測文法）已用文法點：假設語氣×4、倒裝句×4、分詞構句×3、關係子句×4、使役/被動×1、強調句×1、助動詞×1、轉折語氣×1、雙重否定×1、代名詞×1、不定詞/動名詞×2、時態×1、比較級×1（共25題，id到sg-25）
- `toeic-grammar`（多益 Part 5，文法+字彙混合）已用：分詞構句×1、詞性判斷×3、假設語氣×3、介系詞×2、連接詞×3、比較級×1、代名詞×1、時態×1、關係子句×1、動詞(字彙)×3、形容詞(字彙)×3、使役/被動×1、不定詞/動名詞×1（共25題，id到tg-25）
- `junior-vocab`（國中單字）已用字改對照 `data/junior-vocab.json` 實際內容＋`junior-2000-wordlist.json`（官方字表全清單），不再逐字列出 prose 清單（200題等級的清單塞在這裡不利閱讀）；每次要出下一批前，由 Claude Code 執行比對算出「官方字表裡還沒出過的字」，直接提供目標字清單檔案（例如這次的 `_drafts\junior-vocab-batch2-words.txt`），委託時不用再手動核對「已有內容清單」
- `senior-vocab`（高中單字）已用目標字：significant, reluctant, consequence, accomplish, efficient, genuine, controversial, diverse, aware, essential, ambiguous, compromise, inevitable, substantial, equivalent, interpret, vulnerable, superficial, manipulate, comprehensive, accumulate, subtle, relevant, compulsory, persistent, obstacle, deliberately, deteriorate, take...for granted(片語), indispensable, incorporate, perspective, profitable, come up with(片語), spontaneous（共35題，id到sv-35）
- `toeic-vocab`（多益單字）已用目標字：reimburse, negotiate, postponed, invoice, colleague, deadline, inventory, candidates, reliable, budget, implement, complimentary, accommodate, tentative, itinerary, eligible, feedback, compensation, allocate, mandatory, previous, seminar, launch, verify, confidential（共25題，id到tv-25）
- `ielts-vocab`（雅思單字）已用目標字：sustainable, phenomenon, assumption, statistics, contribute, adequate, perspective, exposure, inevitable, outweigh, fundamental, contradictory, fluctuate, empirical, paradigm, correlation, mitigate, underlying, subsequent, comprehensive, prominent, facilitate, consensus, intrinsic, hypothesis（共25題，id到iv-25）
- `junior-translate`（國中中翻英）已出過的中文句子主題：日常作息、天氣、書籍比較、借東西、做家事、電影評論、假設句、連接詞句型、過去完成式、海邊游泳、聽音樂、下雨待家、去過日本、運動健康、熬夜考試、袋子比較、冰箱食物、手機製造、洗澡電話、走路上學、學英文多久、身高比較、圖書館安靜、英文說得好（共25題，id到jt-25）
- `senior-translate`（高中/學測中翻英）已出過的主題：假設語氣倒裝、原因強調句、讓步句、強調句、對比句、科學研究敘述、祈使建議、關係子句、條件句、複合句、智慧型手機影響、全球暖化行動、成功需努力、運動習慣、速食健康、追求夢想、睡眠不足、廣泛閱讀、網路霸凌、有效溝通、志工同理心、保護古蹟、青少年壓力、大眾運輸、挫折視為機會（共25題，id到st-25）
- `toeic-part6`（多益 Part 6 短文填空）已出過的情境：IT系統更新email、辦公室裝修notice、麵包店展店article、報帳流程變更memo、面試邀約email（共5篇20題，id到p6-05）

---

## 四、範例：完整示範一次委託

假設要委託「多益 Part 5 加5題」，「本次任務」表格會這樣填：

| 題庫代碼 | 名稱 | 類型 | 程度 | 這次要加幾題 | id流水號從幾號接續 |
|---|---|---|---|---|---|
| toeic-grammar | 多益 Part 5 | mc | 多益（文法+字彙混合） | 5 | tg-11 開始 |

其他 AI 寫回來的其中一題草稿範例（這題目前**還沒加入題庫，純示範用**，示範它用了「關係子句」這個 toeic-grammar 目前還沒出過的分類，符合「不跟已有內容重複」的要求）：

```json
{
  "id": "tg-11",
  "category": "關係子句",
  "question": "The company relocated its headquarters to Taipei, ______ significantly reduced its shipping costs.",
  "chinese": "公司把總部遷到台北，這件事大幅降低了運費成本。",
  "options": ["which", "that", "who", "what"],
  "answerIndex": 0,
  "explanation": "which 在非限定用法（前面有逗號）中可以代替前面整個子句（把總部遷到台北這件事），指的不是單一名詞而是前述整件事；that 不能用在非限定子句（前面不能加逗號）；who 指人；what 不能引導形容詞子句來修飾前面的子句。",
  "optionNotes": ["關係代名詞・可代替整個子句（非限定用法）", "關係代名詞・限定用法，前面不能加逗號", "關係代名詞・指人", "關係代名詞・無先行詞用法，這裡不適用"]
}
```

Claude Code 收到這題後的審查示範（對照第四節檢查項目逐條過）：
1. JSON 格式有效、七個欄位齊全 ✓
2. answerIndex=0（which）確實是唯一正確答案，其餘三個選項套進句子都不合文法 ✓
3. 句子道地、非機器直譯腔 ✓
4. 難度符合多益 Part 5（關係子句代替整句是中高階文法點，多益常考） ✓
5. 「關係子句」是 toeic-grammar 目前沒出過的新分類，不重複 ✓
6. 情境敘述通用（公司搬遷降低運費），非特定來源的獨特情節 ✓
7. optionNotes 詞性/意思標註正確 ✓

→ 這題審查通過，可以直接採用；如果哪一項沒過，會退回請 AI 依照問題點修正，或由 Claude Code 直接動手改。

---

## 五、Claude Code 收到草稿後的檢查項目

1. JSON 格式是否有效、欄位是否齊全
2. `answerIndex` 是否真的對應唯一正確答案
3. 句子文法/用字是否道地正確（不是機器直譯腔）
4. 難度是否符合該題庫程度（不會太簡單或太超綱）
5. 是否跟已有內容重複（目標字/文法點/中文句子主題）
6. 例句/情境是否為通用敘述，還是恰好跟某個特定已知來源的具體情節高度雷同（第一節「原創性參考」提到的[L4]判斷，供參考不是硬性關卡）
7. `optionNotes` 詞性/意思標註是否正確
8. **這一批的 `answerIndex` 分布是否集中在少數幾個數字**（實際發生過整批15題全部是0的狀況，等於選項排序本身洩題，需要打亂重排才能上線）
9. 單字題庫：`etymology` 欄位（如果有填）拆解是否正確、`category` 是否依規則選字表對應級數（不是自由發揮想到什麼字就出）
10. 句子結構／分類辨識題：`category`歸屬是否正確（只有子句判斷題開新分類「句子結構」，時態/假設語氣判斷題要沿用既有分類，不能自己開新分類）；選項（句子片段或標籤）彼此是否清楚可辨、沒有模稜兩可

有疑慮的地方會直接跟使用者說明、由使用者決定怎麼處理，不會自己認定退回。
