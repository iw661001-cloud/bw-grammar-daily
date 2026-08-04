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

function renderTrackCard(track, s) {
  const reviewText = s.needsReview > 0 ? `<span class="review-flag">・待複習 ${s.needsReview} 題</span>` : "";
  return `
    <a class="track-card" href="track.html?t=${track.id}">
      <div class="track-name">${track.label}</div>
      <div class="track-stats">已作答 ${s.attempted}/10 題${reviewText}</div>
    </a>
  `;
}

function renderComingSoonCard(item) {
  return `
    <div class="track-card coming-soon">
      <div class="track-name">${item.label}</div>
      <div class="track-stats">即將推出</div>
    </div>
  `;
}

async function render() {
  const summaries = await Promise.all(TRACKS.map((t) => trackSummary(t)));
  appEl.innerHTML = GROUP_ORDER.map((group) => {
    const realCardsHtml = TRACKS
      .map((t, i) => ({ t, s: summaries[i] }))
      .filter(({ t }) => t.group === group)
      .map(({ t, s }) => renderTrackCard(t, s))
      .join("");
    const soonCardsHtml = COMING_SOON.filter((c) => c.group === group).map(renderComingSoonCard).join("");
    if (!realCardsHtml && !soonCardsHtml) return "";
    return `
      <div class="section-title">${GROUP_LABELS[group]}</div>
      ${realCardsHtml}${soonCardsHtml}
    `;
  }).join("");
}

render();
