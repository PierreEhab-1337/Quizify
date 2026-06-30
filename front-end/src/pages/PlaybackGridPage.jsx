import { useState, useMemo } from "react";

// ════════════════════════════════════════════════════════════
// بيانات تجريبية — مسابقة بها 12 سؤال بعد الـ Shuffle
// ════════════════════════════════════════════════════════════
const COMPETITION_NAME = "اجتماع الجمعة";

const QUESTIONS_AFTER_SHUFFLE = [
  { id: 1, categoryColor: "#E8A020" },
  { id: 2, categoryColor: "#4CAF82" },
  { id: 3, categoryColor: "#378ADD" },
  { id: 4, categoryColor: "#D4537E" },
  { id: 5, categoryColor: "#7F77DD" },
  { id: 6, categoryColor: "#1D9E75" },
  { id: 7, categoryColor: "#D85A30" },
  { id: 8, categoryColor: "#5DCAA5" },
  { id: 9, categoryColor: "#E8A020" },
  { id: 10, categoryColor: "#378ADD" },
  { id: 11, categoryColor: "#4CAF82" },
  { id: 12, categoryColor: "#D4537E" },
];

// ── حساب أبعاد الشبكة بناءً على عدد الأسئلة ──────────────────
// يعطى أقرب عدد أعمدة لتكوين شكل متوازن، مع السماح بصف أخير غير مكتمل
function computeGridColumns(count) {
  if (count <= 4) return count;
  const sqrt = Math.sqrt(count);
  return Math.ceil(sqrt);
}

export default function PlaybackGridPage() {
  const [answeredIds, setAnsweredIds] = useState(new Set());

  const remainingQuestions = useMemo(
    () => QUESTIONS_AFTER_SHUFFLE.filter((q) => !answeredIds.has(q.id)),
    [answeredIds]
  );

  const columns = computeGridColumns(remainingQuestions.length || 1);

  // ── دالة فتح سؤال (Placeholder) ───────────────────────────
  const openQuestion = (q) => {
    console.log("navigate → /competitions/play/question", { questionId: q.id });
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

        {/* ── شريط علوى بسيط: اسم المسابقة فقط ── */}
        <header style={S.header}>
          <div style={S.headerInner}>
            <span style={S.competitionName}>{COMPETITION_NAME}</span>
          </div>
        </header>

        {/* ── شبكة الأسئلة ── */}
        <main style={S.main}>
          {remainingQuestions.length === 0 ? (
            <div style={S.allDoneText}>تم الانتهاء من جميع الأسئلة</div>
          ) : (
            <div
              style={{
                ...S.grid,
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
              }}
            >
              {remainingQuestions.map((q) => (
                <QuestionTile key={q.id} question={q} onOpen={openQuestion} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// بطاقة رقم السؤال — تصميم مميز وليس مربعاً تقليدياً
// ════════════════════════════════════════════════════════════
function QuestionTile({ question, onOpen }) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);

  const restShadow =
    "0 10px 0 #08183A, 0 14px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)";
  const hoverShadow =
    `0 10px 0 #08183A, 0 22px 44px rgba(0,0,0,0.55), 0 0 0 2px ${question.categoryColor}66, inset 0 1px 0 rgba(255,255,255,0.18)`;
  const pressedShadow =
    "0 3px 0 #08183A, 0 6px 14px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)";

  return (
    <button
      style={{
        ...S.tile,
        borderColor: hover ? question.categoryColor : "rgba(255,255,255,0.08)",
        transform: pressed
          ? "translateY(4px)"
          : hover
          ? "translateY(-4px) scale(1.03)"
          : "translateY(0)",
        boxShadow: pressed ? pressedShadow : hover ? hoverShadow : restShadow,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={() => onOpen(question)}
    >
      <div style={{ ...S.tileAccent, background: question.categoryColor }} />
      <span style={S.tileNumber}>{question.id}</span>
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// الستايلز — أكثر جرأة وبروزاً من باقى الصفحات (شاشة عرض جماهيري)
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
    background: "radial-gradient(ellipse, rgba(245,200,64,0.08) 0%, transparent 65%)",
    pointerEvents: "none",
  },

  header: {
    position: "relative",
    zIndex: 1,
    padding: "32px 0 8px",
    textAlign: "center",
  },
  headerInner: {
    display: "flex",
    justifyContent: "center",
  },
  competitionName: {
    fontFamily: "'Lemonada', cursive",
    fontSize: "clamp(26px, 4vw, 40px)",
    fontWeight: 700,
    color: "#F5C840",
    letterSpacing: "0.5px",
    textShadow: "0 4px 24px rgba(232,160,32,0.35)",
  },

  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 48px 56px",
    position: "relative",
    zIndex: 1,
  },

  grid: {
    display: "grid",
    gap: "30px 24px",
    width: "100%",
    maxWidth: "1200px",
  },

  tile: {
    position: "relative",
    background: "linear-gradient(165deg, #11254A 0%, #0C1B38 100%)",
    border: "1.5px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    aspectRatio: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out, border-color 0.15s ease-out",
    overflow: "hidden",
    padding: 0,
  },
  tileAccent: {
    position: "absolute",
    top: 0,
    insetInlineStart: 0,
    insetInlineEnd: 0,
    height: "6px",
  },
  tileNumber: {
    fontSize: "clamp(28px, 5vw, 52px)",
    fontWeight: 900,
    color: "#FFFFFF",
    fontFamily: "'Cairo', sans-serif",
    textShadow: "0 2px 6px rgba(0,0,0,0.4)",
  },

  allDoneText: {
    color: "#A8C4E8",
    fontSize: "22px",
    fontWeight: 700,
  },
};
