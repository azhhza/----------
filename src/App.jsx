import { useEffect, useRef, useState } from "react";
import useStore from "./store/useStore";
import EntryItem from "./components/EntryItem";
import UndoToast from "./components/UndoToast";

const NAV_ITEMS = [
  { icon: "🧱", label: "בלוקים" },
  { icon: "📁", label: "ארגון" },
  { icon: "💰", label: "כספים" },
  { icon: "📅", label: "יומן" },
];

const ENTRY_TYPES = [
  { value: "note",     label: "בלוק כללי" },
  { value: "task",     label: "משימה" },
  { value: "reminder", label: "תזכורת" },
  { value: "idea",     label: "רעיון" },
  { value: "finance",  label: "בלוק כספי" },
  { value: "activity", label: "פעילות" },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

function StatPill({ n, label, color = "#78716C" }) {
  return (
    <span style={{ fontSize: "12px", color: "#A8A29E" }}>
      <span style={{ color, fontWeight: 800 }}>{n}</span>{" "}{label}
    </span>
  );
}

export default function App() {
  const entries     = useStore((state) => state.entries);
  const addEntry    = useStore((state) => state.addEntry);
  const removeEntry = useStore((state) => state.removeEntry);
  const updateEntry = useStore((state) => state.updateEntry);

  const isMobile = useIsMobile();

  const [input,           setInput]           = useState("");
  const [title,           setTitle]           = useState("");
  const [content,         setContent]         = useState("");
  const [isExpandedInput, setIsExpandedInput] = useState(false);
  const [entryType,       setEntryType]       = useState("note");
  const [lastDeletedEntry,setLastDeletedEntry]= useState(null);
  const [showUndo,        setShowUndo]        = useState(false);
  const [viewMode,        setViewMode]        = useState("active");
  const [activeNav,       setActiveNav]       = useState(0);
  const [searchTerm,      setSearchTerm]      = useState("");
  const [typeFilter,      setTypeFilter]      = useState("all");

  const undoTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const activeEntries   = entries.filter((e) => !e.isArchived);
  const archivedEntries = entries.filter((e) => e.isArchived);
  const newEntries      = activeEntries.filter((e) => e.allocation_status === "new");
  const taskEntries     = activeEntries.filter((e) => e.type === "task");
  const visibleEntries  = viewMode === "active" ? activeEntries : archivedEntries;

  // Nav-based pre-filter
  const navFilteredEntries = activeNav === 2
    ? visibleEntries.filter((e) => e.type === "finance" || e.block_type === "income" || e.block_type === "expense")
    : activeNav === 1
      ? visibleEntries.filter((e) => e.allocation_status === "sorted")
      : visibleEntries;

  const filteredEntries = navFilteredEntries.filter((entry) => {
    if (typeFilter !== "all" && entry.type !== typeFilter) return false;
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const text  = (entry.text_content || entry.content || "").toLowerCase();
    const ttl   = (entry.title || "").toLowerCase();
    return text.includes(q) || ttl.includes(q) || String(entry.code).includes(q);
  });

  // Financial stats (used in כספים view)
  const financeEntries = activeEntries.filter(
    (e) => e.type === "finance" || e.block_type === "income" || e.block_type === "expense"
  );
  const totalIncome  = financeEntries
    .filter((e) => e.block_type === "income")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalExpense = financeEntries
    .filter((e) => e.block_type === "expense")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const balance = totalIncome - totalExpense;

  const getLocalDateTimeString = () => {
    const now = new Date();
    const y   = now.getFullYear();
    const m   = String(now.getMonth() + 1).padStart(2, "0");
    const d   = String(now.getDate()).padStart(2, "0");
    const hh  = String(now.getHours()).padStart(2, "0");
    const mm  = String(now.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${hh}:${mm}`;
  };

  const resetInputState = () => {
    setInput("");
    setTitle("");
    setContent("");
    setIsExpandedInput(false);
  };

  const handleAdd = () => {
    const quickText      = input.trim();
    const trimmedTitle   = title.trim();
    const trimmedContent = content.trim();
    const hasExpandedData = trimmedTitle || trimmedContent;
    const baseTextContent = hasExpandedData ? trimmedContent : quickText;
    if (!hasExpandedData && !quickText) return;

    const resolvedBlockType     = entryType === "finance" ? "expense" : "note";
    const resolvedFinancialKind = entryType === "finance" ? "business" : "";
    const resolvedTextContent   = [trimmedTitle, baseTextContent].filter(Boolean).join("\n\n");

    addEntry({
      id:               Date.now(),
      type:             entryType,
      block_type:       resolvedBlockType,
      financial_kind:   resolvedFinancialKind,
      amount:           null,
      project_label:    "",
      allocation_status:"new",
      title:            hasExpandedData ? trimmedTitle : "",
      content:          baseTextContent,
      text_content:     resolvedTextContent,
      file_path:        "",
      file_name:        "",
      mime_type:        "",
      ptkiyot:          [],
      createdAt:        getLocalDateTimeString(),
    });
    resetInputState();
  };

  const handleDeleteEntry = (entry) => {
    removeEntry(entry.id);
    setLastDeletedEntry(entry);
    setShowUndo(true);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndo(false);
      setLastDeletedEntry(null);
      undoTimeoutRef.current = null;
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!lastDeletedEntry) return;
    updateEntry(lastDeletedEntry.id, { isArchived: false });
    setShowUndo(false);
    setLastDeletedEntry(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  };

  const handleRestoreEntry = (entry) => updateEntry(entry.id, { isArchived: false });

  // ─── Layout ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      display:   "flex",
      flexDirection: isMobile ? "column" : "row",
      height:    "100dvh",
      background:"#FAFAF9",
      overflow:  "hidden",
    }}>

      {/* ─── Desktop Sidebar ─────────────────────────────────── */}
      {!isMobile && (
        <div style={{
          width:         "72px",
          background:    "#1C1917",
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          paddingTop:    "20px",
          paddingBottom: "20px",
          gap:           "6px",
          flexShrink:    0,
        }}>
          <div style={{
            width:         "40px",
            height:        "40px",
            borderRadius:  "12px",
            background:    "#F97316",
            display:       "flex",
            alignItems:    "center",
            justifyContent:"center",
            fontSize:      "20px",
            marginBottom:  "20px",
            flexShrink:    0,
          }}>🧱</div>

          {NAV_ITEMS.map((item, i) => (
            <button key={i} onClick={() => { setActiveNav(i); setSearchTerm(""); setTypeFilter("all"); }} title={item.label} style={{
              width:         "44px",
              height:        "44px",
              borderRadius:  "12px",
              border:        "none",
              cursor:        "pointer",
              fontSize:      "20px",
              display:       "flex",
              alignItems:    "center",
              justifyContent:"center",
              background:    activeNav === i ? "rgba(249,115,22,0.18)" : "transparent",
              outline:       activeNav === i ? "1px solid rgba(249,115,22,0.4)" : "none",
            }}>
              {item.icon}
            </button>
          ))}
        </div>
      )}

      {/* ─── Main Content ──────────────────────────────────────── */}
      <div style={{
        flex:      1,
        overflowY: "auto",
        padding:   isMobile ? "16px 14px 100px" : "28px 28px 80px",
        WebkitOverflowScrolling: "touch",
      }}>

        {/* Header */}
        <div style={{
          marginBottom: isMobile ? "16px" : "24px",
          textAlign:    "right",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "space-between",
          flexDirection: "row-reverse",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
              <h1 style={{
                margin:        0,
                fontSize:      isMobile ? "22px" : "26px",
                fontWeight:    900,
                color:         "#1C1917",
                letterSpacing: "-0.8px",
              }}>
                {activeNav === 2 ? "כספים" : activeNav === 1 ? "ארגון" : "Kulaba SOS"}
              </h1>
              <div className="animate-pulse-dot" style={{
                width:        "8px",
                height:       "8px",
                borderRadius: "50%",
                background:   "#F97316",
                flexShrink:   0,
                boxShadow:    "0 0 0 3px rgba(249,115,22,0.18)",
              }} />
            </div>

            {/* Live stats row */}
            {activeNav === 0 && (
              <div dir="rtl" style={{
                display:    "flex",
                gap:        "12px",
                marginTop:  "6px",
                flexWrap:   "wrap",
                alignItems: "center",
              }}>
                <StatPill n={activeEntries.length} label="פעילים" />
                {newEntries.length > 0 && (
                  <StatPill n={newEntries.length} label="ממתינים לסיווג" color="#F97316" />
                )}
                {taskEntries.length > 0 && (
                  <StatPill n={taskEntries.length} label="משימות" color="#10B981" />
                )}
              </div>
            )}

            {activeNav !== 0 && (
              <p style={{ margin: "4px 0 0", color: "#A8A29E", fontSize: "13px" }}>
                {activeNav === 2 ? "תנועות כספיות פעילות" : "בלוקים מסווגים"}
              </p>
            )}
          </div>
        </div>

        {/* ─── Input Card ──────────────────────────────────────── */}
        <div style={{
          background:   "white",
          borderRadius: "18px",
          padding:      isMobile ? "14px" : "16px",
          marginBottom: isMobile ? "16px" : "24px",
          boxShadow:    "0 1px 4px rgba(0,0,0,0.06)",
          border:       "1px solid #E7E5E4",
        }}>
          {!isExpandedInput ? (
            <>
              <div style={{ display: "flex", gap: "8px", flexDirection: "row-reverse" }}>
                <div style={{
                  flex:         1,
                  display:      "flex",
                  alignItems:   "center",
                  background:   "#FAFAF9",
                  border:       "1px solid #E7E5E4",
                  borderRadius: "12px",
                  padding:      "0 14px",
                  minHeight:    isMobile ? "52px" : "48px",
                }}>
                  <input
                    dir="rtl"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                    placeholder="שגרו כל דבר..."
                    style={{
                      flex:       1,
                      border:     "none",
                      outline:    "none",
                      fontSize:   isMobile ? "16px" : "15px",
                      textAlign:  "right",
                      background: "transparent",
                      color:      "#1C1917",
                    }}
                  />
                </div>
                <button onClick={handleAdd} style={{
                  padding:      "0 18px",
                  borderRadius: "12px",
                  border:       "none",
                  background:   "#F97316",
                  color:        "white",
                  cursor:       "pointer",
                  fontSize:     "15px",
                  fontWeight:   700,
                  minWidth:     "72px",
                  minHeight:    isMobile ? "52px" : "48px",
                  flexShrink:   0,
                }}>
                  שגר
                </button>
              </div>

              <div style={{
                display:       "flex",
                flexDirection: "row-reverse",
                gap:           "8px",
                marginTop:     "10px",
                alignItems:    "center",
                flexWrap:      "wrap",
              }}>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  style={{
                    borderRadius: "10px",
                    border:       "1px solid #E7E5E4",
                    padding:      "8px 10px",
                    fontSize:     "13px",
                    background:   "white",
                    color:        "#1C1917",
                    cursor:       "pointer",
                    minHeight:    "36px",
                  }}
                >
                  {ENTRY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                <button onClick={() => setIsExpandedInput(true)} style={{
                  padding:      "8px 12px",
                  borderRadius: "10px",
                  border:       "1px solid #E7E5E4",
                  background:   "white",
                  cursor:       "pointer",
                  color:        "#78716C",
                  fontSize:     "13px",
                  minHeight:    "36px",
                }}>
                  + פרטים
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{
                display:       "flex",
                flexDirection: "row-reverse",
                gap:           "8px",
                marginBottom:  "12px",
                alignItems:    "center",
                flexWrap:      "wrap",
              }}>
                <button onClick={handleAdd} style={{
                  padding:      "10px 20px",
                  borderRadius: "12px",
                  border:       "none",
                  background:   "#F97316",
                  color:        "white",
                  cursor:       "pointer",
                  fontWeight:   700,
                  fontSize:     "15px",
                  minHeight:    "44px",
                }}>
                  שגר
                </button>
                <button onClick={resetInputState} style={{
                  padding:      "10px 14px",
                  borderRadius: "12px",
                  border:       "1px solid #E7E5E4",
                  background:   "white",
                  cursor:       "pointer",
                  color:        "#78716C",
                  fontSize:     "14px",
                  minHeight:    "44px",
                }}>
                  בטל
                </button>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  style={{
                    borderRadius: "12px",
                    border:       "1px solid #E7E5E4",
                    padding:      "10px 10px",
                    fontSize:     "13px",
                    background:   "white",
                    color:        "#1C1917",
                    minHeight:    "44px",
                  }}
                >
                  {ENTRY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <input
                dir="rtl"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="כותרת (אופציונלי)"
                style={{
                  width:        "100%",
                  borderRadius: "12px",
                  border:       "1px solid #E7E5E4",
                  padding:      "12px 14px",
                  fontSize:     "15px",
                  textAlign:    "right",
                  boxSizing:    "border-box",
                  background:   "#FAFAF9",
                  color:        "#1C1917",
                  marginBottom: "8px",
                  minHeight:    "48px",
                }}
              />

              <textarea
                dir="rtl"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="תוכן..."
                style={{
                  width:       "100%",
                  minHeight:   "100px",
                  borderRadius:"12px",
                  border:      "1px solid #E7E5E4",
                  padding:     "12px 14px",
                  fontSize:    "16px",
                  fontFamily:  "inherit",
                  resize:      "vertical",
                  textAlign:   "right",
                  boxSizing:   "border-box",
                  background:  "#FAFAF9",
                  color:       "#1C1917",
                }}
              />
            </>
          )}
        </div>

        {/* ─── Financial Summary (כספים nav) ───────────────────── */}
        {activeNav === 2 && (
          <div dir="rtl" style={{ marginBottom: isMobile ? "16px" : "20px" }}>
            {/* Three stat cards */}
            <div style={{
              display:             "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap:                 "8px",
              marginBottom:        "10px",
            }}>
              {[
                { label: "הכנסות", amount: totalIncome,  color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
                { label: "הוצאות", amount: totalExpense, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
                { label: "מאזן",   amount: balance,      color: balance >= 0 ? "#F97316" : "#DC2626", bg: "#FFF7ED", border: "#FED7AA" },
              ].map(({ label, amount, color, bg, border }) => (
                <div key={label} style={{
                  background:   bg,
                  border:       `1px solid ${border}`,
                  borderRadius: "14px",
                  padding:      isMobile ? "11px 8px" : "14px 16px",
                  textAlign:    "center",
                }}>
                  <div style={{ fontSize: "11px", color: "#78716C", fontWeight: 600, marginBottom: "5px" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: isMobile ? "14px" : "17px", fontWeight: 800, color, direction: "ltr" }}>
                    ₪{Math.abs(amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Ratio bar */}
            {(totalIncome > 0 || totalExpense > 0) && (
              <div style={{
                background:   "white",
                border:       "1px solid #E7E5E4",
                borderRadius: "12px",
                padding:      "12px 14px",
              }}>
                <div style={{
                  display:        "flex",
                  justifyContent: "space-between",
                  fontSize:       "11px",
                  color:          "#A8A29E",
                  marginBottom:   "7px",
                  direction:      "rtl",
                }}>
                  <span>הכנסות vs הוצאות</span>
                  <span>
                    {totalIncome + totalExpense > 0
                      ? `${Math.round((totalIncome / (totalIncome + totalExpense)) * 100)}% הכנסה`
                      : "—"}
                  </span>
                </div>
                <div style={{
                  height:       "8px",
                  borderRadius: "999px",
                  background:   "#FEE2E2",
                  overflow:     "hidden",
                  direction:    "rtl",
                }}>
                  <div style={{
                    height:       "100%",
                    borderRadius: "999px",
                    background:   "linear-gradient(to left, #22C55E, #16A34A)",
                    width:        `${totalIncome + totalExpense > 0 ? Math.round((totalIncome / (totalIncome + totalExpense)) * 100) : 0}%`,
                    transition:   "width 0.4s ease",
                  }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── View Toggles ──────────────────────────────────────── */}
        <div style={{
          display:        "flex",
          justifyContent: "flex-end",
          gap:            "6px",
          marginBottom:   isMobile ? "12px" : "16px",
        }}>
          {[
            { mode: "active",  label: "פעילים",  count: activeEntries.length },
            { mode: "archive", label: "ארכיון",   count: archivedEntries.length },
          ].map(({ mode, label, count }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding:    isMobile ? "8px 14px" : "7px 16px",
                borderRadius:"10px",
                border:     viewMode === mode ? "none" : "1px solid #E7E5E4",
                background: viewMode === mode ? "#F97316" : "white",
                color:      viewMode === mode ? "white" : "#78716C",
                cursor:     "pointer",
                fontSize:   "13px",
                fontWeight: viewMode === mode ? 700 : 400,
                minHeight:  "36px",
              }}
            >
              {label}
              <span style={{
                marginRight:  "6px",
                background:   viewMode === mode ? "rgba(255,255,255,0.25)" : "#F3F4F6",
                color:        viewMode === mode ? "white" : "#6B7280",
                borderRadius: "999px",
                padding:      "1px 7px",
                fontSize:     "12px",
                fontWeight:   600,
              }}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ─── Search + Filter ───────────────────────────────────── */}
        <div style={{ marginBottom: isMobile ? "12px" : "16px" }}>
          {/* Search input */}
          <div style={{
            position:     "relative",
            marginBottom: "10px",
          }}>
            <input
              dir="rtl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפש לפי תוכן, כותרת או קוד..."
              style={{
                width:        "100%",
                borderRadius: "12px",
                border:       "1px solid #E7E5E4",
                padding:      searchTerm ? "10px 40px 10px 14px" : "10px 14px",
                fontSize:     isMobile ? "16px" : "14px",
                textAlign:    "right",
                boxSizing:    "border-box",
                background:   "white",
                color:        "#1C1917",
                boxShadow:    searchTerm ? "0 0 0 2px rgba(249,115,22,0.18)" : "none",
                outline:      "none",
                transition:   "box-shadow 0.15s ease",
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position:   "absolute",
                  left:       "10px",
                  top:        "50%",
                  transform:  "translateY(-50%)",
                  border:     "none",
                  background: "transparent",
                  color:      "#A8A29E",
                  fontSize:   "16px",
                  cursor:     "pointer",
                  padding:    "0 4px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Type filter pills */}
          <div style={{
            display:        "flex",
            flexDirection:  "row-reverse",
            gap:            "6px",
            overflowX:      "auto",
            paddingBottom:  "2px",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}>
            {[
              { value: "all",      label: "הכל" },
              { value: "note",     label: "פתק" },
              { value: "task",     label: "משימה" },
              { value: "reminder", label: "תזכורת" },
              { value: "idea",     label: "רעיון" },
              { value: "finance",  label: "כספי" },
              { value: "activity", label: "פעילות" },
            ].map(({ value, label }) => {
              const isActive = typeFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  style={{
                    padding:      "5px 12px",
                    borderRadius: "999px",
                    border:       isActive ? "none" : "1px solid #E7E5E4",
                    background:   isActive ? "#F97316" : "white",
                    color:        isActive ? "white"   : "#78716C",
                    fontSize:     "12px",
                    fontWeight:   isActive ? 700       : 400,
                    cursor:       "pointer",
                    flexShrink:   0,
                    whiteSpace:   "nowrap",
                    minHeight:    "30px",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Entries List ──────────────────────────────────────── */}
        <div>
          {filteredEntries.length === 0 && (
            <div style={{
              textAlign: "center",
              padding:   "60px 20px",
              color:     "#A8A29E",
              fontSize:  "15px",
            }}>
              {searchTerm || typeFilter !== "all"
                ? "לא נמצאו תוצאות. נסה חיפוש אחר."
                : viewMode === "active" ? "אין בלוקים פעילים. שגרו משהו!" : "הארכיון ריק."}
            </div>
          )}
          {(searchTerm || typeFilter !== "all") && filteredEntries.length > 0 && (
            <div style={{
              textAlign:    "right",
              fontSize:     "12px",
              color:        "#A8A29E",
              marginBottom: "10px",
            }}>
              {filteredEntries.length} תוצאות
            </div>
          )}
          {filteredEntries.map((entry) => (
            <EntryItem
              key={entry.id}
              entry={entry}
              onDelete={handleDeleteEntry}
              isArchiveView={viewMode === "archive"}
              onRestore={handleRestoreEntry}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>

      {/* ─── Mobile Bottom Nav ─────────────────────────────────── */}
      {isMobile && (
        <div style={{
          position:       "fixed",
          bottom:         0,
          left:           0,
          right:          0,
          background:     "#1C1917",
          display:        "flex",
          justifyContent: "space-around",
          padding:        "10px 0 max(10px, env(safe-area-inset-bottom))",
          zIndex:         100,
        }}>
          {NAV_ITEMS.map((item, i) => (
            <button key={i} onClick={() => { setActiveNav(i); setSearchTerm(""); setTypeFilter("all"); }} style={{
              display:       "flex",
              flexDirection: "column",
              alignItems:    "center",
              gap:           "3px",
              background:    "transparent",
              border:        "none",
              cursor:        "pointer",
              padding:       "4px 12px",
            }}>
              <span style={{ fontSize: "22px" }}>{item.icon}</span>
              <span style={{
                fontSize:   "10px",
                color:      activeNav === i ? "#F97316" : "#78716C",
                fontWeight: activeNav === i ? 700 : 400,
              }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <UndoToast show={showUndo && !!lastDeletedEntry} onUndo={handleUndoDelete} />
    </div>
  );
}
