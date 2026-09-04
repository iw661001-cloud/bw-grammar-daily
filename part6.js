const appEl = document.getElementById("app");
const params = new URLSearchParams(location.search);
const track = trackById(params.get("t"));
const reviewPassageId = params.get("q"); // 從錯題本點進來，只複習這一篇文章，不影響正常進度

let passages = [];
let passageIdx = 0;
let subIdx = 0; // 0~3，當前文章的第幾格
let isReviewMode = false;
let subResults = [null, null, null, null]; // 當前文章4小題的作答狀態，換文章時重置
let dueQueue = []; // 複習模式進頁面當下查到的完整待複習清單（含自己這篇），答完後用來決定跳去哪一項

function progressKey() {
  return `bw-grammar-progress-${track.id}`;
}

function loadProgress() {
  const saved = Number(localStorage.getItem(progressKey()));
  return Number.isInteger(saved) && saved >= 0 ? saved : 0;
}

function saveProgress() {
  localStorage.setItem(progressKey(), String(passageIdx));
}

function clearProgress() {
  localStorage.removeItem(progressKey());
}

function itemRef(passageId) {
  return db.collection("self_grammar").doc(track.id).collection("items").doc(passageId);
}

function dayRef() {
  return db.collection("self_grammar").doc(track.id).collection("days").doc(toLocalDateKey(new Date()));
}

// 儀表板/複習佇列共用「question」欄位當作這個作答單位的摘要文字，
// Part 6 沒有單一句子可以放，改放文章開頭片段（去掉空格標記，避免顯示"______(1)______"這種符號）。
function passageSummary(passage) {
  return passage.passage.replace(/\s+/g, " ").replace(/______\(\d\)______/g, "___").slice(0, 60) + "...";
}

// 排程單位是「整篇文章」不是單一小題：4小題全對才算這篇答對，
// 只要錯一格，排程就當作這篇文章答錯處理（reset間隔），逼使用者下次複習整篇重做。
async function recordPassageResult(passage, allCorrect) {
  const ref = itemRef(passage.id);
  const prevSnap = await ref.get();
  const prev = prevSnap.data() || {};
  const schedule = nextSchedule(prev, allCorrect);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + schedule.interval);

  await Promise.all([
    ref.set({
      attempts: firebase.firestore.FieldValue.increment(1),
      correctCount: firebase.firestore.FieldValue.increment(allCorrect ? 1 : 0),
      needsReview: !allCorrect,
      question: passageSummary(passage),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      repetition: schedule.repetition,
      interval: schedule.interval,
      easeFactor: schedule.easeFactor,
      dueDate: firebase.firestore.Timestamp.fromDate(dueDate),
    }, { merge: true }),
    dayRef().set({
      count: firebase.firestore.FieldValue.increment(1),
      itemIds: firebase.firestore.FieldValue.arrayUnion(passage.id),
    }, { merge: true }),
  ]);
}

