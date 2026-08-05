const appEl = document.getElementById("app");

function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function fetchAllItems() {
  const all = [];
  for (const track of TRACKS) {
    const snap = await db.collection("self_grammar").doc(track.id).collection("items").get();
    snap.forEach((doc) => all.push({ id: doc.id, trackId: track.id, ...doc.data() }));
  }
  return all;
}

// 每天實際練幾題、練了哪幾題，存在 days/{日期} 子集合（見 track.js 的 dayRef()），
// 不能用 items 的 updatedAt 推算——同一題跨天重練時 updatedAt 只留得住最後一天，
// 會把之前那幾天的練習次數整批洗到最新那天。
// 回傳 Map<日期, {count, itemIds}>，itemIds 是舊資料可能沒有的欄位（沿用時視為空陣列）。
async function fetchTrackDayDetails(trackId) {
  const snap = await db.collection("self_grammar").doc(trackId).collection("days").get();
  const map = new Map();
  snap.forEach((doc) => {
    const d = doc.data();
    map.set(doc.id, { count: d.count || 0, itemIds: d.itemIds || [] });
  });
  return map;
}

function toCountMap(dayDetails) {
  const map = new Map();
  dayDetails.forEach((v, k) => map.set(k, v.count));
  return map;
}

// 文法題的「文法點分類」存在題庫 json 裡（跟作答紀錄無關的靜態資料），
// 中翻英沒有單一文法點可標，不計入分類統計。
async function fetchGrammarCategoryMap() {
  const map = {};
  const grammarTracks = TRACKS.filter((t) => t.group === "grammar");
  for (const track of grammarTracks) {
    const res = await fetch(track.file);
    const data = await res.json();
    data.forEach((q) => { map[q.id] = q.category; });
  }
  return map;
}

// 題庫會陸續擴充題量，不能把分母寫死成10，要讀每個題庫json的實際長度。
async function fetchTrackTotals() {
  const totals = {};
  await Promise.all(TRACKS.map(async (track) => {
    const res = await fetch(track.file);
    const data = await res.json();
    totals[track.id] = data.length;
  }));
  return totals;
}

