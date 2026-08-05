const appEl = document.getElementById("app");

// 複習佇列：不再是「只顯示答錯的題目」，改成「間隔重複排程到期的題目」（不分當初對錯）。
// 一律整批讀該題庫的 items（題數還小，直接讀比另外組複合查詢簡單，也順便相容沒有 dueDate 的舊資料）。
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
