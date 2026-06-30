// ════════════════════════════════════════════════════════════
// DashboardPage.jsx — Admin فقط
// البيانات هنا تجريبية — تُستبدل بـ Firestore queries عند الربط
// ════════════════════════════════════════════════════════════

const SAMPLE_STATS = {
  totalQuestions: 248,
  totalCategories: 8,
  totalContests: 34,
  totalUsers: 4,

  byCategory: [
    { name: "مسيحية", count: 52 },
    { name: "قديسين", count: 41 },
    { name: "ماث وألغاز", count: 38 },
    { name: "كورة", count: 34 },
    { name: "جغرافيا", count: 30 },
    { name: "تكنولوجيا وعلوم", count: 27 },
    { name: "مناسبات دينية", count: 16 },
    { name: "عبثيات", count: 10 },
  ],

  contestsByStatus: { completed: 21, saved: 9, drafts: 4 },

  questionsByType: [
    { label: "نص + اختيارات", count: 112 },
    { label: "نص فقط", count: 74 },
    { label: "نص + صور + اختيارات", count: 38 },
    { label: "نص + صور", count: 24 },
  ],

  users: [
    { name: "Admin1", role: "Admin", total: 18, completed: 14, drafts: 2 },
    { name: "User1",  role: "User",  total: 8,  completed: 5,  drafts: 1 },
    { name: "User2",  role: "User",  total: 5,  completed: 2,  drafts: 2 },
    { name: "User3",  role: "User",  total: 3,  completed: 0,  drafts: 1 },
  ],
};

