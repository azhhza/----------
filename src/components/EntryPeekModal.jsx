export default function EntryPeekModal({ entry, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 1000,
      }}
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          border: "1px solid #e2e8f0",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: "14px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              border: "1px solid #cbd5e1",
              background: "white",
              borderRadius: "10px",
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: "13px",
              flexShrink: 0,
            }}
          >
            סגור
          </button>

          <div style={{ textAlign: "right", flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
                marginBottom: "4px",
              }}
            >
              קוד: {entry.code}
            </div>

            <div
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#0f172a",
                whiteSpace: "pre-wrap",
              }}
            >
              {entry.title && entry.title.trim()
                ? entry.title
                : "ללא כותרת"}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: "15px",
            color: "#1e293b",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            textAlign: "right",
          }}
        >
          {entry.content}
        </div>
      </div>
    </div>
  );
}
