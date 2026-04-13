const inputStyle = {
  width:        "100%",
  borderRadius: "12px",
  border:       "1px solid #E7E5E4",
  padding:      "10px 12px",
  fontSize:     "14px",
  textAlign:    "right",
  boxSizing:    "border-box",
  background:   "#FAFAF9",
  color:        "#1C1917",
};

export default function EntryEditForm({
  editedTitle,
  editedContent,
  editedBlockType,
  editedAmount,
  editedFinancialKind,
  editedProjectLabel,
  onTitleChange,
  onContentChange,
  onBlockTypeChange,
  onAmountChange,
  onFinancialKindChange,
  onProjectLabelChange,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <input
        dir="rtl"
        value={editedTitle}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="כותרת (אופציונלי)"
        style={{ ...inputStyle, fontSize: "15px" }}
      />

      <textarea
        dir="rtl"
        value={editedContent}
        onChange={(e) => onContentChange(e.target.value)}
        style={{
          ...inputStyle,
          minHeight:  "90px",
          fontSize:   "16px",
          fontFamily: "inherit",
          resize:     "vertical",
        }}
      />

      <div style={{
        marginTop:     "4px",
        padding:       "12px",
        borderRadius:  "14px",
        background:    "#FFF7ED",
        border:        "1px solid #FED7AA",
        display:       "flex",
        flexDirection: "column",
        gap:           "8px",
      }}>
        <div style={{
          fontSize:   "11px",
          fontWeight: 700,
          color:      "#C2410C",
          textAlign:  "right",
          letterSpacing: "0.3px",
          textTransform: "uppercase",
        }}>
          סידור הבלוק
        </div>

        <select
          dir="rtl"
          value={editedBlockType}
          onChange={(e) => onBlockTypeChange(e.target.value)}
          style={inputStyle}
        >
          <option value="income">הכנסה</option>
          <option value="expense">הוצאה</option>
          <option value="note">הערה</option>
        </select>

        <input
          dir="rtl"
          type="number"
          value={editedAmount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="סכום (₪)"
          style={inputStyle}
        />

        {(editedBlockType === "income" || editedBlockType === "expense") && (
          <select
            dir="rtl"
            value={editedFinancialKind}
            onChange={(e) => onFinancialKindChange(e.target.value)}
            style={inputStyle}
          >
            <option value="business">עסקי</option>
            <option value="private">פרטי</option>
            <option value="project">פרויקט</option>
          </select>
        )}

        <input
          dir="rtl"
          value={editedProjectLabel}
          onChange={(e) => onProjectLabelChange(e.target.value)}
          placeholder="פרויקט / תווית"
          style={inputStyle}
        />
      </div>
    </div>
  );
}
