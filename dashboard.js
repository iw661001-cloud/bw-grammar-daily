const appEl = document.getElementById("app");

function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateKeyFromTimestamp(timestamp) {
  if (!timestamp) return null;
  return toLocalDateKey(timestamp.toDate());
}

async function fetchAllItems() {
  const all = [];
  for (const track of TRACKS) {
    const snap = await db.collection("self_grammar").doc(track.id).collection("items").get();
    snap.forEach((doc) => all.push({ trackId: track.id, ...doc.data() }));
  }
  return all;
}

// 從今天（或昨天，如果今天還沒練習）往回數，中斷就停
function computeStreak(dayCounts) {
  let streak = 0;
  const cursor = new Date();
  if (!dayCounts.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dayCounts.has(toLocalDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function heatLevel(count) {
  if (!count) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function renderHeatmap(dayCounts) {
  const days = 35;
  const cells = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toLocalDateKey(d);
    const count = dayCounts.get(key) || 0;
    cells.push(`<div class="heatmap-cell" data-level="${heatLevel(count)}" title="${key}：${count}題"></div>`);
  }
  return cells.join("");
}

async function render() {
  const items = await fetchAllItems();

  let totalAttempts = 0;
  let totalCorrect = 0;
  const dayCounts = new Map();
  const byTrack = {};
  TRACKS.forEach((t) => (byTrack[t.id] = { attempted: 0, attempts: 0, correct: 0, needsReview: 0 }));

  items.forEach((item) => {
    const attempts = item.attempts || 0;
    const correct = item.correctCount || 0;
    totalAttempts += attempts;
    totalCorrect += correct;

    const bucket = byTrack[item.trackId];
    if (bucket) {
      if (attempts > 0) bucket.attempted++;
      bucket.attempts += attempts;
      bucket.correct += correct;
      if (item.needsReview) bucket.needsReview++;
    }

    // 用單字最後一次作答的日期記錄練習天數；同一題若跨多天重練，只算得到最近那一天，
    // 這是目前資料結構（只存累計次數，沒存逐次紀錄）的已知限制，量少時影響不大。
    const key = dateKeyFromTimestamp(item.updatedAt);
    if (key) dayCounts.set(key, (dayCounts.get(key) || 0) + attempts);
  });

  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const practiceDays = dayCounts.size;
  const streak = computeStreak(dayCounts);

  const kpiHtml = `
    <div class="kpi-row">
      <div class="stat-tile">
        <div class="stat-label">總作答題數</div>
        <div class="stat-value">${totalAttempts}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-label">整體正確率</div>
        <div class="stat-value">${accuracy}<span class="stat-unit">%</span></div>
      </div>
      <div class="stat-tile">
        <div class="stat-label">練習天數</div>
        <div class="stat-value">${practiceDays}<span class="stat-unit">天</span></div>
      </div>
      <div class="stat-tile">
        <div class="stat-label">連續天數</div>
        <div class="stat-value">${streak}<span class="stat-unit">天</span></div>
      </div>
    </div>
  `;

  const heatmapHtml = `
    <div class="heatmap-card">
      <div class="dashboard-section-title" style="margin-top:0;">最近35天練習狀況</div>
      <div class="heatmap-grid">${renderHeatmap(dayCounts)}</div>
      <div class="heatmap-legend">
        少
        <div class="heatmap-cell" data-level="0"></div>
        <div class="heatmap-cell" data-level="1"></div>
        <div class="heatmap-cell" data-level="2"></div>
        <div class="heatmap-cell" data-level="3"></div>
        <div class="heatmap-cell" data-level="4"></div>
        多
      </div>
    </div>
  `;

  const tracksHtml = TRACKS.map((track) => {
    const s = byTrack[track.id];
    const pct = Math.min(100, Math.round((s.attempted / 10) * 100));
    const accuracyPct = s.attempts > 0 ? Math.round((s.correct / s.attempts) * 100) : null;
    return `
      <div class="dashboard-track-card">
        <div class="track-name">${track.label}</div>
        <div class="meter-track"><div class="meter-fill" style="width:${pct}%"></div></div>
        <div class="dashboard-track-row">
          <span>已作答 ${s.attempted}/10</span>
          <span>${accuracyPct === null ? "尚無資料" : "正確率 " + accuracyPct + "%"}</span>
          ${s.needsReview > 0 ? `<span class="review-flag">待複習 ${s.needsReview}</span>` : ""}
        </div>
      </div>
    `;
  }).join("");

  appEl.innerHTML = kpiHtml + heatmapHtml + `<div class="dashboard-section-title">各題庫詳情</div>` + tracksHtml;
}

render();
