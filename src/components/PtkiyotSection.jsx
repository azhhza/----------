function formatPtkitCreatedAtForDisplay(value) {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  const [datePart, ...timeParts] = trimmed.split(" ");
  const timePart = timeParts.join(" ");

  if (!datePart) return trimmed;

  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return trimmed;

  return timePart ? `${day}/${month}/${year} ${timePart}` : `${day}/${month}/${year}`;
}

export default function PtkiyotSection({ ptkiyot, ptkitInput, onInputChange, onAdd }) {
  return (
    <div dir="rtl">
      {ptkiyot.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "14px",
            borderRight: "2px solid #e2e8f0",
            paddingRight: "12px",
          }}
        >
          {ptkiyot.map((ptkit) => (
            <div
              key={ptkit.id}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                {ptkit.localCode}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#0f172a",
                  whiteSpace: "pre-wrap",
                  marginBottom: "6px",
                }}
              >
                {ptkit.content}
              </div>

              <div
                dir="ltr"
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                }}
              >
                {formatPtkitCreatedAtForDisplay(ptkit.createdAt)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            fontSize: "13px",
            color: "#94a3b8",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "10px 12px",
            marginBottom: "12px",
          }}
        >
          אין עדיין פתקיות בשרשור הזה.
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "row-reverse",
          gap: "8px",
        }}
      >
        <input
          dir="rtl"
          value={ptkitInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="הוסף פתקית..."
          style={{
            flex: 1,
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            padding: "8px 10px",
            fontSize: "14px",
            textAlign: "right",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={onAdd}
          style={{
            border: "none",
            background: "#2563eb",
            color: "white",
            borderRadius: "10px",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          הוסף
        </button>
      </div>
    </div>
  );
}
