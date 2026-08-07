const appEl = document.getElementById("app");

// loadDueItems() 已搬到 tracks.js 共用（track.js／part6.js 的複習模式自動接續也要用）。

async function render() {
  const items = await loadDueItems();
  if (items.length === 0) {
    appEl.innerHTML = `<p class="empty-msg">今天沒有到期需要複習的題目，之前作答過的題目會依間隔重複排程自動出現在這裡。</p>`;
    return;
  }
  appEl.innerHTML = items.map((item) => {
    const practicePage = item.track.type === "part6" ? "part6.html" : "track.html";
    return `
    <div class="wrong-item">
      <div class="track-label">${item.track.label}${item.needsReview ? "・上次答錯" : ""}</div>
      <div>${item.question || ""}</div>
      <div class="nav-row">
        <a class="nav-btn secondary" href="${practicePage}?t=${item.track.id}&q=${item.questionId}" style="text-decoration:none;text-align:center;line-height:2.6;">重新練這一題</a>
      </div>
    </div>
  `;
  }).join("");
}

render();
