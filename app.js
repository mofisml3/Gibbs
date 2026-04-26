/* ================================================
   تجربة طاقة كيبس الحرة — منطق التطبيق
   ================================================ */

// ----- State -----
const state = {
  step: 0,            // 0..3 (concept, lab, sign-explorer, quiz)
  // Lab: ΔH (kJ/mol), ΔS (J/mol·K), T (K)
  H: 25.7,            // ammonium nitrate dissolution: endothermic
  S: 108.7,           // increases entropy
  T: 298,             // 25 °C
  quizIdx: 0,
  quizAnswers: [],    // {correct: bool}
};

// ----- Quiz data -----
const QUIZ = [
  {
    text: "تفاعل ما عند درجة حرارة 298 K يمتلك القيم الآتية: ΔH = ‎−85 kJ/mol و ΔS = ‎+120 J/mol·K. ماذا تتوقع عن تلقائية هذا التفاعل؟",
    context: "احسب ΔG وفق قانون: ΔG = ΔH − TΔS",
    options: [
      "تفاعل تلقائي لأن قيمة ΔG سالبة",
      "تفاعل غير تلقائي لأن قيمة ΔG موجبة",
      "تفاعل في حالة اتزان لأن ΔG = 0",
      "لا يمكن تحديد التلقائية من المعطيات"
    ],
    correct: 0,
    explain: "بحساب: ΔG = ‎−85 − (298 × 0.120) = ‎−85 − 35.76 = ‎−120.76 kJ/mol. القيمة سالبة (ΔG < 0)، إذن التفاعل تلقائي وفق ما درسناه في دلالات إشارة ΔG."
  },
  {
    text: "وفق قانون التغير في طاقة كيبس الحرة في الظروف الاعتيادية ΔG = ΔH − TΔS، أيّ من العبارات الآتية صحيحة عندما يكون ΔH موجبًا و ΔS موجبًا؟",
    context: "تحليل أثر درجة الحرارة T على إشارة ΔG.",
    options: [
      "التفاعل تلقائي عند جميع درجات الحرارة",
      "التفاعل غير تلقائي عند جميع درجات الحرارة",
      "التفاعل يصبح تلقائيًا عند درجات الحرارة المرتفعة",
      "التفاعل يصبح تلقائيًا عند درجات الحرارة المنخفضة"
    ],
    correct: 2,
    explain: "عندما يكون ΔH موجبًا و ΔS موجبًا، فإن الحد TΔS يكبر مع ارتفاع T حتى يفوق ΔH، فتصبح ΔG = ΔH − TΔS سالبة. مثال على ذلك: ذوبان نترات الأمونيوم في الماء، عملية تعتمد على الطاقة والانتروبي."
  },
  {
    text: "إذا كان التغير في طاقة كيبس الحرة لتفاعل ما يساوي صفرًا (ΔG = 0)، فإن النظام يكون في:",
    context: "تذكّر دلالات إشارة ΔG الثلاث الواردة في الدرس.",
    options: [
      "حالة تلقائية كاملة",
      "حالة اتزان",
      "حالة غير تلقائية",
      "حالة لا يمكن وصفها ثرموداينميكيًا"
    ],
    correct: 1,
    explain: "نص القانون: عندما تكون ΔG قيمة تساوي صفر (ΔG = 0) فإن التفاعل أو التغير الفيزيائي في حالة اتزان. وهذه إحدى الدلالات الثلاث لإشارة ΔG."
  }
];

// ----- Helpers -----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function fmt(num, dec = 2) {
  if (Number.isNaN(num) || !Number.isFinite(num)) return "—";
  const sign = num < 0 ? "−" : (num > 0 ? "+" : "");
  return sign + Math.abs(num).toFixed(dec);
}

// ----- Step navigation -----
function setStep(i) {
  state.step = i;
  $$(".step-pill").forEach((el, idx) => {
    el.classList.toggle("active", idx === i);
    el.classList.toggle("done", idx < i);
  });
  $$(".section").forEach((el, idx) => el.classList.toggle("active", idx === i));
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (i === 1) updateLab();
  if (i === 3) renderQuiz();
}

