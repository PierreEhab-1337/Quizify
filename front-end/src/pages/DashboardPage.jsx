import { useState, useMemo } from "react";

// ════════════════════════════════════════════════════════════
// بيانات تجريبية (Mock Data) — سيتم استبدالها بـ Firebase لاحقاً
// ════════════════════════════════════════════════════════════
const MOCK = {
  user: { name: "User1", isAdmin: false },
  drafts: [
    { id: 1, name: "اجتماع الجمعة", questionsCount: 8, totalQuestions: 12, updatedAt: "2026-06-20T14:30:00", inProgress: false },
    { id: 2, name: "نشاط الشباب", questionsCount: 3, totalQuestions: 10, updatedAt: "2026-06-18T09:00:00", inProgress: false },
    { id: 8, name: "اجتماع الإثنين", questionsCount: 12, totalQuestions: 12, updatedAt: "2026-06-22T11:00:00", inProgress: true },
  ],
  saved: [
    { id: 3, name: "مسابقة رمضان", totalQuestions: 15, updatedAt: "2026-06-15T10:00:00" },
    { id: 4, name: "اجتماع الأحد", totalQuestions: 12, updatedAt: "2026-06-10T16:20:00" },
    { id: 5, name: "نشاط الأطفال", totalQuestions: 10, updatedAt: "2026-06-08T12:00:00" },
  ],
  completed: [
    { id: 6, name: "مسابقة يناير", totalQuestions: 20, updatedAt: "2026-05-30T19:00:00" },
    { id: 7, name: "اجتماع الجمعة - نسخة قديمة", totalQuestions: 12, updatedAt: "2026-05-20T18:00:00" },
  ],
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });

