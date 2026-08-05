const appEl = document.getElementById("app");
const params = new URLSearchParams(location.search);
const track = trackById(params.get("t"));
const reviewQuestionId = params.get("q"); // 從錯題本點進來，只複習這一題，不影響正常進度

let questions = [];
let pos = 0;
let isReviewMode = false;
let results = []; // 每一題目前的狀態：null=還沒作答，true=答對，false=答錯（均一平台式燈泡進度）

function progressKey() {
  return `bw-grammar-progress-${track.id}`;
}

function loadProgress() {
  const saved = Number(localStorage.getItem(progressKey()));
  return Number.isInteger(saved) && saved >= 0 ? saved : 0;
}

function saveProgress() {
  localStorage.setItem(progressKey(), String(pos));
}

function clearProgress() {
  localStorage.removeItem(progressKey());
}

function itemRef(questionId) {
  return db.collection("self_grammar").doc(track.id).collection("items").doc(questionId);
}

function dayRef() {
  return db.collection("self_grammar").doc(track.id).collection("days").doc(toLocalDateKey(new Date()));
}

// nextSchedule() 已搬到 tracks.js 共用（part6.js 也要用同一套排程邏輯）。

async function recordAnswer(questionId, correct) {
  const ref = itemRef(questionId);
  const prevSnap = await ref.get();
  const prev = prevSnap.data() || {};
  const schedule = nextSchedule(prev, correct);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + schedule.interval);

  // items/{id} 的 attempts 是「這題歷來總次數」，updatedAt 只留得住最後一次的日期，
  // 同一題跨天重練會讓早期的日期被覆蓋掉；改在 days/{日期} 另外獨立計數，
  // 才能讓儀表板熱力圖/連續天數正確反映每天實際練了幾題。
  await Promise.all([
    ref.set({
      attempts: firebase.firestore.FieldValue.increment(1),
      correctCount: firebase.firestore.FieldValue.increment(correct ? 1 : 0),
      needsReview: !correct,
      question: currentQuestionSummary(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      repetition: schedule.repetition,
      interval: schedule.interval,
      easeFactor: schedule.easeFactor,
      dueDate: firebase.firestore.Timestamp.fromDate(dueDate),
    }, { merge: true }),
    dayRef().set({
      count: firebase.firestore.FieldValue.increment(1),
      itemIds: firebase.firestore.FieldValue.arrayUnion(questionId),
    }, { merge: true }),
  ]);
}

function currentQuestionSummary() {
  const q = questions[pos];
  return track.type === "mc" ? q.question : q.chinese;
}

function renderDone() {
  if (isReviewMode) {
    appEl.innerHTML = `
      <div class="done-card">
        <div>複習完成！</div>
        <div class="nav-row">
          <a class="nav-btn secondary" href="wrong.html" style="text-decoration:none;text-align:center;line-height:2.6;">回複習佇列</a>
          <a class="nav-btn" href="track.html?t=${track.id}" style="text-decoration:none;text-align:center;line-height:2.6;">做整個題庫</a>
        </div>
      </div>
    `;
    return;
  }
  clearProgress();
  appEl.innerHTML = `
    <div class="done-card">
      <div>這個題庫做完一輪了！</div>
      <div class="nav-row">
        <a class="nav-btn secondary" href="dashboard.html" style="text-decoration:none;text-align:center;line-height:2.6;">回儀表板</a>
        <button class="nav-btn" id="restartBtn">重新做一次</button>
      </div>
    </div>
  `;
  document.getElementById("restartBtn").addEventListener("click", () => {
    pos = 0;
    renderQuestion();
  });
}

function renderQuestion() {
  if (pos >= questions.length) {
    renderDone();
    return;
  }
  if (!isReviewMode) saveProgress();
  const q = questions[pos];
  if (track.type === "mc") renderMcQuestion(q);
  else renderTranslateQuestion(q);
}

// 均一平台式燈泡進度：一格一題，答對才亮，答錯或還沒作答都維持不亮
function renderProgressDots() {
  return `<div class="progress-dots">${questions.map((_, i) =>
    `<div class="progress-dot${results[i] ? " lit" : ""}"></div>`
  ).join("")}</div>`;
}

