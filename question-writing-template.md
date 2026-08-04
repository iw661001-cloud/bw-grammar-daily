# 題目撰寫範本（給其他 AI 使用）

> 用途：bw-grammar-daily 擴充題庫時，把這份文件連同下面「本次任務」欄位的具體需求一起貼給其他 AI（Gemini/ChatGPT），
> 請它們照格式寫出題目，寫好後交給 Claude Code 檢視、修正、實際上線。
> Claude Code 不會照單全收，會逐題核對格式、正確性、難度、原創性後才會用。

---

## 一、絕對規則（違反其中任一項，整批退回重寫）

1. **完全原創**：著作權保護的是「具體的表達方式」，不是句型結構——主詞+動詞+受詞這種文法框架、常見單字、通用情境（例如「某人每天做某件事」這種敘述模式）本來就不受著作權保護，不需要為了「換句話說」而刻意繞路。真正該避免的是照抄某個特定來源**明顯可辨識的具體情境、獨特故事情節、或解析文字**（即使換了主詞/動詞，讀起來還是同一個情節的改寫），或整批照抄某個來源的選字清單/題目排列方式。簡單說：規則、常見詞、通用情境可以自由用；某個特定作者/書籍獨創的具體場景、比喻、解說方式不要照搬。
   - **特別說明給多益/雅思這類考試題庫**：「這個考試常考什麼句型/情境」（例如多益商業email固定用語 please find the attached、by the 5th of each month 這種截止期限說法）是這個考試本身的公開特徵，不屬於任何一本教材獨創，**應該積極使用這些真實、公認的慣用句型**，這樣寫出來的題目才貼近真實考試，不是要刻意避開常見多益句型去發明考試不會出現的怪句子。真正不能用的，是某本特定書籍自己編的具體例句/故事/解說方式。
2. **只能輸出純 JSON 陣列**，不要加任何說明文字、不要用 ```json 包起來，就是一個可以直接被程式解析的 JSON array。
3. **每一題都要有正確答案，且只有一個正確答案**，其餘三個選項必須明確錯誤（不能有爭議、模稜兩可）。
4. **不能跟「已有內容」清單重複**——每個題庫下面都列了目前已經用過的目標單字或文法點範例，新題目的目標單字/句型不能重複出現。

---

## 二、JSON 格式規範

### 文法題／單字題（type: "mc"）共用格式

```json
{
  "id": "{題庫代碼}-{兩位數字流水號，接續現有最大號碼}",
  "category": "{文法點分類，或詞性：動詞/名詞/形容詞/副詞}",
  "question": "英文句子，空格處用 ______（6個底線）標示",
  "chinese": "整句話的中文翻譯",
  "options": ["選項A", "選項B", "選項C", "選項D"],
  "answerIndex": 0,
  "explanation": "解釋為什麼正確答案符合語境/文法規則，並簡短說明為什麼其他選項不對（尤其是為什麼容易被搞混）",
  "optionNotes": ["選項A的詞性・中文意思", "選項B的詞性・中文意思", "選項C的詞性・中文意思", "選項D的詞性・中文意思"]
}
```

**出題核心原則**：四個選項要「看起來都合理」，最好是字形相似、詞性相同、或意思相近容易混淆的字，不要出現一眼就能刪掉的無關選項（例如用「香蕉」當文法題的錯誤選項）。這樣才能真正測出理解程度，不是用消去法猜答案。

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

---

## 三、本次任務（每次委託時，把下面表格換成實際要做的題庫）

| 題庫代碼 | 名稱 | 類型 | 程度 | 這次要加幾題 | id流水號從幾號接續 |
|---|---|---|---|---|---|
| （填入） | （填入） | mc / translate | （填入） | （填入） | （填入） |

**已有內容清單（避免重複，貼上對應題庫的清單）**：

- `junior-grammar`（國中文法）已用文法點：時態×3、主詞動詞一致×1、比較級×1、連接詞×2、助動詞×1、介系詞×1、不定詞/動名詞×1（共10題，id到jg-10）
- `senior-grammar`（高中/學測文法）已用文法點：假設語氣×2、倒裝句×2、分詞構句×2、關係子句×2、使役/被動×1、強調句×1（共10題，id到sg-10）
- `toeic-grammar`（多益 Part 5，文法+字彙混合）已用：分詞構句×1、詞性判斷×3、假設語氣×3、介系詞×2、連接詞×3、比較級×1、代名詞×1、時態×1、關係子句×1、動詞(字彙)×3、形容詞(字彙)×3、使役/被動×1、不定詞/動名詞×1（共25題，id到tg-25）
- `junior-vocab`（國中單字）已用目標字：borrow, nervous, improve, polite, expect, environment, honest, achieve, crowded, prepare（共10題，id到jv-10）
- `senior-vocab`（高中單字）已用目標字：significant, reluctant, consequence, accomplish, efficient, genuine, controversial, diverse, aware, essential（共10題，id到sv-10）
- `toeic-vocab`（多益單字）已用目標字：reimburse, negotiate, postponed, invoice, colleague, deadline, inventory, candidates, reliable, budget（共10題，id到tv-10）
- `ielts-vocab`（雅思單字）已用目標字：sustainable, phenomenon, assumption, statistics, contribute, adequate, perspective, exposure, inevitable, outweigh（共10題，id到iv-10）
- `junior-translate`（國中中翻英）已出過的中文句子主題：日常作息、天氣、書籍比較、借東西、做家事、電影評論、假設句、連接詞句型、過去完成式（共10題，id到jt-10）
- `senior-translate`（高中/學測中翻英）已出過的主題：假設語氣倒裝、原因強調句、讓步句、強調句、對比句、科學研究敘述、祈使建議、關係子句、條件句、複合句（共10題，id到st-10）

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
6. 沒有跟已知試閱PDF或其他來源雷同的痕跡 ✓
7. optionNotes 詞性/意思標註正確 ✓

→ 這題審查通過，可以直接採用；如果哪一項沒過，會退回請 AI 依照問題點修正，或由 Claude Code 直接動手改。

---

## 五、Claude Code 收到草稿後的檢查項目

1. JSON 格式是否有效、欄位是否齊全
2. `answerIndex` 是否真的對應唯一正確答案
3. 句子文法/用字是否道地正確（不是機器直譯腔）
4. 難度是否符合該題庫程度（不會太簡單或太超綱）
5. 是否跟已有內容重複（目標字/文法點/中文句子主題）
6. 是否有疑似照抄特定教材的痕跡（例句過於巧合、跟已知試閱PDF內容雷同等）
7. `optionNotes` 詞性/意思標註是否正確

不符合的題目會退回重寫或由 Claude Code 直接修正，不會不檢查就上線。
