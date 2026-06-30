import { useState, useRef } from "react";

// ════════════════════════════════════════════════════════════
// بيانات تجريبية — تُستبدل بـ Firestore عند الربط
// ════════════════════════════════════════════════════════════
const MOCK_COUNTS = {
  questions:   248,
  categories:    8,
  users:         4,
  contests:     17,
};

// ════════════════════════════════════════════════════════════
// Modal اختيار صيغة التصدير
// ════════════════════════════════════════════════════════════
function ExportFormatModal({ section, onExport, onClose }) {
  const [format, setFormat] = useState("json");

  const formats = [
    { id: "json",  label: "JSON",  desc: "مناسب للنسخ الاحتياطي واستعادة البيانات" },
    { id: "excel", label: "Excel", desc: "مناسب للمراجعة والتعديل خارج النظام"     },
  ];

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>

        <div style={S.modalHeader}>
          <span style={S.modalTitle}>تصدير {section.label}</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ color: "#A8C4E8", fontSize: "13px", marginBottom: "4px" }}>
            اختر صيغة الملف المطلوبة:
          </div>
          {formats.map((f) => (
            <div
              key={f.id}
              style={{
                ...S.formatOption,
                borderColor: format === f.id ? "#F5C840" : "#2E5FA8",
                background:  format === f.id ? "rgba(245,200,64,.06)" : "transparent",
              }}
              onClick={() => setFormat(f.id)}
            >
              <div style={{ ...S.radio, borderColor: format === f.id ? "#F5C840" : "#2E5FA8" }}>
                {format === f.id && <div style={S.radioDot} />}
              </div>
              <div>
                <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "14px" }}>{f.label}</div>
                <div style={{ color: "#6A90B8", fontSize: "12px", marginTop: "2px" }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={onClose}>إلغاء</button>
          <button
            style={S.saveBtn}
            onClick={() => onExport(format)}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            تصدير
          </button>
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Modal نتيجة الاستيراد
// ════════════════════════════════════════════════════════════
function ImportResultModal({ result, onClose }) {
  if (!result) return null;
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>

        <div style={S.modalHeader}>
          <span style={S.modalTitle}>نتيجة الاستيراد</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>

          <div style={{ color: "#A8C4E8", fontSize: "13px" }}>
            تم معالجة الملف بنجاح. ملخص العملية:
          </div>

          <div style={S.resultGrid}>
            <div style={S.resultItem}>
              <div style={{ ...S.resultVal, color: "#4CAF82" }}>{result.added}</div>
              <div style={S.resultLbl}>تمت إضافته</div>
            </div>
            <div style={S.resultItem}>
              <div style={{ ...S.resultVal, color: "#F5C840" }}>{result.skipped}</div>
              <div style={S.resultLbl}>تم تجاهله</div>
            </div>
            <div style={S.resultItem}>
              <div style={{ ...S.resultVal, color: "#D24646" }}>{result.failed}</div>
              <div style={S.resultLbl}>فشل في الاستيراد</div>
            </div>
          </div>

          {result.skipped > 0 && (
            <div style={S.infoBox}>
              العناصر المتجاهلة موجودة بالفعل في النظام ولم يتم تعديلها.
            </div>
          )}
          {result.failed > 0 && (
            <div style={{ ...S.infoBox, borderColor: "rgba(210,70,70,.3)", background: "rgba(210,70,70,.06)", color: "#E07878" }}>
              بعض العناصر لم يتم استيرادها بسبب بيانات غير صالحة أو مفقودة.
            </div>
          )}

        </div>

        <div style={S.modalFooter}>
          <button
            style={{ ...S.saveBtn, flex: 1 }}
            onClick={onClose}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            حسناً
          </button>
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// سيكشن واحد (Export + Import)
// ════════════════════════════════════════════════════════════
function DataSection({ section, counts, onExportClick, onImportDone }) {
  const fileRef   = useRef(null);
  const [loading, setLoading] = useState(false); // "import"

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading("import");
    // محاكاة معالجة الملف — تُستبدل بالمنطق الحقيقي عند ربط Firestore
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    e.target.value = "";
    onImportDone({
      added:   Math.floor(Math.random() * 20) + 5,
      skipped: Math.floor(Math.random() * 5),
      failed:  Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0,
    });
  };

  return (
    <div style={S.section}>

      {/* معلومات */}
      <div style={S.sectionInfo}>
        <div style={S.sectionIcon}>{section.icon}</div>
        <div>
          <div style={S.sectionLabel}>{section.label}</div>
          <div style={S.sectionCount}>{counts[section.id]} عنصر في النظام</div>
        </div>
      </div>

      {/* أزرار */}
      <div style={S.sectionActions}>

        {/* Export */}
        <button
          style={S.exportBtn}
          onClick={() => onExportClick(section)}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F5C840"; e.currentTarget.style.color = "#F5C840"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E5FA8"; e.currentTarget.style.color = "#A8C4E8"; }}
        >
          تصدير
        </button>

        {/* Import */}
        <button
          style={{
            ...S.importBtn,
            opacity: loading === "import" ? 0.6 : 1,
            cursor:  loading === "import" ? "wait" : "pointer",
          }}
          onClick={() => !loading && fileRef.current?.click()}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.opacity = "0.88"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = loading ? "0.6" : "1"; }}
          onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {loading === "import" ? "جار الاستيراد..." : "استيراد"}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".json,.xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

    </div>
  );
}

