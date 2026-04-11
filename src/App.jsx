import { useEffect, useRef, useState } from "react";
import useStore from "./store/useStore";
import EntryItem from "./components/EntryItem";
import UndoToast from "./components/UndoToast";

export default function App() {
  const entries = useStore((state) => state.entries);
  const addEntry = useStore((state) => state.addEntry);
  const removeEntry = useStore((state) => state.removeEntry);
  const updateEntry = useStore((state) => state.updateEntry);
  const clearEntries = useStore((state) => state.clearEntries);

  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isExpandedInput, setIsExpandedInput] = useState(false);
  const [entryType, setEntryType] = useState("note");
  const [lastDeletedEntry, setLastDeletedEntry] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [viewMode, setViewMode] = useState("active");

  const undoTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const activeEntries = entries.filter((entry) => !entry.isArchived);
  const archivedEntries = entries.filter((entry) => entry.isArchived);
  const visibleEntries = viewMode === "active" ? activeEntries : archivedEntries;

  const getLocalDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const resetInputState = () => {
    setInput("");
    setTitle("");
    setContent("");
    setIsExpandedInput(false);
  };

  const handleAdd = () => {
    const quickText = input.trim();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const hasExpandedData = trimmedTitle || trimmedContent;
    const baseTextContent = hasExpandedData ? trimmedContent : quickText;
    if (!hasExpandedData && !quickText) return;

    const resolvedBlockType = entryType === "finance" ? "expense" : "note";
    const resolvedFinancialKind = entryType === "finance" ? "business" : "";
    const resolvedTextContent = [trimmedTitle, baseTextContent]
      .filter(Boolean)
      .join("\n\n");

    const newEntry = {
      id: Date.now(),
      type: entryType,
      block_type: resolvedBlockType,
      financial_kind: resolvedFinancialKind,
      amount: null,
      project_label: "",
      allocation_status: "new",
      title: hasExpandedData ? trimmedTitle : "",
      content: baseTextContent,
      text_content: resolvedTextContent,
      file_path: "",
      file_name: "",
      mime_type: "",
      ptkiyot: [],
      createdAt: getLocalDateTimeString(),
    };

    addEntry(newEntry);
    resetInputState();
  };

  const handleDeleteEntry = (entry) => {
    removeEntry(entry.id);
    setLastDeletedEntry(entry);
    setShowUndo(true);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

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

  const handleRestoreEntry = (entry) => {
    updateEntry(entry.id, { isArchived: false });
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8fafc" }}>
      {/* סרגל צד שמאלי - תוקן עם תגיות סגורות */}
      <div
        style={{
          width: "80px",
          background: "#1e293b",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "20px",
        }}
      >
        <div style={{ marginBottom: "20px" }}>🧱</div>
        <div style={{ marginBottom: "20px" }}>📁</div>
        <div style={{ marginBottom: "20px" }}>💰</div>
        <div style={{ marginBottom: "20px" }}>📅</div>
      </div>

      <div style={{ flex: 1, padding: "24px 24px 32px", overflowY: "auto" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "20px",
            alignItems: "flex-end",
          }}
        >
          <h1 style={{ margin: 0, color: "#0f172a", fontSize: "28px" }}>
            Kulaba SOS
          </h1>
          <p
            style={{
              margin: 0,
              color: "#64748b",
              textAlign: "right",
              fontSize: "15px",
            }}
          >
            רושמים בטירוף, מסדרים בנחת
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "18px",
            marginBottom: "28px",
            boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                color: "#475569",
              }}
            >
              📎 קבצים
            </div>
            <div
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                color: "#475569",
              }}
            >
              🖼️ מדיה
            </div>
            <div
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                color: "#475569",
              }}
            >
              🎤 אודיו
            </div>
            <div
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                color: "#475569",
              }}
            >
              📄 PDF
            </div>
          </div>

          {!isExpandedInput ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row-reverse",
                  gap: "12px",
                  alignItems: "stretch",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "16px",
                    padding: "0 14px",
                    minHeight: "56px",
                  }}
                >
                  <input
                    dir="rtl"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="שגרו כל דבר, סדרו יותר מאוחר"
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontSize: "16px",
                      textAlign: "right",
                      background: "transparent",
                    }}
                  />
                </div>

                <button
                  onClick={handleAdd}
                  style={{
                    minWidth: "108px",
                    padding: "0 18px",
                    borderRadius: "16px",
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  שגר
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row-reverse",
                  gap: "10px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    padding: "8px 12px",
                    fontSize: "14px",
                    background: "white",
                    minWidth: "140px",
                  }}
                >
                  <option value="note">בלוק כללי</option>
                  <option value="task">משימה</option>
                  <option value="reminder">תזכורת</option>
                  <option value="idea">רעיון</option>
                  <option value="finance">בלוק כספי</option>
                  <option value="activity">פעילות</option>
                </select>

                <button
                  onClick={() => setIsExpandedInput(true)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    background: "white",
                    cursor: "pointer",
                    color: "#0f172a",
                  }}
                >
                  פתיחה מורחבת
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row-reverse",
                  gap: "10px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={handleAdd}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "14px",
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  שגר
                </button>

                <button
                  onClick={resetInputState}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "14px",
                    border: "1px solid #cbd5e1",
                    background: "white",
                    cursor: "pointer",
                    color: "#0f172a",
                  }}
                >
                  בטל
                </button>

                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  style={{
                    borderRadius: "14px",
                    border: "1px solid #cbd5e1",
                    padding: "10px 12px",
                    fontSize: "14px",
                    background: "white",
                  }}
                >
                  <option value="note">בלוק כללי</option>
                  <option value="task">משימה</option>
                  <option value="reminder">תזכורת</option>
                  <option value="idea">רעיון</option>
                  <option value="finance">בלוק כספי</option>
                  <option value="activity">פעילות</option>
                </select>
              </div>

              <input
                dir="rtl"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="כותרת לבלוק (אופציונלי)"
                style={{
                  width: "100%",
                  borderRadius: "14px",
                  border: "1px solid #cbd5e1",
                  padding: "12px 14px",
                  fontSize: "15px",
                  textAlign: "right",
                  boxSizing: "border-box",
                  background: "#f8fafc",
                }}
              />

              <textarea
                dir="rtl"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "130px",
                  borderRadius: "14px",
                  border: "1px solid #cbd5e1",
                  padding: "14px",
                  fontSize: "16px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  textAlign: "right",
                  boxSizing: "border-box",
                  background: "#f8fafc",
                }}
              />
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <button
            onClick={() => setViewMode("active")}
            style={{
              padding: "8px 14px",
              borderRadius: "12px",
              border: viewMode === "active" ? "none" : "1px solid #cbd5e1",
              background: viewMode === "active" ? "#2563eb" : "white",
              color: viewMode === "active" ? "white" : "#0f172a",
              cursor: "pointer",
            }}
          >
            רציף הבלוקים ({activeEntries.length})
          </button>

          <button
            onClick={() => setViewMode("archive")}
            style={{
              padding: "8px 14px",
              borderRadius: "12px",
              border: viewMode === "archive" ? "none" : "1px solid #cbd5e1",
              background: viewMode === "archive" ? "#2563eb" : "white",
              color: viewMode === "archive" ? "white" : "#0f172a",
              cursor: "pointer",
            }}
          >
            ארכיון ({archivedEntries.length})
          </button>
        </div>

        <div style={{ marginTop: "20px", paddingBottom: "90px" }}>
          {visibleEntries.map((entry) => (
            <EntryItem
              key={entry.id}
              entry={entry}
              onDelete={handleDeleteEntry}
              isArchiveView={viewMode === "archive"}
              onRestore={handleRestoreEntry}
            />
          ))}
        </div>

        <UndoToast
          show={showUndo && !!lastDeletedEntry}
          onUndo={handleUndoDelete}
        />
      </div>
    </div>
  );
}