function renderDone() {
  if (isReviewMode) {
    // 邏輯跟 track.js 一致：清單裡移除這一篇，還有剩就跳到到期日最早的下一項，
    // 跨到一般題庫的話換頁面（track.html）。
    const remaining = dueQueue.filter((item) => !(item.track.id === track.id && item.questionId === reviewPassageId));
    if (remaining.length > 0) {
      const next = remaining[0];
      const nextPage = next.track.type === "part6" ? "part6.html" : "track.html";
      location.href = `${nextPage}?t=${next.track.id}&q=${next.questionId}`;
      return;
    }
    appEl.innerHTML = `
      <div class="done-card">
        <div>今天的複習都做完了！</div>
        <div class="nav-row">
          <a class="nav-btn secondary" href="wrong.html" style="text-decoration:none;text-align:center;line-height:2.6;">回複習佇列</a>
          <a class="nav-btn" href="index.html" style="text-decoration:none;text-align:center;line-height:2.6;">回儀表板</a>
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
        <a class="nav-btn secondary" href="index.html" style="text-decoration:none;text-align:center;line-height:2.6;">回儀表板</a>
        <button class="nav-btn" id="restartBtn">重新做一次</button>
      </div>
    </div>
  `;
  document.getElementById("restartBtn").addEventListener("click", () => {
    passageIdx = 0;
    subIdx = 0;
    subResults = [null, null, null, null];
    renderSubQuestion();
  });
}

// 均一平台式燈泡進度，代表當前這篇文章的4小題，換下一篇文章會重置
function renderSubDots() {
  return `<div class="progress-dots">${subResults.map((r) =>
    `<div class="progress-dot${r ? " lit" : ""}"></div>`
  ).join("")}</div>`;
}

// 文章全文固定顯示在上方，4個空格位置用標記呈現；正在作答的那一格用醒目樣式標出，
// 已作答過的格子標對/錯顏色，讓使用者可以一路對照全文找脈絡（尤其是第4題的段落邏輯題）。
function renderPassageBox(passage, activeBlank) {
  const html = passage.passage
    .replace(/\n/g, "<br>")
    .replace(/______\((\d)\)______/g, (m, n) => {
      const num = Number(n);
      let cls = "blank-marker";
      if (num === activeBlank) cls += " active";
      else if (subResults[num - 1] === true) cls += " answered correct";
      else if (subResults[num - 1] === false) cls += " answered wrong";
      return `<span class="${cls}" id="blank-marker-${num}">(${num})</span>`;
    });
  return `<div class="passage-box">${html}</div>`;
}

function renderSubQuestion() {
  if (passageIdx >= passages.length) {
    renderDone();
    return;
  }
  if (!isReviewMode) saveProgress();
  const passage = passages[passageIdx];
  const q = passage.questions[subIdx];
  const activeBlank = subIdx + 1;

  const optionsHtml = q.options.map((opt, i) =>
    `<button class="option-btn" data-idx="${i}">${String.fromCharCode(65 + i)}. ${opt}</button>`
  ).join("");

  appEl.innerHTML = `
    <div class="quiz-progress">第 ${passageIdx + 1} / ${passages.length} 篇文章・第 ${subIdx + 1} / 4 格（${q.blankType}）</div>
    ${renderSubDots()}
    ${renderPassageBox(passage, activeBlank)}
    <div class="quiz-card">
      ${optionsHtml}
      <div class="explanation-box" id="explanationBox">
        ${subIdx === 3 && passage.chinese ? `<div class="chinese-translation">${passage.chinese}</div>` : ""}
        <div>${q.explanation}</div>
        ${q.optionNotes ? `<div class="option-notes">${q.optionNotes.map((note, i) =>
          `<div><strong>${String.fromCharCode(65 + i)}.</strong> ${note}</div>`
        ).join("")}</div>` : ""}
      </div>
      <div class="nav-row">
        <button class="nav-btn" id="nextBtn" disabled>${subIdx === 3 ? "看這篇結果" : "下一格"}</button>
      </div>
    </div>
  `;

  const buttons = [...appEl.querySelectorAll(".option-btn")];
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => (b.disabled = true));
      const idx = Number(btn.dataset.idx);
      const correct = idx === q.answerIndex;
      btn.classList.add(correct ? "correct" : "wrong");
      if (!correct) buttons[q.answerIndex].classList.add("correct");
      document.getElementById("explanationBox").classList.add("show");
      document.getElementById("nextBtn").disabled = false;
      subResults[subIdx] = correct;
      document.querySelector(".progress-dots").outerHTML = renderSubDots();
      const marker = document.getElementById(`blank-marker-${activeBlank}`);
      marker.classList.add("answered", correct ? "correct" : "wrong");
      document.getElementById("nextBtn").scrollIntoView({ behavior: "smooth", block: "end" });
    });
  });

  document.getElementById("nextBtn").addEventListener("click", async () => {
    if (subIdx < 3) {
      subIdx++;
      renderSubQuestion();
      return;
    }
    const allCorrect = subResults.every((r) => r === true);
    await recordPassageResult(passage, allCorrect);
    passageIdx++;
    subIdx = 0;
    subResults = [null, null, null, null];
    renderSubQuestion();
  });
}

function init() {
  if (!track) {
    appEl.innerHTML = `<p class="empty-msg">找不到這個題庫。</p>`;
    return;
  }
  document.getElementById("trackTitle").textContent = track.label;
  const fetchPassages = fetch(track.file).then((res) => res.json());

  if (reviewPassageId) {
    Promise.all([fetchPassages, loadDueItems()]).then(([data, due]) => {
      const target = data.find((p) => p.id === reviewPassageId);
      passages = target ? [target] : [];
      isReviewMode = true;
      passageIdx = 0;
      dueQueue = due;
      document.getElementById("reviewCounterSlot").innerHTML = renderReviewCounterHtml(dueQueue.length);
      subIdx = 0;
      subResults = [null, null, null, null];
      renderSubQuestion();
    });
    return;
  }

  fetchPassages.then((data) => {
    passages = data;
    passageIdx = Math.min(loadProgress(), passages.length);
    subIdx = 0;
    subResults = [null, null, null, null];
    renderSubQuestion();
  });
}

init();
