import { useMemo, useState } from "react";
import useStore from "../store/useStore";
import EntryPeekModal from "./EntryPeekModal";
import EntryEditForm from "./EntryEditForm";
import PtkiyotSection from "./PtkiyotSection";
import LinksSection from "./LinksSection";

const typeLabels = {
  note:     "פתק",
  task:     "משימה",
  finance:  "תנועה כספית",
  reminder: "תזכורת",
  idea:     "רעיון",
  activity: "פעילות",
};

const blockTypeLabels   = { income: "הכנסה", expense: "הוצאה", note: "הערה" };
const financialKindLabels = { business: "עסקי", private: "פרטי", project: "פרויקט" };

// ─── Status design tokens ────────────────────────────────────────────────────
const STATUS = {
  new: {
    borderColor: "#F97316",
    chipBg:      "#FFF7ED",
    chipBorder:  "#FED7AA",
    chipColor:   "#C2410C",
    actionText:  "סדר בלוק",
  },
  partial: {
    borderColor: "#FBBF24",
    chipBg:      "#FFFBEB",
    chipBorder:  "#FDE68A",
    chipColor:   "#92400E",
    actionText:  "השלם פרטים",
  },
  sorted: {
    borderColor: "#D1D5DB",
    chipBg:      "#F9FAFB",
    chipBorder:  "#E5E7EB",
    chipColor:   "#6B7280",
    actionText:  "ערוך סיווג",
  },
};

function formatAmount(value) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  return Number.isNaN(n) ? "" : `₪${n.toLocaleString()}`;
}

