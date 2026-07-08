import { useState, useEffect } from "react";
import { getQuestionById } from "../services/questionService";

// يحوّل نوع السؤال فى الباك اند (singleChoice/multiChoice/openEnded)
// لنفس التصنيف اللى التصميم مبنى عليه (withOptions/withoutOptions)
function mapQuestionType(question_type) {
  if (question_type === "openEnded") return "withoutOptions";
  return "withOptions"; // singleChoice / multiChoice
}

export default function QuestionPlayPage({ questionId, onBack }) {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doneRevealed, setDoneRevealed] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    if (!questionId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setDoneRevealed(false);
    getQuestionById(questionId)
      .then((data) => {
        if (!cancelled) setQuestion(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "تعذّر تحميل السؤال من السيرفر"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [questionId]);

  const handleBack = () => onBack?.();

  if (loading) {
    return (
      <div style={S.root}>
        <div style={S.centerMsg}>جارِ تحميل السؤال...</div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div style={S.root}>
        <div style={{ ...S.centerMsg, color: "#E07878" }}>
          {error || "لم يتم اختيار سؤال"}
        </div>
        <div style={S.backBar}>
          <button style={S.backBtn} onClick={handleBack}>
            العودة إلى لوحة الأسئلة
          </button>
        </div>
      </div>
    );
  }

  const type = mapQuestionType(question.question_type);
  const images = question.images
    ? question.images.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const tags = question.tags
    ? question.tags.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lemonada:wght@400;500;600;700&family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <div style={S.root}>
        <div style={S.dots} />
        <div style={S.glow} />

        <main style={S.main}>
          <div style={S.questionFrame}>
            <div style={S.questionTextBox}>
              <p style={S.questionText}>{question.description}</p>
            </div>

            {tags.length > 0 && (
              <div style={S.tagsRow}>
                {tags.map((tag, i) => (
                  <span key={i} style={S.tagChip}>{tag}</span>
                ))}
              </div>
            )}

            {images.length > 0 && (
              <div style={S.imagesRow}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    style={S.imageThumb}
                    onClick={() => setZoomedImage(img)}
                    title={img}
                  >
                    صورة {i + 1}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ⚠️ الباك اند لسه معندوش تخزين للاختيارات ولا الإجابة الصحيحة
              (جدول question مفيهوش options/answer)، فبنعرض تنبيه بدل
              ما نختلق اختيارات وهمية */}
          {type === "withOptions" && (
            <div style={S.pendingBox}>
              هذا السؤال من نوع اختيارات، لكن الباك اند لسه مفيهوش تخزين
              للاختيارات ولا الإجابة الصحيحة — هيظهر هنا لما الـ endpoint يتضاف.
            </div>
          )}

          {type === "withoutOptions" && !doneRevealed && (
            <div style={S.doneRow}>
              <button style={S.doneBtn} onClick={() => setDoneRevealed(true)}>
                Done — إظهار الإجابة
              </button>
            </div>
          )}

          {type === "withoutOptions" && doneRevealed && (
            <div style={S.pendingBox}>
              الباك اند لسه معندوش حقل مخصص لتخزين نص/صورة الإجابة الصحيحة
              لهذا النوع من الأسئلة.
            </div>
          )}
        </main>

        <div style={S.backBar}>
          <button style={S.backBtn} onClick={handleBack}>
            العودة إلى لوحة الأسئلة
          </button>
        </div>
      </div>

      {zoomedImage && (
        <div style={S.zoomOverlay} onClick={() => setZoomedImage(null)}>
          <div style={S.zoomBox}>{zoomedImage}</div>
        </div>
      )}
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
    padding: "16px",
    textAlign: "center",
    wordBreak: "break-all",
  },
};