export default function DashboardPage() {
  const d = SAMPLE_STATS;
  const maxCat = Math.max(...d.byCategory.map((c) => c.count));
  const total = d.contestsByStatus.completed + d.contestsByStatus.saved + d.contestsByStatus.drafts;

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

          {/* ── هيدر ── */}
          <div style={S.header}>
            <span style={S.headerText}>لوحة الإحصائيات</span>
          </div>

          {/* ── الكروت الأربعة ── */}
          <div style={S.statsRow}>
            {[
              { label: "إجمالي الأسئلة", value: d.totalQuestions, sub: "سؤال في البنك" },
              { label: "التصنيفات",       value: d.totalCategories, sub: "تصنيف نشط" },
              { label: "المسابقات",        value: d.totalContests,  sub: "منذ البداية" },
              { label: "المستخدمون",       value: d.totalUsers,     sub: "Admin + Users" },
            ].map((s) => (
              <div key={s.label} style={S.statCard}>
                <div style={S.statLabel}>{s.label}</div>
                <div style={S.statValue}>{s.value}</div>
                <div style={S.statSub}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── الصف الثاني: تصنيفات + حالة المسابقات ── */}
          <div style={S.twoCol}>

            {/* الأسئلة حسب التصنيف */}
            <div style={S.card}>
              <div style={S.cardTitle}>الأسئلة حسب التصنيف</div>
              <div>
                {d.byCategory.map((c) => (
                  <div key={c.name} style={S.barRow}>
                    <div style={S.barLabel}>{c.name}</div>
                    <div style={S.barTrack}>
                      <div
                        style={{
                          ...S.barFill,
                          width: `${Math.round((c.count / maxCat) * 100)}%`,
                        }}
                      />
                    </div>
                    <div style={S.barCount}>{c.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* الحالة + أنواع الأسئلة */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* حالة المسابقات */}
              <div style={S.card}>
                <div style={S.cardTitle}>المسابقات حسب الحالة</div>
                {[
                  { label: "مكتملة", count: d.contestsByStatus.completed, color: "#4CAF82" },
                  { label: "محفوظة", count: d.contestsByStatus.saved,     color: "#F5C840" },
                  { label: "مسودات", count: d.contestsByStatus.drafts,    color: "#2E5FA8" },
                ].map((s) => (
                  <div key={s.label} style={{ marginBottom: "14px" }}>
                    <div style={S.progressHeader}>
                      <span style={{ color: "#A8C4E8", fontSize: "13px" }}>{s.label}</span>
                      <span style={{ color: s.color, fontWeight: 800, fontSize: "13px" }}>{s.count}</span>
                    </div>
                    <div style={S.progressTrack}>
                      <div
                        style={{
                          ...S.progressFill,
                          width: `${Math.round((s.count / total) * 100)}%`,
                          background: s.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* أنواع الأسئلة */}
              <div style={S.card}>
                <div style={S.cardTitle}>أنواع الأسئلة</div>
                <div style={S.typeGrid}>
                  {d.questionsByType.map((t) => (
                    <div key={t.label} style={S.typeCell}>
                      <div style={S.typeSub}>{t.label}</div>
                      <div style={S.typeValue}>{t.count}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── جدول المستخدمين ── */}
          <div style={S.card}>
            <div style={S.cardTitle}>نشاط المستخدمين</div>
            <table style={S.table}>
              <thead>
                <tr>
                  {["المستخدم", "إجمالي المسابقات", "مكتملة", "مسودات", "الحالة"].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.users.map((u) => (
                  <tr key={u.name} style={S.tr}>
                    <td style={S.td}>
                      <span style={{ color: "#FFFFFF", fontWeight: 700 }}>{u.name}</span>
                      <span
                        style={{
                          ...S.roleBadge,
                          color:      u.role === "Admin" ? "#F5C840" : "#6A90B8",
                          background: u.role === "Admin" ? "rgba(245,200,64,.12)" : "rgba(106,144,184,.12)",
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ ...S.td, textAlign: "center", color: "#FFFFFF", fontWeight: 800 }}>{u.total}</td>
                    <td style={{ ...S.td, textAlign: "center", color: "#4CAF82", fontWeight: 800 }}>{u.completed}</td>
                    <td style={{ ...S.td, textAlign: "center", color: "#5A80A8", fontWeight: 800 }}>{u.drafts}</td>
                    <td style={{ ...S.td, textAlign: "center" }}>
                      <span style={S.activeBadge}>نشط</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
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
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 28px 0",
  },

  // هيدر
  header: {
    background: "linear-gradient(145deg, #E8A020, #F5C840, #E8A020)",
    borderRadius: "18px",
    padding: "20px 32px",
    textAlign: "center",
    boxShadow: "0 6px 0 #B87A10",
    marginBottom: "32px",
  },
  headerText: {
    fontFamily: "'Lemonada', cursive",
    fontSize: "22px",
    fontWeight: 700,
    color: "#1A2A00",
  },

  // كروت الأرقام
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "16px",
  },
  statCard: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "14px",
    padding: "24px 20px",
    textAlign: "center",
    boxShadow: "0 4px 0 #0A1A38",
  },
  statLabel: {
    fontSize: "13px",
    color: "#A8C4E8",
    fontWeight: 600,
    marginBottom: "10px",
  },
  statValue: {
    fontSize: "40px",
    fontWeight: 900,
    color: "#F5C840",
    lineHeight: 1,
  },
  statSub: {
    fontSize: "11px",
    color: "#6A90B8",
    marginTop: "6px",
  },

  // عمودان
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },

  // كارد عام
  card: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "14px",
    padding: "24px 20px",
    boxShadow: "0 4px 0 #0A1A38",
  },
  cardTitle: {
    fontSize: "14px",
    color: "#A8C4E8",
    fontWeight: 700,
    marginBottom: "18px",
    paddingBottom: "12px",
    borderBottom: "1px solid #2E5FA8",
  },

  // بارات التصنيف
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  barLabel: {
    minWidth: "110px",
    fontSize: "12px",
    color: "#A8C4E8",
    textAlign: "right",
  },
  barTrack: {
    flex: 1,
    background: "#0F2040",
    borderRadius: "5px",
    height: "9px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #E8A020, #F5C840)",
    borderRadius: "5px",
    transition: "width 0.4s ease",
  },
  barCount: {
    minWidth: "28px",
    fontSize: "12px",
    color: "#F5C840",
    fontWeight: 800,
  },

  // progress
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
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
    transition: "width 0.4s ease",
  },

  // أنواع الأسئلة
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  typeCell: {
    background: "#0F2040",
    borderRadius: "10px",
    padding: "12px 14px",
  },
  typeSub: {
    fontSize: "11px",
    color: "#6A90B8",
    marginBottom: "4px",
  },
  typeValue: {
    fontSize: "22px",
    fontWeight: 900,
    color: "#F5C840",
  },

  // جدول
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    color: "#6A90B8",
    padding: "6px 10px",
    fontWeight: 700,
    textAlign: "right",
  },
  tr: {
    borderTop: "1px solid rgba(46,95,168,.35)",
  },
  td: {
    padding: "10px",
    color: "#A8C4E8",
  },
  roleBadge: {
    fontSize: "10px",
    marginRight: "6px",
    padding: "2px 7px",
    borderRadius: "4px",
    fontWeight: 700,
  },
  activeBadge: {
    fontSize: "11px",
    color: "#4CAF82",
    background: "rgba(76,175,130,.12)",
    padding: "3px 10px",
    borderRadius: "5px",
  },
};
