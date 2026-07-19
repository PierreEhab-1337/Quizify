import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  uploadQuestionImage,
} from "../services/questionService";
import { getCategories } from "../services/categoryService";

// ════════════════════════════════════════════════════════════
// أنواع الأسئلة — لازم تتطابق مع الباك اند بالظبط (question_type)
// ════════════════════════════════════════════════════════════
const TYPE_LABELS = {
  singleChoice: "اختيار واحد",
  multiChoice:  "اختيار متعدد",
  openEnded:    "إجابة مفتوحة",
};

const TYPE_COLOR = {
  singleChoice: { bg: "rgba(245,200,64,.12)",  text: "#F5C840" },
  multiChoice:  { bg: "rgba(76,175,130,.12)",  text: "#4CAF82" },
  openEnded:    { bg: "rgba(168,196,232,.12)", text: "#A8C4E8" },
};

const OPTION_LETTERS = ["أ", "ب", "ج", "د"];
const EMPTY_CHOICE = () => ({ description: "", status: false, imageFile: null, image_path: null });

// ════════════════════════════════════════════════════════════
// Modal إضافة / تعديل
// ════════════════════════════════════════════════════════════
function QuestionModal({ mode, initial, categories, onSave, onClose, saving }) {
  const [description, setDescription] = useState(initial?.description || "");
  const [type, setType] = useState(initial?.question_type || "singleChoice");
  const [tags, setTags] = useState(() => (initial?.tags || []).map((t) => t.category_type || t));
  const [choices, setChoices] = useState(() => {
    if (initial?.choices?.length) {
      return initial.choices.map((c) => ({
        description: c.description,
        status: !!c.status,
        imageFile: null,
        image_path: c.image_path || null,
      }));
    }
    return [EMPTY_CHOICE(), EMPTY_CHOICE()];
  });
  const [questionImages, setQuestionImages] = useState(() =>
    (initial?.images || []).map((url) => ({ file: null, preview: url, existing: true }))
  );
  const [error, setError] = useState("");

  const hasChoices = type !== "openEnded";

  const toggleTag = (name) => {
    setTags((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  };

  const setChoiceText = (i, text) => {
    setChoices((prev) => prev.map((c, idx) => (idx === i ? { ...c, description: text } : c)));
  };

  const setChoiceCorrect = (i) => {
    setChoices((prev) =>
      prev.map((c, idx) => {
        if (type === "singleChoice") return { ...c, status: idx === i };
        if (idx === i) return { ...c, status: !c.status };
        return c;
      })
    );
  };

  const setChoiceImage = (i, file) => {
    setChoices((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, imageFile: file } : c))
    );
  };

  const addQuestionImage = (file) => {
    if (!file) return;
    setQuestionImages((prev) => [...prev, { file, preview: URL.createObjectURL(file), existing: false }]);
  };

  const removeQuestionImage = (i) => {
    setQuestionImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addChoice = () => {
    if (choices.length >= 6) return;
    setChoices((prev) => [...prev, EMPTY_CHOICE()]);
  };

  const removeChoice = (i) => {
    if (choices.length <= 2) return;
    setChoices((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = () => {
    setError("");
    if (!description.trim()) return setError("نص السؤال مطلوب");
    if (tags.length === 0) return setError("اختر تصنيف واحد على الأقل");

    let payloadChoices = [];
    if (hasChoices) {
      payloadChoices = choices
        .filter((c) => c.description.trim())
        .map((c) => ({
          description: c.description.trim(),
          status: c.status,
          imageFile: c.imageFile,       // new file to upload, if any
          image_path: c.image_path,     // existing path to keep, if any
        }));
      if (payloadChoices.length < 2) return setError("أدخل اختيارين على الأقل");
      const correctCount = payloadChoices.filter((c) => c.status).length;
      if (correctCount === 0) return setError("حدد إجابة صحيحة واحدة على الأقل");
      if (type === "singleChoice" && correctCount > 1) return setError("اختيار واحد يسمح بإجابة صحيحة واحدة فقط");
    }

    onSave({
      description: description.trim(),
      question_type: type,
      tags,
      choices: payloadChoices,
      questionImages, // { file, preview, existing }[]
    });
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>

        <div style={S.modalHeader}>
          <span style={S.modalTitle}>{mode === "add" ? "إضافة سؤال جديد" : "تعديل السؤال"}</span>
          <button style={S.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.modalBody}>

          {error && <div style={S.errorBox}>{error}</div>}

          {/* نص السؤال */}
          <div style={S.fieldGroup}>
            <label style={S.label}>نص السؤال <span style={S.required}>*</span></label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أدخل نص السؤال"
              style={S.textarea}
            />
          </div>

          {/* نوع السؤال */}
          <div style={S.fieldGroup}>
            <label style={S.label}>نوع السؤال</label>
            <select
              value={type}
              onChange={(e) => {
                const t = e.target.value;
                setType(t);
                if (t === "singleChoice") {
                  // اسمح بإجابة صحيحة واحدة بس
                  setChoices((prev) => {
                    const firstCorrect = prev.findIndex((c) => c.status);
                    return prev.map((c, i) => ({ ...c, status: i === firstCorrect }));
                  });
                }
              }}
              style={S.select}
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {/* التصنيفات (tags) */}
          <div style={S.fieldGroup}>
            <label style={S.label}>التصنيفات <span style={S.required}>*</span></label>
            {categories.length === 0 ? (
              <span style={S.muted}>لا توجد تصنيفات — أضف تصنيف أولاً من صفحة التصنيفات</span>
            ) : (
              <div style={S.tagsWrap}>
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c.name}
                    onClick={() => toggleTag(c.name)}
                    style={{
                      ...S.tagChip,
                      background: tags.includes(c.name) ? "rgba(245,200,64,.15)" : "transparent",
                      borderColor: tags.includes(c.name) ? "#F5C840" : "#2E5FA8",
                      color: tags.includes(c.name) ? "#F5C840" : "#A8C4E8",
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* صور السؤال */}
          <div style={S.fieldGroup}>
            <label style={S.label}>صور السؤال <span style={S.muted}>(اختياري)</span></label>
            <div style={S.imageGrid}>
              {questionImages.map((img, i) => (
                <div key={i} style={S.imageThumbWrap}>
                  <img src={img.preview} alt="" style={S.imageThumb} />
                  <button type="button" style={S.removeImageBtn} onClick={() => removeQuestionImage(i)}>✕</button>
                </div>
              ))}
              <label style={S.imageUploadBtn}>
                +
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => { addQuestionImage(e.target.files[0]); e.target.value = ""; }}
                />
              </label>
            </div>
          </div>

          {/* الاختيارات */}
          {hasChoices && (
            <div style={S.fieldGroup}>
              <label style={S.label}>
                الاختيارات <span style={S.muted}>
                  ({type === "singleChoice" ? "حدد إجابة صحيحة واحدة" : "حدد إجابة صحيحة واحدة أو أكثر"})
                </span>
              </label>
              <div style={S.optionsGrid}>
                {choices.map((c, i) => (
                  <div key={i} style={S.optionRow}>
                    <button
                      type="button"
                      onClick={() => setChoiceCorrect(i)}
                      title="إجابة صحيحة؟"
                      style={{
                        ...S.correctToggle,
                        borderRadius: type === "singleChoice" ? "50%" : "5px",
                        background: c.status ? "#4CAF82" : "transparent",
                        borderColor: c.status ? "#4CAF82" : "#2E5FA8",
                        color: c.status ? "#0F2040" : "transparent",
                      }}
                    >
                      ✓
                    </button>
                    <span style={S.optPrefix}>{OPTION_LETTERS[i] || i + 1}</span>
                    <input
                      type="text"
                      value={c.description}
                      onChange={(e) => setChoiceText(i, e.target.value)}
                      placeholder={`الاختيار ${OPTION_LETTERS[i] || i + 1}`}
                      style={S.input}
                    />
                    <label style={S.choiceImageBtn} title="صورة الاختيار">
                      {c.imageFile ? "✓" : c.image_path ? "🖼" : "+"}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => setChoiceImage(i, e.target.files[0])}
                      />
                    </label>
                    {choices.length > 2 && (
                      <button type="button" style={S.removeOptBtn} onClick={() => removeChoice(i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              {choices.length < 6 && (
                <button type="button" style={S.addOptBtn} onClick={addChoice}>+ إضافة اختيار</button>
              )}
            </div>
          )}

          {type === "openEnded" && (
            <div style={S.infoBox}>الأسئلة المفتوحة مفيهاش اختيارات — تتقيّم يدوياً وقت العرض.</div>
          )}

        </div>

        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose} disabled={saving}>إلغاء</button>
          <button
            style={{ ...S.saveBtn, opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer" }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "جارٍ الحفظ..." : mode === "add" ? "إضافة السؤال" : "حفظ التعديلات"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Modal تأكيد الحذف
// ════════════════════════════════════════════════════════════
function DeleteModal({ question, onConfirm, onCancel, busy }) {
  if (!question) return null;
  return (
    <div style={S.overlay} onClick={onCancel}>
      <div style={{ ...S.modal, maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
        <div style={S.deleteIconCircle} />
        <div style={{ color: "#FFFFFF", fontSize: "17px", fontWeight: 800, marginBottom: "10px", textAlign: "center" }}>
          حذف السؤال
        </div>
        <div style={{ color: "#A8C4E8", fontSize: "13px", lineHeight: 1.7, textAlign: "center", marginBottom: "24px" }}>
          هل أنت متأكد من حذف هذا السؤال نهائياً؟ لو السؤال مستخدم داخل مسابقة هيتحذف منها كمان.
        </div>
        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onCancel} disabled={busy}>تراجع</button>
          <button style={{ ...S.deleteConfirmBtn, opacity: busy ? 0.6 : 1 }} onClick={onConfirm} disabled={busy}>
            {busy ? "جارٍ الحذف..." : "حذف نهائياً"}
          </button>
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
  const typeStyle = TYPE_COLOR[q.question_type] || TYPE_COLOR.openEnded;
  const tagNames = (q.tags || []).map((t) => t.category_type || t);

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
      <div style={S.cardTop}>
        <span style={{ ...S.typeBadge, background: typeStyle.bg, color: typeStyle.text }}>
          {TYPE_LABELS[q.question_type] || q.question_type}
        </span>
        {tagNames.map((t) => (
          <span key={t} style={S.catBadge}>{t}</span>
        ))}
      </div>

      <p style={S.cardText}>{q.description}</p>

      {q.images?.length > 0 && (
        <div style={S.imageGrid}>
          {q.images.map((url, i) => (
            <img key={i} src={url} alt="" style={S.imageThumb} />
          ))}
        </div>
      )}

      {q.choices?.length > 0 && (
        <div style={S.cardOptions}>
          {q.choices.map((c, i) => (
            <span
              key={i}
              style={{
                ...S.optPill,
                background: c.status ? "rgba(76,175,130,.15)" : "rgba(255,255,255,.05)",
                borderColor: c.status ? "#4CAF82" : "rgba(255,255,255,.1)",
                color: c.status ? "#4CAF82" : "#A8C4E8",
              }}
            >
              {OPTION_LETTERS[i] || i + 1}- {c.description}
            </span>
          ))}
        </div>
      )}

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
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [filterType, setFilterType] = useState("الكل");

  const [modal, setModal] = useState(null); // null | "add" | { mode:"edit", q }
  const [pendingDelete, setPendingDelete] = useState(null);

  // ── تحميل التصنيفات (مرة واحدة) ──────────────────────────
  useEffect(() => {
    getCategories()
      .then((list) => setCategories(list.map((c) => ({ id: c.category_id, name: c.category_type }))))
      .catch(() => {});
  }, []);

  // ── تحميل الأسئلة (فلترة من السيرفر) ─────────────────────
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters = {};
      if (filterCat !== "الكل") filters.category = filterCat;
      if (filterType !== "الكل") filters.question_type = filterType;
      if (searchText.trim()) filters.search = searchText.trim();
      const list = await getQuestions(filters);
      setQuestions(list);
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر تحميل الأسئلة");
    } finally {
      setLoading(false);
    }
  }, [filterCat, filterType, searchText]);

  useEffect(() => {
    const t = setTimeout(loadQuestions, searchText ? 350 : 0); // debounce بسيط للبحث
    return () => clearTimeout(t);
  }, [loadQuestions, searchText]);

  // ── CRUD ─────────────────────────────────────────────────
  const handleAdd = async (payload) => {
    setSaving(true);
    setError("");
    try {
      const tempId = crypto.randomUUID();

      // ارفع صور السؤال (لو موجودة) على Supabase الأول، وبعدين ابعت الـ paths
      const images = await Promise.all(
        payload.questionImages
          .filter((img) => img.file) // بس الصور الجديدة
          .map((img, i) => uploadQuestionImage(tempId, `q-image-${i}`, img.file))
      );

      // نفس الفكرة لصور الاختيارات
      const choices = await Promise.all(
        payload.choices.map(async (c, i) => ({
          description: c.description,
          status: c.status,
          image_path: c.imageFile
            ? await uploadQuestionImage(tempId, `choice-${i + 1}`, c.imageFile)
            : c.image_path || null,
        }))
      );

      await createQuestion({ ...payload, images, choices });
      setModal(null);
      await loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر إضافة السؤال");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (payload) => {
    setSaving(true);
    setError("");
    try {
      const questionId = modal.q.question_id;

      // حافظ على صور السؤال الموجودة، وارفع بس الجديدة
      const images = await Promise.all(
        payload.questionImages.map((img, i) =>
          img.file ? uploadQuestionImage(questionId, `q-image-${i}`, img.file) : img.preview
        )
      );

      const choices = await Promise.all(
        payload.choices.map(async (c, i) => ({
          description: c.description,
          status: c.status,
          image_path: c.imageFile
            ? await uploadQuestionImage(questionId, `choice-${i + 1}`, c.imageFile)
            : c.image_path || null,
        }))
      );

      await updateQuestion(questionId, { ...payload, images, choices });
      setModal(null);
      await loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر تعديل السؤال");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError("");
    try {
      await deleteQuestion(pendingDelete.question_id);
      setPendingDelete(null);
      await loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر حذف السؤال");
    } finally {
      setSaving(false);
    }
  };

  const countLabel = useMemo(() => `${questions.length} سؤال`, [questions.length]);
  const filtersActive = filterCat !== "الكل" || filterType !== "الكل" || !!searchText;

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
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={S.filterSelect}>
              <option value="الكل">كل الأنواع</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {/* ── العداد ── */}
          <div style={S.countBar}>
            <span style={S.countText}>{countLabel}</span>
            {filtersActive && (
              <button
                style={S.clearFilters}
                onClick={() => { setFilterCat("الكل"); setFilterType("الكل"); setSearchText(""); }}
              >
                مسح الفلاتر
              </button>
            )}
          </div>

          {error && <div style={{ ...S.infoBox, marginBottom: "16px" }}>{error}</div>}

          {/* ── الجريد ── */}
          {loading ? (
            <div style={{ color: "#6A90B8", padding: "20px 0" }}>جارِ التحميل...</div>
          ) : questions.length === 0 ? (
            <div style={S.empty}>لا توجد أسئلة تطابق البحث الحالى</div>
          ) : (
            <div style={S.grid}>
              {questions.map((q) => (
                <QuestionCard
                  key={q.question_id}
                  q={q}
                  onEdit={(q) => setModal({ mode: "edit", q })}
                  onDelete={(q) => setPendingDelete(q)}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {modal === "add" && (
        <QuestionModal
          mode="add"
          initial={null}
          categories={categories}
          onSave={handleAdd}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal && modal.mode === "edit" && (
        <QuestionModal
          mode="edit"
          initial={modal.q}
          categories={categories}
          onSave={handleEdit}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      <DeleteModal
        question={pendingDelete}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        busy={saving}
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
  tagsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  tagChip: {
    border: "1.5px solid",
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    transition: "all 0.15s",
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
  correctToggle: {
    width: "22px",
    height: "22px",
    minWidth: "22px",
    border: "1.5px solid",
    fontSize: "12px",
    fontWeight: 900,
    lineHeight: "1",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    transition: "all 0.15s",
  },
  optPrefix: {
    color: "#F5C840",
    fontWeight: 800,
    fontSize: "14px",
    minWidth: "18px",
    textAlign: "center",
  },
  removeOptBtn: {
    background: "none",
    border: "none",
    color: "#D24646",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "'Cairo', sans-serif",
    padding: "0 4px",
  },
  addOptBtn: {
    alignSelf: "flex-start",
    background: "none",
    border: "none",
    color: "#F5C840",
    fontSize: "12px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    padding: 0,
    marginTop: "4px",
  },

  errorBox: {
    background: "rgba(210,70,70,0.1)",
    border: "1px solid rgba(210,70,70,0.3)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#E07878",
    fontSize: "13px",
    lineHeight: 1.6,
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

  // ── صور ──
  imageGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  imageThumbWrap: {
    position: "relative",
    width: "64px",
    height: "64px",
  },
  imageThumb: {
    width: "64px",
    height: "64px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1.5px solid #2E5FA8",
  },
  removeImageBtn: {
    position: "absolute",
    top: "-6px",
    left: "-6px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#D24646",
    color: "#fff",
    border: "none",
    fontSize: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  imageUploadBtn: {
    width: "64px",
    height: "64px",
    borderRadius: "8px",
    border: "1.5px dashed #2E5FA8",
    color: "#6A90B8",
    fontSize: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  choiceImageBtn: {
    width: "30px",
    height: "30px",
    minWidth: "30px",
    borderRadius: "6px",
    border: "1.5px solid #2E5FA8",
    color: "#A8C4E8",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
};