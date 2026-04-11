import { useMemo, useState } from "react";
import useStore from "../store/useStore";
import EntryPeekModal from "./EntryPeekModal";

const typeLabels = {
  note: "פתק",
  task: "משימה",
  finance: "תנועה כספית",
  reminder: "תזכורת",
  idea: "רעיון",
  activity: "פעילות",
};

const blockTypeLabels = {
  income: "הכנסה",
  expense: "הוצאה",
  note: "הערה",
};

const financialKindLabels = {
  business: "עסקי",
  private: "פרטי",
  project: "פרויקט",
};

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

function formatAmountForDisplay(value) {
  if (value === null || value === undefined || value === "") return "";
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "";
  return `₪${numericValue}`;
}

function buildTextContent(title, content) {
  const safeTitle = (title || "").trim();
  const safeContent = (content || "").trim();

  if (safeTitle && safeContent) {
    return `${safeTitle}\n${safeContent}`;
  }

  if (safeTitle) return safeTitle;
  return safeContent;
}

export default function EntryItem({
  entry,
  onDelete,
  isArchiveView = false,
  onRestore,
}) {
  const updateEntry = useStore((state) => state.updateEntry);
  const allocateBlock = useStore((state) => state.allocateBlock);
  const addPtkit = useStore((state) => state.addPtkit);
  const addLinkedEntry = useStore((state) => state.addLinkedEntry);
  const removeLinkedEntry = useStore((state) => state.removeLinkedEntry);
  const togglePinnedLinkedEntry = useStore((state) => state.togglePinnedLinkedEntry);
  const entries = useStore((state) => state.entries);

  const initialContent = entry.text_content ?? entry.content ?? "";
  const initialBlockType = entry.block_type || "note";
  const initialAmount =
    entry.amount === null || entry.amount === undefined ? "" : String(entry.amount);
  const initialFinancialKind = entry.financial_kind || "business";
  const initialProjectLabel = entry.project_label || "";

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(entry.title || "");
  const [editedContent, setEditedContent] = useState(initialContent);
  const [editedBlockType, setEditedBlockType] = useState(initialBlockType);
  const [editedAmount, setEditedAmount] = useState(initialAmount);
  const [editedFinancialKind, setEditedFinancialKind] = useState(initialFinancialKind);
  const [editedProjectLabel, setEditedProjectLabel] = useState(initialProjectLabel);
  const [isPtkiyotOpen, setIsPtkiyotOpen] = useState(false);
  const [ptkitInput, setPtkitInput] = useState("");
  const [isLinksOpen, setIsLinksOpen] = useState(false);
  const [linkedSearchTerm, setLinkedSearchTerm] = useState("");
  const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);
  const [peekEntry, setPeekEntry] = useState(null);

  const parseDate = (dateString) => {
    if (!dateString) return { date: "", time: "" };

    const [datePart, timePart] = dateString.split(" ");
    if (!datePart) return { date: dateString, time: "" };

    const [year, month, day] = datePart.split("-");
    if (!year || !month || !day) {
      return { date: dateString, time: "" };
    }

    return {
      date: `${day}/${month}/${year}`,
      time: timePart || "",
    };
  };

  const handleSave = () => {
    if (!editedTitle.trim() && !editedContent.trim()) return;

    updateEntry(entry.id, {
      title: editedTitle,
      content: editedContent,
      text_content: buildTextContent(editedTitle, editedContent),
    });

    const normalizedAmount =
      editedAmount === "" ? null : Number(editedAmount);

    allocateBlock(entry.id, {
      block_type: editedBlockType,
      amount:
        normalizedAmount === null || Number.isNaN(normalizedAmount)
          ? null
          : normalizedAmount,
      financial_kind:
        editedBlockType === "income" || editedBlockType === "expense"
          ? editedFinancialKind
          : null,
      project_label: editedProjectLabel.trim(),
    });

    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(entry.title || "");
    setEditedContent(entry.text_content ?? entry.content ?? "");
    setEditedBlockType(entry.block_type || "note");
    setEditedAmount(
      entry.amount === null || entry.amount === undefined ? "" : String(entry.amount)
    );
    setEditedFinancialKind(entry.financial_kind || "business");
    setEditedProjectLabel(entry.project_label || "");
    setIsEditing(false);
  };

  const handleAddPtkit = () => {
    if (!ptkitInput.trim()) return;
    addPtkit(entry.id, ptkitInput.trim());
    setPtkitInput("");
    setIsPtkiyotOpen(true);
  };

  const handleAddLinkedEntry = (targetCode) => {
    if (!targetCode) return;
    addLinkedEntry(entry.id, Number(targetCode));
    setLinkedSearchTerm("");
    setIsLinkPickerOpen(false);
    setIsLinksOpen(true);
  };

  const handleToggleExpanded = () => {
    if (isExpanded) {
      setIsEditing(false);
      setIsPtkiyotOpen(false);
      setIsLinksOpen(false);
      setIsLinkPickerOpen(false);
      setLinkedSearchTerm("");
    }
    setIsExpanded((prev) => !prev);
  };

  const { date, time } = parseDate(entry.createdAt);
  const typeLabel = typeLabels[entry.type] || entry.type;
  const displayContent = entry.text_content ?? entry.content ?? "";
  const displayBlockType = entry.block_type || "note";
  const allocationStatus = entry.allocation_status || "new";

  const outgoingLinkedEntries = useMemo(() => {
    const linkedEntries = entry.linkedEntries || [];

    return linkedEntries
      .map((linkedItem) => {
        const targetEntry = entries.find((item) => item.code === linkedItem.code);

        return {
          ...linkedItem,
          targetEntry: targetEntry || null,
        };
      })
      .filter((item) => item.targetEntry);
  }, [entry.linkedEntries, entries]);

  const incomingLinkedEntries = useMemo(() => {
    return entries.filter((item) => {
      if (item.id === entry.id) return false;

      const linkedEntries = item.linkedEntries || [];
      return linkedEntries.some((linkedItem) => linkedItem.code === entry.code);
    });
  }, [entries, entry.id, entry.code]);

  const availableLinkTargets = useMemo(() => {
    const currentLinkedCodes = new Set((entry.linkedEntries || []).map((item) => item.code));
    const normalizedSearch = linkedSearchTerm.trim();

    return entries.filter((item) => {
      if (item.id === entry.id) return false;
      if (currentLinkedCodes.has(item.code)) return false;

      if (!normalizedSearch) return true;

      const searchableTitle =
        item.title && item.title.trim()
          ? item.title.trim()
          : item.text_content || item.content || "";

      return (
        String(item.code).includes(normalizedSearch) ||
        searchableTitle.toLowerCase().includes(normalizedSearch.toLowerCase())
      );
    });
  }, [entries, entry.id, entry.linkedEntries, linkedSearchTerm]);

  const renderOutgoingLinkedEntryRow = (targetEntry, isPinned = false) => (
    <div
      key={targetEntry.id}
      style={{
        padding: "10px 12px",
        borderRadius: "14px",
        background: isPinned ? "#eff6ff" : "#f8fafc",
        border: isPinned ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <button
          onClick={() => setPeekEntry(targetEntry)}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            width: "100%",
            textAlign: "right",
          }}
          title="הצג הצצה"
        >
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            קוד: {targetEntry.code}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: "right",
              color: "#0f172a",
              fontSize: "14px",
              fontWeight: isPinned ? "700" : "500",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {targetEntry.title && targetEntry.title.trim()
              ? targetEntry.title
              : targetEntry.text_content || targetEntry.content}
          </div>

          {isPinned && (
            <div
              style={{
                fontSize: "14px",
                flexShrink: 0,
              }}
              title="קישור נעוץ"
            >
              📌
            </div>
          )}
        </button>
      </div>

      {!isArchiveView && (
        <div
          style={{
            display: "flex",
            flexDirection: "row-reverse",
            gap: "8px",
          }}
        >
          <button
            onClick={() => togglePinnedLinkedEntry(entry.id, targetEntry.code)}
            style={{
              border: isPinned ? "1px solid #93c5fd" : "1px solid #cbd5e1",
              background: "white",
              borderRadius: "8px",
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            {isPinned ? "בטל נעיצה" : "נעץ"}
          </button>

          <button
            onClick={() => removeLinkedEntry(entry.id, targetEntry.code)}
            style={{
              border: "1px solid #fecaca",
              background: "#fff1f2",
              color: "#9f1239",
              borderRadius: "8px",
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            הסר קישור
          </button>
        </div>
      )}
    </div>
  );

  const renderIncomingLinkedEntryRow = (sourceEntry) => (
    <button
      key={sourceEntry.id}
      onClick={() => setPeekEntry(sourceEntry)}
      style={{
        width: "100%",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        background: "#fafafa",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        padding: "10px 12px",
        cursor: "pointer",
        textAlign: "right",
      }}
      title="הצג הצצה"
    >
      <div
        style={{
          fontSize: "12px",
          color: "#64748b",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        קוד: {sourceEntry.code}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: "right",
          color: "#0f172a",
          fontSize: "14px",
          fontWeight: "500",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {sourceEntry.title && sourceEntry.title.trim()
          ? sourceEntry.title
          : sourceEntry.text_content || sourceEntry.content}
      </div>
    </button>
  );

  const classificationSummaryParts = [];
  const hasFinancialType = displayBlockType === "income" || displayBlockType === "expense";
  const blockTypeLabel = blockTypeLabels[displayBlockType];
  const financialKindLabel = financialKindLabels[entry.financial_kind];
  const displayAmount = formatAmountForDisplay(entry.amount);
  const hasProjectLabel = !!(entry.project_label && entry.project_label.trim());

  if (blockTypeLabel) {
    if (hasFinancialType && financialKindLabel) {
      classificationSummaryParts.push(`${blockTypeLabel} ${financialKindLabel}`);
    } else {
      classificationSummaryParts.push(blockTypeLabel);
    }
  }

  if (displayAmount) {
    classificationSummaryParts.push(displayAmount);
  }

  if (hasProjectLabel) {
    classificationSummaryParts.push(entry.project_label.trim());
  }

  const classificationSummary = classificationSummaryParts.join(" · ");
  const shouldShowFallbackSummary =
    allocationStatus === "new" && !classificationSummary;

  const allocationUi = {
    new: {
      border: "1px solid #fdba74",
      boxShadow: "0 4px 14px rgba(251, 146, 60, 0.14)",
      background: "linear-gradient(180deg, #fffaf5 0%, #ffffff 100%)",
      actionText: "סדר בלוק",
      actionColor: "#c2410c",
    },
    partial: {
      border: "1px solid #fcd34d",
      boxShadow: "0 3px 12px rgba(245, 158, 11, 0.10)",
      background: "linear-gradient(180deg, #fffdf5 0%, #ffffff 100%)",
      actionText: "השלם פרטים",
      actionColor: "#a16207",
    },
    sorted: {
      border: "1px solid #cbd5e1",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      background: "white",
      actionText: "ערוך סיווג",
      actionColor: "#475569",
    },
  };

  const currentAllocationUi = allocationUi[allocationStatus] || allocationUi.new;

  const summaryText =
    entry.title && entry.title.trim() ? entry.title : displayContent || "";

  return (
    <>
      <div
        style={{
          position: "relative",
          background: currentAllocationUi.background,
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "16px",
          boxShadow: currentAllocationUi.boxShadow,
          border: currentAllocationUi.border,
          opacity: isArchiveView ? 0.9 : 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "16px",
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#1e293b",
            }}
          >
            {date}
          </div>
          {time && (
            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
              }}
            >
              {time}
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "16px",
            display: "flex",
            gap: "8px",
          }}
        >
          {isExpanded &&
            (!isArchiveView ? (
              !isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                    title="עריכה"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => onDelete(entry)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                    title="העבר לארכיון"
                  >
                    🗂️
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                    title="שמור"
                  >
                    ✅
                  </button>

                  <button
                    onClick={handleCancel}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                    title="בטל"
                  >
                    ↩️
                  </button>
                </>
              )
            ) : (
              <button
                onClick={() => onRestore(entry)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
                title="שחזר מהארכיון"
              >
                ♻️
              </button>
            ))}
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "#64748b",
            marginBottom: "8px",
          }}
        >
          סוג: {typeLabel} | קוד: {entry.code}
        </div>

        {(classificationSummary || shouldShowFallbackSummary) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              marginBottom: "10px",
              padding: "8px 10px",
              borderRadius: "12px",
              background:
                allocationStatus === "new"
                  ? "#fff7ed"
                  : allocationStatus === "partial"
                    ? "#fffbeb"
                    : "#f8fafc",
              border:
                allocationStatus === "new"
                  ? "1px solid #fed7aa"
                  : allocationStatus === "partial"
                    ? "1px solid #fde68a"
                    : "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#0f172a",
                textAlign: "right",
                flex: 1,
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {classificationSummary || "עדיין לא סווג"}
            </div>

            {!isArchiveView && (
              <button
                onClick={() => {
                  if (!isExpanded) {
                    setIsExpanded(true);
                  }
                  setIsEditing(true);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: currentAllocationUi.actionColor,
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                  padding: 0,
                  flexShrink: 0,
                }}
                title={currentAllocationUi.actionText}
              >
                {currentAllocationUi.actionText}
              </button>
            )}
          </div>
        )}

        {!isExpanded ? (
          <button
            onClick={handleToggleExpanded}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              textAlign: "right",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: "16px",
                fontWeight: "600",
                color: "#0f172a",
                whiteSpace: "pre-wrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: "1.45",
              }}
            >
              {summaryText}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                flexShrink: 0,
                marginTop: "4px",
              }}
            >
              ▼
            </div>
          </button>
        ) : (
          <>
            {!isEditing ? (
              <button
                onClick={handleToggleExpanded}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "right",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {!!entry.title && entry.title.trim() && (
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#1e293b",
                        marginBottom: "6px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {entry.title}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#0f172a",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {displayContent}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    flexShrink: 0,
                    marginTop: "4px",
                  }}
                >
                  ▲
                </div>
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input
                  dir="rtl"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
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
                  onChange={(e) => setEditedContent(e.target.value)}
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
                    onChange={(e) => setEditedBlockType(e.target.value)}
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
                    onChange={(e) => setEditedAmount(e.target.value)}
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
                      onChange={(e) => setEditedFinancialKind(e.target.value)}
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
                    onChange={(e) => setEditedProjectLabel(e.target.value)}
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
            )}

            <div
              style={{
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <button
                onClick={() => setIsPtkiyotOpen((prev) => !prev)}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "white",
                  borderRadius: "10px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: "13px",
                  marginBottom: isPtkiyotOpen ? "12px" : "0",
                }}
              >
                {isPtkiyotOpen
                  ? "הסתר שרשור"
                  : (entry.ptkiyot || []).length > 0
                    ? `הצג שרשור (${(entry.ptkiyot || []).length})`
                    : "הוסף פתקית"}
              </button>

              {isPtkiyotOpen && (
                <div dir="rtl">
                  {(entry.ptkiyot || []).length > 0 ? (
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
                      {(entry.ptkiyot || []).map((ptkit) => (
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
                      onChange={(e) => setPtkitInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPtkit();
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
                      onClick={handleAddPtkit}
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
              )}
            </div>

            <div
              style={{
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <button
                onClick={() => setIsLinksOpen((prev) => !prev)}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "white",
                  borderRadius: "10px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: "13px",
                  marginBottom: isLinksOpen ? "12px" : "0",
                }}
              >
                {isLinksOpen
                  ? "הסתר קישורים"
                  : `הצג קישורים (${outgoingLinkedEntries.length + incomingLinkedEntries.length})`}
              </button>

              {isLinksOpen && (
                <div
                  dir="rtl"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "14px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      קישורים לפתקים נוספים
                    </div>

                    {!isArchiveView && (
                      <div
                        style={{
                          marginBottom: "12px",
                          border: "1px solid #dbe3ea",
                          borderRadius: "16px",
                          background: "#ffffff",
                          boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row-reverse",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            padding: "12px 14px",
                            background: "#f1f5f9",
                            borderBottom: isLinkPickerOpen ? "1px solid #e2e8f0" : "none",
                          }}
                        >
                          <button
                            onClick={() => setIsLinkPickerOpen((prev) => !prev)}
                            style={{
                              border: "none",
                              background: "#2563eb",
                              color: "white",
                              borderRadius: "10px",
                              padding: "8px 12px",
                              cursor: "pointer",
                              fontSize: "14px",
                              flexShrink: 0,
                            }}
                          >
                            {isLinkPickerOpen ? "סגור" : "הוסף קישור"}
                          </button>

                          <div style={{ textAlign: "right", flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: "700",
                                color: "#0f172a",
                                marginBottom: "2px",
                              }}
                            >
                              הוספת קישור חדש
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#64748b",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              חפש פתק קיים לפי קוד או כותרת
                            </div>
                          </div>
                        </div>

                        {isLinkPickerOpen && (
                          <div style={{ padding: "12px" }}>
                            <div style={{ marginBottom: "10px" }}>
                              <input
                                dir="rtl"
                                value={linkedSearchTerm}
                                onChange={(e) => setLinkedSearchTerm(e.target.value)}
                                placeholder="חפש לפי קוד או כותרת..."
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
                              />
                            </div>

                            <div
                              style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "14px",
                                background: "white",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  padding: "8px 12px",
                                  background: "#f8fafc",
                                  borderBottom: "1px solid #e2e8f0",
                                  fontSize: "12px",
                                  color: "#64748b",
                                  textAlign: "right",
                                }}
                              >
                                {availableLinkTargets.length > 0
                                  ? `נמצאו ${availableLinkTargets.length} פתקים מתאימים`
                                  : "לא נמצאו פתקים מתאימים"}
                              </div>

                              {availableLinkTargets.length > 0 ? (
                                <div
                                  style={{
                                    maxHeight: "220px",
                                    overflowY: "auto",
                                    display: "flex",
                                    flexDirection: "column",
                                  }}
                                >
                                  {availableLinkTargets.map((item, index) => (
                                    <button
                                      key={item.id}
                                      onClick={() => handleAddLinkedEntry(item.code)}
                                      style={{
                                        border: "none",
                                        borderBottom:
                                          index === availableLinkTargets.length - 1
                                            ? "none"
                                            : "1px solid #f1f5f9",
                                        background: "white",
                                        cursor: "pointer",
                                        padding: "12px",
                                        textAlign: "right",
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          color: "#64748b",
                                          marginBottom: "3px",
                                        }}
                                      >
                                        קוד: {item.code}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "14px",
                                          color: "#0f172a",
                                          fontWeight: "600",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.title && item.title.trim()
                                          ? item.title
                                          : item.text_content || item.content}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div
                                  style={{
                                    padding: "14px 12px",
                                    fontSize: "13px",
                                    color: "#94a3b8",
                                    textAlign: "right",
                                    background: "#ffffff",
                                  }}
                                >
                                  נסה לחפש לפי קוד אחר או תחילת כותרת.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {outgoingLinkedEntries.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {outgoingLinkedEntries.map((item) =>
                          renderOutgoingLinkedEntryRow(item.targetEntry, item.isPinned)
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#94a3b8",
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "10px 12px",
                        }}
                      >
                        אין עדיין קישורים לפתקים נוספים.
                      </div>
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      אזכורים לפתק הזה
                    </div>

                    {incomingLinkedEntries.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {incomingLinkedEntries.map((item) =>
                          renderIncomingLinkedEntryRow(item)
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#94a3b8",
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "10px 12px",
                        }}
                      >
                        אין עדיין אזכורים לפתק הזה.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {peekEntry && (
        <EntryPeekModal
          entry={peekEntry}
          onClose={() => setPeekEntry(null)}
        />
      )}
    </>
  );
}