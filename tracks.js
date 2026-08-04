// 題庫的共用設定，首頁、練習頁、儀表板、錯題本共用這份清單。
// group 決定首頁/儀表板的分類分欄（文法/單字/中翻英），type 決定練習頁用哪種作答介面（mc/translate）。
const TRACKS = [
  { id: "junior-grammar", label: "國中文法", type: "mc", group: "grammar", file: "data/junior-grammar.json" },
  { id: "senior-grammar", label: "高中/學測文法", type: "mc", group: "grammar", file: "data/senior-grammar.json" },
  { id: "toeic-grammar", label: "多益 Part 5", type: "mc", group: "grammar", file: "data/toeic-grammar.json" },
  { id: "junior-translate", label: "國中中翻英", type: "translate", group: "translate", file: "data/junior-translate.json" },
  { id: "senior-translate", label: "高中/學測中翻英", type: "translate", group: "translate", file: "data/senior-translate.json" },
];

// 規劃中但還沒做出來的項目：首頁/儀表板顯示「即將推出」卡片佔位，不對應真正的 track，不能點進去。
// 單字4個題庫、多益 Part 6/7 內容做出來後，會從這裡移除、改成 TRACKS 裡的正式項目。
const COMING_SOON = [
  { label: "多益 Part 6", group: "grammar" },
  { label: "多益 Part 7", group: "grammar" },
  { label: "國中單字", group: "vocab" },
  { label: "高中單字", group: "vocab" },
  { label: "多益單字", group: "vocab" },
  { label: "雅思單字", group: "vocab" },
];

const GROUP_ORDER = ["grammar", "vocab", "translate"];
const GROUP_LABELS = { grammar: "文法", vocab: "單字", translate: "中翻英" };

function trackById(id) {
  return TRACKS.find((t) => t.id === id);
}

// 兩個地方都要用同一套日期字串規則（練習頁記錄用、儀表板讀取用），
// 放共用檔案避免各自實作出現時區/格式落差。
function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
