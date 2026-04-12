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
        style={{
          width: "100%",
          borderRadius: "12px",
          border: "1px solid #cbd5e1",
          padding: "10px 12px",
          fontSize: "15px",
          textAlign: "right",
          boxSizing: "border-box",
        }}
      />

      <textarea
        dir="rtl"
        value={editedContent}
        onChange={(e) => onContentChange(e.target.value)}
        style={{
          width: "100%",
          minHeight: "90px",
          borderRadius: "12px",
          border: "1px solid #cbd5e1",
          padding: "12px",
          fontSize: "16px",
          fontFamily: "inherit",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />

      <div
        style={{
          marginTop: "4px",
          padding: "12px",
          borderRadius: "14px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "700",
            color: "#475569",
            textAlign: "right",
          }}
        >
          סידור הבלוק
        </div>

        <select
          dir="rtl"
          value={editedBlockType}
          onChange={(e) => onBlockTypeChange(e.target.value)}
          style={{
            width: "100%",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            padding: "10px 12px",
            fontSize: "14px",
            textAlign: "right",
            boxSizing: "border-box",
            background: "white",
          }}
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
          placeholder="סכום"
          style={{
            width: "100%",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            padding: "10px 12px",
            fontSize: "14px",
            textAlign: "right",
            boxSizing: "border-box",
          }}
        />

        {(editedBlockType === "income" || editedBlockType === "expense") && (
          <select
            dir="rtl"
            value={editedFinancialKind}
            onChange={(e) => onFinancialKindChange(e.target.value)}
            style={{
              width: "100%",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              padding: "10px 12px",
              fontSize: "14px",
              textAlign: "right",
              boxSizing: "border-box",
              background: "white",
            }}
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
          placeholder="פרויקט"
          style={{
            width: "100%",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            padding: "10px 12px",
            fontSize: "14px",
            textAlign: "right",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}
