import { useState, useMemo } from "react";

// ════════════════════════════════════════════════════════════
// بيانات تجريبية — تُستبدل بـ Firestore عند الربط
// ════════════════════════════════════════════════════════════
const SAMPLE_CATEGORIES = [
  "مسيحية", "قديسين", "ماث وألغاز", "كورة",
  "جغرافيا", "تكنولوجيا وعلوم", "مناسبات دينية", "عبثيات",
];

const SAMPLE_QUESTIONS = [
  { id: 1, text: "ما هو أطول نهر فى قارة أفريقيا؟", category: "جغرافيا", type: "withOptions", options: ["نهر النيل", "نهر الكونغو", "نهر النيجر", "نهر زامبيزى"], answer: "نهر النيل", images: [], answerImages: [] },
  { id: 2, text: "اذكر اسم القديس المعروف بلقب صاحب العمود ومن أين كان أصله؟", category: "قديسين", type: "withoutOptions", options: [], answer: "", images: [], answerImages: [] },
  { id: 3, text: "حدد اسم هذا المعلم السياحى من الصور الموضحة", category: "جغرافيا", type: "withOptionsAndImages", options: ["أبو الهول", "معبد أبو سمبل", "معبد الكرنك"], answer: "معبد أبو سمبل", images: ["img1", "img2"], answerImages: [] },
  { id: 4, text: "تأمل الصور التالية ثم حدد العنصر المشترك بينها", category: "عبثيات", type: "withoutOptionsAndImages", options: [], answer: "", images: ["img1", "img2", "img3"], answerImages: ["answerImg"] },
  { id: 5, text: "من هو مؤسس الكنيسة القبطية الأرثوذكسية؟", category: "مسيحية", type: "withOptions", options: ["مرقس الرسول", "بطرس الرسول", "بولس الرسول", "يوحنا الرسول"], answer: "مرقس الرسول", images: [], answerImages: [] },
  { id: 6, text: "كم عدد مرات تعرض البابا أثناسيوس للنفى؟", category: "قديسين", type: "withOptions", options: ["3 مرات", "4 مرات", "5 مرات", "6 مرات"], answer: "5 مرات", images: [], answerImages: [] },
  { id: 7, text: "ما هى عاصمة المملكة العربية السعودية؟", category: "جغرافيا", type: "withOptions", options: ["الرياض", "جدة", "مكة المكرمة", "المدينة المنورة"], answer: "الرياض", images: [], answerImages: [] },
  { id: 8, text: "اشرح نظرية فيثاغورس مع ذكر مثال تطبيقى", category: "ماث وألغاز", type: "withoutOptions", options: [], answer: "", images: [], answerImages: [] },
];

const TYPE_LABELS = {
  withOptions:             "نص + اختيارات",
  withoutOptions:          "نص فقط",
  withOptionsAndImages:    "نص + صور + اختيارات",
  withoutOptionsAndImages: "نص + صور",
};

const TYPE_COLOR = {
  withOptions:             { bg: "rgba(245,200,64,.12)",  text: "#F5C840" },
  withoutOptions:          { bg: "rgba(168,196,232,.12)", text: "#A8C4E8" },
  withOptionsAndImages:    { bg: "rgba(76,175,130,.12)",  text: "#4CAF82" },
  withoutOptionsAndImages: { bg: "rgba(90,128,168,.14)",  text: "#8FB0D8" },
};

const EMPTY_FORM = {
  text: "", category: "", type: "withOptions",
  optA: "", optB: "", optC: "", optD: "",
  answer: "", images: [], answerImages: [],
};

