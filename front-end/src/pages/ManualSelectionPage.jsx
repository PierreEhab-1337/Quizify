import { useState, useMemo } from "react";

// ════════════════════════════════════════════════════════════
// بيانات تجريبية
// ════════════════════════════════════════════════════════════
const CATEGORIES = [
  { id: "religious", name: "مناسبات دينية", color: "#E8A020" },
  { id: "saints", name: "قديسين", color: "#4CAF82" },
  { id: "absurd", name: "عبثيات", color: "#D4537E" },
  { id: "football", name: "كورة", color: "#378ADD" },
  { id: "geo", name: "جغرافيا", color: "#1D9E75" },
  { id: "christian", name: "مسيحية", color: "#7F77DD" },
  { id: "math", name: "ماث وألغاز", color: "#D85A30" },
  { id: "tech", name: "تكنولوجيا وعلوم", color: "#5DCAA5" },
];

const ALL_QUESTIONS = [
  { id: "q1", categoryId: "religious", text: "ما هو اسم العيد الذى يسبق عيد القيامة بأسبوع؟", hasImage: false, hasOptions: true, usedBefore: false },
  { id: "q2", categoryId: "religious", text: "فى أى شهر يقع عيد الميلاد المجيد فى التقويم القبطى؟", hasImage: true, hasOptions: true, usedBefore: true, lastUsedAt: "2026-04-10" },
  { id: "q3", categoryId: "religious", text: "كم عدد أيام الصوم الكبير؟", hasImage: false, hasOptions: false, usedBefore: false },
  { id: "q4", categoryId: "religious", text: "ما اسم القنديل المستخدم فى احتفالات سبت النور؟", hasImage: true, hasOptions: false, usedBefore: false },
  { id: "q5", categoryId: "saints", text: "من هو القديس المعروف بـ صاحب العمود؟", hasImage: false, hasOptions: true, usedBefore: false },
  { id: "q6", categoryId: "saints", text: "فى أى مدينة عاش القديس أنطونيوس الكبير؟", hasImage: true, hasOptions: true, usedBefore: true, lastUsedAt: "2026-03-22" },
  { id: "q7", categoryId: "saints", text: "ما هو لقب القديسة مارينا؟", hasImage: false, hasOptions: true, usedBefore: false },
  { id: "q8", categoryId: "football", text: "من الفريق الحائز على أكبر عدد من كؤوس دورى أبطال أوروبا؟", hasImage: false, hasOptions: true, usedBefore: false },
  { id: "q9", categoryId: "football", text: "فى أى عام استضافت مصر كأس الأمم الأفريقية لكرة القدم آخر مرة؟", hasImage: false, hasOptions: true, usedBefore: false },
  { id: "q10", categoryId: "football", text: "حدد اسم اللاعب فى الصورة", hasImage: true, hasOptions: true, usedBefore: false },
  { id: "q11", categoryId: "geo", text: "ما أطول نهر فى قارة أفريقيا؟", hasImage: false, hasOptions: true, usedBefore: false },
  { id: "q12", categoryId: "geo", text: "حدد اسم هذا المعلم السياحى من الصورة", hasImage: true, hasOptions: false, usedBefore: true, lastUsedAt: "2026-05-01" },
  { id: "q13", categoryId: "christian", text: "ما اسم آخر كتاب فى العهد الجديد؟", hasImage: false, hasOptions: true, usedBefore: false },
  { id: "q14", categoryId: "christian", text: "من كاتب سفر الرؤيا؟", hasImage: false, hasOptions: false, usedBefore: false },
  { id: "q15", categoryId: "math", text: "ما هو العدد الذى إذا ضربته فى نفسه يساوى 144؟", hasImage: false, hasOptions: true, usedBefore: false },
  { id: "q16", categoryId: "math", text: "أكمل المتسلسلة: 2، 4، 8، 16، ...", hasImage: false, hasOptions: true, usedBefore: false },
  { id: "q17", categoryId: "tech", text: "من مؤسس شركة مايكروسوفت؟", hasImage: false, hasOptions: true, usedBefore: false },
  { id: "q18", categoryId: "tech", text: "ما اسم أول قمر صناعى تم إطلاقه فى التاريخ؟", hasImage: true, hasOptions: true, usedBefore: false },
  { id: "q19", categoryId: "absurd", text: "لو الفيل اتكلم عربى هيقول إيه أول ما يصحى؟", hasImage: false, hasOptions: false, usedBefore: false },
  { id: "q20", categoryId: "absurd", text: "ما هو أغرب طبق ممكن تتخيل وجوده على فطار مصرى؟", hasImage: false, hasOptions: false, usedBefore: false },
];

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });

