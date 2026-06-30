import { useEffect, useState } from "react";

export default function EndPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lemonada:wght@400;500;600;700&family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <div style={S.root}>
        {/* خلفية النقاط */}
        <div style={S.dots} />

        {/* وهج مركزي خفيف */}
        <div style={S.glow} />

        {/* المحتوى المركزي */}
        <div style={{
          ...S.center,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(28px)",
        }}>

          {/* الشعار */}
          <div style={S.logoCard}>
            <span style={S.logoText}>أنت ونصيبك وحظك هايصيبك</span>
          </div>

          {/* الصليب */}
          <div style={S.crossWrap}>
            {/* الجذع العمودي */}
            <div style={S.crossVertical} />
            {/* الذراع الأفقي */}
            <div style={S.crossHorizontal} />
            {/* توهج خفيف حول الصليب */}
            <div style={S.crossGlow} />
          </div>

          {/* النص الختامي */}
          <p style={S.closingText}>وبهذا تنتهى فقرتنا لهذا اليوم</p>

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
    width: "700px",
    height: "700px",
    background: "radial-gradient(ellipse, rgba(245,200,64,0.07) 0%, transparent 65%)",
    pointerEvents: "none",
  },

  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0px",
    zIndex: 1,
    transition: "opacity 0.8s ease, transform 0.8s ease",
  },

  // الشعار
  logoCard: {
    background: "linear-gradient(145deg, #E8A020, #F5C840, #E8A020)",
    borderRadius: "18px",
    padding: "20px 40px",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(232,160,32,0.4)",
    marginBottom: "56px",
  },
  logoText: {
    fontFamily: "'Lemonada', cursive",
    fontSize: "clamp(18px, 2.8vw, 28px)",
    fontWeight: 700,
    color: "#1A2A00",
    lineHeight: 1.4,
  },

  // الصليب
  crossWrap: {
    position: "relative",
    width: "120px",
    height: "160px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "52px",
  },
  crossVertical: {
    position: "absolute",
    width: "22px",
    height: "160px",
    background: "linear-gradient(180deg, #E8A020, #F5C840, #E8A020)",
    borderRadius: "6px",
    boxShadow: "0 0 24px rgba(245,200,64,0.5)",
  },
  crossHorizontal: {
    position: "absolute",
    width: "120px",
    height: "22px",
    top: "44px",
    background: "linear-gradient(90deg, #E8A020, #F5C840, #E8A020)",
    borderRadius: "6px",
    boxShadow: "0 0 24px rgba(245,200,64,0.5)",
  },
  crossGlow: {
    position: "absolute",
    width: "180px",
    height: "220px",
    background: "radial-gradient(ellipse, rgba(245,200,64,0.18) 0%, transparent 65%)",
    pointerEvents: "none",
  },

  // النص الختامي
  closingText: {
    fontFamily: "'Cairo', sans-serif",
    fontSize: "clamp(18px, 2.4vw, 26px)",
    fontWeight: 700,
    color: "#A8C4E8",
    textAlign: "center",
    margin: 0,
    letterSpacing: "0.3px",
    lineHeight: 1.6,
  },
};
