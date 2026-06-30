import { useState, useEffect, useRef, useCallback } from "react";

// ════════════════════════════════════════════════════════════
// بيانات تجريبية لأنواع الأسئلة الأربعة
// النوع 1: نص + اختيارات
// النوع 2: نص فقط بدون اختيارات (Done)
// النوع 3: نص + صور + اختيارات
// النوع 4: نص + صور بدون اختيارات (Done)
// ════════════════════════════════════════════════════════════
const SAMPLE_QUESTIONS = {
  type1: {
    id: 1,
    type: "withOptions",
    text: "ما هو أطول نهر فى قارة أفريقيا؟",
    images: [],
    options: [
      { id: "a", text: "نهر النيل", correct: true },
      { id: "b", text: "نهر الكونغو", correct: false },
      { id: "c", text: "نهر النيجر", correct: false },
      { id: "d", text: "نهر زامبيزى", correct: false },
    ],
    timer: 20,
  },
  type2: {
    id: 2,
    type: "withoutOptions",
    text: "اذكر اسم القديس المعروف بلقب صاحب العمود، ومن أين كان أصله؟",
    images: [],
    answerImage: null,
    timer: 25,
  },
  type3: {
    id: 3,
    type: "withOptions",
    text: "حدد اسم هذا المعلم السياحى من الصور الموضحة",
    images: ["img1", "img2"],
    options: [
      { id: "a", text: "أبو الهول", correct: false },
      { id: "b", text: "معبد أبو سمبل", correct: true },
      { id: "c", text: "معبد الكرنك", correct: false },
    ],
    timer: 30,
  },
  type4: {
    id: 4,
    type: "withoutOptions",
    text: "تأمل الصور التالية، ثم حدد العنصر المشترك بينها",
    images: ["img1", "img2", "img3"],
    answerImage: "answerImg",
    timer: null,
  },
};

