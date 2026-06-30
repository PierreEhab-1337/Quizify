import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState(null);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setError("");
    setLoading(true);
    // Firebase auth goes here
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lemonada:wght@400;500;600;700&family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <div style={S.root}>
        {/* نقاط الخلفية */}
        <div style={S.dots} />

        {/* وهج مركزي */}
        <div style={S.glow} />

        <div style={S.wrapper}>

          {/* كارد العنوان الذهبي */}
          <div style={S.titleCard}>
            <div style={S.titleText}>أنت ونصيبك وحظك هايصيبك</div>
          </div>

          {/* كارد الفورم */}
          <div style={S.formCard}>
            <p style={S.subtitle}>سجّل دخولك للمتابعة</p>

            {/* Username */}
            <div style={S.fieldGroup}>
              <label style={{
                ...S.label,
                color: focus === "u" ? "#F5C840" : "#A8C4E8",
              }}>
                اسم المستخدم
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="أدخل اسم المستخدم"
                style={{
                  ...S.input,
                  borderColor: focus === "u" ? "#F5C840" : "#2E5FA8",
                }}
                onFocus={() => setFocus("u")}
                onBlur={() => setFocus(null)}
              />
            </div>

            {/* Password */}
            <div style={{ ...S.fieldGroup, marginBottom: "28px" }}>
              <label style={{
                ...S.label,
                color: focus === "p" ? "#F5C840" : "#A8C4E8",
              }}>
                كلمة المرور
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="أدخل كلمة المرور"
                  style={{
                    ...S.input,
                    paddingLeft: "56px",
                    borderColor: focus === "p" ? "#F5C840" : "#2E5FA8",
                  }}
                  onFocus={() => setFocus("p")}
                  onBlur={() => setFocus(null)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  style={S.toggleBtn}
                >
                  {showPassword ? "إخفاء" : "إظهار"}
                </button>
              </div>
            </div>

            {/* خطأ */}
            {error && (
              <div style={S.errorBox}>{error}</div>
            )}

            {/* زر الدخول */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                ...S.submitBtn,
                opacity: loading ? 0.75 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = loading ? "0.75" : "1"; }}
              onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {loading ? "جارى الدخول..." : "دخول"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

const S = {
  root: {
    minHeight: "100vh",
    background: "#1A4F9C",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    direction: "rtl",
    fontFamily: "'Cairo', sans-serif",
    padding: "24px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
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
    width: "600px",
    height: "500px",
    background: "radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 65%)",
    pointerEvents: "none",
  },
  wrapper: {
    width: "100%",
    maxWidth: "440px",
    zIndex: 1,
  },
  titleCard: {
    background: "linear-gradient(145deg, #E8A020, #F5C840, #E8A020)",
    borderRadius: "18px",
    padding: "28px 32px",
    textAlign: "center",
    marginBottom: "16px",
    boxShadow: "0 8px 32px rgba(232,160,32,0.4)",
  },
  titleText: {
    fontFamily: "'Lemonada', cursive",
    fontSize: "30px",
    fontWeight: 700,
    color: "#1A2A00",
    lineHeight: 1.4,
  },
  formCard: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "14px",
    padding: "32px 28px",
  },
  subtitle: {
    color: "#A8C4E8",
    fontSize: "13px",
    fontWeight: 400,
    textAlign: "center",
    margin: "0 0 28px",
  },
  fieldGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "7px",
    transition: "color 0.2s",
  },
  input: {
    width: "100%",
    background: "#0F2040",
    border: "1.5px solid #2E5FA8",
    borderRadius: "8px",
    padding: "11px 14px",
    color: "#FFFFFF",
    fontSize: "15px",
    fontFamily: "'Cairo', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  toggleBtn: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#5A80A8",
    fontSize: "10px",
    fontFamily: "'Cairo', sans-serif",
    fontWeight: 700,
    letterSpacing: "1px",
    cursor: "pointer",
    padding: 0,
  },
  errorBox: {
    background: "rgba(210,70,70,0.1)",
    border: "1px solid rgba(210,70,70,0.3)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#E07878",
    fontSize: "13px",
    marginBottom: "20px",
    textAlign: "center",
    lineHeight: 1.6,
  },
  submitBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    border: "none",
    borderRadius: "8px",
    padding: "13px",
    color: "#1A2A00",
    fontSize: "16px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
    transition: "opacity 0.2s, transform 0.1s",
    letterSpacing: "0.5px",
  },
};
