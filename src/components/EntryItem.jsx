import { useMemo, useState } from "react";
import useStore from "../store/useStore";
import EntryPeekModal from "./EntryPeekModal";
import EntryEditForm from "./EntryEditForm";
import PtkiyotSection from "./PtkiyotSection";
import LinksSection from "./LinksSection";

// ─── Per-type visual config ───────────────────────────────────────────────────
const TYPE_CONFIG = {
  note:     { icon: "📝", label: "פתק",          iconBg: "#EEF2FF" },
  task:     { icon: "☑️",  label: "משימה",        iconBg: "#DCFCE7" },
  reminder: { icon: "🔔", label: "תזכורת",       iconBg: "#FEF3C7" },
  idea:     { icon: "💡", label: "רעיון",         iconBg: "#F5F3FF" },
  finance:  { icon: "💸", label: "תנועה כספית",  iconBg: "#FFF7ED" },
  activity: { icon: "🏃", label: "פעילות",       iconBg: "#E0F2FE" },
};

// ─── Status tokens ────────────────────────────────────────────────────────────
const STATUS = {
  new: {
    borderColor: "#F97316",
    cardBg:      "rgba(249,115,22,0.028)",
    cardShadow:  "0 1px 2px rgba(28,25,23,0.04), 0 6px 20px rgba(249,115,22,0.12), 0 0 0 1px rgba(249,115,22,0.09)",
    dot:         "#F97316",
    chipBg:      "#FFF7ED",
    chipBorder:  "#FED7AA",
    chipColor:   "#C2410C",
    actionText:  "סדר בלוק",
  },
  partial: {
    borderColor: "#F59E0B",
    cardBg:      "rgba(245,158,11,0.022)",
    cardShadow:  "0 1px 2px rgba(28,25,23,0.04), 0 6px 18px rgba(28,25,23,0.07), 0 0 0 1px rgba(245,158,11,0.09)",
    dot:         "#F59E0B",
    chipBg:      "#FFFBEB",
    chipBorder:  "#FDE68A",
    chipColor:   "#92400E",
    actionText:  "השלם פרטים",
  },
  sorted: {
    borderColor: "#E2E0DE",
    cardBg:      "#FFFFFF",
    cardShadow:  "0 1px 2px rgba(28,25,23,0.04), 0 4px 14px rgba(28,25,23,0.06)",
    dot:         null,
    chipBg:      "#F5F5F4",
    chipBorder:  "#E7E5E4",
    chipColor:   "#78716C",
    actionText:  "ערוך סיווג",
  },
};

const blockTypeLabels     = { income: "הכנסה", expense: "הוצאה", note: "הערה" };
const financialKindLabels = { business: "עסקי", private: "פרטי", project: "פרויקט" };

function formatAmount(val) {
  if (val === null || val === undefined || val === "") return "";
  const n = Number(val);
  return Number.isNaN(n) ? "" : `₪${n.toLocaleString()}`;
}