export default function QuestionPlayPage() {
  // غيّر هذه القيمة لمعاينة كل نوع: type1 / type2 / type3 / type4
  const [activeSample, setActiveSample] = useState("type1");
  const question = SAMPLE_QUESTIONS[activeSample];

  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [doneRevealed, setDoneRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(question.timer);
  const [timeUp, setTimeUp] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const intervalRef = useRef(null);

  const hasAnswered = selectedOptionId !== null || doneRevealed;

  // ── إعادة تهيئة الحالة عند تبديل السؤال التجريبى ──────────
  useEffect(() => {
    setSelectedOptionId(null);
    setDoneRevealed(false);
    setTimeUp(false);
    setTimeLeft(question.timer);
  }, [activeSample, question.timer]);

  // ── المؤقت ─────────────────────────────────────────────────
  useEffect(() => {
    if (question.timer == null || hasAnswered || timeUp) return;
    if (timeLeft <= 0) {
      setTimeUp(true);
      playSound("timeUp");
      return;
    }
    intervalRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(intervalRef.current);
  }, [timeLeft, hasAnswered, timeUp, question.timer]);

  // ── أصوات (Placeholder — سيتم استبدالها بملفات صوت فعلية) ──
  const playSound = useCallback((name) => {
    console.log("play sound →", name);
  }, []);

  useEffect(() => {
    playSound("open");
  }, [activeSample, playSound]);

  // ── اختيار إجابة ───────────────────────────────────────────
  const handleSelectOption = (opt) => {
    if (hasAnswered) return;
    setSelectedOptionId(opt.id);
    playSound("answerSelected");
  };

  const handleDone = () => {
    if (doneRevealed) return;
    setDoneRevealed(true);
    playSound("answerSelected");
  };

  const handleBack = () => {
    playSound("back");
    console.log("navigate → /competitions/play/grid");
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lemonada:wght@400;500;600;700&family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <div style={S.root}>
        <div style={S.dots} />
        <div style={S.glow} />

        {/* ── مبدّل المعاينة (أداة تطوير فقط — تُحذف عند الربط الفعلى) ── */}
        <div style={S.devSwitcher}>
          {Object.keys(SAMPLE_QUESTIONS).map((key) => (
            <button
              key={key}
              style={{
                ...S.devSwitchBtn,
                ...(activeSample === key ? S.devSwitchBtnActive : {}),
              }}
              onClick={() => setActiveSample(key)}
            >
              {key}
            </button>
          ))}
        </div>

        {/* ── المؤقت الثابت ── */}
        {question.timer != null && (
          <div style={{ ...S.timerBadge, borderColor: timeUp ? "#D24646" : "#F5C840" }}>
            <span style={{ ...S.timerNum, color: timeUp ? "#E07878" : "#F5C840" }}>
              {timeUp ? "0" : timeLeft}
            </span>
            <span style={S.timerLabel}>ثانية</span>
          </div>
        )}

        <main style={S.main}>
          {/* ── برواز السؤال (نص + صور) ── */}
          <div style={S.questionFrame}>
            <div style={S.questionTextBox}>
              <p style={S.questionText}>{question.text}</p>
            </div>

            {question.images.length > 0 && (
              <div style={S.imagesRow}>
                {question.images.map((img, i) => (
                  <div
                    key={i}
                    style={S.imageThumb}
                    onClick={() => setZoomedImage(img)}
                  >
                    صورة {i + 1}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── زر ANSWER الفاصل ── */}
          {question.type === "withOptions" && (
            <div style={S.answerDivider}>
              <button style={S.answerDividerBtn} disabled>
                <span style={S.answerDividerArrow}>&#9658;</span>
                ANSWER
              </button>
            </div>
          )}

          {/* ── النوع الاختيارى ── */}
          {question.type === "withOptions" && (
            <div style={S.optionsGrid}>
              {question.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                const showResult = hasAnswered;
                let bg = "#162E58";
                let border = "#2E5FA8";
                let textColor = "#FFFFFF";

                if (showResult && opt.correct) {
                  bg = "rgba(76,175,130,0.18)";
                  border = "#4CAF82";
                  textColor = "#9FE1CB";
                } else if (showResult && isSelected && !opt.correct) {
                  bg = "rgba(210,70,70,0.18)";
                  border = "#D24646";
                  textColor = "#F09595";
                } else if (showResult) {
                  border = "rgba(255,255,255,0.08)";
                }

                return (
                  <button
                    key={opt.id}
                    style={{
                      ...S.optionCard,
                      background: bg,
                      borderColor: border,
                      color: textColor,
                      cursor: hasAnswered ? "default" : "pointer",
                    }}
                    onClick={() => handleSelectOption(opt)}
                    disabled={hasAnswered}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── النوع غير الاختيارى ── */}
          {question.type === "withoutOptions" && !doneRevealed && (
            <div style={S.doneRow}>
              <button style={S.doneBtn} onClick={handleDone}>
                Done — إظهار الإجابة
              </button>
            </div>
          )}

          {question.type === "withoutOptions" && doneRevealed && (
            <div style={S.answerRevealBox}>
              {question.answerImage ? (
                <div style={S.imageThumb}>صورة الإجابة</div>
              ) : (
                <div style={S.defaultDoneImage}>Done</div>
              )}
            </div>
          )}

          {/* ── تنبيه انتهاء الوقت (بدون إغلاق السؤال) ── */}
          {timeUp && !hasAnswered && (
            <div style={S.timeUpNotice}>انتهى الوقت المحدد لهذا السؤال</div>
          )}
        </main>

        {/* ── زر العودة — يظهر فقط بعد الإجابة ── */}
        {hasAnswered && (
          <div style={S.backBar}>
            <button style={S.backBtn} onClick={handleBack}>
              العودة إلى لوحة الأسئلة
            </button>
          </div>
        )}
      </div>

      {/* ── تكبير الصورة ── */}
      {zoomedImage && (
        <div style={S.zoomOverlay} onClick={() => setZoomedImage(null)}>
          <div style={S.zoomBox}>صورة مكبّرة</div>
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════
// الستايلز
// ════════════════════════════════════════════════════════════
const S = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0B1F40 0%, #1A4F9C 55%, #14397A 100%)",
    direction: "rtl",
    fontFamily: "'Cairo', sans-serif",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  dots: {
    position: "fixed",
    inset: 0,
    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)",
    backgroundSize: "44px 44px",
    pointerEvents: "none",
    zIndex: 0,
  },
  glow: {
    position: "absolute",
    top: "-10%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "900px",
    height: "700px",
    background: "radial-gradient(ellipse, rgba(245,200,64,0.06) 0%, transparent 65%)",
    pointerEvents: "none",
  },

  // مبدّل المعاينة (Dev only)
  devSwitcher: {
    position: "fixed",
    top: "12px",
    insetInlineStart: "12px",
    display: "flex",
    gap: "6px",
    zIndex: 300,
  },
  devSwitchBtn: {
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "5px",
    padding: "4px 9px",
    color: "rgba(255,255,255,0.5)",
    fontSize: "11px",
    cursor: "pointer",
    fontFamily: "monospace",
  },
  devSwitchBtnActive: {
    borderColor: "#F5C840",
    color: "#F5C840",
  },

  // المؤقت
  timerBadge: {
    position: "fixed",
    top: "24px",
    insetInlineEnd: "24px",
    background: "rgba(15,32,64,0.9)",
    border: "2px solid",
    borderRadius: "14px",
    padding: "10px 18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 250,
    minWidth: "64px",
  },
  timerNum: {
    fontSize: "26px",
    fontWeight: 900,
    lineHeight: 1,
  },
  timerLabel: {
    fontSize: "10px",
    color: "#A8C4E8",
    marginTop: "2px",
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "100px 48px 120px",
    position: "relative",
    zIndex: 1,
    maxWidth: "900px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },

  questionFrame: {
    width: "100%",
    background: "linear-gradient(145deg, #E8A020, #F5C840, #E8A020)",
    border: "none",
    borderRadius: "22px",
    padding: "40px 44px",
    marginBottom: "36px",
    boxShadow: "0 8px 0 #B87A10, 0 18px 36px rgba(232,160,32,0.35)",
  },
  questionTextBox: {
    marginBottom: "0",
    textAlign: "center",
  },
  questionText: {
    color: "#1A2A00",
    fontSize: "clamp(22px, 3vw, 32px)",
    fontWeight: 800,
    lineHeight: 1.6,
    margin: 0,
  },

  // الصور
  imagesRow: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    marginTop: "28px",
    flexWrap: "wrap",
    width: "100%",
  },
  imageThumb: {
    width: "220px",
    height: "160px",
    background: "rgba(255,255,255,0.06)",
    border: "1.5px solid rgba(255,255,255,0.15)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#8FB0D8",
    fontSize: "13px",
    cursor: "zoom-in",
    flexShrink: 0,
  },

  // الاختيارات
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    width: "100%",
  },
  optionCard: {
    border: "3px solid #2E5FA8",
    borderRadius: "14px",
    padding: "22px 28px",
    fontSize: "clamp(16px, 2.2vw, 22px)",
    fontWeight: 800,
    fontFamily: "'Cairo', sans-serif",
    textAlign: "center",
    background: "#162E58",
    color: "#FFFFFF",
    boxShadow: "0 4px 0 #0A1A38",
    transition: "background 0.25s, border-color 0.25s",
  },

  // زر ANSWER الفاصل
  answerDivider: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
    marginTop: "-8px",
  },
  answerDividerBtn: {
    background: "linear-gradient(135deg, #1A4F9C, #2460B8)",
    border: "2px solid #3A72CC",
    borderRadius: "8px",
    padding: "10px 28px",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
    letterSpacing: "2px",
    cursor: "default",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 3px 0 #0F2A60",
  },
  answerDividerArrow: {
    color: "#F5C840",
    fontSize: "12px",
  },

  // Done
  doneRow: {
    display: "flex",
    justifyContent: "center",
  },
  doneBtn: {
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    border: "none",
    borderRadius: "12px",
    padding: "16px 40px",
    color: "#1A2A00",
    fontSize: "17px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    boxShadow: "0 6px 24px rgba(232,160,32,0.35)",
  },
  answerRevealBox: {
    display: "flex",
    justifyContent: "center",
  },
  defaultDoneImage: {
    width: "220px",
    height: "160px",
    background: "rgba(245,200,64,0.1)",
    border: "2px solid #F5C840",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#F5C840",
    fontSize: "24px",
    fontWeight: 900,
    fontFamily: "'Lemonada', cursive",
  },

  timeUpNotice: {
    marginTop: "28px",
    color: "#E07878",
    fontSize: "14px",
    fontWeight: 700,
    textAlign: "center",
  },

  // شريط العودة
  backBar: {
    position: "fixed",
    bottom: "32px",
    insetInlineStart: 0,
    insetInlineEnd: 0,
    display: "flex",
    justifyContent: "center",
    zIndex: 200,
  },
  backBtn: {
    background: "rgba(15,32,64,0.95)",
    border: "1.5px solid #F5C840",
    borderRadius: "10px",
    padding: "13px 32px",
    color: "#F5C840",
    fontSize: "15px",
    fontWeight: 800,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },

  // تكبير الصورة
  zoomOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(8,16,32,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    cursor: "zoom-out",
  },
  zoomBox: {
    width: "min(600px, 90vw)",
    height: "min(450px, 70vh)",
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#5A80A8",
    fontSize: "14px",
  },
};
