const appEl = document.getElementById("app");

async function loadWrongItems() {
  const results = [];
  for (const track of TRACKS) {
    const snap = await db.collection("self_grammar").doc(track.id).collection("items")
      .where("needsReview", "==", true).get();
    snap.forEach((doc) => {
      results.push({ track, questionId: doc.id, ...doc.data() });
    });
  }
  return results;
}

async function render() {
  const items = await loadWrongItems();
  if (items.length === 0) {
    appEl.innerHTML = `<p class="empty-msg">目前沒有待複習的題目，答錯的題目會自動出現在這裡。</p>`;
    return;
  }
  appEl.innerHTML = items.map((item) => `
    <div class="wrong-item">
      <div class="track-label">${item.track.label}</div>
      <div>${item.question || ""}</div>
      <div class="nav-row">
        <a class="nav-btn secondary" href="track.html?t=${item.track.id}" style="text-decoration:none;text-align:center;line-height:2.6;">去這個題庫複習</a>
      </div>
    </div>
  `).join("");
}

render();
