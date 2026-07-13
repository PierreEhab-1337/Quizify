import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, updateUser, deleteUser } from "../services/userService";
import { register } from "../services/authService";

const ROLE_LABELS = { admin: "مدير", moderator: "مشرف", user: "مستخدم" };

// ════════════════════════════════════════════════════════════
// Modal إضافة مستخدم جديد
// ملحوظة: الباك اند مفيهوش endpoint لإنشاء مستخدم بـ role مخصص —
// بيستخدم /auth/register اللى بيعمل الحساب بـ role: "user" افتراضياً دايماً.
// ════════════════════════════════════════════════════════════
function AddUserModal({ onSave, onClose, saving }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("كل الحقول مطلوبة");
      return;
    }
    if (password.length < 8) {
      setError("كلمة المرور لازم تكون 8 حروف على الأقل");
      return;
    }
    onSave({ username: username.trim(), email: email.trim(), password });
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>إضافة مستخدم جديد</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {error && <div style={S.errorBox}>{error}</div>}

          <div style={S.fieldGroup}>
            <label style={S.label}>اسم المستخدم <span style={S.required}>*</span></label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              style={S.input}
              autoFocus
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>البريد الإلكتروني <span style={S.required}>*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="أدخل البريد الإلكتروني"
              style={S.input}
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>كلمة المرور <span style={S.required}>*</span></label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="8 أحرف على الأقل"
                style={{ ...S.input, paddingLeft: "56px" }}
              />
              <button style={S.eyeBtn} onClick={() => setShowPass((p) => !p)} tabIndex={-1}>
                {showPass ? "إخفاء" : "إظهار"}
              </button>
            </div>
          </div>

          <div style={S.infoBox}>
            الحساب الجديد هيتعمل بصلاحية "مستخدم" دايماً. لو محتاج ترفع صلاحيته لمشرف أو مدير، ده حالياً محتاج تدخّل مباشر على قاعدة البيانات.
          </div>
        </div>

        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose} disabled={saving}>إلغاء</button>
          <button style={{ ...S.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? "جارٍ الإضافة..." : "إضافة"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Modal تعديل username/email
// ════════════════════════════════════════════════════════════
function EditUserModal({ user, onSave, onClose, saving }) {
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");
    if (!username.trim() || !email.trim()) {
      setError("اسم المستخدم والبريد الإلكتروني مطلوبين");
      return;
    }
    onSave({ username: username.trim(), email: email.trim() });
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>تعديل: {user.username}</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {error && <div style={S.errorBox}>{error}</div>}

          <div style={S.fieldGroup}>
            <label style={S.label}>اسم المستخدم <span style={S.required}>*</span></label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={S.input}
              autoFocus
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>البريد الإلكتروني <span style={S.required}>*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={S.input}
            />
          </div>
        </div>

        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose} disabled={saving}>إلغاء</button>
          <button style={{ ...S.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ التعديل"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Modal تأكيد الحذف
// ════════════════════════════════════════════════════════════
function DeleteUserModal({ user, onConfirm, onClose, busy }) {
  if (!user) return null;
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>حذف مستخدم</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={S.deleteIconRow}>
            <div style={S.deleteIconCircle} />
            <div>
              <div style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "15px", marginBottom: "4px" }}>
                {user.username}
              </div>
              <div style={{ color: "#6A90B8", fontSize: "12px" }}>
                {ROLE_LABELS[user.role] || user.role}
              </div>
            </div>
          </div>

          <div style={{ ...S.infoBox, borderColor: "rgba(210,70,70,.3)", background: "rgba(210,70,70,.06)", color: "#E07878" }}>
            هيتم حذف الحساب نهائياً من قاعدة البيانات — الإجراء ده مش قابل للتراجع.
          </div>
        </div>

        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose} disabled={busy}>تراجع</button>
          <button style={{ ...S.deleteConfirmBtn, opacity: busy ? 0.6 : 1 }} onClick={onConfirm} disabled={busy}>
            {busy ? "جارٍ الحذف..." : "حذف المستخدم"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// كارت المستخدم
// ════════════════════════════════════════════════════════════
function UserCard({ user, disableDelete, disableDeleteReason, onEdit, onDelete }) {
  const [hover, setHover] = useState(false);

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
        <div style={S.avatarCircle}>
          <span style={S.avatarLetter}>{user.username?.[0]?.toUpperCase()}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.cardUsername}>{user.username}</div>
          <div style={{
            ...S.roleBadge,
            background: user.role === "admin" ? "rgba(245,200,64,.12)"
              : user.role === "moderator" ? "rgba(76,175,130,.12)"
              : "rgba(168,196,232,.1)",
            color: user.role === "admin" ? "#F5C840"
              : user.role === "moderator" ? "#4CAF82"
              : "#A8C4E8",
          }}>
            {ROLE_LABELS[user.role] || user.role}
          </div>
        </div>
      </div>

      <div style={S.emailRow}>
        <span style={S.emailLabel}>البريد الإلكتروني</span>
        <span style={S.emailValue}>{user.email}</span>
      </div>

      <div style={S.cardActions}>
        <button
          style={S.editBtn}
          onClick={() => onEdit(user)}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F5C840"; e.currentTarget.style.color = "#F5C840"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E5FA8"; e.currentTarget.style.color = "#A8C4E8"; }}
        >
          تعديل
        </button>
        <button
          style={{
            ...S.deleteBtn,
            opacity: disableDelete ? 0.35 : 1,
            cursor: disableDelete ? "not-allowed" : "pointer",
          }}
          onClick={() => !disableDelete && onDelete(user)}
          title={disableDelete ? disableDeleteReason : ""}
          onMouseEnter={(e) => { if (!disableDelete) { e.currentTarget.style.borderColor = "#D24646"; e.currentTarget.style.color = "#D24646"; } }}
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
export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(null); // null | "add" | { mode:"edit", user }
  const [delTarget, setDelTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const adminCount = useMemo(() => users.filter((u) => u.role === "admin").length, [users]);

  // ── إضافة ──────────────────────────────────────────────
  const handleAdd = async (payload) => {
    setSaving(true);
    setError("");
    try {
      await register(payload.username, payload.email, payload.password);
      setModal(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر إضافة المستخدم");
    } finally {
      setSaving(false);
    }
  };

  // ── تعديل ──────────────────────────────────────────────
  const handleEdit = async (payload) => {
    setSaving(true);
    setError("");
    try {
      await updateUser(modal.user.user_id, payload);
      setModal(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر حفظ التعديل");
    } finally {
      setSaving(false);
    }
  };

  // ── حذف ────────────────────────────────────────────────
  const handleDelete = async () => {
    setSaving(true);
    setError("");
    try {
      await deleteUser(delTarget.user_id);
      setDelTarget(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر حذف المستخدم");
    } finally {
      setSaving(false);
    }
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

          <div style={S.pageHeader}>
            <span style={S.pageTitle}>إدارة المستخدمين</span>
            <button
              style={S.addBtn}
              onClick={() => setModal("add")}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              + إضافة مستخدم
            </button>
          </div>

          <div style={S.summaryRow}>
            <div style={S.summaryCard}>
              <div style={S.summaryValue}>{users.length}</div>
              <div style={S.summaryLabel}>إجمالى المستخدمين</div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryValue}>{adminCount}</div>
              <div style={S.summaryLabel}>مديرين</div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryValue}>{users.length - adminCount}</div>
              <div style={S.summaryLabel}>باقى المستخدمين</div>
            </div>
          </div>

          {error && <div style={{ ...S.errorBox, marginBottom: "20px" }}>{error}</div>}

          {loading && <div style={S.emptyText}>جارِ تحميل المستخدمين...</div>}

          {!loading && users.length === 0 && !error && (
            <div style={S.emptyText}>لا يوجد مستخدمين</div>
          )}

          {!loading && users.length > 0 && (
            <div style={S.grid}>
              {users.map((u) => {
                const isSelf = currentUser?.user_id === u.user_id;
                const isLastAdmin = u.role === "admin" && adminCount === 1;
                const disableDelete = isSelf || isLastAdmin;
                const reason = isSelf ? "لا يمكنك حذف حسابك الخاص" : isLastAdmin ? "لا يمكن حذف المدير الوحيد" : "";
                return (
                  <UserCard
                    key={u.user_id}
                    user={u}
                    disableDelete={disableDelete}
                    disableDeleteReason={reason}
                    onEdit={(user) => setModal({ mode: "edit", user })}
                    onDelete={(user) => setDelTarget(user)}
                  />
                );
              })}
            </div>
          )}

        </div>
      </div>

      {modal === "add" && (
        <AddUserModal onSave={handleAdd} onClose={() => setModal(null)} saving={saving} />
      )}

      {modal && modal.mode === "edit" && (
        <EditUserModal user={modal.user} onSave={handleEdit} onClose={() => setModal(null)} saving={saving} />
      )}

      {delTarget && (
        <DeleteUserModal user={delTarget} onConfirm={handleDelete} onClose={() => setDelTarget(null)} busy={saving} />
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

  emptyText: {
    color: "#A8C4E8",
    fontSize: "15px",
    fontWeight: 600,
    textAlign: "center",
    padding: "40px 0",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "14px",
  },

  card: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatarCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarLetter: {
    color: "#1A2A00",
    fontSize: "18px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
  },
  cardUsername: {
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: 800,
    marginBottom: "4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  roleBadge: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: 700,
    borderRadius: "5px",
    padding: "2px 9px",
  },

  emailRow: {
    background: "#0F2040",
    borderRadius: "8px",
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  emailLabel: {
    fontSize: "10px",
    color: "#6A90B8",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  emailValue: {
    color: "#A8C4E8",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "'Cairo', sans-serif",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  cardActions: {
    display: "flex",
    gap: "8px",
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
    transition: "border-color 0.2s, color 0.2s",
  },

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
    border: "1.5px solid #2E5FA8",
    borderRadius: "8px",
    padding: "11px 14px",
    color: "#FFFFFF",
    fontSize: "14px",
    fontFamily: "'Cairo', sans-serif",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#6A90B8",
    fontSize: "11px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    padding: "0",
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
};