function buildTextContent(title, content) {
  const t = (title   || "").trim();
  const c = (content || "").trim();
  if (t && c) return `${t}\n${c}`;
  return t || c;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function EntryItem({ entry, onDelete, isArchiveView = false, onRestore, isMobile = false }) {
  const updateEntry             = useStore((s) => s.updateEntry);
  const allocateBlock           = useStore((s) => s.allocateBlock);
  const addPtkit                = useStore((s) => s.addPtkit);
  const addLinkedEntry          = useStore((s) => s.addLinkedEntry);
  const removeLinkedEntry       = useStore((s) => s.removeLinkedEntry);
  const togglePinnedLinkedEntry = useStore((s) => s.togglePinnedLinkedEntry);
  const entries                 = useStore((s) => s.entries);

  // ── Edit state ──
  const [isExpanded,          setIsExpanded]          = useState(false);
  const [isEditing,           setIsEditing]           = useState(false);
  const [editedTitle,         setEditedTitle]         = useState(entry.title || "");
  const [editedContent,       setEditedContent]       = useState(entry.text_content ?? entry.content ?? "");
  const [editedBlockType,     setEditedBlockType]     = useState(entry.block_type || "note");
  const [editedAmount,        setEditedAmount]        = useState(
    entry.amount === null || entry.amount === undefined ? "" : String(entry.amount)
  );
  const [editedFinancialKind, setEditedFinancialKind] = useState(entry.financial_kind || "business");
  const [editedProjectLabel,  setEditedProjectLabel]  = useState(entry.project_label || "");

  // ── Sections state ──
  const [isPtkiyotOpen,    setIsPtkiyotOpen]    = useState(false);
  const [ptkitInput,       setPtkitInput]       = useState("");
  const [isLinksOpen,      setIsLinksOpen]      = useState(false);
  const [linkedSearchTerm, setLinkedSearchTerm] = useState("");
  const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);
  const [peekEntry,        setPeekEntry]        = useState(null);

  // ── Derived values ──
  const allocationStatus = entry.allocation_status || "new";
  const status           = STATUS[allocationStatus] || STATUS.new;
  const displayContent   = entry.text_content ?? entry.content ?? "";
  const typeConfig       = TYPE_CONFIG[entry.type] || { icon: "📝", label: entry.type, iconBg: "#F5F5F4" };

  // Classification
  const classificationParts = [];
  const hasFinancialType    = entry.block_type === "income" || entry.block_type === "expense";
  const blockLabel          = blockTypeLabels[entry.block_type];
  const kindLabel           = financialKindLabels[entry.financial_kind];
  const amountDisplay       = formatAmount(entry.amount);

  if (blockLabel) {
    classificationParts.push(hasFinancialType && kindLabel ? `${blockLabel} ${kindLabel}` : blockLabel);
  }
  if (amountDisplay) classificationParts.push(amountDisplay);
  if (entry.project_label?.trim()) classificationParts.push(entry.project_label.trim());

  const classificationText = classificationParts.join(" · ");
  const showClassification = classificationText || allocationStatus === "new";

  // Date
  const parseDate = (s) => {
    if (!s) return "";
    const [datePart] = s.split(" ");
    if (!datePart) return "";
    const [y, m, d] = datePart.split("-");
    return (y && m && d) ? `${d}/${m}` : "";
  };
  const date = parseDate(entry.createdAt);

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
      const t = (e.title?.trim()) ? e.title : (e.text_content || e.content || "");
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
      block_type:     editedBlockType,
      amount:         (n === null || Number.isNaN(n)) ? null : n,
      financial_kind: (editedBlockType === "income" || editedBlockType === "expense") ? editedFinancialKind : null,
      project_label:  editedProjectLabel.trim(),
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
      <div
        className="entry-card"
        style={{
          background:   isArchiveView ? "#F8F6F4" : status.cardBg,
          borderRadius: "20px",
          marginBottom: isMobile ? "12px" : "10px",
          boxShadow:    status.cardShadow,
          border:       "none",
          borderRight:  `4px solid ${status.borderColor}`,
          opacity:      isArchiveView ? 0.70 : 1,
          overflow:     "hidden",
        }}
      >
        {/* ── Clickable zone ── */}
        <div
          onClick={!isEditing ? handleToggleExpanded : undefined}
          style={{ cursor: isEditing ? "default" : "pointer" }}
        >

          {/* Top metadata row */}
          <div
            dir="rtl"
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              padding:        "13px 14px 0",
            }}
          >
            {/* Right: icon badge + type label + status dot */}
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <div style={{
                width:          "28px",
                height:         "28px",
                borderRadius:   "8px",
                background:     typeConfig.iconBg,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       "14px",
                flexShrink:     0,
              }}>
                {typeConfig.icon}
              </div>
              <span style={{
                fontSize:      "11px",
                fontWeight:    600,
                color:         "#A8A29E",
                letterSpacing: "0.2px",
              }}>
                {typeConfig.label}
              </span>
              {status.dot && (
                <div style={{
                  width:        "5px",
                  height:       "5px",
                  borderRadius: "50%",
                  background:   status.dot,
                  flexShrink:   0,
                }} />
              )}
            </div>

            {/* Left: code + date */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", color: "#C8C3BE" }}>#{entry.code}</span>
              {date && (
                <>
                  <span style={{ fontSize: "10px", color: "#DDD9D6" }}>·</span>
                  <span style={{ fontSize: "11px", color: "#C8C3BE" }}>{date}</span>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          {isEditing ? (
            <div onClick={(e) => e.stopPropagation()} style={{ padding: "10px 14px 0" }}>
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
            <div dir="rtl" style={{ padding: "8px 14px 0" }}>
              {entry.title?.trim() && (
                <div style={{
                  fontSize:      "11px",
                  fontWeight:    700,
                  color:         "#B0A89E",
                  marginBottom:  "3px",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                }}>
                  {entry.title}
                </div>
              )}
              <div style={{
                fontSize:   isMobile ? "16px" : "15px",
                fontWeight: 600,
                color:      "#1C1917",
                lineHeight: 1.55,
                ...(isExpanded
                  ? { whiteSpace: "pre-wrap" }
                  : {
                      display:         "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow:        "hidden",
                    }),
              }}>
                {displayContent}
              </div>
            </div>
          )}

          {/* Footer row */}
          <div
            dir="rtl"
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              padding:        "10px 14px 13px",
              marginTop:      "10px",
              borderTop:      "1px solid rgba(28,25,23,0.05)",
            }}
          >
            {/* Right: status info or action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {isEditing ? (
                <>
                  <ActionBtn accent onClick={(e) => { e.stopPropagation(); handleSave(); }}>
                    ✓ שמור
                  </ActionBtn>
                  <ActionBtn onClick={(e) => { e.stopPropagation(); handleCancel(); }}>
                    ביטול
                  </ActionBtn>
                </>
              ) : isExpanded ? (
                !isArchiveView ? (
                  <>
                    <ActionBtn onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                      ✏️ ערוך
                    </ActionBtn>
                    <ActionBtn onClick={(e) => { e.stopPropagation(); onDelete(entry); }}>
                      🗂️
                    </ActionBtn>
                  </>
                ) : (
                  <ActionBtn onClick={(e) => { e.stopPropagation(); onRestore(entry); }}>
                    ↩️ שחזר
                  </ActionBtn>
                )
              ) : classificationText ? (
                <span style={{
                  fontSize:     "12px",
                  color:        status.chipColor,
                  background:   status.chipBg,
                  border:       `1px solid ${status.chipBorder}`,
                  borderRadius: "999px",
                  padding:      "3px 10px",
                  fontWeight:   600,
                }}>
                  {classificationText}
                </span>
              ) : allocationStatus === "new" ? (
                <span style={{ fontSize: "11px", color: "#F97316", fontWeight: 600, opacity: 0.9 }}>
                  טרם סווג
                </span>
              ) : null}
            </div>

            {/* Left: animated chevron */}
            <div style={{
              color:      "#C8C3BE",
              fontSize:   "10px",
              transform:  isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.22s ease",
              flexShrink: 0,
            }}>
              ▼
            </div>
          </div>
        </div>

        {/* ── Expanded section ── */}
        {isExpanded && (
          <div
            className="animate-expand"
            style={{
              borderTop:  "1px solid rgba(28,25,23,0.05)",
              padding:    "14px 14px 16px",
              background: "rgba(28,25,23,0.012)",
            }}
          >
            {/* Classification chip */}
            {showClassification && !isEditing && (
              <div style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          "8px",
                background:   status.chipBg,
                border:       `1px solid ${status.chipBorder}`,
                borderRadius: "999px",
                padding:      "5px 14px",
                marginBottom: "12px",
              }}>
                <span style={{ fontSize: "13px", color: status.chipColor, fontWeight: 700 }}>
                  {classificationText || "עדיין לא סווג"}
                </span>
                {!isArchiveView && (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      border:     "none",
                      background: "transparent",
                      color:      status.chipColor,
                      cursor:     "pointer",
                      fontSize:   "12px",
                      fontWeight: 700,
                      padding:    0,
                      opacity:    0.7,
                    }}
                  >
                    {status.actionText} →
                  </button>
                )}
              </div>
            )}

            {/* Ptkiyot */}
            <div style={{ marginBottom: "8px" }}>
              <SectionToggle
                label={isPtkiyotOpen ? "הסתר שרשור" : ptkiyotCount > 0 ? `שרשור (${ptkiyotCount})` : "הוסף פתקית"}
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
              label={isLinksOpen ? "הסתר קישורים" : `קישורים (${linksCount})`}
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function ActionBtn({ onClick, title, children, accent }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        border:       accent ? "none" : "1px solid #E7E5E4",
        background:   accent ? "linear-gradient(135deg,#F97316,#EA580C)" : "white",
        color:        accent ? "white" : "#78716C",
        borderRadius: "9px",
        padding:      "5px 13px",
        cursor:       "pointer",
        fontSize:     "12px",
        fontWeight:   accent ? 700 : 500,
        whiteSpace:   "nowrap",
        boxShadow:    accent ? "0 2px 6px rgba(249,115,22,0.28)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function SectionToggle({ label, isOpen, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border:       `1px solid ${isOpen ? "#FED7AA" : "#E7E5E4"}`,
        background:   isOpen ? "#FFF7ED" : "white",
        borderRadius: "9px",
        padding:      "5px 13px",
        cursor:       "pointer",
        fontSize:     "12px",
        color:        isOpen ? "#C2410C" : "#78716C",
        fontWeight:   isOpen ? 700 : 500,
        transition:   "background 0.14s, color 0.14s, border-color 0.14s",
      }}
    >
      {label}
    </button>
  );
}