function buildTextContent(title, content) {
  const t = (title   || "").trim();
  const c = (content || "").trim();
  if (t && c) return `${t}\n${c}`;
  return t || c;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function EntryItem({ entry, onDelete, isArchiveView = false, onRestore }) {
  const updateEntry           = useStore((s) => s.updateEntry);
  const allocateBlock         = useStore((s) => s.allocateBlock);
  const addPtkit              = useStore((s) => s.addPtkit);
  const addLinkedEntry        = useStore((s) => s.addLinkedEntry);
  const removeLinkedEntry     = useStore((s) => s.removeLinkedEntry);
  const togglePinnedLinkedEntry = useStore((s) => s.togglePinnedLinkedEntry);
  const entries               = useStore((s) => s.entries);

  // ── Edit state ──
  const [isExpanded,         setIsExpanded]         = useState(false);
  const [isEditing,          setIsEditing]          = useState(false);
  const [editedTitle,        setEditedTitle]        = useState(entry.title || "");
  const [editedContent,      setEditedContent]      = useState(entry.text_content ?? entry.content ?? "");
  const [editedBlockType,    setEditedBlockType]    = useState(entry.block_type || "note");
  const [editedAmount,       setEditedAmount]       = useState(
    entry.amount === null || entry.amount === undefined ? "" : String(entry.amount)
  );
  const [editedFinancialKind,setEditedFinancialKind]= useState(entry.financial_kind || "business");
  const [editedProjectLabel, setEditedProjectLabel] = useState(entry.project_label || "");

  // ── Sections state ──
  const [isPtkiyotOpen,   setIsPtkiyotOpen]   = useState(false);
  const [ptkitInput,      setPtkitInput]      = useState("");
  const [isLinksOpen,     setIsLinksOpen]     = useState(false);
  const [linkedSearchTerm,setLinkedSearchTerm]= useState("");
  const [isLinkPickerOpen,setIsLinkPickerOpen]= useState(false);
  const [peekEntry,       setPeekEntry]       = useState(null);

  // ── Derived display values ──
  const allocationStatus = entry.allocation_status || "new";
  const status           = STATUS[allocationStatus] || STATUS.new;
  const displayContent   = entry.text_content ?? entry.content ?? "";
  const typeLabel        = typeLabels[entry.type] || entry.type;

  // Classification chip text
  const classificationParts = [];
  const hasFinancialType = entry.block_type === "income" || entry.block_type === "expense";
  const blockLabel       = blockTypeLabels[entry.block_type];
  const kindLabel        = financialKindLabels[entry.financial_kind];
  const amountDisplay    = formatAmount(entry.amount);

  if (blockLabel) {
    classificationParts.push(hasFinancialType && kindLabel ? `${blockLabel} ${kindLabel}` : blockLabel);
  }
  if (amountDisplay) classificationParts.push(amountDisplay);
  if (entry.project_label && entry.project_label.trim()) classificationParts.push(entry.project_label.trim());

  const classificationText = classificationParts.join(" · ");
  const showClassification = classificationText || allocationStatus === "new";

  // Date parsing
  const parseDate = (s) => {
    if (!s) return { date: "", time: "" };
    const [datePart, timePart] = s.split(" ");
    if (!datePart) return { date: s, time: "" };
    const [y, m, d] = datePart.split("-");
    if (!y || !m || !d) return { date: s, time: "" };
    return { date: `${d}/${m}`, time: timePart || "" };
  };
  const { date, time } = parseDate(entry.createdAt);

  // ── Linked entries ──
  const outgoingLinkedEntries = useMemo(() => {
    return (entry.linkedEntries || [])
      .map((li) => ({ ...li, targetEntry: entries.find((e) => e.code === li.code) || null }))
      .filter((li) => li.targetEntry);
  }, [entry.linkedEntries, entries]);

  const incomingLinkedEntries = useMemo(() => {
    return entries.filter((e) => {
      if (e.id === entry.id) return false;
      return (e.linkedEntries || []).some((li) => li.code === entry.code);
    });
  }, [entries, entry.id, entry.code]);

  const availableLinkTargets = useMemo(() => {
    const linked = new Set((entry.linkedEntries || []).map((li) => li.code));
    const q = linkedSearchTerm.trim().toLowerCase();
    return entries.filter((e) => {
      if (e.id === entry.id || linked.has(e.code)) return false;
      if (!q) return true;
      const t = (e.title && e.title.trim()) ? e.title : (e.text_content || e.content || "");
      return String(e.code).includes(q) || t.toLowerCase().includes(q);
    });
  }, [entries, entry.id, entry.linkedEntries, linkedSearchTerm]);

  // ── Handlers ──
  const handleSave = () => {
    if (!editedTitle.trim() && !editedContent.trim()) return;
    updateEntry(entry.id, {
      title:        editedTitle,
      content:      editedContent,
      text_content: buildTextContent(editedTitle, editedContent),
    });
    const n = editedAmount === "" ? null : Number(editedAmount);
    allocateBlock(entry.id, {
      block_type:    editedBlockType,
      amount:        (n === null || Number.isNaN(n)) ? null : n,
      financial_kind:(editedBlockType === "income" || editedBlockType === "expense") ? editedFinancialKind : null,
      project_label: editedProjectLabel.trim(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(entry.title || "");
    setEditedContent(entry.text_content ?? entry.content ?? "");
    setEditedBlockType(entry.block_type || "note");
    setEditedAmount(entry.amount === null || entry.amount === undefined ? "" : String(entry.amount));
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
    setIsExpanded((p) => !p);
  };

  const ptkiyotCount = (entry.ptkiyot || []).length;
  const linksCount   = outgoingLinkedEntries.length + incomingLinkedEntries.length;

  // ── Render ──
  return (
    <>
      <div style={{
        background:   "white",
        borderRadius: "14px",
        marginBottom: "10px",
        boxShadow:    "0 1px 4px rgba(0,0,0,0.06)",
        border:       "1px solid #E7E5E4",
        borderRight:  `4px solid ${status.borderColor}`,
        opacity:      isArchiveView ? 0.7 : 1,
        overflow:     "hidden",
      }}>

        {/* ── Main clickable area ── */}
        <div
          onClick={!isEditing ? handleToggleExpanded : undefined}
          style={{
            padding: "14px 16px 0",
            cursor: isEditing ? "default" : "pointer",
          }}
        >
          {/* Action buttons row (visible when expanded) */}
          {isExpanded && (
            <div style={{
              display:        "flex",
              justifyContent: "flex-start",
              gap:            "6px",
              marginBottom:   "10px",
            }}>
              {!isArchiveView ? (
                !isEditing ? (
                  <>
                    <ActionBtn onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} title="עריכה">
                      ✏️
                    </ActionBtn>
                    <ActionBtn onClick={(e) => { e.stopPropagation(); onDelete(entry); }} title="ארכיון">
                      🗂️
                    </ActionBtn>
                  </>
                ) : (
                  <>
                    <ActionBtn onClick={(e) => { e.stopPropagation(); handleSave(); }} title="שמור" accent>
                      שמור
                    </ActionBtn>
                    <ActionBtn onClick={(e) => { e.stopPropagation(); handleCancel(); }} title="בטל">
                      ביטול
                    </ActionBtn>
                  </>
                )
              ) : (
                <ActionBtn onClick={(e) => { e.stopPropagation(); onRestore(entry); }} title="שחזר">
                  ♻️ שחזר
                </ActionBtn>
              )}
            </div>
          )}

          {/* Content area */}
          {isEditing ? (
            <div onClick={(e) => e.stopPropagation()}>
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
            </div>
          ) : (
            <div dir="rtl">
              {entry.title && entry.title.trim() && (
                <div style={{
                  fontSize:     "13px",
                  fontWeight:   700,
                  color:        "#78716C",
                  marginBottom: "3px",
                  textTransform:"uppercase",
                  letterSpacing:"0.4px",
                }}>
                  {entry.title}
                </div>
              )}
              <div style={{
                fontSize:   "15px",
                fontWeight: 600,
                color:      "#1C1917",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
                ...(isExpanded ? {} : {
                  display:            "-webkit-box",
                  WebkitLineClamp:    2,
                  WebkitBoxOrient:    "vertical",
                  overflow:           "hidden",
                  textOverflow:       "ellipsis",
                  whiteSpace:         "normal",
                }),
              }}>
                {displayContent}
              </div>
            </div>
          )}

          {/* Metadata row */}
          <div style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            marginTop:      "12px",
            paddingBottom:  "12px",
          }}>
            {/* Left: chevron */}
            <div style={{ color: "#A8A29E", fontSize: "11px", lineHeight: 1 }}>
              {isExpanded ? "▲" : "▼"}
            </div>

            {/* Right: type · code · date */}
            <div dir="rtl" style={{
              display:    "flex",
              alignItems: "center",
              gap:        "8px",
            }}>
              {/* type chip */}
              <span style={{
                fontSize:     "11px",
                fontWeight:   600,
                color:        "#78716C",
                background:   "#F3F4F6",
                borderRadius: "999px",
                padding:      "2px 8px",
              }}>
                {typeLabel}
              </span>

              <span style={{ color: "#D1D5DB", fontSize: "11px" }}>·</span>

              <span style={{ fontSize: "11px", color: "#A8A29E" }}>
                {entry.code}
              </span>

              {date && (
                <>
                  <span style={{ color: "#D1D5DB", fontSize: "11px" }}>·</span>
                  <span style={{ fontSize: "11px", color: "#A8A29E" }}>
                    {date}{time ? ` ${time}` : ""}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Expanded sections ── */}
        {isExpanded && (
          <div style={{ borderTop: "1px solid #F3F4F6", padding: "14px 16px 16px" }}>

            {/* Classification chip */}
            {showClassification && !isEditing && (
              <div style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          "8px",
                background:   status.chipBg,
                border:       `1px solid ${status.chipBorder}`,
                borderRadius: "999px",
                padding:      "4px 12px",
                marginBottom: "14px",
              }}>
                <span style={{ fontSize: "12px", color: status.chipColor, fontWeight: 600 }}>
                  {classificationText || "עדיין לא סווג"}
                </span>

                {!isArchiveView && (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      border:       "none",
                      background:   "transparent",
                      color:        status.chipColor,
                      cursor:       "pointer",
                      fontSize:     "11px",
                      fontWeight:   700,
                      padding:      "0",
                      opacity:      0.8,
                    }}
                  >
                    {status.actionText} →
                  </button>
                )}
              </div>
            )}

            {/* Ptkiyot */}
            <div style={{ marginBottom: "10px" }}>
              <SectionToggle
                label={
                  isPtkiyotOpen
                    ? "הסתר שרשור"
                    : ptkiyotCount > 0
                      ? `שרשור (${ptkiyotCount})`
                      : "הוסף פתקית"
                }
                isOpen={isPtkiyotOpen}
                onClick={() => setIsPtkiyotOpen((p) => !p)}
              />
              {isPtkiyotOpen && (
                <div style={{ marginTop: "10px" }}>
                  <PtkiyotSection
                    ptkiyot={entry.ptkiyot || []}
                    ptkitInput={ptkitInput}
                    onInputChange={setPtkitInput}
                    onAdd={handleAddPtkit}
                  />
                </div>
              )}
            </div>

            {/* Links */}
            <SectionToggle
              label={
                isLinksOpen
                  ? "הסתר קישורים"
                  : `קישורים (${linksCount})`
              }
              isOpen={isLinksOpen}
              onClick={() => setIsLinksOpen((p) => !p)}
            />
            {isLinksOpen && (
              <div style={{ marginTop: "10px" }}>
                <LinksSection
                  outgoingLinkedEntries={outgoingLinkedEntries}
                  incomingLinkedEntries={incomingLinkedEntries}
                  availableLinkTargets={availableLinkTargets}
                  isArchiveView={isArchiveView}
                  isLinksOpen={isLinksOpen}
                  onToggleLinksOpen={() => setIsLinksOpen((p) => !p)}
                  linkedSearchTerm={linkedSearchTerm}
                  onSearchChange={setLinkedSearchTerm}
                  isLinkPickerOpen={isLinkPickerOpen}
                  onTogglePickerOpen={() => setIsLinkPickerOpen((p) => !p)}
                  onAddLink={handleAddLinkedEntry}
                  onRemoveLink={(code) => removeLinkedEntry(entry.id, code)}
                  onTogglePin={(code) => togglePinnedLinkedEntry(entry.id, code)}
                  onPeek={setPeekEntry}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {peekEntry && (
        <EntryPeekModal entry={peekEntry} onClose={() => setPeekEntry(null)} />
      )}
    </>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function ActionBtn({ onClick, title, children, accent }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        border:       accent ? "none" : "1px solid #E7E5E4",
        background:   accent ? "#F97316" : "white",
        color:        accent ? "white"   : "#78716C",
        borderRadius: "8px",
        padding:      "5px 12px",
        cursor:       "pointer",
        fontSize:     "12px",
        fontWeight:   accent ? 700 : 400,
      }}
    >
      {children}
    </button>
  );
}

function SectionToggle({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border:       "1px solid #E7E5E4",
        background:   "white",
        borderRadius: "8px",
        padding:      "5px 12px",
        cursor:       "pointer",
        fontSize:     "12px",
        color:        "#78716C",
        fontWeight:   500,
      }}
    >
      {label}
    </button>
  );
}
