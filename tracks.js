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
