export default function UndoToast({ show, onUndo }) {
    if (!show) return null;
  
    return (
      <div
        className="animate-slide-up"
        style={{
          position: "fixed",
          bottom: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1C1917",
          color: "white",
          padding: "12px 16px",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
          zIndex: 1000,
          whiteSpace: "nowrap",
        }}
      >
        <span>הרשומה נמחקה</span>
  
        <button
          onClick={onUndo}
          style={{
            border: "none",
            background: "#F97316",
            color: "white",
            borderRadius: "10px",
            padding: "6px 14px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          בטל
        </button>
      </div>
    );
  }