// 從今天（或昨天，如果今天還沒練習）往回數，中斷就停。
// 回傳 {count, startDate, endDate}（YYYY-MM-DD字串），不只回傳數字，
// 讓畫面上可以顯示「連續天數是從幾號到幾號」，不是只有一個孤立的數字。
function computeStreak(dayCounts) {
  let count = 0;
  let startDate = null;
  let endDate = null;
  const cursor = new Date();
  if (!dayCounts.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dayCounts.has(toLocalDateKey(cursor))) {
    const key = toLocalDateKey(cursor);
    if (!endDate) endDate = key;
    startDate = key;
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { count, startDate, endDate };
}

function heatLevel(count) {
  if (!count) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

// 每個題庫各自一條小熱力圖，不做全站合併的大格子——題庫一多（文法x3+中翻英x2）
// 塞進同一個月曆會太擠，分開放在各自卡片下方，一眼就看得出「這個題庫最近有沒有在練」。
// 固定顯示「本週」（週一到週日），不是往回捲動的最近7天——用捲動視窗的話，
// 只要每天練習量差不多，格子顏色會一直長一樣，看不出週期節奏；固定一週的話，
// 每週一自動歸零重新填，比較看得出這週練了幾天。
const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

function renderMiniHeatmap(dayCounts) {
  const labelCells = WEEKDAY_LABELS.map((w) => `<div class="heatmap-weekday-label">${w}</div>`).join("");

  const cells = [];
  const today = new Date();
  const daysSinceMonday = (today.getDay() + 6) % 7; // 週一=0...週日=6
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = toLocalDateKey(d);
    const count = dayCounts.get(key) || 0;
    cells.push(`<div class="heatmap-cell" data-level="${heatLevel(count)}" title="${key}：${count}題">${count > 0 ? count : ""}</div>`);
  }
  return `<div class="mini-heatmap-labels">${labelCells}</div><div class="mini-heatmap-grid">${cells.join("")}</div>`;
}

async function render() {
  const [items, categoryMap, trackDayDetailsList, trackTotals] = await Promise.all([
    fetchAllItems(),
    fetchGrammarCategoryMap(),
    Promise.all(TRACKS.map((t) => fetchTrackDayDetails(t.id))),
    fetchTrackTotals(),
  ]);

  let totalAttempts = 0;
  let totalCorrect = 0;
  const dayCounts = new Map();
  const byTrack = {};
  const byCategory = {};
  TRACKS.forEach((t, i) => {
    const dayDetails = trackDayDetailsList[i];
    byTrack[t.id] = {
      attempted: 0, attempts: 0, correct: 0, needsReview: 0,
      dayDetails,
      dayCounts: toCountMap(dayDetails),
      items: [],
    };
    dayDetails.forEach((v, key) => dayCounts.set(key, (dayCounts.get(key) || 0) + v.count));
  });

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
      bucket.items.push(item);
    }

    const category = categoryMap[item.id];
    if (category && attempts > 0) {
      if (!byCategory[category]) byCategory[category] = { attempts: 0, correct: 0 };
      byCategory[category].attempts += attempts;
      byCategory[category].correct += correct;
    }
  });

  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const practiceDays = dayCounts.size;
  const streak = computeStreak(dayCounts).count;
  const now = new Date();
  const dueCount = items.filter((item) => isDueForReview(item, now)).length;

  const reviewBannerHtml = dueCount > 0
    ? `<a class="review-banner" href="wrong.html">今天有 <strong>${dueCount}</strong> 題到期需要複習・前往複習</a>`
    : `<div class="review-banner is-clear">今天沒有到期需要複習的題目</div>`;

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

  // 答錯率超過50%標「較難」，門檻是簡單的經驗值，不是統計顯著性判斷——
  // 借鏡 staresto 網站的難度標示設計，但我們沒有官方P/D值，只能用自己累積的答錯率概算。
  function difficultyTag(item) {
    const attempts = item.attempts || 0;
    if (attempts < 2) return "";
    const wrongRate = 1 - (item.correctCount || 0) / attempts;
    return wrongRate > 0.5 ? `<span class="difficulty-tag">較難</span>` : "";
  }

  function renderTrackDetail(track, s) {
    const dateEntries = [...s.dayDetails.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
    const itemById = {};
    s.items.forEach((it) => { itemById[it.id] = it; });

    const dateListHtml = dateEntries.length
      ? dateEntries.map(([date, v]) => {
          const qList = v.itemIds.length
            ? v.itemIds.map((id) => `<div class="detail-question">${(itemById[id] && itemById[id].question) || id}</div>`).join("")
            : `<div class="detail-question empty-msg">這天的題目明細是舊資料，沒有記錄實際作答哪幾題</div>`;
          return `
            <div class="detail-date-block">
              <div class="detail-date-label">${date}（${v.count}題）</div>
              ${qList}
            </div>
          `;
        }).join("")
      : `<p class="empty-msg">還沒有任何作答紀錄</p>`;

    const streak = computeStreak(s.dayCounts);
    const streakRangeHtml = streak.count > 0
      ? `<p>${streak.startDate} ～ ${streak.endDate}（連續 ${streak.count} 天）</p>`
      : `<p class="empty-msg">目前沒有連續中的複習</p>`;

    const sortedItems = [...s.items].sort((a, b) => {
      const rateA = a.attempts > 0 ? (a.correctCount || 0) / a.attempts : 1;
      const rateB = b.attempts > 0 ? (b.correctCount || 0) / b.attempts : 1;
      return rateA - rateB;
    });
    const itemListHtml = sortedItems.length
      ? sortedItems.map((it) => {
          const acc = it.attempts > 0 ? Math.round(((it.correctCount || 0) / it.attempts) * 100) : 0;
          return `
            <div class="detail-item-row">
              <div class="detail-question">${it.question}</div>
              <div class="detail-item-meta">
                <span>作答 ${it.attempts || 0} 次・正確率 ${acc}%</span>
                ${difficultyTag(it)}
                <button class="report-btn" data-track="${track.id}" data-item="${it.id}">回報這題有問題</button>
              </div>
            </div>
          `;
        }).join("")
      : `<p class="empty-msg">還沒有任何作答紀錄</p>`;

    return `
      <div class="track-detail" id="detail-${track.id}">
        <div class="detail-section-title">練習紀錄</div>
        ${dateListHtml}
        <div class="detail-section-title">連續天數區間</div>
        ${streakRangeHtml}
        <div class="detail-section-title">每題正確率（由低到高）</div>
        ${itemListHtml}
      </div>
    `;
  }

  const renderTrackCard = (track) => {
    const s = byTrack[track.id];
    const total = trackTotals[track.id] || 0;
    const pct = total > 0 ? Math.min(100, Math.round((s.attempted / total) * 100)) : 0;
    const accuracyPct = s.attempts > 0 ? Math.round((s.correct / s.attempts) * 100) : null;
    const trackPracticeDays = s.dayCounts.size;
    const trackStreak = computeStreak(s.dayCounts).count;
    return `
      <div class="dashboard-track-card">
        <a class="dashboard-track-link" href="track.html?t=${track.id}">
          <div class="track-name">${track.label}</div>
          <div class="meter-track"><div class="meter-fill" style="width:${pct}%"></div></div>
          <div class="dashboard-track-row">
            <span>已作答 ${s.attempted}/${total}</span>
            <span>${accuracyPct === null ? "尚無資料" : "正確率 " + accuracyPct + "%"}</span>
            ${s.needsReview > 0 ? `<span class="review-flag">待複習 ${s.needsReview}</span>` : ""}
          </div>
        </a>
        <div class="track-heat-row track-detail-toggle" data-target="detail-${track.id}">
          <div class="mini-heatmap-wrap">${renderMiniHeatmap(s.dayCounts)}</div>
          <div class="mini-stat-list">
            <div class="mini-stat"><span class="mini-stat-value">${s.attempts}</span><span class="mini-stat-label">總作答</span></div>
            <div class="mini-stat"><span class="mini-stat-value">${trackPracticeDays}</span><span class="mini-stat-label">練習天數</span></div>
            <div class="mini-stat"><span class="mini-stat-value">${trackStreak}</span><span class="mini-stat-label">連續天數</span></div>
          </div>
        </div>
        ${renderTrackDetail(track, s)}
      </div>
    `;
  };

  function renderComingSoonCard(item) {
    return `
      <div class="dashboard-track-card coming-soon">
        <div class="track-name">${item.label}</div>
        <div class="dashboard-track-row"><span>即將推出</span></div>
      </div>
    `;
  }

  const columnsHtml = GROUP_ORDER.map((group) => {
    const realCardsHtml = TRACKS.filter((t) => t.group === group).map(renderTrackCard).join("");
    const soonCardsHtml = COMING_SOON.filter((c) => c.group === group).map(renderComingSoonCard).join("");
    return `
      <div class="dashboard-category-col">
        <div class="section-title" style="margin-top:0;">${GROUP_LABELS[group]}</div>
        ${realCardsHtml}${soonCardsHtml}
      </div>
    `;
  }).join("");

  // 寬螢幕（電腦）三欄並排，窄螢幕（手機）自動收成單欄，見 style.css 的 media query
  const categoryHtml = `<div class="dashboard-category-cols">${columnsHtml}</div>`;

  const categoryStatsHtml = renderCategoryStats(byCategory);

  appEl.innerHTML = reviewBannerHtml + kpiHtml + categoryHtml + categoryStatsHtml;

  // 卡片下半部（熱力圖/統計數字）點擊展開細節，不是連結——跟上半部的練習連結是兩個獨立的可點擊區，
  // 中間用CSS分隔線區隔（見style.css），避免同一張卡片裡有兩種點擊行為卻長得一樣。
  appEl.querySelectorAll(".track-detail-toggle").forEach((el) => {
    el.addEventListener("click", () => {
      const target = document.getElementById(el.dataset.target);
      if (target) target.classList.toggle("show");
    });
  });

  appEl.querySelectorAll(".report-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "回報中...";
      await db.collection("self_grammar").doc(btn.dataset.track).collection("reports").doc(btn.dataset.item).set({
        reportedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      btn.textContent = "已回報，謝謝";
    });
  });
}

