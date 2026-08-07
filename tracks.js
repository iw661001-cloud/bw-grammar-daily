// 題庫的共用設定，首頁、練習頁、儀表板、錯題本共用這份清單。
// group 決定首頁/儀表板的分類分欄（文法/單字/中翻英），type 決定練習頁用哪種作答介面（mc/translate）。
const TRACKS = [
  { id: "junior-grammar", label: "國中文法", type: "mc", group: "grammar", file: "data/junior-grammar.json" },
  { id: "senior-grammar", label: "高中/學測文法", type: "mc", group: "grammar", file: "data/senior-grammar.json" },
  { id: "toeic-grammar", label: "多益 Part 5", type: "mc", group: "grammar", file: "data/toeic-grammar.json" },
  { id: "junior-vocab", label: "國中單字", type: "mc", group: "vocab", file: "data/junior-vocab.json" },
  { id: "senior-vocab", label: "高中單字", type: "mc", group: "vocab", file: "data/senior-vocab.json" },
  { id: "toeic-vocab", label: "多益單字", type: "mc", group: "vocab", file: "data/toeic-vocab.json" },
  { id: "ielts-vocab", label: "雅思單字", type: "mc", group: "vocab", file: "data/ielts-vocab.json" },
  { id: "junior-translate", label: "國中中翻英", type: "translate", group: "translate", file: "data/junior-translate.json" },
  { id: "senior-translate", label: "高中/學測中翻英", type: "translate", group: "translate", file: "data/senior-translate.json" },
  { id: "toeic-part6", label: "多益 Part 6", type: "part6", group: "grammar", file: "data/toeic-part6.json" },
];

// 規劃中但還沒做出來的項目：首頁/儀表板顯示「即將推出」卡片佔位，不對應真正的 track，不能點進去。
// 單字題庫、多益 Part 7 內容做出來後，會從這裡移除、改成 TRACKS 裡的正式項目。
const COMING_SOON = [
  { label: "多益 Part 7", group: "grammar" },
];

const GROUP_ORDER = ["grammar", "vocab", "translate"];
const GROUP_LABELS = { grammar: "文法", vocab: "單字", translate: "中翻英" };

function trackById(id) {
  return TRACKS.find((t) => t.id === id);
}

// 間隔重複複習佇列共用判斷：沒作答過的題目不算複習範圍；
// 這次改版之前寫入的舊資料沒有 dueDate 欄位，視為今天已到期，自然併入新排程，不用另外跑遷移腳本。
function isDueForReview(itemData, now) {
  if (!itemData || !itemData.attempts) return false;
  const due = itemData.dueDate ? itemData.dueDate.toDate() : now;
  return due <= now;
}

// 複習佇列：不再是「只顯示答錯的題目」，改成「間隔重複排程到期的題目」（不分當初對錯）。
// 一律整批讀該題庫的 items（題數還小，直接讀比另外組複合查詢簡單，也順便相容沒有 dueDate 的舊資料）。
// wrong.js（列表頁）跟 track.js／part6.js（複習模式的自動接續）共用同一份清單邏輯。
async function loadDueItems() {
  const now = new Date();
  const results = [];
  for (const track of TRACKS) {
    const snap = await db.collection("self_grammar").doc(track.id).collection("items").get();
    snap.forEach((doc) => {
      const data = doc.data();
      if (!isDueForReview(data, now)) return;
      const dueDate = data.dueDate ? data.dueDate.toDate() : now;
      results.push({ track, questionId: doc.id, ...data, dueDate });
    });
  }
  results.sort((a, b) => a.dueDate - b.dueDate);
  return results;
}

// 複習模式的剩餘題數計數器，黃底黑框硬邊陰影（不用模糊/發光效果），
// track.js／part6.js 共用同一份樣式，插入 header 的 #reviewCounterSlot。
function renderReviewCounterHtml(count) {
  return `<span class="review-counter">剩餘 ${count} 題</span>`;
}

// 兩個地方都要用同一套日期字串規則（練習頁記錄用、儀表板讀取用），
// 放共用檔案避免各自實作出現時區/格式落差。
function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 間隔重複排程（SM-2簡化版，因為只有對/錯二元結果，沒有 Anki 那種5級自評）：
// 第1次答對＝1天後，第2次連續答對＝6天後，之後每次答對＝上次間隔×難易度係數；
// 答錯就把 repetition 歸零、間隔打回1天、難易度係數降0.2（下限1.3）。
// track.js（單題）跟 part6.js（整篇文章視為一個複習單位）共用同一套排程邏輯。
function nextSchedule(prev, correct) {
  const repetition = prev.repetition || 0;
  const easeFactor = prev.easeFactor || 2.5;
  if (!correct) {
    return { repetition: 0, interval: 1, easeFactor: Math.max(1.3, easeFactor - 0.2) };
  }
  const nextRepetition = repetition + 1;
  let interval;
  if (nextRepetition === 1) interval = 1;
  else if (nextRepetition === 2) interval = 6;
  else interval = Math.round((prev.interval || 1) * easeFactor);
  return { repetition: nextRepetition, interval, easeFactor };
}
