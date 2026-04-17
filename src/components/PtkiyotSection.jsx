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
        <div style={{
          display:       "flex",
          flexDirection: "column",
          gap:           "8px",
          marginBottom:  "12px",
          borderRight:   "3px solid #FED7AA",
          paddingRight:  "12px",
        }}>
          {ptkiyot.map((ptkit) => (
            <div key={ptkit.id} style={{
              background:   "#FAFAF9",
              border:       "1px solid #E7E5E4",
              borderRadius: "12px",
              padding:      "10px 12px",
            }}>
              <div style={{
                fontSize:     "11px",
                color:        "#F97316",
                fontWeight:   700,
                marginBottom: "4px",
              }}>
                {ptkit.localCode}
              </div>
              <div style={{
                fontSize:   "14px",
                color:      "#1C1917",
                whiteSpace: "pre-wrap",
                lineHeight: "1.5",
                marginBottom: "5px",
              }}>
                {ptkit.content}
              </div>
              <div dir="ltr" style={{ fontSize: "11px", color: "#A8A29E" }}>
                {formatPtkitCreatedAtForDisplay(ptkit.createdAt)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          fontSize:     "13px",
          color:        "#A8A29E",
          background:   "#FAFAF9",
          border:       "1px solid #E7E5E4",
          borderRadius: "12px",
          padding:      "10px 12px",
          marginBottom: "12px",
        }}>
          אין עדיין פתקיות בשרשור הזה.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "row-reverse", gap: "8px" }}>
        <input
          dir="rtl"
          value={ptkitInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onAdd(); }
          }}
          placeholder="הוסף פתקית..."
          style={{
            flex:         1,
            borderRadius: "10px",
            border:       "1px solid #E7E5E4",
            padding:      "9px 12px",
            fontSize:     "14px",
            textAlign:    "right",
            boxSizing:    "border-box",
            background:   "#FAFAF9",
            color:        "#1C1917",
          }}
        />
        <button
          onClick={onAdd}
          style={{
            border:       "none",
            background:   "#F97316",
            color:        "white",
            borderRadius: "10px",
            padding:      "9px 14px",
            cursor:       "pointer",
            fontSize:     "14px",
            fontWeight:   700,
          }}
        >
          הוסף
        </button>
      </div>
    </div>
  );
}