// 文法錯誤類型統計：跨國中/高中/多益三個難度合併看同一個文法點，依錯誤率高到低排序，
// 沒作答過的類別不顯示。題庫還小的時候（每類常常只有1~3題），這個統計參考價值有限，
// 明確標註提醒，不要讓人誤以為是可靠的弱點診斷。
function renderCategoryStats(byCategory) {
  const rows = Object.entries(byCategory)
    .map(([category, s]) => ({
      category,
      attempts: s.attempts,
      wrong: s.attempts - s.correct,
      wrongRate: s.attempts > 0 ? (s.attempts - s.correct) / s.attempts : 0,
    }))
    .sort((a, b) => b.wrongRate - a.wrongRate || b.attempts - a.attempts);

  if (rows.length === 0) {
    return `
      <div class="section-title">文法錯誤類型統計</div>
      <p class="empty-msg">開始練習文法題後，這裡會依文法點分類顯示錯誤情況。</p>
    `;
  }

  const rowsHtml = rows.map((r) => `
    <div class="dashboard-track-card">
      <div class="track-name">${r.category}</div>
      <div class="dashboard-track-row">
        <span>作答 ${r.attempts} 次</span>
        <span>答錯 ${r.wrong} 次（${Math.round(r.wrongRate * 100)}%）</span>
      </div>
    </div>
  `).join("");

  return `
    <div class="section-title">文法錯誤類型統計</div>
    <p class="empty-msg" style="padding:10px 16px;margin-bottom:12px;">題庫還小，每個文法點常常只有1~3題，這個統計僅供參考，題庫變大後會更準。</p>
    ${rowsHtml}
  `;
}

render();