const sortByLatest = (items) =>
  [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

// ════════════════════════════════════════════════════════════
// Modal تأكيد الحذف
// ════════════════════════════════════════════════════════════
function ConfirmDeleteModal({ item, onConfirm, onCancel }) {
  if (!item) return null;
  return (
    <div style={S.overlay} onClick={onCancel}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalIconWrap}>
          <div style={S.modalIcon} />
        </div>
        <div style={S.modalTitle}>حذف المسابقة</div>
        <div style={S.modalText}>
          هل أنت متأكد من حذف
          {" "}
          <span style={S.modalItemName}>{item.name}</span>
          {" "}
          نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
        </div>
        <div style={S.modalActions}>
          <button style={S.modalCancelBtn} onClick={onCancel}>
            تراجع
          </button>
          <button style={S.modalConfirmBtn} onClick={() => onConfirm(item)}>
            حذف نهائياً
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// بطاقة مسابقة
// ════════════════════════════════════════════════════════════
function CompetitionCard({ item, type, onOpen, onPlay, onResume, onDeleteRequest }) {
  const [hover, setHover] = useState(false);
  const progress = type === "draft" ? Math.round((item.questionsCount / item.totalQuestions) * 100) : null;

  return (
    <div
      style={{
        ...S.card,
        borderColor: hover ? "#F5C840" : "#2E5FA8",
        transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? "0 6px 24px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={S.cardName}>{item.name}</div>

      <div style={S.cardMeta}>
        <span>{type === "draft" ? `${item.questionsCount} من ${item.totalQuestions} سؤال` : `${item.totalQuestions} سؤال`}</span>
        <span style={S.dot}>·</span>
        <span>{formatDate(item.updatedAt)}</span>
      </div>

      {type === "draft" && (
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFill, width: `${progress}%` }} />
        </div>
      )}

      {type === "draft" && item.inProgress && (
        <div style={S.pausedBadge}>متوقفة أثناء التشغيل</div>
      )}

      <div style={S.cardActions}>
        {type === "draft" && item.inProgress && (
          <button style={S.btnPlay} onClick={() => onResume(item)}>استكمال التشغيل</button>
        )}
        {type === "draft" && !item.inProgress && (
          <button style={S.btnOpen} onClick={() => onOpen(item)}>استكمال التجهيز</button>
        )}
        {type === "saved" && (
          <>
            <button style={S.btnPlay} onClick={() => onPlay(item)}>تشغيل</button>
            <button style={S.btnOpen} onClick={() => onOpen(item)}>تعديل</button>
          </>
        )}
        {type === "completed" && (
          <>
            <button style={S.btnPlay} onClick={() => onPlay(item)}>إعادة التشغيل</button>
            <button style={S.btnOpen} onClick={() => onOpen(item)}>عرض</button>
          </>
        )}
        <button style={S.btnDelete} onClick={() => onDeleteRequest(item)}>حذف</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// قسم (Drafts / Saved / Completed)
// ════════════════════════════════════════════════════════════
function Section({ title, color, items, type, emptyMsg, onOpen, onPlay, onResume, onDeleteRequest }) {
  const sorted = useMemo(() => sortByLatest(items), [items]);

  return (
    <div style={S.section}>
      <div style={{ ...S.sectionHeader, borderColor: color }}>
        <span style={{ ...S.sectionTitle, color }}>{title}</span>
        <span style={S.sectionCount}>{sorted.length}</span>
      </div>

      {sorted.length === 0 ? (
        <div style={S.empty}>{emptyMsg}</div>
      ) : (
        <div style={S.grid}>
          {sorted.map((item) => (
            <CompetitionCard
              key={item.id}
              item={item}
              type={type}
              onOpen={onOpen}
              onPlay={onPlay}
              onResume={onResume}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// الصفحة الرئيسية (لوحة المسابقات)
// ════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { user, drafts, saved, completed } = MOCK;
  const [pendingDelete, setPendingDelete] = useState(null);

  // ── دوال تنقّل مؤقتة (Placeholders) ──────────────────────
  // سيتم استبدالها بـ navigate() من React Router عند ربط الصفحات
  const goToCreateCompetition = () => {
    console.log("navigate → /competitions/new");
  };
  const goToContinueDraft = (item) => {
    console.log("navigate → /competitions/" + item.id + "/build");
  };
  const goToResumePlayback = (item) => {
    console.log("navigate → /competitions/" + item.id + "/play?resume=true");
  };
  const goToPlay = (item) => {
    console.log("navigate → /competitions/" + item.id + "/play");
  };
  const goToOpen = (item) => {
    console.log("navigate → /competitions/" + item.id);
  };
  const goToAdminPanel = () => {
    console.log("navigate → /admin/dashboard");
  };
  const handleLogout = () => {
    console.log("logout()");
  };

  // ── الحذف ─────────────────────────────────────────────────
  const requestDelete = (item) => setPendingDelete(item);
  const cancelDelete = () => setPendingDelete(null);
  const confirmDelete = (item) => {
    console.log("delete competition →", item.id);
    setPendingDelete(null);
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
            <div style={S.headerRight}>
              {user.isAdmin && (
                <button style={S.adminLink} onClick={goToAdminPanel}>
                  لوحة الإدارة
                </button>
              )}
              <span style={S.userName}>{user.name}</span>
              <button style={S.logoutBtn} onClick={handleLogout}>خروج</button>
            </div>
          </div>
        </header>

        {/* ── المحتوى ── */}
        <main style={S.main}>
          <div style={S.createRow}>
            <button
              style={S.createBtn}
              onClick={goToCreateCompetition}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <span style={S.createPlus}>+</span>
              إنشاء مسابقة جديدة
            </button>
          </div>

          <Section
            title="Drafts"
            color="#A8C4E8"
            type="draft"
            items={drafts}
            emptyMsg="لا يوجد مسودات حالياً. ابدأ بإنشاء مسابقة جديدة."
            onOpen={goToContinueDraft}
            onResume={goToResumePlayback}
            onDeleteRequest={requestDelete}
          />
          <Section
            title="Saved"
            color="#F5C840"
            type="saved"
            items={saved}
            emptyMsg="لا يوجد مسابقات محفوظة بعد."
            onOpen={goToOpen}
            onPlay={goToPlay}
            onDeleteRequest={requestDelete}
          />
          <Section
            title="Completed"
            color="#4CAF82"
            type="completed"
            items={completed}
            emptyMsg="لا يوجد مسابقات مكتملة بعد."
            onOpen={goToOpen}
            onPlay={goToPlay}
            onDeleteRequest={requestDelete}
          />
        </main>
      </div>

      <ConfirmDeleteModal
        item={pendingDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
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
    overflowX: "hidden",
  },
  dots: {
    position: "fixed",
    inset: 0,
    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
    pointerEvents: "none",
    zIndex: 0,
  },

  // هيدر
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
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  adminLink: {
    background: "transparent",
    border: "1px solid #F5C840",
    borderRadius: "6px",
    padding: "6px 16px",
    color: "#F5C840",
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
  },
  userName: {
    color: "#A8C4E8",
    fontSize: "14px",
    fontWeight: 600,
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #2E5FA8",
    borderRadius: "6px",
    padding: "6px 16px",
    color: "#A8C4E8",
    fontSize: "13px",
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s",
  },

  // المحتوى
  main: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "32px 24px 60px",
    position: "relative",
    zIndex: 1,
  },

  // زر الإنشاء
  createRow: {
    marginBottom: "40px",
  },
  createBtn: {
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    border: "none",
    borderRadius: "10px",
    padding: "14px 32px",
    color: "#1A2A00",
    fontSize: "16px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "opacity 0.2s, transform 0.1s",
    boxShadow: "0 4px 20px rgba(232,160,32,0.35)",
  },
  createPlus: {
    fontSize: "22px",
    lineHeight: 1,
    fontWeight: 400,
  },

  // القسم
  section: {
    marginBottom: "40px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    paddingRight: "12px",
    borderRight: "3px solid",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 800,
    letterSpacing: "0.5px",
  },
  sectionCount: {
    background: "rgba(255,255,255,0.1)",
    color: "#A8C4E8",
    fontSize: "12px",
    fontWeight: 700,
    borderRadius: "20px",
    padding: "2px 10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "14px",
  },
  empty: {
    color: "rgba(168,196,232,0.45)",
    fontSize: "14px",
    padding: "20px 0",
  },

  // البطاقة
  card: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "12px",
    padding: "18px 20px",
    cursor: "default",
    transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
  },
  cardName: {
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "8px",
    lineHeight: 1.4,
  },
  cardMeta: {
    color: "#6A90B8",
    fontSize: "12px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "12px",
  },
  dot: {
    opacity: 0.5,
  },
  progressTrack: {
    width: "100%",
    height: "5px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "3px",
    marginBottom: "12px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #E8A020, #F5C840)",
    borderRadius: "3px",
  },
  pausedBadge: {
    display: "inline-block",
    background: "rgba(245,200,64,0.12)",
    color: "#F5C840",
    fontSize: "11px",
    fontWeight: 700,
    borderRadius: "5px",
    padding: "3px 10px",
    marginBottom: "12px",
  },
  cardActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  btnPlay: {
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    border: "none",
    borderRadius: "6px",
    padding: "7px 16px",
    color: "#1A2A00",
    fontSize: "13px",
    fontWeight: 800,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    flex: 1,
  },
  btnOpen: {
    background: "transparent",
    border: "1px solid #2E5FA8",
    borderRadius: "6px",
    padding: "7px 16px",
    color: "#A8C4E8",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    flex: 1,
  },
  btnDelete: {
    background: "transparent",
    border: "1px solid rgba(210,70,70,0.3)",
    borderRadius: "6px",
    padding: "7px 12px",
    color: "rgba(210,70,70,0.7)",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
  },

  // ── Modal تأكيد الحذف ──
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(8,16,32,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "24px",
  },
  modal: {
    width: "100%",
    maxWidth: "400px",
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "14px",
    padding: "32px 28px",
    direction: "rtl",
    fontFamily: "'Cairo', sans-serif",
    textAlign: "center",
    boxShadow: "0 16px 50px rgba(0,0,0,0.45)",
  },
  modalIconWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "16px",
  },
  modalIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "rgba(210,70,70,0.12)",
    border: "1.5px solid rgba(210,70,70,0.4)",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: "18px",
    fontWeight: 800,
    marginBottom: "10px",
  },
  modalText: {
    color: "#A8C4E8",
    fontSize: "14px",
    lineHeight: 1.7,
    marginBottom: "26px",
  },
  modalItemName: {
    color: "#F5C840",
    fontWeight: 700,
  },
  modalActions: {
    display: "flex",
    gap: "10px",
  },
  modalCancelBtn: {
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
  modalConfirmBtn: {
    flex: 1,
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
