export default function EntryPeekModal({ entry, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position:   "fixed",
        inset:      0,
        background: "rgba(28, 25, 23, 0.4)",
        display:    "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:    "20px",
        zIndex:     1000,
      }}
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        style={{
          width:        "100%",
          maxWidth:     "520px",
          background:   "white",
          borderRadius: "20px",
          boxShadow:    "0 24px 64px rgba(28,25,23,0.2)",
          border:       "1px solid #E7E5E4",
          borderTop:    "4px solid #F97316",
          overflow:     "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "flex-start",
          gap:            "12px",
          padding:        "16px 18px 14px",
          borderBottom:   "1px solid #F5F5F4",
        }}>
          <button
            onClick={onClose}
            style={{
              border:       "1px solid #E7E5E4",
              background:   "white",
              borderRadius: "10px",
              padding:      "6px 12px",
              cursor:       "pointer",
              fontSize:     "13px",
              color:        "#78716C",
              flexShrink:   0,
            }}
          >
            סגור
          </button>

          <div style={{ textAlign: "right", flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize:     "11px",
              color:        "#A8A29E",
              marginBottom: "4px",
            }}>
              קוד: {entry.code}
            </div>
            <div style={{
              fontSize:   "17px",
              fontWeight: 700,
              color:      "#1C1917",
            }}>
              {entry.title && entry.title.trim() ? entry.title : "ללא כותרת"}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{
          padding:    "16px 18px 20px",
          fontSize:   "15px",
          color:      "#44403C",
          lineHeight: 1.65,
          whiteSpace: "pre-wrap",
          textAlign:  "right",
        }}>
          {entry.text_content || entry.content || ""}
        </div>
      </div>
    </div>
  );
}