// ════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ════════════════════════════════════════════════════════════
const SECTIONS = [
  { id: "questions",  label: "الأسئلة",     icon: "Q" },
  { id: "categories", label: "التصنيفات",   icon: "C" },
  { id: "users",      label: "المستخدمين",  icon: "U" },
  { id: "contests",   label: "المسابقات",   icon: "M" },
];

export default function ImportExportPage() {
  const [exportTarget,  setExportTarget]  = useState(null); // section object
  const [importResult,  setImportResult]  = useState(null); // { added, skipped, failed }

  const handleExport = (format) => {
    // محاكاة التصدير — تُستبدل بالمنطق الحقيقي عند ربط Firestore
    const filename = `${exportTarget.id}_export_${Date.now()}.${format === "excel" ? "xlsx" : "json"}`;
    const blob = new Blob(
      [JSON.stringify({ type: exportTarget.id, exportedAt: new Date().toISOString(), data: [] }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setExportTarget(null);
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
            <span style={S.pageTitle}>استيراد وتصدير</span>
          </div>

          {/* ── ملاحظة ── */}
          <div style={S.noteBox}>
            عند الاستيراد: العناصر الموجودة مسبقاً في النظام يتم تجاهلها والإبقاء عليها كما هي. العناصر الجديدة فقط هي التي تُضاف.
          </div>

          {/* ── السيكشنز ── */}
          <div style={S.sectionsGrid}>
            {SECTIONS.map((sec) => (
              <DataSection
                key={sec.id}
                section={sec}
                counts={MOCK_COUNTS}
                onExportClick={(s) => setExportTarget(s)}
                onImportDone={(result) => setImportResult(result)}
              />
            ))}
          </div>

        </div>
      </div>

      {exportTarget && (
        <ExportFormatModal
          section={exportTarget}
          onExport={handleExport}
          onClose={() => setExportTarget(null)}
        />
      )}

      {importResult && (
        <ImportResultModal
          result={importResult}
          onClose={() => setImportResult(null)}
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
    maxWidth: "700px",
    margin: "0 auto",
    padding: "40px 28px 0",
  },

  pageHeader: {
    marginBottom: "24px",
  },
  pageTitle: {
    fontFamily: "'Lemonada', cursive",
    fontSize: "22px",
    fontWeight: 700,
    color: "#F5C840",
  },

  noteBox: {
    background: "rgba(245,200,64,.07)",
    border: "1px solid rgba(245,200,64,.2)",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#A8C4E8",
    fontSize: "13px",
    lineHeight: 1.7,
    marginBottom: "24px",
  },

  sectionsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  // سيكشن
  section: {
    background: "#162E58",
    border: "1.5px solid #2E5FA8",
    borderRadius: "14px",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  sectionInfo: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flex: 1,
  },
  sectionIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    background: "rgba(245,200,64,.1)",
    border: "1.5px solid rgba(245,200,64,.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#F5C840",
    fontSize: "16px",
    fontWeight: 900,
    flexShrink: 0,
  },
  sectionLabel: {
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: 800,
    marginBottom: "3px",
  },
  sectionCount: {
    color: "#6A90B8",
    fontSize: "12px",
    fontWeight: 600,
  },
  sectionActions: {
    display: "flex",
    gap: "8px",
    flexShrink: 0,
  },

  exportBtn: {
    background: "transparent",
    border: "1px solid #2E5FA8",
    borderRadius: "8px",
    padding: "9px 20px",
    color: "#A8C4E8",
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s",
    whiteSpace: "nowrap",
  },
  importBtn: {
    background: "linear-gradient(135deg, #E8A020, #F5C840)",
    border: "none",
    borderRadius: "8px",
    padding: "9px 20px",
    color: "#1A2A00",
    fontSize: "13px",
    fontWeight: 900,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.1s",
    boxShadow: "0 3px 0 #B87A10",
    whiteSpace: "nowrap",
  },

  // Modals
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

  // format options
  formatOption: {
    border: "1.5px solid",
    borderRadius: "10px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
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

  // نتيجة الاستيراد
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },
  resultItem: {
    background: "#0F2040",
    borderRadius: "10px",
    padding: "14px",
    textAlign: "center",
  },
  resultVal: {
    fontSize: "28px",
    fontWeight: 900,
    lineHeight: 1,
    marginBottom: "4px",
  },
  resultLbl: {
    fontSize: "11px",
    color: "#6A90B8",
    fontWeight: 600,
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
};