// ----- Lab simulator -----
function updateLab() {
  const H = state.H;
  const S = state.S;
  const T = state.T;
  const G = H - (T * S) / 1000; // kJ/mol

  // readout
  $("#out-h").textContent = fmt(H, 1);
  $("#out-s").textContent = fmt(S, 1);
  $("#out-t").textContent = T.toFixed(0);
  $("#out-ts").textContent = fmt((T * S) / 1000, 2);

  const gEl = $("#out-g");
  gEl.textContent = fmt(G, 2);
  gEl.classList.remove("neg", "pos", "zero");

  const tag = $("#verdict-tag");
  const tagState = $("#verdict-state");
  tag.classList.remove("spontaneous", "nonspontaneous", "equilibrium");

  if (Math.abs(G) < 0.5) {
    gEl.classList.add("zero");
    tag.classList.add("equilibrium");
    tagState.textContent = "حالة اتزان";
    setReactionMood("equilibrium");
  } else if (G < 0) {
    gEl.classList.add("neg");
    tag.classList.add("spontaneous");
    tagState.textContent = "تفاعل تلقائي";
    setReactionMood("spontaneous");
  } else {
    gEl.classList.add("pos");
    tag.classList.add("nonspontaneous");
    tagState.textContent = "تفاعل غير تلقائي";
    setReactionMood("nonspontaneous");
  }

  // labels
  $("#lab-h").textContent = fmt(H, 1);
  $("#lab-s").textContent = fmt(S, 1);
  $("#lab-t").textContent = T.toFixed(0);

  // thermometer fill
  const pct = Math.max(0, Math.min(1, (T - 250) / 200));
  $("#therm-fill").style.height = `${pct * 100}%`;
  $("#therm-val").textContent = `${T.toFixed(0)} K`;
  $("#therm-c").textContent = `${(T - 273.15).toFixed(0)} °C`;
}

// ----- Particle animation in beaker -----
const particles = [];
let particleSpeed = 0.6;
let particleColor = "#6b8e4e";

function setReactionMood(mood) {
  if (mood === "spontaneous") {
    particleSpeed = 1.4;
    particleColor = "#6b8e4e";
  } else if (mood === "nonspontaneous") {
    particleSpeed = 0.4;
    particleColor = "#c97b50";
  } else {
    particleSpeed = 0.8;
    particleColor = "#c9a44a";
  }
  particles.forEach(p => p.el.style.background = particleColor);
}

function initParticles() {
  const stage = $("#beaker-particles");
  if (!stage) return;
  stage.innerHTML = "";
  particles.length = 0;
  const W = 160, H = 200;
  for (let i = 0; i < 28; i++) {
    const el = document.createElement("div");
    el.className = "particle";
    el.style.background = particleColor;
    el.style.opacity = 0.7;
    stage.appendChild(el);
    particles.push({
      el,
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    });
  }
  animateParticles(W, H);
}

function animateParticles(W, H) {
  function tick() {
    particles.forEach(p => {
      p.x += p.vx * particleSpeed;
      p.y += p.vy * particleSpeed;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      p.x = Math.max(0, Math.min(W, p.x));
      p.y = Math.max(0, Math.min(H, p.y));
      p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    });
    requestAnimationFrame(tick);
  }
  tick();
}

// ----- Presets -----
function applyPreset(name) {
  const presets = {
    nh4no3: { H: 25.7, S: 108.7, T: 298 },   // ذوبان نترات الأمونيوم
    combustion: { H: -890, S: -242, T: 298 }, // احتراق الميثان (تلقائي)
    melting:  { H: 6.01, S: 22.0, T: 273 },   // انصهار الجليد عند 0°C → اتزان تقريبي
    photosyn: { H: 2802, S: -210, T: 298 },   // التركيب الضوئي (غير تلقائي)
  };
  const p = presets[name];
  if (!p) return;
  state.H = p.H; state.S = p.S; state.T = p.T;
  $("#sl-h").value = p.H;
  $("#sl-s").value = p.S;
  $("#sl-t").value = p.T;
  updateLab();
}

// ----- Quiz -----
function renderQuiz() {
  const idx = state.quizIdx;

  if (idx >= QUIZ.length) {
    renderResult();
    return;
  }

  const q = QUIZ[idx];
  const card = $("#quiz-card");
  card.innerHTML = `
    <div class="q-num">السؤال ${String(idx + 1).padStart(2, "0")} / ${String(QUIZ.length).padStart(2, "0")}</div>
    <div class="q-text">${q.text}</div>
    <div class="q-context">${q.context}</div>
    <div class="options">
      ${q.options.map((opt, i) => `
        <button class="option" data-i="${i}">
          <span class="opt-letter">${["أ","ب","ج","د"][i]}</span>
          <span>${opt}</span>
        </button>
      `).join("")}
    </div>
    <div class="feedback" id="feedback"></div>
    <div class="quiz-nav">
      <button class="btn ghost" id="back-q" ${idx === 0 ? "disabled" : ""}>السؤال السابق</button>
      <button class="btn" id="next-q" disabled>${idx === QUIZ.length - 1 ? "عرض النتيجة" : "السؤال التالي"}</button>
    </div>
  `;

  updateQuizPips();

  $$(".option").forEach(btn => {
    btn.addEventListener("click", () => handleAnswer(parseInt(btn.dataset.i, 10)));
  });
  $("#next-q").addEventListener("click", () => {
    state.quizIdx++;
    renderQuiz();
  });
  $("#back-q").addEventListener("click", () => {
    if (state.quizIdx > 0) {
      state.quizIdx--;
      renderQuiz();
    }
  });
}

