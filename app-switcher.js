// 共用元件：跨網站App切換選單（試點：先只加在dashboard.html，確認可行再推廣到其他頁面／其他專案）。
// 純drop-in設計：不依賴各網站既有的header結構，用position:fixed浮動按鈕＋自己的<style>，
// 貼一行<script src="app-switcher.js">就能用，不用改任何HTML/CSS。
(function () {
  // icon是相對路徑（icons/xxx.png），每個專案各自要在自己的webapp資料夾放一份對應的圖檔
  // （目前只有fire-engineer-exam放了；推廣到bw-grammar-daily時要把engineer.png、linguistics.png
  // 也複製一份過去，不能只複製這支.js卻沒有圖檔，圖片會顯示不出來）。
  var APPS = [
    { id: "fire-engineer-exam", label: "設備師", icon: "icons/engineer.png", url: "https://iw661001-cloud.github.io/fire-engineer-exam/dashboard.html" },
    { id: "bw-grammar-daily", label: "English", icon: "icons/linguistics.png", url: "https://iw661001-cloud.github.io/bw-grammar-daily/dashboard.html" },
  ];

  // 用網址判斷目前在哪個App，本機測試（localhost）時比對路徑關鍵字判斷。
  function currentAppId() {
    var href = location.href;
    if (href.indexOf("fire-engineer-exam") !== -1) return "fire-engineer-exam";
    if (href.indexOf("bw-grammar-daily") !== -1) return "bw-grammar-daily";
    return null;
  }

  var style = document.createElement("style");
  style.textContent = [
    ".app-switcher-btn{position:fixed;top:14px;left:14px;z-index:999;width:44px;height:36px;",
    "border-radius:10px;background:#5cb85c;border:none;cursor:pointer;",
    "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;",
    "box-shadow:0 2px 8px rgba(0,0,0,0.25);}",
    ".app-switcher-btn span{display:block;width:20px;height:2.5px;background:#1c2230;border-radius:2px;}",
    ".app-switcher-panel{position:fixed;top:58px;left:14px;z-index:999;background:#fff;",
    "border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,0.22);padding:8px;",
    "display:none;flex-direction:row;gap:6px;}",
    ".app-switcher-panel.show{display:flex;}",
    ".app-switcher-item{display:flex;flex-direction:column;align-items:center;gap:4px;",
    "width:76px;padding:10px 6px;border-radius:10px;text-decoration:none;",
    "font-size:0.74rem;font-weight:700;color:#1c2230;font-family:-apple-system,\"PingFang TC\",\"Microsoft JhengHei\",sans-serif;}",
    ".app-switcher-item .icon{width:34px;height:34px;object-fit:contain;}",
    ".app-switcher-item.active{background:#eef6ee;color:#2f7a3d;}",
    ".app-switcher-item:not(.active):active{background:#f2f2f2;}",
  ].join("");
  document.head.appendChild(style);

  var btn = document.createElement("button");
  btn.className = "app-switcher-btn";
  btn.setAttribute("aria-label", "切換App");
  btn.innerHTML = "<span></span><span></span><span></span>";

  var panel = document.createElement("div");
  panel.className = "app-switcher-panel";
  var active = currentAppId();
  panel.innerHTML = APPS.map(function (app) {
    var isActive = app.id === active;
    return '<a class="app-switcher-item' + (isActive ? " active" : "") + '" href="' + (isActive ? "#" : app.url) + '">' +
      '<img class="icon" src="' + app.icon + '" alt="' + app.label + '">' +
      "<span>" + app.label + "</span></a>";
  }).join("");

  btn.addEventListener("click", function () {
    panel.classList.toggle("show");
  });
  document.addEventListener("click", function (e) {
    if (!panel.contains(e.target) && e.target !== btn) panel.classList.remove("show");
  });

  document.body.appendChild(btn);
  document.body.appendChild(panel);
})();
