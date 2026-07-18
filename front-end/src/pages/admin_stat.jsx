import { useState, useEffect, useCallback, useMemo } from "react";
import { getAllUsers } from "../services/userService";
import { getCategories } from "../services/categoryService";
import { getQuestions } from "../services/questionService";
import { getAllContestsAdmin } from "../services/contestService";

const QUESTION_TYPE_LABELS = {
  singleChoice: "اختيار واحد",
  multiChoice: "اختيار متعدد",
  openEnded: "إجابة مفتوحة",
};

const STATUS_LABELS = {
  completed: "مكتملة",
  inProgress: "شغّالة دلوقتى",
  saved: "محفوظة",
  draft: "مسودات",
};

const STATUS_COLORS = {
  completed: "#4CAF82",
  inProgress: "#F5C840",
  saved: "#378ADD",
  draft: "#2E5FA8",
};

const ROLE_LABELS = { admin: "مدير", moderator: "مشرف", user: "مستخدم" };

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [u, c, q, ct] = await Promise.all([
        getAllUsers(),
        getCategories(),
        getQuestions(),
        getAllContestsAdmin(),
      ]);
      setUsers(u);
      setCategories(c);
      setQuestions(q);
      setContests(ct);
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر تحميل الإحصائيات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── تجميع البيانات ────────────────────────────────────────
  const byCategory = useMemo(
    () =>
      [...categories]
        .map((c) => ({ name: c.category_type, count: Number(c.question_count) || 0 }))
        .sort((a, b) => b.count - a.count),
    [categories]
  );
  const maxCat = Math.max(1, ...byCategory.map((c) => c.count));

  const questionsByType = useMemo(() => {
    const counts = { singleChoice: 0, multiChoice: 0, openEnded: 0 };
    for (const q of questions) {
      if (counts[q.question_type] !== undefined) counts[q.question_type]++;
    }
    return Object.entries(counts).map(([type, count]) => ({
      label: QUESTION_TYPE_LABELS[type],
      count,
    }));
  }, [questions]);

  const contestsByStatus = useMemo(() => {
    const counts = { draft: 0, saved: 0, inProgress: 0, completed: 0 };
    for (const c of contests) {
      if (counts[c.status] !== undefined) counts[c.status]++;
    }
    return counts;
  }, [contests]);
  const totalContestsForBar = Math.max(1, contests.length);

  const usersActivity = useMemo(() => {
    const byUser = {};
    for (const c of contests) {
      const uid = c.user_id;
      if (!byUser[uid]) byUser[uid] = { total: 0, completed: 0, inProgress: 0 };
      byUser[uid].total++;
      if (c.status === "completed") byUser[uid].completed++;
      if (c.status === "inProgress") byUser[uid].inProgress++;
    }
    return users
      .map((u) => ({
        user_id: u.user_id,
        name: u.username,
        role: u.role,
        total: byUser[u.user_id]?.total || 0,
        completed: byUser[u.user_id]?.completed || 0,
        inProgress: byUser[u.user_id]?.inProgress || 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [users, contests]);

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
            <span style={S.headerText}>لوحة الإحصائيات</span>
          </div>

          {error && <div style={S.errorBox}>{error}</div>}

          {loading && <div style={S.emptyText}>جارِ تحميل الإحصائيات...</div>}

          {!loading && !error && (
            <>
              {/* ── الكروت الأربعة ── */}
              <div style={S.statsRow}>
                {[
                  { label: "إجمالي الأسئلة", value: questions.length, sub: "سؤال في البنك" },
                  { label: "التصنيفات", value: categories.length, sub: "تصنيف نشط" },
                  { label: "المسابقات", value: contests.length, sub: "منذ البداية" },
                  { label: "المستخدمون", value: users.length, sub: "كل الصلاحيات" },
                ].map((s) => (
                  <div key={s.label} style={S.statCard}>
                    <div style={S.statLabel}>{s.label}</div>
                    <div style={S.statValue}>{s.value}</div>
                    <div style={S.statSub}>{s.sub}</div>
                  </div>
                ))}
              </div>

              <div style={S.twoCol}>

                {/* الأسئلة حسب التصنيف */}
                <div style={S.card}>
                  <div style={S.cardTitle}>الأسئلة حسب التصنيف</div>
                  {byCategory.length === 0 ? (
                    <div style={S.mutedText}>لا توجد تصنيفات بعد</div>
                  ) : (
                    <div>
                      {byCategory.map((c) => (
                        <div key={c.name} style={S.barRow}>
                          <div style={S.barLabel}>{c.name}</div>
                          <div style={S.barTrack}>
                            <div style={{ ...S.barFill, width: `${Math.round((c.count / maxCat) * 100)}%` }} />
                          </div>
                          <div style={S.barCount}>{c.count}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                  {/* حالة المسابقات */}
                  <div style={S.card}>
                    <div style={S.cardTitle}>المسابقات حسب الحالة</div>
                    {contests.length === 0 ? (
                      <div style={S.mutedText}>لا توجد مسابقات بعد</div>
                    ) : (
                      Object.entries(contestsByStatus).map(([status, count]) => (
                        <div key={status} style={{ marginBottom: "14px" }}>
                          <div style={S.progressHeader}>
                            <span style={{ color: "#A8C4E8", fontSize: "13px" }}>{STATUS_LABELS[status]}</span>
                            <span style={{ color: STATUS_COLORS[status], fontWeight: 800, fontSize: "13px" }}>{count}</span>
                          </div>
                          <div style={S.progressTrack}>
                            <div
                              style={{
                                ...S.progressFill,
                                width: `${Math.round((count / totalContestsForBar) * 100)}%`,
                                background: STATUS_COLORS[status],
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* أنواع الأسئلة */}
                  <div style={S.card}>
                    <div style={S.cardTitle}>أنواع الأسئلة</div>
                    <div style={S.typeGrid}>
                      {questionsByType.map((t) => (
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
                {usersActivity.length === 0 ? (
                  <div style={S.mutedText}>لا يوجد مستخدمين</div>
                ) : (
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {["المستخدم", "إجمالي المسابقات", "مكتملة", "شغّالة دلوقتى"].map((h) => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {usersActivity.map((u) => (
                        <tr key={u.user_id} style={S.tr}>
                          <td style={S.td}>
                            <span style={{ color: "#FFFFFF", fontWeight: 700 }}>{u.name}</span>
                            <span
                              style={{
                                ...S.roleBadge,
                                color: u.role === "admin" ? "#F5C840" : "#6A90B8",
                                background: u.role === "admin" ? "rgba(245,200,64,.12)" : "rgba(106,144,184,.12)",
                              }}
                            >
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </td>
                          <td style={{ ...S.td, textAlign: "center", color: "#FFFFFF", fontWeight: 800 }}>{u.total}</td>
                          <td style={{ ...S.td, textAlign: "center", color: "#4CAF82", fontWeight: 800 }}>{u.completed}</td>
                          <td style={{ ...S.td, textAlign: "center", color: "#F5C840", fontWeight: 800 }}>{u.inProgress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

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

  emptyText: {
    color: "#A8C4E8",
    fontSize: "15px",
    fontWeight: 600,
    textAlign: "center",
    padding: "40px 0",
  },
  mutedText: {
    color: "#6A90B8",
    fontSize: "13px",
    textAlign: "center",
    padding: "12px 0",
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

  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },

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
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
};