function handleAnswer(i) {
  const q = QUIZ[state.quizIdx];
  const isCorrect = i === q.correct;
  state.quizAnswers[state.quizIdx] = { correct: isCorrect, picked: i };

  $$(".option").forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.correct) btn.classList.add("correct");
    else if (idx === i) btn.classList.add("wrong");
  });

  const fb = $("#feedback");
  fb.classList.add("show");
  if (isCorrect) {
    fb.classList.add("correct");
    fb.innerHTML = `<b>✓ إجابة صحيحة</b>${q.explain}`;
  } else {
    fb.classList.add("wrong");
    fb.innerHTML = `<b>✗ إجابة غير دقيقة</b>${q.explain}`;
  }

  $("#next-q").disabled = false;
  updateQuizPips();
}

function updateQuizPips() {
  $$(".qpip").forEach((pip, i) => {
    pip.classList.remove("active", "correct", "wrong");
    const ans = state.quizAnswers[i];
    if (ans) pip.classList.add(ans.correct ? "correct" : "wrong");
    else if (i === state.quizIdx) pip.classList.add("active");
  });
}

function renderResult() {
  const correct = state.quizAnswers.filter(a => a && a.correct).length;
  const pct = Math.round((correct / QUIZ.length) * 100);
  let msg = "";
  if (correct === QUIZ.length) msg = "ممتاز! أتقنت مفهوم طاقة كيبس الحرة وعلاقتها بـ ΔH و ΔS ودلالات إشارة ΔG.";
  else if (correct >= 2) msg = "جيد جدًا. لديك فهم قوي للمفهوم. راجع السؤال الذي أخطأت فيه لتعزيز فهمك لإشارة ΔG.";
  else msg = "ابدأ بمراجعة قانون ΔG = ΔH − TΔS ودلالات إشارة ΔG الثلاث، ثم أعد المحاولة.";

  $("#quiz-card").innerHTML = `
    <div class="result">
      <div class="score-ring">
        <svg viewBox="0 0 120 120" width="140" height="140">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#e4e0d6" stroke-width="10"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke="#6b8e4e" stroke-width="10"
            stroke-dasharray="${(pct / 100) * 326.7} 326.7"
            stroke-linecap="round"
            transform="rotate(-90 60 60)"
            style="transition: stroke-dasharray 1s ease;"/>
        </svg>
        <div class="num">${correct}/${QUIZ.length}</div>
      </div>
      <h3>اكتملت التجربة التعليمية</h3>
      <p>${msg}</p>
      <button class="btn" id="restart">إعادة الاختبار</button>
    </div>
  `;
  $("#restart").addEventListener("click", () => {
    state.quizIdx = 0;
    state.quizAnswers = [];
    renderQuiz();
  });
}

// ----- Wire up -----
window.addEventListener("DOMContentLoaded", () => {
  // step pills
  $$(".step-pill").forEach((el, idx) => {
    el.addEventListener("click", () => setStep(idx));
  });

  // foot nav
  $$(".foot-next").forEach(btn => btn.addEventListener("click", () => setStep(state.step + 1)));
  $$(".foot-prev").forEach(btn => btn.addEventListener("click", () => setStep(state.step - 1)));

  // sliders
  $("#sl-h").addEventListener("input", (e) => { state.H = parseFloat(e.target.value); updateLab(); });
  $("#sl-s").addEventListener("input", (e) => { state.S = parseFloat(e.target.value); updateLab(); });
  $("#sl-t").addEventListener("input", (e) => { state.T = parseFloat(e.target.value); updateLab(); });

  // presets
  $$(".preset").forEach(btn => btn.addEventListener("click", () => applyPreset(btn.dataset.preset)));

  initParticles();
  setStep(0);
});