function renderMcQuestion(q) {
  const optionsHtml = q.options.map((opt, i) =>
    `<button class="option-btn" data-idx="${i}">${String.fromCharCode(65 + i)}. ${opt}</button>`
  ).join("");

  appEl.innerHTML = `
    <div class="quiz-progress">第 ${pos + 1} / ${questions.length} 題</div>
    ${renderProgressDots()}
    <div class="quiz-card">
      <div class="question-text">${q.question}</div>
      ${optionsHtml}
      <div class="explanation-box" id="explanationBox">
        ${q.chinese ? `<div class="chinese-translation">${q.chinese}</div>` : ""}
        <div>${q.explanation}</div>
        ${q.optionNotes ? `<div class="option-notes">${q.optionNotes.map((note, i) =>
          `<div><strong>${String.fromCharCode(65 + i)}.</strong> ${note}</div>`
        ).join("")}</div>` : ""}
      </div>
      <div class="nav-row">
        <button class="nav-btn" id="nextBtn" disabled>下一題</button>
      </div>
    </div>
  `;

  const buttons = [...appEl.querySelectorAll(".option-btn")];
  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      buttons.forEach((b) => (b.disabled = true));
      const idx = Number(btn.dataset.idx);
      const correct = idx === q.answerIndex;
      btn.classList.add(correct ? "correct" : "wrong");
      if (!correct) buttons[q.answerIndex].classList.add("correct");
      document.getElementById("explanationBox").classList.add("show");
      document.getElementById("nextBtn").disabled = false;
      results[pos] = correct;
      document.querySelector(".progress-dots").outerHTML = renderProgressDots();
      // 手機直式畫面塞不下題目+解析+下一題，答完不主動捲動的話，
      // 使用者在 iPhone Safari 上完全看不到解析已經出現，得自己手滑找按鈕。
      document.getElementById("nextBtn").scrollIntoView({ behavior: "smooth", block: "end" });
      await recordAnswer(q.id, correct);
    });
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    pos++;
    renderQuestion();
  });
}

function renderTranslateQuestion(q) {
  appEl.innerHTML = `
    <div class="quiz-progress">第 ${pos + 1} / ${questions.length} 題</div>
    ${renderProgressDots()}
    <div class="quiz-card">
      <div class="question-text">${q.chinese}</div>
      <textarea class="translate-input" id="translateInput" placeholder="先自己翻翻看..."></textarea>
      <div class="nav-row">
        <button class="nav-btn secondary" id="showRefBtn">看參考答案</button>
      </div>
      <div class="reference-box" id="referenceBox">${q.reference}</div>
      <div class="nav-row" id="markRow" style="display:none;">
        <button class="nav-btn correct-mark" id="markCorrectBtn">我對了</button>
        <button class="nav-btn wrong-mark" id="markWrongBtn">還需要加強</button>
      </div>
    </div>
  `;

  document.getElementById("showRefBtn").addEventListener("click", () => {
    document.getElementById("referenceBox").classList.add("show");
    document.getElementById("markRow").style.display = "flex";
    document.getElementById("showRefBtn").disabled = true;
    document.getElementById("markRow").scrollIntoView({ behavior: "smooth", block: "end" });
  });

  const mark = async (correct) => {
    document.getElementById("markCorrectBtn").disabled = true;
    document.getElementById("markWrongBtn").disabled = true;
    results[pos] = correct;
    await recordAnswer(q.id, correct);
    pos++;
    renderQuestion();
  };
  document.getElementById("markCorrectBtn").addEventListener("click", () => mark(true));
  document.getElementById("markWrongBtn").addEventListener("click", () => mark(false));
}

function init() {
  if (!track) {
    appEl.innerHTML = `<p class="empty-msg">找不到這個題庫。</p>`;
    return;
  }
  document.getElementById("trackTitle").textContent = track.label;
  fetch(track.file)
    .then((res) => res.json())
    .then((data) => {
      if (reviewQuestionId) {
        const target = data.find((q) => q.id === reviewQuestionId);
        questions = target ? [target] : [];
        isReviewMode = true;
        pos = 0;
      } else {
        questions = data;
        pos = Math.min(loadProgress(), questions.length);
      }
      results = new Array(questions.length).fill(null);
      renderQuestion();
    });
}

init();
