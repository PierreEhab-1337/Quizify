import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getContestById, getContestQuestions } from "../services/contestService";

// ألوان بتتوزع على الأسئلة بالدور لتمييز البلاطات بصرياً فقط
const TILE_COLORS = [
  "#E8A020", "#4CAF82", "#378ADD", "#D4537E",
  "#7F77DD", "#1D9E75", "#D85A30", "#5DCAA5",
];

const STATUS_LABEL = { correct: "✓", wrong: "✕" };

// ── حساب أبعاد الشبكة بناءً على عدد الأسئلة ──────────────────
function computeGridColumns(count) {
  if (count <= 4) return count || 1;
  const sqrt = Math.sqrt(count);
  return Math.ceil(sqrt);
}

export default function PlaybackGridPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!contestId) {
      setError("لا يوجد معرّف مسابقة (contestId) فى الرابط");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [c, qs] = await Promise.all([
        getContestById(contestId),
        getContestQuestions(contestId),
      ]);
      setContest(c);
      setQuestions(
        qs.map((q, i) => ({ ...q, tileColor: TILE_COLORS[i % TILE_COLORS.length] }))
      );
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر تحميل بيانات المسابقة");
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    load();
  }, [load]);

  // إعادة التحميل كل ما نرجع للصفحة دى (بعد الرجوع من سؤال متجاوَب عليه)
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const pendingQuestions = useMemo(
    () => questions.filter((q) => q.status === "pending" || !q.status),
    [questions]
  );
  const answeredCount = questions.length - pendingQuestions.length;
  const allAnswered = questions.length > 0 && pendingQuestions.length === 0;

  const columns = computeGridColumns(questions.length);

  const openQuestion = (q) => {
    navigate(`/question-play/${contestId}/${q.question_id}`);
  };

  const goToEnd = () => {
    navigate(`/end?contestId=${contestId}`);
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
            <span style={S.competitionName}>{contest?.contest_name || "المسابقة"}</span>
            {questions.length > 0 && (
              <span style={S.progressText}>{answeredCount} / {questions.length} تم الرد عليها</span>
            )}
          </div>
        </header>

        <main style={S.main}>
          {loading && <div style={S.allDoneText}>جارِ تحميل المسابقة...</div>}

          {!loading && error && (
            <div style={{ ...S.allDoneText, color: "#E07878" }}>{error}</div>
          )}

          {!loading && !error && questions.length === 0 && (
            <div style={S.allDoneText}>
              لا توجد أسئلة فى هذه المسابقة — ارجع لصفحة اختيار الأسئلة وأضف أسئلة أولاً
            </div>
          )}

          {!loading && !error && questions.length > 0 && allAnswered && (
            <div style={S.finishBox}>
              <div style={S.allDoneText}>تم الرد على كل الأسئلة 🎉</div>
              <button style={S.finishBtn} onClick={goToEnd}>
                إنهاء المسابقة وعرض النتيجة
              </button>
            </div>
          )}

          {!loading && !error && questions.length > 0 && !allAnswered && (
            <div
              style={{
                ...S.grid,
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
              }}
            >
              {questions.map((q, i) => (
                <QuestionTile key={q.question_id} question={q} index={i + 1} onOpen={openQuestion} />
              ))}
            </div>
          )}
        </main>

        {!loading && !error && questions.length > 0 && !allAnswered && answeredCount > 0 && (
          <div style={S.bottomBar}>
            <button style={S.endEarlyBtn} onClick={goToEnd}>
              إنهاء المسابقة الآن ({answeredCount}/{questions.length})
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function QuestionTile({ question, index, onOpen }) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const answered = question.status === "correct" || question.status === "wrong";
  const color =
    question.status === "correct" ? "#4CAF82" :
    question.status === "wrong" ? "#D24646" :
    question.tileColor;

  const restShadow =
    "0 10px 0 #08183A, 0 14px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)";
  const hoverShadow =
    `0 10px 0 #08183A, 0 22px 44px rgba(0,0,0,0.55), 0 0 0 2px ${color}66, inset 0 1px 0 rgba(255,255,255,0.18)`;
  const pressedShadow =
    "0 3px 0 #08183A, 0 6px 14px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)";

  return (
    <button
      style={{
        ...S.tile,
        opacity: answered ? 0.55 : 1,
        cursor: answered ? "default" : "pointer",
        borderColor: !answered && hover ? color : "rgba(255,255,255,0.08)",
        transform: !answered && pressed
          ? "translateY(4px)"
          : !answered && hover
          ? "translateY(-4px) scale(1.03)"
          : "translateY(0)",
        boxShadow: !answered && pressed ? pressedShadow : !answered && hover ? hoverShadow : restShadow,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={() => !answered && onOpen(question)}
      disabled={answered}
      title={question.description}
    >
      <div style={{ ...S.tileAccent, background: color }} />
      {answered ? (
        <span style={{ ...S.tileStatusIcon, color }}>{STATUS_LABEL[question.status]}</span>
      ) : (
        <span style={S.tileNumber}>{index}</span>
      )}
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
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  competitionName: {
    fontFamily: "'Lemonada', cursive",
    fontSize: "clamp(26px, 4vw, 40px)",
    fontWeight: 700,
    color: "#F5C840",
    letterSpacing: "0.5px",
    textShadow: "0 4px 24px rgba(232,160,32,0.35)",
  },
  progressText: {
    color: "#A8C4E8",
    fontSize: "14px",
    fontWeight: 700,
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
    transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out, border-color 0.15s ease-out, opacity 0.2s",
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
  tileStatusIcon: {
    fontSize: "clamp(30px, 5vw, 54px)",
    fontWeight: 900,
  },

  allDoneText: {
    color: "#A8C4E8",
    fontSize: "22px",
    fontWeight: 700,
    textAlign: "center",
  },
  finishBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
  },
  finishBtn: {
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    border: "none",
    borderRadius: "12px",
    padding: "16px 40px",
    color: "#1A2A00",
    fontSize: "16px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    boxShadow: "0 6px 24px rgba(232,160,32,0.35)",
  },

  bottomBar: {
    position: "fixed",
    bottom: "24px",
    insetInlineStart: 0,
    insetInlineEnd: 0,
    display: "flex",
    justifyContent: "center",
    zIndex: 200,
  },
  endEarlyBtn: {
    background: "rgba(15,32,64,0.95)",
    border: "1.5px solid #F5C840",
    borderRadius: "10px",
    padding: "12px 28px",
    color: "#F5C840",
    fontSize: "13px",
    fontWeight: 800,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
};