// ════════════════════════════════════════════════════════════
// Modal إضافة / تعديل
// ════════════════════════════════════════════════════════════
function QuestionModal({ mode, initial, categories, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        text: initial.text,
        category: initial.category,
        type: initial.type,
        optA: initial.options[0] || "",
        optB: initial.options[1] || "",
        optC: initial.options[2] || "",
        optD: initial.options[3] || "",
        answer: initial.answer,
        images: initial.images,
        answerImages: initial.answerImages,
      };
    }
    return { ...EMPTY_FORM };
  });

  const hasOptions = form.type === "withOptions" || form.type === "withOptionsAndImages";
  const hasImages  = form.type === "withOptionsAndImages" || form.type === "withoutOptionsAndImages";

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.text.trim())     return alert("نص السؤال مطلوب");
    if (!form.category)        return alert("التصنيف مطلوب");
    const options = hasOptions
      ? [form.optA, form.optB, form.optC, form.optD].filter(Boolean)
      : [];
    if (hasOptions && options.length < 2) return alert("أدخل اختيارين على الأقل");
    onSave({ text: form.text, category: form.category, type: form.type, options, answer: form.answer, images: form.images, answerImages: form.answerImages });
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>

        <div style={S.modalHeader}>
          <span style={S.modalTitle}>{mode === "add" ? "إضافة سؤال جديد" : "تعديل السؤال"}</span>
          <button style={S.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.modalBody}>

          {/* نص السؤال */}
          <div style={S.fieldGroup}>
            <label style={S.label}>نص السؤال <span style={S.required}>*</span></label>
            <textarea
              rows={3}
              value={form.text}
              onChange={(e) => set("text", e.target.value)}
              placeholder="أدخل نص السؤال"
              style={S.textarea}
            />
          </div>

          {/* التصنيف + النوع */}
          <div style={S.twoCol}>
            <div style={S.fieldGroup}>
              <label style={S.label}>التصنيف <span style={S.required}>*</span></label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} style={S.select}>
                <option value="">اختر التصنيف</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>نوع السؤال</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} style={S.select}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* الصور */}
          {hasImages && (
            <div style={S.fieldGroup}>
              <label style={S.label}>صور السؤال <span style={S.muted}>(حد أقصى 3 صور — 5MB لكل صورة)</span></label>
              <div style={S.uploadZone}>
                <span style={{ color: "#6A90B8", fontSize: "13px" }}>اضغط لرفع صور أو اسحبها هنا</span>
              </div>
            </div>
          )}

          {/* الاختيارات */}
          {hasOptions && (
            <div style={S.fieldGroup}>
              <label style={S.label}>الاختيارات <span style={S.muted}>(2 على الأقل — 4 كحد أقصى)</span></label>
              <div style={S.optionsGrid}>
                {[["optA","أ"], ["optB","ب"], ["optC","ج"], ["optD","د"]].map(([k, prefix]) => (
                  <div key={k} style={S.optionRow}>
                    <span style={S.optPrefix}>{prefix}</span>
                    <input
                      type="text"
                      value={form[k]}
                      onChange={(e) => set(k, e.target.value)}
                      placeholder={`الاختيار ${prefix}`}
                      style={S.input}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* الإجابة الصحيحة */}
          {hasOptions && (
            <div style={S.fieldGroup}>
              <label style={S.label}>الإجابة الصحيحة</label>
              <select value={form.answer} onChange={(e) => set("answer", e.target.value)} style={S.select}>
                <option value="">اختر الإجابة الصحيحة</option>
                {[form.optA, form.optB, form.optC, form.optD].filter(Boolean).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          )}

          {/* صور الإجابة */}
          <div style={S.fieldGroup}>
            <label style={S.label}>
              صور الإجابة
              <span style={S.muted}> — إذا تُركت فارغة يُستخدم Done الافتراضى</span>
            </label>
            <div style={S.uploadZone}>
              <span style={{ color: "#6A90B8", fontSize: "13px" }}>اضغط لرفع صور الإجابة</span>
            </div>
          </div>

        </div>

        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose}>إلغاء</button>
          <button
            style={S.saveBtn}
            onClick={handleSave}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {mode === "add" ? "إضافة السؤال" : "حفظ التعديلات"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Modal تأكيد الحذف
// ════════════════════════════════════════════════════════════
function DeleteModal({ question, onConfirm, onCancel }) {
  if (!question) return null;
  return (
    <div style={S.overlay} onClick={onCancel}>
      <div style={{ ...S.modal, maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
        <div style={S.deleteIconCircle} />
        <div style={{ color: "#FFFFFF", fontSize: "17px", fontWeight: 800, marginBottom: "10px", textAlign: "center" }}>
          حذف السؤال
        </div>
        <div style={{ color: "#A8C4E8", fontSize: "13px", lineHeight: 1.7, textAlign: "center", marginBottom: "8px" }}>
          هل أنت متأكد من حذف هذا السؤال نهائياً؟
        </div>
        <div style={{ color: "#6A90B8", fontSize: "12px", textAlign: "center", marginBottom: "24px", lineHeight: 1.6 }}>
          إذا كان السؤال مستخدماً داخل مسابقة سيتم استبداله تلقائياً بسؤال من نفس التصنيف.
        </div>
        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onCancel}>تراجع</button>
          <button style={S.deleteConfirmBtn} onClick={onConfirm}>حذف نهائياً</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// كارت السؤال
// ════════════════════════════════════════════════════════════
function QuestionCard({ q, onEdit, onDelete }) {
  const [hover, setHover] = useState(false);
  const typeStyle = TYPE_COLOR[q.type] || TYPE_COLOR.withoutOptions;

  return (
    <div
      style={{
        ...S.card,
        borderColor: hover ? "#F5C840" : "#2E5FA8",
        transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? "0 6px 24px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.15)",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* الرأس */}
      <div style={S.cardTop}>
        <span style={{ ...S.typeBadge, background: typeStyle.bg, color: typeStyle.text }}>
          {TYPE_LABELS[q.type]}
        </span>
        <span style={S.catBadge}>{q.category}</span>
      </div>

      {/* النص */}
      <p style={S.cardText}>{q.text}</p>

      {/* الاختيارات */}
      {q.options.length > 0 && (
        <div style={S.cardOptions}>
          {q.options.map((o, i) => (
            <span
              key={i}
              style={{
                ...S.optPill,
                background: o === q.answer ? "rgba(76,175,130,.15)" : "rgba(255,255,255,.05)",
                borderColor: o === q.answer ? "#4CAF82" : "rgba(255,255,255,.1)",
                color: o === q.answer ? "#4CAF82" : "#A8C4E8",
              }}
            >
              {["أ","ب","ج","د"][i]}- {o}
            </span>
          ))}
        </div>
      )}

      {/* الصور */}
      {q.images.length > 0 && (
        <div style={S.cardImagesRow}>
          {q.images.map((_, i) => (
            <div key={i} style={S.imgThumb}>صورة {i + 1}</div>
          ))}
        </div>
      )}

      {/* الأزرار */}
      <div style={S.cardActions}>
        <button
          style={S.editBtn}
          onClick={() => onEdit(q)}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F5C840"; e.currentTarget.style.color = "#F5C840"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E5FA8"; e.currentTarget.style.color = "#A8C4E8"; }}
        >
          تعديل
        </button>
        <button
          style={S.deleteBtn}
          onClick={() => onDelete(q)}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D24646"; e.currentTarget.style.color = "#D24646"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(210,70,70,.3)"; e.currentTarget.style.color = "rgba(210,70,70,.7)"; }}
        >
          حذف
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ════════════════════════════════════════════════════════════
export default function QuestionsPage() {
  const [questions, setQuestions]       = useState(SAMPLE_QUESTIONS);
  const [searchText, setSearchText]     = useState("");
  const [filterCat, setFilterCat]       = useState("الكل");
  const [filterType, setFilterType]     = useState("الكل");
  const [modal, setModal]               = useState(null); // null | "add" | { mode:"edit", q }
  const [pendingDelete, setPendingDelete] = useState(null);

  // ── الفلترة ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch = !searchText.trim() || q.text.includes(searchText.trim());
      const matchCat    = filterCat  === "الكل" || q.category === filterCat;
      const matchType   = filterType === "الكل" || q.type === filterType;
      return matchSearch && matchCat && matchType;
    });
  }, [questions, searchText, filterCat, filterType]);

  // ── CRUD ─────────────────────────────────────────────────
  const handleAdd = (data) => {
    setQuestions((prev) => [...prev, { id: Date.now(), ...data }]);
    setModal(null);
  };

  const handleEdit = (data) => {
    setQuestions((prev) => prev.map((q) => q.id === modal.q.id ? { ...q, ...data } : q));
    setModal(null);
  };

  const handleDelete = () => {
    setQuestions((prev) => prev.filter((q) => q.id !== pendingDelete.id));
    setPendingDelete(null);
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

          {/* ── الهيدر ── */}
          <div style={S.pageHeader}>
            <span style={S.pageTitle}>إدارة الأسئلة</span>
            <button
              style={S.addBtn}
              onClick={() => setModal("add")}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              + إضافة سؤال
            </button>
          </div>

          {/* ── شريط البحث والفلاتر ── */}
          <div style={S.filtersBar}>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="بحث في نص السؤال..."
              style={S.searchInput}
            />
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={S.filterSelect}>
              <option value="الكل">كل التصنيفات</option>
              {SAMPLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={S.filterSelect}>
              <option value="الكل">كل الأنواع</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {/* ── العداد ── */}
          <div style={S.countBar}>
            <span style={S.countText}>
              {filtered.length === questions.length
                ? `${questions.length} سؤال`
                : `${filtered.length} من ${questions.length} سؤال`}
            </span>
            {(filterCat !== "الكل" || filterType !== "الكل" || searchText) && (
              <button
                style={S.clearFilters}
                onClick={() => { setFilterCat("الكل"); setFilterType("الكل"); setSearchText(""); }}
              >
                مسح الفلاتر
              </button>
            )}
          </div>

          {/* ── الجريد ── */}
          {filtered.length === 0 ? (
            <div style={S.empty}>لا توجد أسئلة تطابق البحث الحالى</div>
          ) : (
            <div style={S.grid}>
              {filtered.map((q) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  onEdit={(q) => setModal({ mode: "edit", q })}
                  onDelete={(q) => setPendingDelete(q)}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Modal الإضافة ── */}
      {modal === "add" && (
        <QuestionModal
          mode="add"
          initial={null}
          categories={SAMPLE_CATEGORIES}
          onSave={handleAdd}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Modal التعديل ── */}
      {modal && modal.mode === "edit" && (
        <QuestionModal
          mode="edit"
          initial={modal.q}
          categories={SAMPLE_CATEGORIES}
          onSave={handleEdit}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Modal الحذف ── */}
      <DeleteModal
        question={pendingDelete}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
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
    overflow: "hidden",
    paddingBottom: "60px",
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
    background: "radial-gradient(ellipse, rgba(245,200,64,0.05) 0%, transparent 65%)",
    pointerEvents: "none",
  },
  inner: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "40px 28px 0",
  },

  // هيدر الصفحة
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "28px",
  },
  pageTitle: {
    fontFamily: "'Lemonada', cursive",
    fontSize: "22px",
    fontWeight: 700,
    color: "#F5C840",
  },
  addBtn: {
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    border: "none",
    borderRadius: "10px",
    padding: "12px 28px",
    color: "#1A2A00",
    fontSize: "15px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.1s",
    boxShadow: "0 4px 0 #B87A10",
  },

  // شريط الفلاتر
  filtersBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 2,
    minWidth: "220px",
    background: "#0F2040",
    border: "1.5px solid #2E5FA8",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#FFFFFF",
    fontSize: "14px",
    fontFamily: "'Cairo', sans-serif",
    outline: "none",
  },
  filterSelect: {
    flex: 1,
    minWidth: "160px",
    background: "#0F2040",
    border: "1.5px solid #2E5FA8",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#A8C4E8",
    fontSize: "13px",
    fontFamily: "'Cairo', sans-serif",
    outline: "none",
    cursor: "pointer",
  },

  // العداد
  countBar: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
  },
  countText: {
    color: "#6A90B8",
    fontSize: "13px",
    fontWeight: 600,
  },
  clearFilters: {
    background: "transparent",
    border: "none",
    color: "#F5C840",
    fontSize: "12px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },

  // الجريد
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
  },
  empty: {
    color: "rgba(168,196,232,.45)",
    fontSize: "15px",
    textAlign: "center",
    padding: "60px 0",
  },

  // كارت السؤال
  card: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "14px",
    padding: "20px",
    transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  typeBadge: {
    fontSize: "11px",
    fontWeight: 700,
    borderRadius: "5px",
    padding: "3px 9px",
  },
  catBadge: {
    fontSize: "11px",
    fontWeight: 700,
    borderRadius: "5px",
    padding: "3px 9px",
    background: "rgba(46,95,168,.25)",
    color: "#8FB0D8",
  },
  cardText: {
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: 700,
    lineHeight: 1.6,
    margin: 0,
  },
  cardOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  optPill: {
    fontSize: "12px",
    fontWeight: 600,
    border: "1px solid",
    borderRadius: "6px",
    padding: "4px 10px",
    lineHeight: 1.5,
  },
  cardImagesRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  imgThumb: {
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "11px",
    color: "#6A90B8",
  },
  cardActions: {
    display: "flex",
    gap: "8px",
    marginTop: "4px",
  },
  editBtn: {
    flex: 1,
    background: "transparent",
    border: "1px solid #2E5FA8",
    borderRadius: "7px",
    padding: "8px",
    color: "#A8C4E8",
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s",
  },
  deleteBtn: {
    flex: 1,
    background: "transparent",
    border: "1px solid rgba(210,70,70,.3)",
    borderRadius: "7px",
    padding: "8px",
    color: "rgba(210,70,70,.7)",
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s",
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
    maxWidth: "560px",
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "90vh",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #2E5FA8",
    flexShrink: 0,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: "17px",
    fontWeight: 800,
  },
  modalCloseBtn: {
    background: "none",
    border: "none",
    color: "#6A90B8",
    fontSize: "16px",
    cursor: "pointer",
    padding: "4px 8px",
    fontFamily: "'Cairo', sans-serif",
  },
  modalBody: {
    padding: "24px",
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  modalFooter: {
    display: "flex",
    gap: "10px",
    padding: "16px 24px",
    borderTop: "1px solid #2E5FA8",
    flexShrink: 0,
  },

  // حقول الفورم
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#A8C4E8",
  },
  required: {
    color: "#D24646",
    marginRight: "2px",
  },
  muted: {
    color: "#6A90B8",
    fontWeight: 400,
    fontSize: "11px",
  },
  input: {
    flex: 1,
    background: "#0F2040",
    border: "1.5px solid #2E5FA8",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "#FFFFFF",
    fontSize: "14px",
    fontFamily: "'Cairo', sans-serif",
    outline: "none",
  },
  textarea: {
    background: "#0F2040",
    border: "1.5px solid #2E5FA8",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#FFFFFF",
    fontSize: "14px",
    fontFamily: "'Cairo', sans-serif",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.6,
  },
  select: {
    background: "#0F2040",
    border: "1.5px solid #2E5FA8",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#A8C4E8",
    fontSize: "13px",
    fontFamily: "'Cairo', sans-serif",
    outline: "none",
    cursor: "pointer",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  uploadZone: {
    background: "#0F2040",
    border: "1.5px dashed #2E5FA8",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center",
    cursor: "pointer",
  },
  optionsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  optionRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  optPrefix: {
    color: "#F5C840",
    fontWeight: 800,
    fontSize: "14px",
    minWidth: "18px",
    textAlign: "center",
  },

  // أزرار الفوتر
  cancelBtn: {
    flex: 1,
    background: "transparent",
    border: "1px solid #2E5FA8",
    borderRadius: "8px",
    padding: "11px",
    color: "#A8C4E8",
    fontSize: "14px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
  },
  saveBtn: {
    flex: 2,
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    border: "none",
    borderRadius: "8px",
    padding: "11px",
    color: "#1A2A00",
    fontSize: "14px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.1s",
    boxShadow: "0 3px 0 #B87A10",
  },

  // حذف
  deleteIconCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "rgba(210,70,70,.12)",
    border: "1.5px solid rgba(210,70,70,.4)",
    margin: "0 auto 16px",
  },
  deleteConfirmBtn: {
    flex: 2,
    background: "#D24646",
    border: "none",
    borderRadius: "8px",
    padding: "11px",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 800,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
  },
};