export default function ManualSelectionPage() {
  const TOTAL_REQUIRED = 12; // قادم من شاشة إنشاء المسابقة

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | unused | withImages | withOptions
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedByCategory, setSelectedByCategory] = useState({}); // categoryId -> count
  const [zoomImage, setZoomImage] = useState(null);

  // ── الأسئلة المعروضة بعد الفلترة والبحث (داخل التصنيف الحالى فقط) ──
  const visibleQuestions = useMemo(() => {
    let list = ALL_QUESTIONS.filter((q) => q.categoryId === activeCategory);

    if (search.trim().length > 0) {
      list = list.filter((q) => q.text.includes(search.trim()));
    }

    if (filter === "unused") list = list.filter((q) => !q.usedBefore);
    if (filter === "withImages") list = list.filter((q) => q.hasImage);
    if (filter === "withOptions") list = list.filter((q) => q.hasOptions);

    return list;
  }, [activeCategory, search, filter]);

  const selectedCount = selectedIds.size;
  const remainingCount = Math.max(TOTAL_REQUIRED - selectedCount, 0);

  // ── ألوان شريط التقدم حسب التصنيفات المختارة ──────────────
  const progressSegments = useMemo(() => {
    const total = Object.values(selectedByCategory).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Object.entries(selectedByCategory)
      .filter(([, count]) => count > 0)
      .map(([catId, count]) => {
        const cat = CATEGORIES.find((c) => c.id === catId);
        return { color: cat?.color || "#A8C4E8", percent: (count / TOTAL_REQUIRED) * 100 };
      });
  }, [selectedByCategory]);

  // ── تبديل اختيار سؤال ──────────────────────────────────────
  const toggleQuestion = (q) => {
    const newSelected = new Set(selectedIds);
    const newByCategory = { ...selectedByCategory };

    if (newSelected.has(q.id)) {
      newSelected.delete(q.id);
      newByCategory[q.categoryId] = Math.max((newByCategory[q.categoryId] || 1) - 1, 0);
    } else {
      if (selectedCount >= TOTAL_REQUIRED) return; // اكتمل العدد
      newSelected.add(q.id);
      newByCategory[q.categoryId] = (newByCategory[q.categoryId] || 0) + 1;
    }

    setSelectedIds(newSelected);
    setSelectedByCategory(newByCategory);
  };

  // ── اختيار سؤال عشوائى من التصنيف الحالى ──────────────────
  const pickRandomFromCategory = () => {
    const candidates = visibleQuestions.filter((q) => !selectedIds.has(q.id));
    if (candidates.length === 0) return;
    const randomQ = candidates[Math.floor(Math.random() * candidates.length)];
    toggleQuestion(randomQ);
  };

  const handleFinish = () => {
    console.log("navigate → /competitions/new/shuffle-preview", { selectedIds: Array.from(selectedIds) });
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lemonada:wght@400;500;600;700&family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <div style={S.root}>
        <div style={S.dots} />

        {/* ── الهيدر ── */}
        <header style={S.header}>
          <div style={S.headerInner}>
            <div style={S.logo}>أنت ونصيبك</div>
            <button style={S.backBtn} onClick={() => console.log("navigate → /competitions/new")}>
              رجوع
            </button>
          </div>
        </header>

        <main style={S.main}>
          <h1 style={S.pageTitle}>اختيار الأسئلة</h1>

          {/* ── شريط التقدم ── */}
          <div style={S.progressBox}>
            <div style={S.progressStats}>
              <span style={S.progressStatItem}>
                <span style={S.progressNum}>{TOTAL_REQUIRED}</span> مطلوب
              </span>
              <span style={S.progressStatItem}>
                <span style={{ ...S.progressNum, color: "#F5C840" }}>{selectedCount}</span> مختار
              </span>
              <span style={S.progressStatItem}>
                <span style={{ ...S.progressNum, color: "#A8C4E8" }}>{remainingCount}</span> متبقى
              </span>
            </div>
            <div style={S.progressTrack}>
              {progressSegments.length === 0 ? (
                <div style={S.progressEmptyFill} />
              ) : (
                progressSegments.map((seg, i) => (
                  <div key={i} style={{ height: "100%", width: `${seg.percent}%`, background: seg.color }} />
                ))
              )}
            </div>
          </div>

          {/* ── شريط التصنيفات ── */}
          <div style={S.categoryBar}>
            {CATEGORIES.map((cat) => {
              const count = selectedByCategory[cat.id] || 0;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  style={{
                    ...S.categoryChip,
                    borderColor: active ? cat.color : "#2E5FA8",
                    background: active ? `${cat.color}1A` : "#162E58",
                  }}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span style={{ color: active ? cat.color : "#FFFFFF", fontWeight: active ? 800 : 600 }}>
                    {cat.name}
                  </span>
                  {count > 0 && (
                    <span style={{ ...S.categoryChipCount, background: cat.color }}>{count}</span>
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
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={S.filterSelect}
            >
              <option value="all">كل الأسئلة</option>
              <option value="unused">غير مستخدمة سابقاً</option>
              <option value="withImages">تحتوى على صور</option>
              <option value="withOptions">تحتوى على اختيارات</option>
            </select>
            <button style={S.randomBtn} onClick={pickRandomFromCategory}>
              اختيار سؤال عشوائى من التصنيف الحالى
            </button>
          </div>

          {/* ── شبكة الأسئلة ── */}
          {visibleQuestions.length === 0 ? (
            <div style={S.empty}>لا توجد أسئلة مطابقة فى هذا التصنيف</div>
          ) : (
            <div style={S.questionsGrid}>
              {visibleQuestions.map((q) => {
                const isSelected = selectedIds.has(q.id);
                return (
                  <div
                    key={q.id}
                    style={{
                      ...S.qCard,
                      borderColor: isSelected ? "#F5C840" : "#2E5FA8",
                      background: isSelected ? "rgba(245,200,64,0.06)" : "#162E58",
                    }}
                  >
                    {q.hasImage && (
                      <div
                        style={S.qThumb}
                        onClick={(e) => { e.stopPropagation(); setZoomImage(q.id); }}
                      >
                        صورة
                      </div>
                    )}

                    <div style={S.qText}>{q.text}</div>

                    <div style={S.qMetaRow}>
                      {q.hasOptions ? (
                        <span style={S.qBadge}>اختيارى</span>
                      ) : (
                        <span style={{ ...S.qBadge, color: "#6A90B8" }}>بدون اختيارات</span>
                      )}
                    </div>

                    {q.usedBefore && (
                      <div style={S.usedWarning}>
                        تم استخدام هذا السؤال مسبقاً — آخر استخدام {formatDate(q.lastUsedAt)}
                      </div>
                    )}

                    <button
                      style={{
                        ...S.selectBtn,
                        ...(isSelected ? S.selectBtnActive : {}),
                      }}
                      onClick={() => toggleQuestion(q)}
                      disabled={!isSelected && selectedCount >= TOTAL_REQUIRED}
                    >
                      {isSelected ? "إزالة من المسابقة" : "إضافة للمسابقة"}
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
            {selectedCount} من {TOTAL_REQUIRED} سؤال مختار
          </span>
          <button
            style={{
              ...S.finishBtn,
              opacity: selectedCount === TOTAL_REQUIRED ? 1 : 0.5,
              cursor: selectedCount === TOTAL_REQUIRED ? "pointer" : "not-allowed",
            }}
            onClick={handleFinish}
            disabled={selectedCount !== TOTAL_REQUIRED}
          >
            تأكيد الأسئلة المختارة
          </button>
        </div>
      </div>

      {/* ── تكبير الصورة (Placeholder بصرى) ── */}
      {zoomImage && (
        <div style={S.zoomOverlay} onClick={() => setZoomImage(null)}>
          <div style={S.zoomBox}>صورة مكبّرة للسؤال</div>
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

  // شريط التقدم
  progressBox: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "20px",
  },
  progressStats: {
    display: "flex",
    gap: "24px",
    marginBottom: "12px",
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
  progressTrack: {
    width: "100%",
    height: "8px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "4px",
    overflow: "hidden",
    display: "flex",
  },
  progressEmptyFill: {
    width: "0%",
    height: "100%",
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
  qThumb: {
    width: "100%",
    height: "90px",
    background: "#0F2040",
    border: "1px solid #2E5FA8",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#5A80A8",
    fontSize: "12px",
    cursor: "zoom-in",
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
  },
  qBadge: {
    fontSize: "11px",
    color: "#A8C4E8",
    background: "rgba(168,196,232,0.08)",
    borderRadius: "5px",
    padding: "3px 9px",
  },
  usedWarning: {
    background: "rgba(245,200,64,0.1)",
    border: "1px solid rgba(245,200,64,0.3)",
    borderRadius: "6px",
    padding: "8px 10px",
    color: "#F5C840",
    fontSize: "11.5px",
    lineHeight: 1.6,
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
