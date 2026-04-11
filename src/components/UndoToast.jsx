export default function UndoToast({ show, onUndo }) {
    if (!show) return null;
  
    return (
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#0f172a",
          color: "white",
          padding: "12px 16px",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          zIndex: 1000,
        }}
      >
        <span>הרשומה נמחקה</span>
  
        <button
          onClick={onUndo}
          style={{
            border: "none",
            background: "#2563eb",
            color: "white",
            borderRadius: "10px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          בטל
        </button>
      </div>
    );
  }