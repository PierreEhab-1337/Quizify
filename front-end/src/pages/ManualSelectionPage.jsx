import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getCategories } from "../services/categoryService";
import { getQuestions } from "../services/questionService";
import {
  getContestById,
  getContestQuestions,
  addQuestionToContest,
  removeQuestionFromContest,
  randomFillContest,
} from "../services/contestService";

const CAT_COLORS = ["#E8A020", "#4CAF82", "#D4537E", "#378ADD", "#1D9E75", "#7F77DD", "#D85A30", "#5DCAA5"];

const TYPE_LABELS = {
  singleChoice: "اختيار واحد",
  multiChoice:  "اختيار متعدد",
  openEnded:    "إجابة مفتوحة",
};

export default function ManualSelectionPage() {
  const [searchParams] = useSearchParams();
  const contestId = searchParams.get("contestId");
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [bankQuestions, setBankQuestions] = useState([]);
  const [contestQuestions, setContestQuestions] = useState([]);

  const [loadingBank, setLoadingBank] = useState(false);
  const [loadingSelected, setLoadingSelected] = useState(true);
  const [busyId, setBusyId] = useState(null); // question_id بيتحدّث دلوقتي
  const [error, setError] = useState("");

  const [randomCount, setRandomCount] = useState(10);
  const [randomBusy, setRandomBusy] = useState(false);

  // ── تحميل بيانات المسابقة + التصنيفات + الأسئلة المختارة فعلاً ──
  const loadSelected = useCallback(async () => {
    if (!contestId) {
      setError("لا يوجد معرّف مسابقة (contestId) فى الرابط");
      setLoadingSelected(false);
      return;
    }
    setLoadingSelected(true);
    setError("");
    try {
      const [c, list] = await Promise.all([
        getContestById(contestId),
        getContestQuestions(contestId),
      ]);
      setContest(c);
      setContestQuestions(list);
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر تحميل بيانات المسابقة");
    } finally {
      setLoadingSelected(false);
    }
  }, [contestId]);

  useEffect(() => {
    getCategories()
      .then((list) => {
        setCategories(list.map((c) => ({ id: c.category_id, name: c.category_type })));
        if (list.length > 0) setActiveCategory((prev) => prev || list[0].category_type);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadSelected();
  }, [loadSelected]);

  // ── تحميل بنك الأسئلة الخاص بالتصنيف الحالى (من السيرفر) ──
  const loadBank = useCallback(async () => {
    if (!activeCategory) return;
    setLoadingBank(true);
    try {
      const filters = { category: activeCategory };
      if (search.trim()) filters.search = search.trim();
      if (filterType !== "all") filters.question_type = filterType;
      const list = await getQuestions(filters);
      setBankQuestions(list);
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر تحميل الأسئلة");
    } finally {
      setLoadingBank(false);
    }
  }, [activeCategory, search, filterType]);

  useEffect(() => {
    const t = setTimeout(loadBank, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [loadBank, search]);

  const selectedIds = useMemo(
    () => new Set(contestQuestions.map((q) => q.question_id)),
    [contestQuestions]
  );

  const selectedByCategory = useMemo(() => {
    const map = {};
    for (const q of contestQuestions) {
      for (const t of q.tags || []) {
        const name = t.category_type || t;
        map[name] = (map[name] || 0) + 1;
      }
    }
    return map;
  }, [contestQuestions]);

  // ── إضافة/إزالة سؤال ─────────────────────────────────────
  const toggleQuestion = async (q) => {
    setBusyId(q.question_id);
    setError("");
    try {
      if (selectedIds.has(q.question_id)) {
        await removeQuestionFromContest(contestId, q.question_id);
      } else {
        const nextOrder = contestQuestions.length + 1;
        await addQuestionToContest(contestId, q.question_id, nextOrder);
      }
      await loadSelected();
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر تحديث السؤال");
    } finally {
      setBusyId(null);
    }
  };

  // ── اختيار سؤال عشوائى من البنك المعروض حالياً ────────────
  const pickRandomFromCategory = () => {
    const candidates = bankQuestions.filter((q) => !selectedIds.has(q.question_id));
    if (candidates.length === 0) return;
    const randomQ = candidates[Math.floor(Math.random() * candidates.length)];
    toggleQuestion(randomQ);
  };

  // ── ملء عشوائى كامل (بيستبدل كل أسئلة المسابقة الحالية) ───
  const handleRandomFill = async () => {
    if (!window.confirm(`هيتم استبدال كل الأسئلة المختارة حالياً (${contestQuestions.length}) بـ ${randomCount} سؤال عشوائى. متأكد؟`)) return;
    setRandomBusy(true);
    setError("");
    try {
      await randomFillContest(contestId, Number(randomCount));
      await loadSelected();
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر تنفيذ الاختيار العشوائى — تأكد إن عدد الأسئلة المتاحة كافى");
    } finally {
      setRandomBusy(false);
    }
  };

  const handleFinish = () => {
    navigate(`/playback/${contestId}`);
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lemonada:wght@400;500;600;700&family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <div style={S.root}>
        <div style={S.dots} />

        <header style={S.header}>
          <div style={S.headerInner}>
            <div style={S.logo}>أنت ونصيبك</div>
            <button style={S.backBtn} onClick={() => navigate("/")}>رجوع</button>
          </div>
        </header>

        <main style={S.main}>
          <h1 style={S.pageTitle}>
            اختيار الأسئلة {contest ? `— ${contest.contest_name}` : ""}
          </h1>

          {error && <div style={S.errorBox}>{error}</div>}

          {/* ── ملخص + أداة الملء العشوائى ── */}
          <div style={S.progressBox}>
            <div style={S.progressStats}>
              <span style={S.progressStatItem}>
                <span style={{ ...S.progressNum, color: "#F5C840" }}>{contestQuestions.length}</span> سؤال مختار حالياً
              </span>
            </div>

            <div style={S.randomFillRow}>
              <span style={S.randomFillLabel}>ملء عشوائى كامل:</span>
              <input
                type="number"
                min={1}
                value={randomCount}
                onChange={(e) => setRandomCount(e.target.value)}
                style={S.randomCountInput}
              />
              <button
                style={{ ...S.randomFillBtn, opacity: randomBusy ? 0.6 : 1 }}
                onClick={handleRandomFill}
                disabled={randomBusy}
              >
                {randomBusy ? "جارٍ التنفيذ..." : "استبدال كل الأسئلة عشوائياً"}
              </button>
            </div>
            <div style={S.randomFillNote}>
              ⚠️ العملية دى بتستبدل كل الأسئلة المختارة حالياً بأسئلة عشوائية جديدة من كل التصنيفات — مش بتضيف فوق الموجود.
            </div>
          </div>

          {/* ── شريط التصنيفات ── */}
          <div style={S.categoryBar}>
            {categories.map((cat, i) => {
              const count = selectedByCategory[cat.name] || 0;
              const active = activeCategory === cat.name;
              const color = CAT_COLORS[i % CAT_COLORS.length];
              return (
                <button
                  key={cat.id}
                  style={{
                    ...S.categoryChip,
                    borderColor: active ? color : "#2E5FA8",
                    background: active ? `${color}1A` : "#162E58",
                  }}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  <span style={{ color: active ? color : "#FFFFFF", fontWeight: active ? 800 : 600 }}>
                    {cat.name}
                  </span>
                  {count > 0 && (
                    <span style={{ ...S.categoryChipCount, background: color }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── أدوات البحث والفلترة وزر العشوائى ── */}
          <div style={S.toolsRow}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث داخل هذا التصنيف..."
              style={S.searchInput}
            />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={S.filterSelect}>
              <option value="all">كل الأنواع</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button style={S.randomBtn} onClick={pickRandomFromCategory}>
              اختيار سؤال عشوائى من التصنيف الحالى
            </button>
          </div>

          {/* ── شبكة الأسئلة ── */}
          {loadingBank ? (
            <div style={{ color: "#6A90B8", padding: "20px 0" }}>جارِ التحميل...</div>
          ) : bankQuestions.length === 0 ? (
            <div style={S.empty}>لا توجد أسئلة مطابقة فى هذا التصنيف</div>
          ) : (
            <div style={S.questionsGrid}>
              {bankQuestions.map((q) => {
                const isSelected = selectedIds.has(q.question_id);
                const isBusy = busyId === q.question_id;
                return (
                  <div
                    key={q.question_id}
                    style={{
                      ...S.qCard,
                      borderColor: isSelected ? "#F5C840" : "#2E5FA8",
                      background: isSelected ? "rgba(245,200,64,0.06)" : "#162E58",
                    }}
                  >
                    <div style={S.qText}>{q.description}</div>

                    <div style={S.qMetaRow}>
                      <span style={S.qBadge}>{TYPE_LABELS[q.question_type] || q.question_type}</span>
                      {q.choices?.length > 0 && (
                        <span style={{ ...S.qBadge, color: "#6A90B8" }}>{q.choices.length} اختيارات</span>
                      )}
                    </div>

                    <button
                      style={{
                        ...S.selectBtn,
                        ...(isSelected ? S.selectBtnActive : {}),
                        opacity: isBusy ? 0.6 : 1,
                        cursor: isBusy ? "not-allowed" : "pointer",
                      }}
                      onClick={() => toggleQuestion(q)}
                      disabled={isBusy}
                    >
                      {isBusy ? "جارٍ التحديث..." : isSelected ? "إزالة من المسابقة" : "إضافة للمسابقة"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ── شريط سفلى ثابت ── */}
        <div style={S.bottomBar}>
          <span style={S.bottomBarText}>
            {loadingSelected ? "جارِ التحميل..." : `${contestQuestions.length} سؤال مختار فى المسابقة`}
          </span>
          <button
            style={{
              ...S.finishBtn,
              opacity: contestQuestions.length === 0 ? 0.5 : 1,
              cursor: contestQuestions.length === 0 ? "not-allowed" : "pointer",
            }}
            onClick={handleFinish}
            disabled={contestQuestions.length === 0}
          >
            الانتقال لعرض المسابقة
          </button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// الستايلز
// ════════════════════════════════════════════════════════════
const S = {
  root: {
    minHeight: "100vh",
    background: "#1A4F9C",
    direction: "rtl",
    fontFamily: "'Cairo', sans-serif",
    position: "relative",
    overflowX: "hidden",
    paddingBottom: "90px",
  },
  dots: {
    position: "fixed",
    inset: 0,
    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
    pointerEvents: "none",
    zIndex: 0,
  },

  header: {
    background: "#0F2040",
    borderBottom: "1px solid #2E5FA8",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 24px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontFamily: "'Lemonada', cursive",
    fontSize: "20px",
    fontWeight: 700,
    color: "#F5C840",
  },
  backBtn: {
    background: "transparent",
    border: "1px solid #2E5FA8",
    borderRadius: "6px",
    padding: "6px 16px",
    color: "#A8C4E8",
    fontSize: "13px",
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
  },

  main: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "32px 24px 40px",
    position: "relative",
    zIndex: 1,
  },
  pageTitle: {
    color: "#FFFFFF",
    fontSize: "24px",
    fontWeight: 800,
    margin: "0 0 20px",
  },

  errorBox: {
    background: "rgba(210,70,70,0.1)",
    border: "1px solid rgba(210,70,70,0.3)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#E07878",
    fontSize: "13px",
    marginBottom: "16px",
    lineHeight: 1.6,
  },

  // شريط الملخص + الملء العشوائى
  progressBox: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  progressStats: {
    display: "flex",
    gap: "24px",
    fontSize: "13px",
    color: "#A8C4E8",
  },
  progressStatItem: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  progressNum: {
    fontSize: "16px",
    fontWeight: 800,
    color: "#FFFFFF",
  },
  randomFillRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  randomFillLabel: {
    color: "#A8C4E8",
    fontSize: "13px",
    fontWeight: 700,
  },
  randomCountInput: {
    width: "70px",
    background: "#0F2040",
    border: "1.5px solid #2E5FA8",
    borderRadius: "6px",
    padding: "7px 10px",
    color: "#FFFFFF",
    fontSize: "13px",
    fontFamily: "'Cairo', sans-serif",
    outline: "none",
  },
  randomFillBtn: {
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    border: "none",
    borderRadius: "7px",
    padding: "8px 16px",
    color: "#1A2A00",
    fontSize: "12px",
    fontWeight: 800,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
  },
  randomFillNote: {
    color: "#F5C840",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  // شريط التصنيفات
  categoryBar: {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    paddingBottom: "6px",
    marginBottom: "20px",
  },
  categoryChip: {
    flexShrink: 0,
    border: "1.5px solid",
    borderRadius: "20px",
    padding: "9px 18px",
    fontSize: "13px",
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "border-color 0.2s, background 0.2s",
    whiteSpace: "nowrap",
  },
  categoryChipCount: {
    color: "#0F2040",
    fontSize: "11px",
    fontWeight: 800,
    borderRadius: "10px",
    padding: "1px 7px",
    minWidth: "18px",
    textAlign: "center",
  },

  // أدوات البحث والفلترة
  toolsRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: "1 1 220px",
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#FFFFFF",
    fontSize: "14px",
    fontFamily: "'Cairo', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  },
  filterSelect: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#A8C4E8",
    fontSize: "13px",
    fontFamily: "'Cairo', sans-serif",
    outline: "none",
    cursor: "pointer",
  },
  randomBtn: {
    background: "transparent",
    border: "1.5px solid #F5C840",
    borderRadius: "8px",
    padding: "10px 18px",
    color: "#F5C840",
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
  },

  empty: {
    color: "rgba(168,196,232,0.45)",
    fontSize: "14px",
    padding: "40px 0",
    textAlign: "center",
  },

  // شبكة الأسئلة
  questionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
    gap: "14px",
  },
  qCard: {
    border: "1.5px solid",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    transition: "border-color 0.2s, background 0.2s",
  },
  qText: {
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.6,
  },
  qMetaRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  qBadge: {
    fontSize: "11px",
    color: "#A8C4E8",
    background: "rgba(168,196,232,0.08)",
    borderRadius: "5px",
    padding: "3px 9px",
  },
  selectBtn: {
    background: "transparent",
    border: "1.5px solid #2E5FA8",
    borderRadius: "8px",
    padding: "9px",
    color: "#A8C4E8",
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    marginTop: "auto",
  },
  selectBtnActive: {
    background: "rgba(210,70,70,0.1)",
    borderColor: "rgba(210,70,70,0.4)",
    color: "#E07878",
  },

  // الشريط السفلى الثابت
  bottomBar: {
    position: "fixed",
    bottom: 0,
    insetInlineStart: 0,
    insetInlineEnd: 0,
    background: "#0F2040",
    borderTop: "1px solid #2E5FA8",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: "100%",
    zIndex: 200,
  },
  bottomBarText: {
    color: "#A8C4E8",
    fontSize: "14px",
    fontWeight: 700,
  },
  finishBtn: {
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    border: "none",
    borderRadius: "8px",
    padding: "11px 28px",
    color: "#1A2A00",
    fontSize: "14px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
    transition: "opacity 0.2s",
  },
};
