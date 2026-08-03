const appEl = document.getElementById("app");
const params = new URLSearchParams(location.search);
const track = trackById(params.get("t"));

let questions = [];
let pos = 0;

function itemRef(questionId) {
  return db.collection("self_grammar").doc(track.id).collection("items").doc(questionId);
}

async function recordAnswer(questionId, correct) {
  await itemRef(questionId).set({
    attempts: firebase.firestore.FieldValue.increment(1),
    correctCount: firebase.firestore.FieldValue.increment(correct ? 1 : 0),
    needsReview: !correct,
    question: currentQuestionSummary(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

function currentQuestionSummary() {
  const q = questions[pos];
  return track.type === "mc" ? q.question : q.chinese;
}

function renderDone() {
  appEl.innerHTML = `
    <div class="done-card">
      <div>這個題庫做完一輪了！</div>
      <div class="nav-row">
        <a class="nav-btn secondary" href="index.html" style="text-decoration:none;text-align:center;line-height:2.6;">回首頁</a>
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
  const q = questions[pos];
  if (track.type === "mc") renderMcQuestion(q);
  else renderTranslateQuestion(q);
}

function renderMcQuestion(q) {
  const optionsHtml = q.options.map((opt, i) =>
    `<button class="option-btn" data-idx="${i}">${String.fromCharCode(65 + i)}. ${opt}</button>`
  ).join("");

  appEl.innerHTML = `
    <div class="quiz-progress">第 ${pos + 1} / ${questions.length} 題</div>
    <div class="quiz-card">
      <div class="question-text">${q.question}</div>
      ${optionsHtml}
      <div class="explanation-box" id="explanationBox">
        ${q.chinese ? `<div class="chinese-translation">${q.chinese}</div>` : ""}
        <div>${q.explanation}</div>
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
  });

  const mark = async (correct) => {
    document.getElementById("markCorrectBtn").disabled = true;
    document.getElementById("markWrongBtn").disabled = true;
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
      questions = data;
      renderQuestion();
    });
}

init();
