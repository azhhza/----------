import { useMemo, useState } from "react";
import useStore from "../store/useStore";
import EntryPeekModal from "./EntryPeekModal";
import EntryEditForm from "./EntryEditForm";
import PtkiyotSection from "./PtkiyotSection";
import LinksSection from "./LinksSection";

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
              <EntryEditForm
                editedTitle={editedTitle}
                editedContent={editedContent}
                editedBlockType={editedBlockType}
                editedAmount={editedAmount}
                editedFinancialKind={editedFinancialKind}
                editedProjectLabel={editedProjectLabel}
                onTitleChange={setEditedTitle}
                onContentChange={setEditedContent}
                onBlockTypeChange={setEditedBlockType}
                onAmountChange={setEditedAmount}
                onFinancialKindChange={setEditedFinancialKind}
                onProjectLabelChange={setEditedProjectLabel}
              />
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
                <PtkiyotSection
                  ptkiyot={entry.ptkiyot || []}
                  ptkitInput={ptkitInput}
                  onInputChange={setPtkitInput}
                  onAdd={handleAddPtkit}
                />
              )}
            </div>

            <LinksSection
              outgoingLinkedEntries={outgoingLinkedEntries}
              incomingLinkedEntries={incomingLinkedEntries}
              availableLinkTargets={availableLinkTargets}
              isArchiveView={isArchiveView}
              isLinksOpen={isLinksOpen}
              onToggleLinksOpen={() => setIsLinksOpen((prev) => !prev)}
              linkedSearchTerm={linkedSearchTerm}
              onSearchChange={setLinkedSearchTerm}
              isLinkPickerOpen={isLinkPickerOpen}
              onTogglePickerOpen={() => setIsLinkPickerOpen((prev) => !prev)}
              onAddLink={handleAddLinkedEntry}
              onRemoveLink={(targetCode) => removeLinkedEntry(entry.id, targetCode)}
              onTogglePin={(targetCode) => togglePinnedLinkedEntry(entry.id, targetCode)}
              onPeek={setPeekEntry}
            />
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