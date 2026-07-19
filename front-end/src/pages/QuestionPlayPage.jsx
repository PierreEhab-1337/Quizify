import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getContestQuestion, answerContestQuestion } from "../services/contestService";

const TYPE_LABELS = {
  singleChoice: "اختيار واحد",
  multiChoice:  "اختيار متعدد",
  openEnded:    "إجابة مفتوحة",
};

const TIMER_SECONDS = 30;
const OPTION_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];

export default function QuestionPlayPage() {
  const { contestId, questionId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── مؤقت بسيط، محلي بالكامل (الباك اند مفيهوش تخزين للوقت) ──
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [timerRunning, setTimerRunning] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!questionId || !contestId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setRevealed(false);
    setSecondsLeft(TIMER_SECONDS);
    setTimerRunning(true);
    getContestQuestion(contestId, questionId)
      .then((data) => {
        if (!cancelled) setQuestion(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "تعذّر تحميل السؤال من السيرفر");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [contestId, questionId]);

  // ── تشغيل/إيقاف المؤقت ──────────────────────────────────
  useEffect(() => {
    if (!timerRunning) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setTimerRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const resetTimer = () => {
    setTimerRunning(false);
    setSecondsLeft(TIMER_SECONDS);
  };

  const handleBack = () => navigate(`/playback/${contestId}`);

  const recordAnswer = useCallback(async (status) => {
    setSubmitting(true);
    setError("");
    try {
      await answerContestQuestion(contestId, questionId, status);
      navigate(`/playback/${contestId}`);
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر تسجيل الإجابة — تأكد إن المسابقة لسه شغالة (inProgress)");
    } finally {
      setSubmitting(false);
    }
  }, [contestId, questionId, navigate]);

  if (loading) {
    return (
      <div style={S.root}>
        <div style={S.centerMsg}>جارِ تحميل السؤال...</div>
      </div>
    );
  }

  if (error && !question) {
    return (
      <div style={S.root}>
        <div style={{ ...S.centerMsg, color: "#E07878" }}>{error}</div>
        <div style={S.backBar}>
          <button style={S.backBtn} onClick={handleBack}>العودة إلى لوحة الأسئلة</button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const alreadyAnswered = question.status === "correct" || question.status === "wrong";
  const hasChoices = question.choices?.length > 0;
  const tagNames = (question.tags || []).map((t) => t.category_type || t);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lemonada:wght@400;500;600;700&family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <div style={S.root}>
        <div style={S.dots} />
        <div style={S.glow} />

        {/* ── المؤقت ── */}
        <div style={S.timerBox}>
          <span style={{ ...S.timerText, color: secondsLeft <= 5 && timerRunning ? "#E07878" : "#F5C840" }}>
            {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
          </span>
          <div style={S.timerBtns}>
            <button style={S.timerBtn} onClick={() => setTimerRunning((r) => !r)}>
              {timerRunning ? "إيقاف" : "بدء"}
            </button>
            <button style={S.timerBtn} onClick={resetTimer}>إعادة</button>
          </div>
        </div>

        <main style={S.main}>
          <div style={S.questionFrame}>
            <div style={S.questionTextBox}>
              <p style={S.questionText}>{question.description}</p>
            </div>

            {question.images?.length > 0 && (
              <div style={S.questionImagesRow}>
                {question.images.map((url, i) => (
                  <img key={i} src={url} alt="" style={S.questionImage} />
                ))}
              </div>
            )}
          </div>

          {error && <div style={{ ...S.pendingBox, borderColor: "rgba(210,70,70,.4)", color: "#E07878" }}>{error}</div>}

          {alreadyAnswered ? (
            <div style={{
              ...S.pendingBox,
              borderColor: question.status === "correct" ? "rgba(76,175,130,.4)" : "rgba(210,70,70,.4)",
              color: question.status === "correct" ? "#4CAF82" : "#E07878",
            }}>
              تم تسجيل هذا السؤال مسبقاً كـ {question.status === "correct" ? "إجابة صحيحة ✓" : "إجابة خاطئة ✕"}
            </div>
          ) : (
            <>
              {hasChoices && (
                <div style={S.choicesGrid}>
                  {question.choices.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        ...S.choicePill,
                        borderColor: revealed && c.status ? "#4CAF82" : "rgba(255,255,255,0.15)",
                        background: revealed && c.status ? "rgba(76,175,130,.12)" : "rgba(255,255,255,0.04)",
                        color: revealed && c.status ? "#4CAF82" : "#FFFFFF",
                      }}
                    >
                      <span style={S.choiceLetter}>{OPTION_LETTERS[i] || i + 1}</span>
                      {c.image_path && (
                        <img
                          src={c.image_path}
                          alt=""
                          style={c.description ? S.choiceImage : S.largechoiceImage}
                        />
                      )}
                      <span>{c.description || ""}</span>
                    </div>
                  ))}
                </div>
              )}

              {!revealed && (
                <div style={S.doneRow}>
                  <button style={S.doneBtn} onClick={() => setRevealed(true)}>
                    {hasChoices ? "إظهار الإجابة الصحيحة" : "Done — إظهار للحكم"}
                  </button>
                </div>
              )}

              {revealed && !hasChoices && (
                <div style={S.pendingBox}>
                  سؤال إجابة مفتوحة — يتقيّم يدوياً حسب إجابة الفريق
                </div>
              )}

              {revealed && (
                <div style={S.judgeRow}>
                  <span style={S.judgeLabel}>تسجيل نتيجة الفريق:</span>
                  <button
                    style={{ ...S.judgeBtn, ...S.correctBtn, opacity: submitting ? 0.6 : 1 }}
                    onClick={() => recordAnswer("correct")}
                    disabled={submitting}
                  >
                    إجابة صحيحة ✓
                  </button>
                  <button
                    style={{ ...S.judgeBtn, ...S.wrongBtn, opacity: submitting ? 0.6 : 1 }}
                    onClick={() => recordAnswer("wrong")}
                    disabled={submitting}
                  >
                    إجابة خاطئة ✕
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        <div style={S.backBar}>
          <button style={S.backBtn} onClick={handleBack}>العودة إلى لوحة الأسئلة</button>
        </div>
      </div>
    </>
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
  centerMsg: {
    margin: "auto",
    color: "#A8C4E8",
    fontSize: "20px",
    fontWeight: 700,
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

  timerBox: {
    position: "fixed",
    top: "24px",
    insetInlineEnd: "32px",
    zIndex: 200,
    background: "rgba(15,32,64,0.9)",
    border: "1.5px solid #2E5FA8",
    borderRadius: "14px",
    padding: "12px 18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  timerText: {
    fontSize: "26px",
    fontWeight: 900,
    fontVariantNumeric: "tabular-nums",
  },
  timerBtns: {
    display: "flex",
    gap: "6px",
  },
  timerBtn: {
    background: "transparent",
    border: "1px solid #2E5FA8",
    borderRadius: "6px",
    padding: "4px 10px",
    color: "#A8C4E8",
    fontSize: "11px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "120px 48px 120px",
    position: "relative",
    zIndex: 1,
    maxWidth: "900px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
    gap: "28px",
  },

  questionFrame: {
    width: "100%",
    background: "linear-gradient(145deg, #E8A020, #F5C840, #E8A020)",
    border: "none",
    borderRadius: "22px",
    padding: "40px 44px",
    boxShadow: "0 8px 0 #B87A10, 0 18px 36px rgba(232,160,32,0.35)",
  },
  questionTextBox: {
    textAlign: "center",
  },
  questionText: {
    color: "#1A2A00",
    fontSize: "clamp(22px, 3vw, 32px)",
    fontWeight: 800,
    lineHeight: 1.6,
    margin: 0,
  },

  tagsRow: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "18px",
  },
  tagChip: {
    background: "rgba(26,42,0,0.15)",
    border: "1px solid rgba(26,42,0,0.3)",
    borderRadius: "999px",
    padding: "4px 14px",
    color: "#1A2A00",
    fontSize: "13px",
    fontWeight: 700,
  },

  choicesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
    width: "100%",
  },
  choicePill: {
    border: "1.5px solid",
    borderRadius: "12px",
    padding: "16px 20px",
    fontSize: "16px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.2s",
  },
  choiceLetter: {
    color: "#F5C840",
    fontWeight: 900,
    minWidth: "18px",
  },

  pendingBox: {
    background: "rgba(245,200,64,0.08)",
    border: "1.5px solid rgba(245,200,64,0.3)",
    borderRadius: "14px",
    padding: "20px 26px",
    color: "#F5C840",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.8,
    textAlign: "center",
    maxWidth: "560px",
  },

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

  judgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  judgeLabel: {
    color: "#A8C4E8",
    fontSize: "14px",
    fontWeight: 700,
  },
  judgeBtn: {
    border: "none",
    borderRadius: "10px",
    padding: "13px 28px",
    fontSize: "15px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
  },
  correctBtn: {
    background: "#4CAF82",
    color: "#0F2040",
  },
  wrongBtn: {
    background: "#D24646",
    color: "#FFFFFF",
  },

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
    questionImagesRow: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "24px",
  },
  questionImage: {
    maxWidth: "260px",
    maxHeight: "220px",
    objectFit: "contain",
    borderRadius: "12px",
    border: "2px solid rgba(26,42,0,0.2)",
  },
  choiceImage: {
    width: "48px",
    height: "48px",
    objectFit: "cover",
    borderRadius: "8px",
    flexShrink: 0,
  },
  largechoiceImage: {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "8px",
    flexShrink: 0,
  },
};
