import { useState, useMemo } from "react";

// ════════════════════════════════════════════════════════════
// بيانات تجريبية — تُستبدل بـ Firestore عند الربط
// ════════════════════════════════════════════════════════════
const SAMPLE_CATEGORIES = [
  { id: 1, name: "مسيحية",          count: 52 },
  { id: 2, name: "قديسين",          count: 41 },
  { id: 3, name: "ماث وألغاز",      count: 38 },
  { id: 4, name: "كورة",            count: 34 },
  { id: 5, name: "جغرافيا",         count: 30 },
  { id: 6, name: "تكنولوجيا وعلوم", count: 27 },
  { id: 7, name: "مناسبات دينية",   count: 16 },
  { id: 8, name: "عبثيات",          count: 10 },
];

// ════════════════════════════════════════════════════════════
// Modal إضافة / تعديل اسم التصنيف
// ════════════════════════════════════════════════════════════
function CategoryModal({ mode, initial, existingNames, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || "");
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("اسم التصنيف مطلوب");
    if (
      existingNames
        .filter((n) => n !== initial?.name)
        .includes(trimmed)
    ) return setError("هذا الاسم موجود بالفعل");
    onSave(trimmed);
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>

        <div style={S.modalHeader}>
          <span style={S.modalTitle}>
            {mode === "add" ? "إضافة تصنيف جديد" : `تعديل: ${initial.name}`}
          </span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px" }}>
          {mode === "edit" && initial.count > 0 && (
            <div style={S.infoBox}>
              سيتم تحديث جميع الأسئلة المرتبطة ({initial.count} سؤال) تلقائياً عند الحفظ.
            </div>
          )}

          <div style={S.fieldGroup}>
            <label style={S.label}>اسم التصنيف <span style={S.required}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="أدخل اسم التصنيف"
              style={{ ...S.input, borderColor: error ? "#D24646" : "#2E5FA8" }}
              autoFocus
            />
            {error && <span style={S.errorText}>{error}</span>}
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
            {mode === "add" ? "إضافة" : "حفظ التعديل"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Modal حذف التصنيف — مع معالجة الأسئلة
// ════════════════════════════════════════════════════════════
function DeleteCategoryModal({ category, otherCategories, onConfirm, onClose }) {
  // decisions: { questionIndex: "move" | "delete", targetCategory: string }
  // هنا بنتعامل مع قرار جماعى لأن الأسئلة الحقيقية ستُجلب من Firestore
  const [decision, setDecision] = useState("move"); // "move" | "delete"
  const [target,   setTarget]   = useState(otherCategories[0]?.name || "");

  if (!category) return null;

  const hasQuestions = category.count > 0;

  const handleConfirm = () => {
    if (hasQuestions && decision === "move" && !target) return;
    onConfirm({ decision, target });
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>

        <div style={S.modalHeader}>
          <span style={S.modalTitle}>حذف تصنيف</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

          <div style={S.deleteIconRow}>
            <div style={S.deleteIconCircle} />
            <div>
              <div style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "15px", marginBottom: "4px" }}>
                {category.name}
              </div>
              <div style={{ color: "#6A90B8", fontSize: "12px" }}>
                {category.count} سؤال مرتبط بهذا التصنيف
              </div>
            </div>
          </div>

          {!hasQuestions ? (
            <div style={S.infoBox}>
              التصنيف فارغ ويمكن حذفه مباشرة بدون أى إجراء إضافى.
            </div>
          ) : (
            <>
              <div style={{ color: "#A8C4E8", fontSize: "13px", lineHeight: 1.7 }}>
                لا يمكن حذف التصنيف قبل تحديد مصير الأسئلة المرتبطة به.
                اختر ما تريد فعله بـ <span style={{ color: "#F5C840", fontWeight: 700 }}>{category.count} سؤال</span>:
              </div>

              {/* خيار النقل */}
              <div
                style={{
                  ...S.decisionCard,
                  borderColor: decision === "move" ? "#F5C840" : "#2E5FA8",
                  background:  decision === "move" ? "rgba(245,200,64,.06)" : "transparent",
                }}
                onClick={() => setDecision("move")}
              >
                <div style={S.radioRow}>
                  <div style={{
                    ...S.radio,
                    borderColor: decision === "move" ? "#F5C840" : "#2E5FA8",
                  }}>
                    {decision === "move" && <div style={S.radioDot} />}
                  </div>
                  <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "14px" }}>
                    نقل الأسئلة إلى تصنيف آخر
                  </span>
                </div>

                {decision === "move" && (
                  <div style={{ marginTop: "12px" }}>
                    <label style={{ ...S.label, marginBottom: "6px", display: "block" }}>التصنيف المستهدف</label>
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      style={S.select}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {otherCategories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* خيار الحذف */}
              <div
                style={{
                  ...S.decisionCard,
                  borderColor: decision === "delete" ? "#D24646" : "#2E5FA8",
                  background:  decision === "delete" ? "rgba(210,70,70,.06)" : "transparent",
                }}
                onClick={() => setDecision("delete")}
              >
                <div style={S.radioRow}>
                  <div style={{
                    ...S.radio,
                    borderColor: decision === "delete" ? "#D24646" : "#2E5FA8",
                  }}>
                    {decision === "delete" && <div style={{ ...S.radioDot, background: "#D24646" }} />}
                  </div>
                  <div>
                    <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "14px" }}>
                      حذف جميع الأسئلة نهائياً
                    </span>
                    <div style={{ color: "#E07878", fontSize: "12px", marginTop: "3px" }}>
                      لا يمكن التراجع عن هذا الإجراء
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose}>تراجع</button>
          <button
            style={{
              ...S.deleteConfirmBtn,
              opacity: (hasQuestions && decision === "move" && !target) ? 0.5 : 1,
            }}
            onClick={handleConfirm}
          >
            {hasQuestions
              ? (decision === "move" ? "نقل وحذف التصنيف" : "حذف الأسئلة والتصنيف")
              : "حذف التصنيف"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// كارت التصنيف
// ════════════════════════════════════════════════════════════
function CategoryCard({ cat, totalQuestions, onEdit, onDelete }) {
  const [hover, setHover] = useState(false);
  const pct = totalQuestions > 0 ? Math.round((cat.count / totalQuestions) * 100) : 0;

  return (
    <div
      style={{
        ...S.card,
        borderColor: hover ? "#F5C840" : "#2E5FA8",
        transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? "0 6px 24px rgba(0,0,0,.3)" : "0 2px 8px rgba(0,0,0,.15)",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={S.cardTop}>
        <span style={S.catName}>{cat.name}</span>
        <span style={S.countBadge}>{cat.count} سؤال</span>
      </div>

      {/* شريط النسبة */}
      <div style={S.barTrack}>
        <div style={{ ...S.barFill, width: `${pct}%` }} />
      </div>
      <div style={S.pctLabel}>{pct}% من إجمالى الأسئلة</div>

      <div style={S.cardActions}>
        <button
          style={S.editBtn}
          onClick={() => onEdit(cat)}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F5C840"; e.currentTarget.style.color = "#F5C840"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E5FA8"; e.currentTarget.style.color = "#A8C4E8"; }}
        >
          تعديل الاسم
        </button>
        <button
          style={S.deleteBtn}
          onClick={() => onDelete(cat)}
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
export default function CategoriesPage() {
  const [categories, setCategories] = useState(SAMPLE_CATEGORIES);
  const [modal,      setModal]      = useState(null); // null | "add" | { mode:"edit", cat }
  const [delTarget,  setDelTarget]  = useState(null);

  const totalQuestions = useMemo(() => categories.reduce((s, c) => s + c.count, 0), [categories]);
  const existingNames  = categories.map((c) => c.name);

  // ── إضافة ─────────────────────────────────────────────────
  const handleAdd = (name) => {
    setCategories((prev) => [...prev, { id: Date.now(), name, count: 0 }]);
    setModal(null);
  };

  // ── تعديل ────────────────────────────────────────────────
  const handleEdit = (name) => {
    setCategories((prev) =>
      prev.map((c) => c.id === modal.cat.id ? { ...c, name } : c)
    );
    setModal(null);
  };

  // ── حذف ──────────────────────────────────────────────────
  const handleDelete = ({ decision, target }) => {
    setCategories((prev) => {
      let updated = prev.filter((c) => c.id !== delTarget.id);
      if (decision === "move" && target) {
        updated = updated.map((c) =>
          c.name === target ? { ...c, count: c.count + delTarget.count } : c
        );
      }
      return updated;
    });
    setDelTarget(null);
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
            <span style={S.pageTitle}>إدارة التصنيفات</span>
            <button
              style={S.addBtn}
              onClick={() => setModal("add")}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              + إضافة تصنيف
            </button>
          </div>

          {/* ── ملخص ── */}
          <div style={S.summaryRow}>
            <div style={S.summaryCard}>
              <div style={S.summaryValue}>{categories.length}</div>
              <div style={S.summaryLabel}>تصنيف</div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryValue}>{totalQuestions}</div>
              <div style={S.summaryLabel}>إجمالى الأسئلة</div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryValue}>
                {categories.filter((c) => c.count === 0).length}
              </div>
              <div style={S.summaryLabel}>تصنيفات فارغة</div>
            </div>
          </div>

          {/* ── الجريد ── */}
          <div style={S.grid}>
            {categories
              .slice()
              .sort((a, b) => b.count - a.count)
              .map((cat) => (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  totalQuestions={totalQuestions}
                  onEdit={(cat) => setModal({ mode: "edit", cat })}
                  onDelete={(cat) => setDelTarget(cat)}
                />
              ))}
          </div>

        </div>
      </div>

      {/* ── Modals ── */}
      {modal === "add" && (
        <CategoryModal
          mode="add"
          initial={null}
          existingNames={existingNames}
          onSave={handleAdd}
          onClose={() => setModal(null)}
        />
      )}

      {modal && modal.mode === "edit" && (
        <CategoryModal
          mode="edit"
          initial={modal.cat}
          existingNames={existingNames}
          onSave={handleEdit}
          onClose={() => setModal(null)}
        />
      )}

      {delTarget && (
        <DeleteCategoryModal
          category={delTarget}
          otherCategories={categories.filter((c) => c.id !== delTarget.id)}
          onConfirm={handleDelete}
          onClose={() => setDelTarget(null)}
        />
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
    transform: "translate(-50%,-50%)",
    width: "700px",
    height: "700px",
    background: "radial-gradient(ellipse, rgba(245,200,64,0.05) 0%, transparent 65%)",
    pointerEvents: "none",
  },
  inner: {
    position: "relative",
    zIndex: 1,
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 28px 0",
  },

  // هيدر
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

  // ملخص
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
    marginBottom: "28px",
  },
  summaryCard: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "12px",
    padding: "18px",
    textAlign: "center",
    boxShadow: "0 3px 0 #0A1A38",
  },
  summaryValue: {
    fontSize: "32px",
    fontWeight: 900,
    color: "#F5C840",
    lineHeight: 1,
  },
  summaryLabel: {
    fontSize: "12px",
    color: "#A8C4E8",
    marginTop: "6px",
    fontWeight: 600,
  },

  // جريد التصنيفات
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "14px",
  },

  // كارت
  card: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  catName: {
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: 800,
  },
  countBadge: {
    background: "rgba(245,200,64,.12)",
    color: "#F5C840",
    fontSize: "11px",
    fontWeight: 700,
    borderRadius: "5px",
    padding: "3px 9px",
  },
  barTrack: {
    background: "#0F2040",
    borderRadius: "5px",
    height: "7px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #E8A020, #F5C840)",
    borderRadius: "5px",
    transition: "width 0.4s ease",
  },
  pctLabel: {
    fontSize: "11px",
    color: "#6A90B8",
    fontWeight: 600,
    marginTop: "-4px",
  },
  cardActions: {
    display: "flex",
    gap: "8px",
    marginTop: "2px",
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

  // ── Modals ──
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
    transition: "opacity 0.2s",
  },

  // فورم
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
  },
  input: {
    background: "#0F2040",
    border: "1.5px solid",
    borderRadius: "8px",
    padding: "11px 14px",
    color: "#FFFFFF",
    fontSize: "14px",
    fontFamily: "'Cairo', sans-serif",
    outline: "none",
  },
  select: {
    width: "100%",
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
  errorText: {
    color: "#E07878",
    fontSize: "12px",
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

  // حذف
  deleteIconRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  deleteIconCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "rgba(210,70,70,.12)",
    border: "1.5px solid rgba(210,70,70,.4)",
    flexShrink: 0,
  },
  decisionCard: {
    border: "1.5px solid",
    borderRadius: "10px",
    padding: "14px 16px",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
  },
  radioRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  radio: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "border-color 0.2s",
  },
  radioDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#F5C840",
  },
};
