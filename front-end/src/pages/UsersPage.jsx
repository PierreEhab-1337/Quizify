import { useState, useMemo } from "react";

// ════════════════════════════════════════════════════════════
// بيانات تجريبية — تُستبدل بـ Firestore عند الربط
// ════════════════════════════════════════════════════════════
const SAMPLE_USERS = [
  { id: 1, username: "Admin1", password: "Admin1@2026", role: "admin" },
  { id: 2, username: "User1",  password: "User1@2026",  role: "user"  },
  { id: 3, username: "User2",  password: "User2@2026",  role: "user"  },
  { id: 4, username: "User3",  password: "User3@2026",  role: "user"  },
];

// ════════════════════════════════════════════════════════════
// Modal إضافة / تعديل المستخدم
// ════════════════════════════════════════════════════════════
function UserModal({ mode, initial, existingUsernames, onSave, onClose }) {
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState(initial?.password || "");
  const [role,     setRole]     = useState(initial?.role     || "user");
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({});

  const validate = () => {
    const e = {};
    const trimUser = username.trim();
    const trimPass = password.trim();
    if (!trimUser) e.username = "اسم المستخدم مطلوب";
    else if (
      existingUsernames
        .filter((n) => n !== initial?.username)
        .includes(trimUser)
    ) e.username = "اسم المستخدم موجود بالفعل";
    if (!trimPass) e.password = "كلمة المرور مطلوبة";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ username: username.trim(), password: password.trim(), role });
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>

        <div style={S.modalHeader}>
          <span style={S.modalTitle}>
            {mode === "add" ? "إضافة مستخدم جديد" : `تعديل: ${initial.username}`}
          </span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* اسم المستخدم */}
          <div style={S.fieldGroup}>
            <label style={S.label}>اسم المستخدم <span style={S.required}>*</span></label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setErrors((p) => ({ ...p, username: "" })); }}
              placeholder="أدخل اسم المستخدم"
              style={{ ...S.input, borderColor: errors.username ? "#D24646" : "#2E5FA8" }}
              autoFocus
            />
            {errors.username && <span style={S.errorText}>{errors.username}</span>}
          </div>

          {/* كلمة المرور */}
          <div style={S.fieldGroup}>
            <label style={S.label}>كلمة المرور <span style={S.required}>*</span></label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="أدخل كلمة المرور"
                style={{
                  ...S.input,
                  borderColor: errors.password ? "#D24646" : "#2E5FA8",
                  paddingLeft: "44px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              <button
                style={S.eyeBtn}
                onClick={() => setShowPass((p) => !p)}
                tabIndex={-1}
              >
                {showPass ? "إخفاء" : "إظهار"}
              </button>
            </div>
            {errors.password && <span style={S.errorText}>{errors.password}</span>}
          </div>

          {/* الدور */}
          <div style={S.fieldGroup}>
            <label style={S.label}>الصلاحية</label>
            <div style={S.roleRow}>
              {["user", "admin"].map((r) => (
                <div
                  key={r}
                  style={{
                    ...S.roleOption,
                    borderColor: role === r ? "#F5C840" : "#2E5FA8",
                    background:  role === r ? "rgba(245,200,64,.06)" : "transparent",
                  }}
                  onClick={() => setRole(r)}
                >
                  <div style={{ ...S.radio, borderColor: role === r ? "#F5C840" : "#2E5FA8" }}>
                    {role === r && <div style={S.radioDot} />}
                  </div>
                  <span style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 700 }}>
                    {r === "admin" ? "مدير" : "مستخدم"}
                  </span>
                </div>
              ))}
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
            {mode === "add" ? "إضافة" : "حفظ التعديل"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Modal تأكيد الحذف
// ════════════════════════════════════════════════════════════
function DeleteUserModal({ user, onConfirm, onClose }) {
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
                {user.role === "admin" ? "مدير" : "مستخدم"}
              </div>
            </div>
          </div>

          <div style={{ ...S.infoBox, borderColor: "rgba(210,70,70,.3)", background: "rgba(210,70,70,.06)", color: "#E07878" }}>
            سيتم منع هذا المستخدم من تسجيل الدخول. بياناته ومسابقاته ستنتقل إلى النظام وتظل متاحة للأدمن.
          </div>
        </div>

        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose}>تراجع</button>
          <button
            style={S.deleteConfirmBtn}
            onClick={onConfirm}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            حذف المستخدم
          </button>
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// كارت المستخدم
// ════════════════════════════════════════════════════════════
function UserCard({ user, isOnlyAdmin, onEdit, onDelete }) {
  const [hover,    setHover]    = useState(false);
  const [showPass, setShowPass] = useState(false);
  const canDelete = !(user.role === "admin" && isOnlyAdmin);

  return (
    <div
      style={{
        ...S.card,
        borderColor: hover ? "#F5C840" : "#2E5FA8",
        transform:   hover ? "translateY(-2px)" : "none",
        boxShadow:   hover ? "0 6px 24px rgba(0,0,0,.3)" : "0 2px 8px rgba(0,0,0,.15)",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* الهيدر */}
      <div style={S.cardTop}>
        <div style={S.avatarCircle}>
          <span style={S.avatarLetter}>{user.username[0]}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.cardUsername}>{user.username}</div>
          <div style={{
            ...S.roleBadge,
            background: user.role === "admin"
              ? "rgba(245,200,64,.12)"
              : "rgba(168,196,232,.1)",
            color: user.role === "admin" ? "#F5C840" : "#A8C4E8",
          }}>
            {user.role === "admin" ? "مدير" : "مستخدم"}
          </div>
        </div>
      </div>

      {/* كلمة المرور */}
      <div style={S.passRow}>
        <span style={S.passLabel}>كلمة المرور</span>
        <div style={S.passValueRow}>
          <span style={{ ...S.passValue, letterSpacing: showPass ? "0" : "2px" }}>
            {showPass ? user.password : "••••••••"}
          </span>
          <button
            style={S.togglePassBtn}
            onClick={() => setShowPass((p) => !p)}
          >
            {showPass ? "إخفاء" : "إظهار"}
          </button>
        </div>
      </div>

      {/* أزرار */}
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
            opacity: canDelete ? 1 : 0.35,
            cursor:  canDelete ? "pointer" : "not-allowed",
          }}
          onClick={() => canDelete && onDelete(user)}
          title={!canDelete ? "لا يمكن حذف المدير الوحيد" : ""}
          onMouseEnter={(e) => { if (canDelete) { e.currentTarget.style.borderColor = "#D24646"; e.currentTarget.style.color = "#D24646"; } }}
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
  const [users,     setUsers]     = useState(SAMPLE_USERS);
  const [modal,     setModal]     = useState(null); // null | "add" | { mode:"edit", user }
  const [delTarget, setDelTarget] = useState(null);

  const adminCount    = useMemo(() => users.filter((u) => u.role === "admin").length, [users]);
  const existingNames = users.map((u) => u.username);

  // ── إضافة ──────────────────────────────────────────────
  const handleAdd = (data) => {
    setUsers((prev) => [...prev, { id: Date.now(), ...data }]);
    setModal(null);
  };

  // ── تعديل ──────────────────────────────────────────────
  const handleEdit = (data) => {
    setUsers((prev) =>
      prev.map((u) => u.id === modal.user.id ? { ...u, ...data } : u)
    );
    setModal(null);
  };

  // ── حذف ────────────────────────────────────────────────
  const handleDelete = () => {
    setUsers((prev) => prev.filter((u) => u.id !== delTarget.id));
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

          {/* ── ملخص ── */}
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
              <div style={S.summaryLabel}>مستخدمين</div>
            </div>
          </div>

          {/* ── الجريد ── */}
          <div style={S.grid}>
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isOnlyAdmin={adminCount === 1}
                onEdit={(u) => setModal({ mode: "edit", user: u })}
                onDelete={(u) => setDelTarget(u)}
              />
            ))}
          </div>

        </div>
      </div>

      {/* ── Modals ── */}
      {modal === "add" && (
        <UserModal
          mode="add"
          initial={null}
          existingUsernames={existingNames}
          onSave={handleAdd}
          onClose={() => setModal(null)}
        />
      )}

      {modal && modal.mode === "edit" && (
        <UserModal
          mode="edit"
          initial={modal.user}
          existingUsernames={existingNames}
          onSave={handleEdit}
          onClose={() => setModal(null)}
        />
      )}

      {delTarget && (
        <DeleteUserModal
          user={delTarget}
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

  // جريد
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

  // كلمة المرور
  passRow: {
    background: "#0F2040",
    borderRadius: "8px",
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  passLabel: {
    fontSize: "10px",
    color: "#6A90B8",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  passValueRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  passValue: {
    color: "#A8C4E8",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "'Cairo', sans-serif",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  togglePassBtn: {
    background: "none",
    border: "none",
    color: "#6A90B8",
    fontSize: "11px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    padding: "0",
    flexShrink: 0,
  },

  // أزرار الكارت
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
  roleRow: {
    display: "flex",
    gap: "10px",
  },
  roleOption: {
    flex: 1,
    border: "1.5px solid",
    borderRadius: "9px",
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
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
