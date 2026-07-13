import { useState, useEffect, useCallback, useRef } from "react";
import { getQuestions, createQuestion } from "../services/questionService";
import { getCategories } from "../services/categoryService";
import { getAllUsers } from "../services/userService";
import { getAllContestsAdmin } from "../services/contestService";

// ════════════════════════════════════════════════════════════
// ملحوظة مهمة: الباك اند حالياً مفيهوش endpoint استيراد جماعي
// ولا دعم لملفات Excel. الصفحة دي بتصدّر/تستورد بنك الأسئلة بس،
// بصيغة JSON، عن طريق تكرار نداء POST /question لكل سؤال.
// ════════════════════════════════════════════════════════════

function ImportResultModal({ result, onClose }) {
  if (!result) return null;
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>نتيجة الاستيراد</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ color: "#A8C4E8", fontSize: "13px" }}>
            تم معالجة الملف. ملخص العملية:
          </div>

          <div style={S.resultGrid}>
            <div style={S.resultItem}>
              <div style={{ ...S.resultVal, color: "#4CAF82" }}>{result.added}</div>
              <div style={S.resultLbl}>تمت إضافته</div>
            </div>
            <div style={S.resultItem}>
              <div style={{ ...S.resultVal, color: "#D24646" }}>{result.failed.length}</div>
              <div style={S.resultLbl}>فشل في الاستيراد</div>
            </div>
          </div>

          {result.failed.length > 0 && (
            <div style={{ ...S.infoBox, borderColor: "rgba(210,70,70,.3)", background: "rgba(210,70,70,.06)", color: "#E07878", maxHeight: "180px", overflowY: "auto" }}>
              {result.failed.map((f, i) => (
                <div key={i} style={{ marginBottom: i < result.failed.length - 1 ? "8px" : 0 }}>
                  <strong>سؤال {f.index + 1}:</strong> {f.message}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={S.modalFooter}>
          <button
            style={{ ...S.saveBtn, flex: 1 }}
            onClick={onClose}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            حسناً
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ImportExportPage() {
  const fileInputRef = useRef(null);

  const [counts, setCounts] = useState({ questions: 0, categories: 0, users: 0, contests: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(null); // { done, total }
  const [importResult, setImportResult] = useState(null);

  const loadCounts = useCallback(async () => {
    setLoadingCounts(true);
    try {
      const [q, c, u, ct] = await Promise.all([
        getQuestions(),
        getCategories(),
        getAllUsers(),
        getAllContestsAdmin(),
      ]);
      setCounts({
        questions: q.length,
        categories: c.length,
        users: u.length,
        contests: ct.length,
      });
    } catch {
      // مش حرج — الأرقام دي عرض بس
    } finally {
      setLoadingCounts(false);
    }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  // ── تصدير ─────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const questions = await getQuestions();
      // بنشيل الحقول اللي الباك اند بيولّدها لوحده عشان الملف يبقى صالح لإعادة الاستيراد
      const exportable = questions.map((q) => ({
        description: q.description,
        question_type: q.question_type,
        tags: (q.tags || []).map((t) => t.category_type || t),
        choices: (q.choices || []).map((c) => ({
          description: c.description,
          status: !!c.status,
        })),
      }));
      const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quizify-questions-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر تصدير الأسئلة");
    } finally {
      setExporting(false);
    }
  };

  // ── استيراد ───────────────────────────────────────────────
  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // يسمح باختيار نفس الملف تانى لو حابب يعيد المحاولة
    if (!file) return;

    setError("");
    let parsed;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      setError("الملف مش JSON صالح");
      return;
    }
    if (!Array.isArray(parsed)) {
      setError("محتوى الملف لازم يكون مصفوفة (array) من الأسئلة");
      return;
    }
    if (parsed.length === 0) {
      setError("الملف فاضى، مفيش أسئلة للاستيراد");
      return;
    }

    setImporting(true);
    setImportProgress({ done: 0, total: parsed.length });
    let added = 0;
    const failed = [];

    for (let i = 0; i < parsed.length; i++) {
      const q = parsed[i];
      try {
        if (!q.description || !q.question_type) {
          throw new Error("ناقصه description أو question_type");
        }
        await createQuestion({
          description: q.description,
          question_type: q.question_type,
          tags: q.tags || [],
          choices: q.choices || [],
        });
        added++;
      } catch (err) {
        failed.push({
          index: i,
          message: err.response?.data?.message || err.message || "خطأ غير معروف",
        });
      }
      setImportProgress({ done: i + 1, total: parsed.length });
    }

    setImporting(false);
    setImportProgress(null);
    setImportResult({ added, failed });
    loadCounts();
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lemonada:wght@700&family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <div style={S.root}>
        <div style={S.dots} />
        <div style={S.glow} />

        <div style={S.inner}>

          <div style={S.header}>
            <span style={S.headerText}>استيراد وتصدير الأسئلة</span>
          </div>

          {error && <div style={S.errorBox}>{error}</div>}

          {/* ── ملخص البيانات الحالية ── */}
          <div style={S.statsRow}>
            {[
              { label: "الأسئلة", value: counts.questions },
              { label: "التصنيفات", value: counts.categories },
              { label: "المستخدمون", value: counts.users },
              { label: "المسابقات", value: counts.contests },
            ].map((s) => (
              <div key={s.label} style={S.statCard}>
                <div style={S.statValue}>{loadingCounts ? "…" : s.value}</div>
                <div style={S.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── تصدير ── */}
          <div style={S.card}>
            <div style={S.cardTitle}>تصدير بنك الأسئلة</div>
            <p style={S.cardDesc}>
              بيصدّر كل الأسئلة الموجودة فى البنك (بنصها، نوعها، تصنيفاتها، واختياراتها) كملف JSON واحد — مناسب للنسخ الاحتياطى أو نقل الأسئلة بين مشروعين.
            </p>
            <button style={{ ...S.primaryBtn, opacity: exporting ? 0.6 : 1 }} onClick={handleExport} disabled={exporting}>
              {exporting ? "جارِ التصدير..." : "⬇ تصدير كل الأسئلة (JSON)"}
            </button>
          </div>

          {/* ── استيراد ── */}
          <div style={S.card}>
            <div style={S.cardTitle}>استيراد أسئلة</div>
            <p style={S.cardDesc}>
              بيقرأ ملف JSON (بنفس شكل ملف التصدير) ويضيف كل سؤال فيه للبنك سؤال سؤال. لازم كل تصنيف (tag) مذكور فى الملف يكون موجود بالفعل فى صفحة التصنيفات، وإلا هيفشل السؤال ده بس ويكمل الباقى.
            </p>

            {importing && importProgress ? (
              <div style={S.progressWrap}>
                <div style={S.progressTrack}>
                  <div
                    style={{
                      ...S.progressFill,
                      width: `${Math.round((importProgress.done / importProgress.total) * 100)}%`,
                    }}
                  />
                </div>
                <span style={S.progressText}>
                  جارِ الاستيراد... {importProgress.done} / {importProgress.total}
                </span>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  style={{ display: "none" }}
                  onChange={handleFilePicked}
                />
                <button style={S.primaryBtn} onClick={() => fileInputRef.current?.click()}>
                  ⬆ اختيار ملف JSON للاستيراد
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {importResult && (
        <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════
const S = {
  root: {
    minHeight: "100vh",
    background: "#1A4F9C",
    direction: "rtl",
    fontFamily: "'Cairo', sans-serif",
    position: "relative",
    overflow: "hidden",
    paddingBottom: "48px",
  },
  dots: {
    position: "absolute",
    inset: 0,
    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
    pointerEvents: "none",
  },
  glow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "700px",
    height: "700px",
    background: "radial-gradient(ellipse, rgba(245,200,64,0.06) 0%, transparent 65%)",
    pointerEvents: "none",
  },
  inner: {
    position: "relative",
    zIndex: 1,
    maxWidth: "760px",
    margin: "0 auto",
    padding: "40px 28px 0",
  },

  header: {
    background: "linear-gradient(145deg, #E8A020, #F5C840, #E8A020)",
    borderRadius: "18px",
    padding: "20px 32px",
    textAlign: "center",
    boxShadow: "0 6px 0 #B87A10",
    marginBottom: "28px",
  },
  headerText: {
    fontFamily: "'Lemonada', cursive",
    fontSize: "22px",
    fontWeight: 700,
    color: "#1A2A00",
  },

  errorBox: {
    background: "rgba(210,70,70,0.1)",
    border: "1px solid rgba(210,70,70,0.3)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#E07878",
    fontSize: "13px",
    lineHeight: 1.6,
    marginBottom: "20px",
  },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    marginBottom: "20px",
  },
  statCard: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "12px",
    padding: "16px 10px",
    textAlign: "center",
    boxShadow: "0 3px 0 #0A1A38",
  },
  statValue: {
    fontSize: "26px",
    fontWeight: 900,
    color: "#F5C840",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "11px",
    color: "#A8C4E8",
    marginTop: "6px",
    fontWeight: 600,
  },

  card: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "14px",
    padding: "24px 22px",
    boxShadow: "0 4px 0 #0A1A38",
    marginBottom: "18px",
  },
  cardTitle: {
    fontSize: "15px",
    color: "#FFFFFF",
    fontWeight: 800,
    marginBottom: "10px",
  },
  cardDesc: {
    color: "#A8C4E8",
    fontSize: "13px",
    lineHeight: 1.8,
    margin: "0 0 18px",
  },

  primaryBtn: {
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    border: "none",
    borderRadius: "10px",
    padding: "13px 26px",
    color: "#1A2A00",
    fontSize: "14px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    boxShadow: "0 4px 0 #B87A10",
  },

  progressWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  progressTrack: {
    background: "#0F2040",
    borderRadius: "6px",
    height: "10px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "6px",
    background: "linear-gradient(90deg, #E8A020, #F5C840)",
    transition: "width 0.2s ease",
  },
  progressText: {
    color: "#A8C4E8",
    fontSize: "12px",
    fontWeight: 700,
    textAlign: "center",
  },

  // ── Modal ──
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(8,16,32,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "24px",
  },
  modal: {
    width: "100%",
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0,0,0,.5)",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px",
    borderBottom: "1px solid #2E5FA8",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: 800,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#6A90B8",
    fontSize: "16px",
    cursor: "pointer",
    padding: "4px 8px",
    fontFamily: "'Cairo', sans-serif",
  },
  modalFooter: {
    display: "flex",
    gap: "10px",
    padding: "16px 24px",
    borderTop: "1px solid #2E5FA8",
  },
  saveBtn: {
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    border: "none",
    borderRadius: "8px",
    padding: "11px",
    color: "#1A2A00",
    fontSize: "14px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    transition: "opacity 0.2s",
    boxShadow: "0 3px 0 #B87A10",
  },

  resultGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  resultItem: {
    background: "#0F2040",
    borderRadius: "10px",
    padding: "14px",
    textAlign: "center",
  },
  resultVal: {
    fontSize: "26px",
    fontWeight: 900,
  },
  resultLbl: {
    fontSize: "11px",
    color: "#A8C4E8",
    marginTop: "4px",
  },
  infoBox: {
    background: "rgba(245,200,64,.08)",
    border: "1px solid rgba(245,200,64,.25)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#F5C840",
    fontSize: "12px",
    lineHeight: 1.6,
  },
};
