import { useEffect, useRef, useState } from "react";
import useStore from "./store/useStore";
import EntryItem from "./components/EntryItem";
import UndoToast from "./components/UndoToast";

const NAV_ITEMS = [
  { icon: "🧱", label: "בלוקים" },
  { icon: "📁", label: "ארגון"  },
  { icon: "💰", label: "כספים" },
  { icon: "📅", label: "יומן"  },
];

const ENTRY_TYPES = [
  { value: "note",     label: "פתק כללי"  },
  { value: "task",     label: "משימה"     },
  { value: "reminder", label: "תזכורת"    },
  { value: "idea",     label: "רעיון"     },
  { value: "finance",  label: "כספי"      },
  { value: "activity", label: "פעילות"    },
];

const TYPE_FILTERS = [
  { value: "all",      label: "הכל"    },
  { value: "note",     label: "📝 פתק"  },
  { value: "task",     label: "☑️ משימה" },
  { value: "reminder", label: "🔔 תזכורת"},
  { value: "idea",     label: "💡 רעיון" },
  { value: "finance",  label: "💸 כספי" },
  { value: "activity", label: "🏃 פעילות"},
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

// ─── Main App ────────────────────────────────────────────────────────────────
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
    return () => { if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current); };
  }, []);

  // ── Derived state ──
  const activeEntries   = entries.filter((e) => !e.isArchived);
  const archivedEntries = entries.filter((e) => e.isArchived);
  const newEntries      = activeEntries.filter((e) => e.allocation_status === "new");
  const taskEntries     = activeEntries.filter((e) => e.type === "task");
  const visibleEntries  = viewMode === "active" ? activeEntries : archivedEntries;

  const navFilteredEntries =
    activeNav === 2 ? visibleEntries.filter((e) => e.type === "finance" || e.block_type === "income" || e.block_type === "expense")
    : activeNav === 1 ? visibleEntries.filter((e) => e.allocation_status === "sorted")
    : visibleEntries;

  const filteredEntries = navFilteredEntries.filter((entry) => {
    if (typeFilter !== "all" && entry.type !== typeFilter) return false;
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const text = (entry.text_content || entry.content || "").toLowerCase();
    const ttl  = (entry.title || "").toLowerCase();
    return text.includes(q) || ttl.includes(q) || String(entry.code).includes(q);
  });

  // Financial stats
  const financeEntries = activeEntries.filter(
    (e) => e.type === "finance" || e.block_type === "income" || e.block_type === "expense"
  );
  const totalIncome  = financeEntries.filter((e) => e.block_type === "income").reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalExpense = financeEntries.filter((e) => e.block_type === "expense").reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const balance      = totalIncome - totalExpense;

  // ── Helpers ──
  const getLocalDateTimeString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  };

  const resetInputState = () => { setInput(""); setTitle(""); setContent(""); setIsExpandedInput(false); };

  const handleAdd = () => {
    const quickText       = input.trim();
    const trimmedTitle    = title.trim();
    const trimmedContent  = content.trim();
    const hasExpandedData = trimmedTitle || trimmedContent;
    if (!hasExpandedData && !quickText) return;

    addEntry({
      id:               Date.now(),
      type:             entryType,
      block_type:       entryType === "finance" ? "expense" : "note",
      financial_kind:   entryType === "finance" ? "business" : "",
      amount:           null,
      project_label:    "",
      allocation_status:"new",
      title:            hasExpandedData ? trimmedTitle : "",
      content:          hasExpandedData ? trimmedContent : quickText,
      text_content:     [trimmedTitle, hasExpandedData ? trimmedContent : quickText].filter(Boolean).join("\n\n"),
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
    if (undoTimeoutRef.current) { clearTimeout(undoTimeoutRef.current); undoTimeoutRef.current = null; }
  };

  const handleRestoreEntry = (entry) => updateEntry(entry.id, { isArchived: false });

  const switchNav = (i) => { setActiveNav(i); setSearchTerm(""); setTypeFilter("all"); };

  // ─── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display:      "flex",
      flexDirection: isMobile ? "column" : "row",
      height:       "100dvh",
      background:   "linear-gradient(160deg, #FFF8F2 0%, #FAF7F4 45%, #F8F5F1 100%)",
      overflow:     "hidden",
    }}>

      {/* ─── Thin orange brand stripe ─────────────────────────── */}
      <div style={{
        position:   "fixed",
        top:        0,
        left:       0,
        right:      0,
        height:     "3px",
        background: "linear-gradient(to right, #F97316 0%, #FBBF24 50%, #F97316 100%)",
        zIndex:     300,
      }} />

      {/* ─── Desktop Sidebar ──────────────────────────────────── */}
      {!isMobile && (
        <div style={{
          width:         "76px",
          background:    "linear-gradient(180deg, #1E1A18 0%, #1C1917 100%)",
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          paddingTop:    "28px",
          paddingBottom: "20px",
          gap:           "4px",
          flexShrink:    0,
          borderRight:   "1px solid rgba(255,255,255,0.04)",
        }}>
          {/* Brand mark */}
          <div style={{
            width:          "42px",
            height:         "42px",
            borderRadius:   "13px",
            background:     "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       "20px",
            marginBottom:   "24px",
            flexShrink:     0,
            boxShadow:      "0 4px 12px rgba(249,115,22,0.35)",
          }}>🧱</div>

          {NAV_ITEMS.map((item, i) => (
            <button
              key={i}
              onClick={() => switchNav(i)}
              title={item.label}
              style={{
                width:          "46px",
                height:         "46px",
                borderRadius:   "13px",
                border:         "none",
                cursor:         "pointer",
                fontSize:       "20px",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                background:     activeNav === i ? "rgba(249,115,22,0.18)" : "transparent",
                boxShadow:      activeNav === i ? "0 0 0 1px rgba(249,115,22,0.35)" : "none",
                transition:     "background 0.15s, box-shadow 0.15s",
              }}
            >
              {item.icon}
            </button>
          ))}
        </div>
      )}

      {/* ─── Main Content ─────────────────────────────────────── */}
      <div style={{
        flex:                    1,
        overflowY:               "auto",
        padding:                 isMobile ? "20px 14px 110px" : "36px 32px 80px",
        paddingTop:              isMobile ? "24px" : "40px",
        WebkitOverflowScrolling: "touch",
      }}>

        {/* ─── Header ─────────────────────────────────────────── */}
        <div style={{
          marginBottom:   isMobile ? "20px" : "28px",
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          flexDirection:  "row-reverse",
        }}>
          <div>
            {/* Title row */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
              <h1 style={{
                margin:        0,
                fontSize:      isMobile ? "24px" : "28px",
                fontWeight:    900,
                color:         "#1C1917",
                letterSpacing: "-1px",
                lineHeight:    1.1,
              }}>
                {activeNav === 2 ? "כספים" : activeNav === 1 ? "ארגון" : "Kulaba SOS"}
              </h1>
              <div
                className="animate-pulse-dot"
                style={{
                  width:        "9px",
                  height:       "9px",
                  borderRadius: "50%",
                  background:   "#F97316",
                  flexShrink:   0,
                  marginTop:    "4px",
                }}
              />
            </div>

            {/* Subtitle / stats */}
            {activeNav === 0 && (
              <div
                dir="rtl"
                style={{ display: "flex", gap: "10px", marginTop: "7px", flexWrap: "wrap" }}
              >
                <StatPill n={activeEntries.length} label="פעילים" />
                {newEntries.length > 0 && (
                  <StatPill n={newEntries.length} label="ממתינים לסיווג" accent />
                )}
                {taskEntries.length > 0 && (
                  <StatPill n={taskEntries.length} label="משימות" color="#10B981" />
                )}
              </div>
            )}
            {activeNav !== 0 && (
              <p style={{ margin: "5px 0 0", color: "#A8A29E", fontSize: "13px", fontWeight: 500 }}>
                {activeNav === 2 ? "תנועות כספיות פעילות" : "בלוקים מסווגים"}
              </p>
            )}
          </div>
        </div>

        {/* ─── Input Card ───────────────────────────────────────── */}
        <div style={{
          background:   "white",
          borderRadius: "22px",
          padding:      isMobile ? "14px" : "18px",
          marginBottom: isMobile ? "18px" : "26px",
          boxShadow:    "0 1px 2px rgba(28,25,23,0.04), 0 8px 28px rgba(28,25,23,0.08)",
          border:       "1px solid rgba(28,25,23,0.05)",
        }}>
          {!isExpandedInput ? (
            <>
              <div style={{ display: "flex", gap: "8px", flexDirection: "row-reverse" }}>
                {/* Input wrapper */}
                <div style={{
                  flex:         1,
                  display:      "flex",
                  alignItems:   "center",
                  background:   "#FAF7F4",
                  border:       "1.5px solid #EDE9E5",
                  borderRadius: "14px",
                  padding:      "0 14px",
                  minHeight:    isMobile ? "54px" : "50px",
                  transition:   "border-color 0.15s, box-shadow 0.15s",
                }}>
                  <input
                    dir="rtl"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                    placeholder="שגרו כל דבר — מחשבה, משימה, הוצאה..."
                    className="input-focus"
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

                {/* Submit button */}
                <button
                  onClick={handleAdd}
                  style={{
                    padding:      "0 20px",
                    borderRadius: "14px",
                    border:       "none",
                    background:   "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                    color:        "white",
                    cursor:       "pointer",
                    fontSize:     "15px",
                    fontWeight:   800,
                    minWidth:     "76px",
                    minHeight:    isMobile ? "54px" : "50px",
                    flexShrink:   0,
                    boxShadow:    "0 3px 10px rgba(249,115,22,0.32)",
                    letterSpacing: "0.2px",
                  }}
                >
                  שגר
                </button>
              </div>

              {/* Controls row */}
              <div style={{
                display:       "flex",
                flexDirection: "row-reverse",
                gap:           "7px",
                marginTop:     "11px",
                alignItems:    "center",
                flexWrap:      "wrap",
              }}>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  style={{
                    borderRadius: "10px",
                    border:       "1.5px solid #EDE9E5",
                    padding:      "7px 10px",
                    fontSize:     "13px",
                    background:   "white",
                    color:        "#44403C",
                    cursor:       "pointer",
                    minHeight:    "36px",
                    fontWeight:   500,
                  }}
                >
                  {ENTRY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                <button
                  onClick={() => setIsExpandedInput(true)}
                  style={{
                    padding:      "7px 13px",
                    borderRadius: "10px",
                    border:       "1.5px solid #EDE9E5",
                    background:   "white",
                    cursor:       "pointer",
                    color:        "#78716C",
                    fontSize:     "13px",
                    minHeight:    "36px",
                    fontWeight:   500,
                  }}
                >
                  + פרטים
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Expanded controls */}
              <div style={{
                display:       "flex",
                flexDirection: "row-reverse",
                gap:           "8px",
                marginBottom:  "12px",
                alignItems:    "center",
                flexWrap:      "wrap",
              }}>
                <button
                  onClick={handleAdd}
                  style={{
                    padding:      "10px 22px",
                    borderRadius: "13px",
                    border:       "none",
                    background:   "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                    color:        "white",
                    cursor:       "pointer",
                    fontWeight:   800,
                    fontSize:     "15px",
                    minHeight:    "46px",
                    boxShadow:    "0 3px 10px rgba(249,115,22,0.30)",
                  }}
                >
                  שגר
                </button>
                <button
                  onClick={resetInputState}
                  style={{
                    padding:      "10px 16px",
                    borderRadius: "13px",
                    border:       "1.5px solid #EDE9E5",
                    background:   "white",
                    cursor:       "pointer",
                    color:        "#78716C",
                    fontSize:     "14px",
                    minHeight:    "46px",
                    fontWeight:   500,
                  }}
                >
                  בטל
                </button>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  style={{
                    borderRadius: "13px",
                    border:       "1.5px solid #EDE9E5",
                    padding:      "10px",
                    fontSize:     "13px",
                    background:   "white",
                    color:        "#44403C",
                    minHeight:    "46px",
                    fontWeight:   500,
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
                className="input-focus"
                style={{
                  width:        "100%",
                  borderRadius: "13px",
                  border:       "1.5px solid #EDE9E5",
                  padding:      "12px 14px",
                  fontSize:     "15px",
                  textAlign:    "right",
                  boxSizing:    "border-box",
                  background:   "#FAF7F4",
                  color:        "#1C1917",
                  marginBottom: "8px",
                  minHeight:    "50px",
                  fontWeight:   600,
                }}
              />

              <textarea
                dir="rtl"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="תוכן..."
                className="input-focus"
                style={{
                  width:        "100%",
                  minHeight:    "100px",
                  borderRadius: "13px",
                  border:       "1.5px solid #EDE9E5",
                  padding:      "12px 14px",
                  fontSize:     "16px",
                  fontFamily:   "inherit",
                  resize:       "vertical",
                  textAlign:    "right",
                  boxSizing:    "border-box",
                  background:   "#FAF7F4",
                  color:        "#1C1917",
                }}
              />
            </>
          )}
        </div>

        {/* ─── Financial Summary ──────────────────────────────── */}
        {activeNav === 2 && (
          <div dir="rtl" style={{ marginBottom: isMobile ? "18px" : "22px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "10px" }}>
              {[
                { label: "הכנסות", amount: totalIncome,  color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", shadow: "rgba(22,163,74,0.10)" },
                { label: "הוצאות", amount: totalExpense, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", shadow: "rgba(220,38,38,0.10)" },
                { label: "מאזן",   amount: balance,      color: balance >= 0 ? "#F97316" : "#DC2626", bg: "#FFF7ED", border: "#FED7AA", shadow: "rgba(249,115,22,0.10)" },
              ].map(({ label, amount, color, bg, border, shadow }) => (
                <div key={label} style={{
                  background:   bg,
                  border:       `1px solid ${border}`,
                  borderRadius: "16px",
                  padding:      isMobile ? "12px 8px" : "16px",
                  textAlign:    "center",
                  boxShadow:    `0 2px 10px ${shadow}`,
                }}>
                  <div style={{ fontSize: "11px", color: "#78716C", fontWeight: 700, marginBottom: "6px", letterSpacing: "0.3px" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: isMobile ? "15px" : "18px", fontWeight: 900, color, direction: "ltr" }}>
                    ₪{Math.abs(amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {(totalIncome > 0 || totalExpense > 0) && (
              <div style={{
                background:   "white",
                border:       "1px solid rgba(28,25,23,0.06)",
                borderRadius: "14px",
                padding:      "13px 16px",
                boxShadow:    "0 1px 4px rgba(28,25,23,0.04)",
              }}>
                <div dir="rtl" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#A8A29E", marginBottom: "8px", fontWeight: 600 }}>
                  <span>יחס הכנסות / הוצאות</span>
                  <span>
                    {totalIncome + totalExpense > 0
                      ? `${Math.round((totalIncome / (totalIncome + totalExpense)) * 100)}% הכנסה`
                      : "—"}
                  </span>
                </div>
                <div style={{ height: "8px", borderRadius: "999px", background: "#FEE2E2", overflow: "hidden", direction: "rtl" }}>
                  <div style={{
                    height:     "100%",
                    borderRadius:"999px",
                    background: "linear-gradient(to left, #22C55E, #16A34A)",
                    width:      `${totalIncome + totalExpense > 0 ? Math.round((totalIncome / (totalIncome + totalExpense)) * 100) : 0}%`,
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── View Mode Segmented Control ───────────────────── */}
        <div
          dir="rtl"
          style={{
            display:      "flex",
            background:   "#EDE9E5",
            borderRadius: "14px",
            padding:      "4px",
            gap:          "3px",
            marginBottom: isMobile ? "14px" : "18px",
          }}
        >
          {[
            { mode: "active",  label: "פעילים",  count: activeEntries.length },
            { mode: "archive", label: "ארכיון",  count: archivedEntries.length },
          ].map(({ mode, label, count }) => {
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  flex:          1,
                  padding:       isMobile ? "9px 16px" : "8px 20px",
                  borderRadius:  "11px",
                  border:        "none",
                  background:    isActive ? "white" : "transparent",
                  color:         isActive ? "#1C1917" : "#78716C",
                  cursor:        "pointer",
                  fontSize:      "13px",
                  fontWeight:    isActive ? 700 : 500,
                  boxShadow:     isActive ? "0 1px 5px rgba(28,25,23,0.12)" : "none",
                  transition:    "all 0.16s ease",
                  display:       "flex",
                  alignItems:    "center",
                  justifyContent:"center",
                  gap:           "6px",
                }}
              >
                {label}
                <span style={{
                  background:   isActive ? "#F5F0EB" : "transparent",
                  color:        isActive ? "#78716C" : "#A8A29E",
                  borderRadius: "999px",
                  padding:      "1px 7px",
                  fontSize:     "11px",
                  fontWeight:   700,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── Search ────────────────────────────────────────── */}
        <div style={{ marginBottom: isMobile ? "12px" : "14px" }}>
          <div style={{ position: "relative", marginBottom: "9px" }}>
            <input
              dir="rtl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפש לפי תוכן, כותרת או קוד..."
              className="input-focus"
              style={{
                width:        "100%",
                borderRadius: "13px",
                border:       "1.5px solid #EDE9E5",
                padding:      searchTerm ? "10px 14px 10px 38px" : "10px 14px",
                fontSize:     isMobile ? "16px" : "14px",
                textAlign:    "right",
                boxSizing:    "border-box",
                background:   "white",
                color:        "#1C1917",
                boxShadow:    "0 1px 3px rgba(28,25,23,0.04)",
                outline:      "none",
                transition:   "border-color 0.15s, box-shadow 0.15s",
                fontWeight:   500,
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position:   "absolute",
                  left:       "11px",
                  top:        "50%",
                  transform:  "translateY(-50%)",
                  border:     "none",
                  background: "#EDE9E5",
                  color:      "#78716C",
                  fontSize:   "12px",
                  cursor:     "pointer",
                  padding:    "3px 6px",
                  borderRadius:"999px",
                  lineHeight: 1,
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Type filter pills */}
          <div style={{
            display:                 "flex",
            flexDirection:           "row-reverse",
            gap:                     "5px",
            overflowX:               "auto",
            paddingBottom:           "3px",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth:          "none",
          }}>
            {TYPE_FILTERS.map(({ value, label }) => {
              const isActive = typeFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  style={{
                    padding:      "5px 12px",
                    borderRadius: "999px",
                    border:       `1.5px solid ${isActive ? "transparent" : "#EDE9E5"}`,
                    background:   isActive ? "#F97316" : "white",
                    color:        isActive ? "white" : "#78716C",
                    fontSize:     "12px",
                    fontWeight:   isActive ? 700 : 500,
                    cursor:       "pointer",
                    flexShrink:   0,
                    whiteSpace:   "nowrap",
                    minHeight:    "30px",
                    boxShadow:    isActive ? "0 2px 6px rgba(249,115,22,0.25)" : "none",
                    transition:   "all 0.14s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Entries List ──────────────────────────────────── */}
        <div>
          {/* Results count when filtering */}
          {(searchTerm || typeFilter !== "all") && filteredEntries.length > 0 && (
            <div dir="rtl" style={{
              fontSize:     "12px",
              color:        "#A8A29E",
              marginBottom: "10px",
              fontWeight:   500,
            }}>
              {filteredEntries.length} תוצאות
            </div>
          )}

          {/* Empty state */}
          {filteredEntries.length === 0 && (
            <div style={{
              textAlign:     "center",
              padding:       "70px 20px 50px",
              display:       "flex",
              flexDirection: "column",
              alignItems:    "center",
              gap:           "10px",
            }}>
              <div style={{ fontSize: "52px", opacity: 0.45, lineHeight: 1 }}>
                {searchTerm ? "🔍" : viewMode === "archive" ? "📦" : "🧱"}
              </div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "#44403C", opacity: 0.45 }}>
                {searchTerm || typeFilter !== "all"
                  ? "לא נמצאו תוצאות"
                  : viewMode === "active" ? "אין בלוקים פעילים" : "הארכיון ריק"}
              </div>
              <div style={{ fontSize: "13px", color: "#A8A29E", fontWeight: 500 }}>
                {searchTerm || typeFilter !== "all"
                  ? "נסה לחפש במילים אחרות"
                  : viewMode === "active" ? "שגרו את המחשבה הראשונה למעלה" : "כל הבלוקים במצב פעיל"}
              </div>
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

      {/* ─── Mobile Bottom Nav ────────────────────────────────── */}
      {isMobile && (
        <div style={{
          position:            "fixed",
          bottom:              0,
          left:                0,
          right:               0,
          background:          "rgba(22,19,17,0.94)",
          backdropFilter:      "blur(24px)",
          WebkitBackdropFilter:"blur(24px)",
          display:             "flex",
          justifyContent:      "space-around",
          padding:             "8px 0 max(12px, env(safe-area-inset-bottom))",
          zIndex:              200,
          borderTop:           "1px solid rgba(255,255,255,0.07)",
        }}>
          {NAV_ITEMS.map((item, i) => {
            const isActive = activeNav === i;
            return (
              <button
                key={i}
                onClick={() => switchNav(i)}
                style={{
                  display:       "flex",
                  flexDirection: "column",
                  alignItems:    "center",
                  gap:           "3px",
                  background:    "transparent",
                  border:        "none",
                  cursor:        "pointer",
                  padding:       "4px 16px",
                  position:      "relative",
                }}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div style={{
                    position:     "absolute",
                    top:          "-2px",
                    left:         "50%",
                    transform:    "translateX(-50%)",
                    width:        "4px",
                    height:       "4px",
                    borderRadius: "50%",
                    background:   "#F97316",
                  }} />
                )}
                <span style={{
                  fontSize: "22px",
                  filter:   isActive ? "none" : "grayscale(40%)",
                  opacity:  isActive ? 1 : 0.6,
                  transition: "opacity 0.15s, filter 0.15s",
                }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize:   "10px",
                  color:      isActive ? "#F97316" : "#6B6560",
                  fontWeight: isActive ? 800 : 500,
                  transition: "color 0.15s",
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <UndoToast show={showUndo && !!lastDeletedEntry} onUndo={handleUndoDelete} />
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function StatPill({ n, label, accent, color }) {
  const c = accent ? "#F97316" : (color || "#78716C");
  return (
    <span style={{ fontSize: "12px", color: "#A8A29E", fontWeight: 500 }}>
      <span style={{ color: c, fontWeight: 800 }}>{n}</span>{" "}{label}
    </span>
  );
}
