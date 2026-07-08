import { useState, useMemo, useEffect } from "react";
import { getAllQuestions } from "../services/questionService";

// ألوان بتتوزع على الأسئلة بالدور (بما إن الباك اند لسه معندوش تصنيفات/ألوان حقيقية)
const TILE_COLORS = [
  "#E8A020", "#4CAF82", "#378ADD", "#D4537E",
  "#7F77DD", "#1D9E75", "#D85A30", "#5DCAA5",
];

const COMPETITION_NAME = "بنك الأسئلة";

// ── حساب أبعاد الشبكة بناءً على عدد الأسئلة ──────────────────
function computeGridColumns(count) {
  if (count <= 4) return count || 1;
  const sqrt = Math.sqrt(count);
  return Math.ceil(sqrt);
}

export default function PlaybackGridPage({ onPlayQuestion }) {
  const [questions, setQuestions] = useState([]);
  const [answeredIds, setAnsweredIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getAllQuestions()
      .then((data) => {
        if (cancelled) return;
        const withColors = data.map((q, i) => ({
          ...q,
          categoryColor: TILE_COLORS[i % TILE_COLORS.length],
        }));
        setQuestions(withColors);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.response?.data?.message || "تعذّر تحميل الأسئلة من السيرفر"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const remainingQuestions = useMemo(
    () => questions.filter((q) => !answeredIds.has(q.question_id)),
    [questions, answeredIds]
  );

  const columns = computeGridColumns(remainingQuestions.length);

  const openQuestion = (q) => {
    setAnsweredIds((prev) => new Set(prev).add(q.question_id));
    onPlayQuestion?.(q.question_id);
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

        <header style={S.header}>
          <div style={S.headerInner}>
            <span style={S.competitionName}>{COMPETITION_NAME}</span>
          </div>
        </header>

        <main style={S.main}>
          {loading && <div style={S.allDoneText}>جارِ تحميل الأسئلة...</div>}

          {!loading && error && (
            <div style={{ ...S.allDoneText, color: "#E07878" }}>{error}</div>
          )}

          {!loading && !error && remainingQuestions.length === 0 && (
            <div style={S.allDoneText}>
              {questions.length === 0
                ? "لا توجد أسئلة فى بنك الأسئلة حالياً"
                : "تم الانتهاء من جميع الأسئلة"}
            </div>
          )}

          {!loading && !error && remainingQuestions.length > 0 && (
            <div
              style={{
                ...S.grid,
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
              }}
            >
              {remainingQuestions.map((q) => (
                <QuestionTile key={q.question_id} question={q} onOpen={openQuestion} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

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
      title={question.description}
    >
      <div style={{ ...S.tileAccent, background: question.categoryColor }} />
      <span style={S.tileNumber}>{question.question_id}</span>
    </button>
  );
}

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
