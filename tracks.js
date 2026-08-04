// 五個題庫的共用設定，首頁、練習頁、錯題本共用這份清單。
const TRACKS = [
  { id: "junior-grammar", label: "國中文法", type: "mc", file: "data/junior-grammar.json" },
  { id: "senior-grammar", label: "高中/學測文法", type: "mc", file: "data/senior-grammar.json" },
  { id: "toeic-grammar", label: "多益/職場文法", type: "mc", file: "data/toeic-grammar.json" },
  { id: "junior-translate", label: "國中中翻英", type: "translate", file: "data/junior-translate.json" },
  { id: "senior-translate", label: "高中/學測中翻英", type: "translate", file: "data/senior-translate.json" },
];

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
