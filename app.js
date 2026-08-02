const appEl = document.getElementById("app");

async function trackSummary(track) {
  const itemsSnap = await db.collection("self_grammar").doc(track.id).collection("items").get();
  let attempted = 0;
  let needsReview = 0;
  itemsSnap.forEach((doc) => {
    const d = doc.data();
    if ((d.attempts || 0) > 0) attempted++;
    if (d.needsReview) needsReview++;
  });
  return { attempted, needsReview };
}

async function render() {
  const summaries = await Promise.all(TRACKS.map((t) => trackSummary(t)));
  appEl.innerHTML = TRACKS.map((track, i) => {
    const s = summaries[i];
    const reviewText = s.needsReview > 0 ? `<span class="review-flag">・待複習 ${s.needsReview} 題</span>` : "";
    return `
      <a class="track-card" href="track.html?t=${track.id}">
        <div class="track-name">${track.label}</div>
        <div class="track-stats">已作答 ${s.attempted}/10 題${reviewText}</div>
      </a>
    `;
  }).join("");
}

render();
