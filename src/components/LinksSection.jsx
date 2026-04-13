function OutgoingLinkRow({ targetEntry, isPinned, isArchiveView, onPeek, onTogglePin, onRemove }) {
  return (
    <div style={{
      padding:       "10px 12px",
      borderRadius:  "12px",
      background:    isPinned ? "#FFF7ED" : "#FAFAF9",
      border:        isPinned ? "1px solid #FED7AA" : "1px solid #E7E5E4",
      display:       "flex",
      flexDirection: "column",
      gap:           "8px",
    }}>
      <button
        onClick={() => onPeek(targetEntry)}
        style={{
          border:         "none",
          background:     "transparent",
          padding:        0,
          margin:         0,
          cursor:         "pointer",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            "10px",
          width:          "100%",
          textAlign:      "right",
        }}
        title="הצג הצצה"
      >
        <div style={{ fontSize: "11px", color: "#A8A29E", whiteSpace: "nowrap", flexShrink: 0 }}>
          {targetEntry.code}
        </div>
        <div style={{
          flex:          1,
          minWidth:      0,
          textAlign:     "right",
          color:         "#1C1917",
          fontSize:      "14px",
          fontWeight:    isPinned ? 700 : 500,
          whiteSpace:    "nowrap",
          overflow:      "hidden",
          textOverflow:  "ellipsis",
        }}>
          {targetEntry.title && targetEntry.title.trim()
            ? targetEntry.title
            : targetEntry.text_content || targetEntry.content}
        </div>
        {isPinned && (
          <div style={{ fontSize: "13px", flexShrink: 0 }} title="קישור נעוץ">📌</div>
        )}
      </button>

      {!isArchiveView && (
        <div style={{ display: "flex", flexDirection: "row-reverse", gap: "6px" }}>
          <button
            onClick={() => onTogglePin(targetEntry.code)}
            style={{
              border:       isPinned ? "1px solid #FED7AA" : "1px solid #E7E5E4",
              background:   "white",
              borderRadius: "8px",
              padding:      "5px 10px",
              cursor:       "pointer",
              fontSize:     "12px",
              color:        isPinned ? "#C2410C" : "#78716C",
            }}
          >
            {isPinned ? "בטל נעיצה" : "נעץ"}
          </button>
          <button
            onClick={() => onRemove(targetEntry.code)}
            style={{
              border:       "1px solid #FED7AA",
              background:   "#FFF7ED",
              color:        "#C2410C",
              borderRadius: "8px",
              padding:      "5px 10px",
              cursor:       "pointer",
              fontSize:     "12px",
            }}
          >
            הסר
          </button>
        </div>
      )}
    </div>
  );
}

function IncomingLinkRow({ sourceEntry, onPeek }) {
  return (
    <button
      onClick={() => onPeek(sourceEntry)}
      style={{
        width:          "100%",
        border:         "1px solid #E7E5E4",
        borderRadius:   "12px",
        background:     "#FAFAF9",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            "10px",
        padding:        "10px 12px",
        cursor:         "pointer",
        textAlign:      "right",
      }}
      title="הצג הצצה"
    >
      <div style={{ fontSize: "11px", color: "#A8A29E", whiteSpace: "nowrap", flexShrink: 0 }}>
        {sourceEntry.code}
      </div>
      <div style={{
        flex:          1,
        minWidth:      0,
        textAlign:     "right",
        color:         "#1C1917",
        fontSize:      "14px",
        fontWeight:    500,
        whiteSpace:    "nowrap",
        overflow:      "hidden",
        textOverflow:  "ellipsis",
      }}>
        {sourceEntry.title && sourceEntry.title.trim()
          ? sourceEntry.title
          : sourceEntry.text_content || sourceEntry.content}
      </div>
    </button>
  );
}

export default function LinksSection({
  outgoingLinkedEntries,
  incomingLinkedEntries,
  availableLinkTargets,
  isArchiveView,
  isLinksOpen,
  onToggleLinksOpen,
  linkedSearchTerm,
  onSearchChange,
  isLinkPickerOpen,
  onTogglePickerOpen,
  onAddLink,
  onRemoveLink,
  onTogglePin,
  onPeek,
}) {
  const totalLinks = outgoingLinkedEntries.length + incomingLinkedEntries.length;

  return (
    <div style={{ marginTop: "12px" }}>
      {isLinksOpen && (
        <div dir="rtl" style={{
          display:       "flex",
          flexDirection: "column",
          gap:           "14px",
          background:    "#FAFAF9",
          border:        "1px solid #E7E5E4",
          borderRadius:  "14px",
          padding:       "14px",
        }}>
          {/* Outgoing */}
          <div>
            <div style={{
              fontSize:     "12px",
              fontWeight:   700,
              color:        "#78716C",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}>
              קישורים לפתקים נוספים
            </div>

            {!isArchiveView && (
              <div style={{
                marginBottom: "10px",
                border:       "1px solid #E7E5E4",
                borderRadius: "12px",
                background:   "white",
                overflow:     "hidden",
              }}>
                <div style={{
                  display:        "flex",
                  flexDirection:  "row-reverse",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  gap:            "10px",
                  padding:        "10px 12px",
                  background:     "#F5F5F4",
                  borderBottom:   isLinkPickerOpen ? "1px solid #E7E5E4" : "none",
                }}>
                  <button
                    onClick={onTogglePickerOpen}
                    style={{
                      border:       "none",
                      background:   "#F97316",
                      color:        "white",
                      borderRadius: "8px",
                      padding:      "7px 12px",
                      cursor:       "pointer",
                      fontSize:     "13px",
                      fontWeight:   700,
                      flexShrink:   0,
                    }}
                  >
                    {isLinkPickerOpen ? "סגור" : "+ קישור"}
                  </button>
                  <div style={{ textAlign: "right", flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1C1917" }}>
                      הוספת קישור
                    </div>
                    <div style={{ fontSize: "12px", color: "#A8A29E" }}>
                      חפש לפי קוד או כותרת
                    </div>
                  </div>
                </div>

                {isLinkPickerOpen && (
                  <div style={{ padding: "12px" }}>
                    <input
                      dir="rtl"
                      value={linkedSearchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder="חפש לפי קוד או כותרת..."
                      style={{
                        width:        "100%",
                        borderRadius: "10px",
                        border:       "1px solid #E7E5E4",
                        padding:      "9px 12px",
                        fontSize:     "14px",
                        textAlign:    "right",
                        boxSizing:    "border-box",
                        background:   "#FAFAF9",
                        marginBottom: "8px",
                      }}
                    />
                    <div style={{
                      border:       "1px solid #E7E5E4",
                      borderRadius: "10px",
                      background:   "white",
                      overflow:     "hidden",
                    }}>
                      <div style={{
                        padding:        "7px 12px",
                        background:     "#FAFAF9",
                        borderBottom:   "1px solid #E7E5E4",
                        fontSize:       "11px",
                        color:          "#A8A29E",
                        textAlign:      "right",
                      }}>
                        {availableLinkTargets.length > 0
                          ? `${availableLinkTargets.length} פתקים מתאימים`
                          : "לא נמצאו פתקים"}
                      </div>
                      {availableLinkTargets.length > 0 ? (
                        <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                          {availableLinkTargets.map((item, index) => (
                            <button
                              key={item.id}
                              onClick={() => onAddLink(item.code)}
                              style={{
                                border:       "none",
                                borderBottom: index === availableLinkTargets.length - 1 ? "none" : "1px solid #F5F5F4",
                                background:   "white",
                                cursor:       "pointer",
                                padding:      "10px 12px",
                                textAlign:    "right",
                              }}
                            >
                              <div style={{ fontSize: "11px", color: "#A8A29E", marginBottom: "2px" }}>
                                קוד: {item.code}
                              </div>
                              <div style={{
                                fontSize:     "14px",
                                color:        "#1C1917",
                                fontWeight:   600,
                                whiteSpace:   "nowrap",
                                overflow:     "hidden",
                                textOverflow: "ellipsis",
                              }}>
                                {item.title && item.title.trim()
                                  ? item.title
                                  : item.text_content || item.content}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: "12px", fontSize: "13px", color: "#A8A29E", textAlign: "right" }}>
                          נסה חיפוש אחר.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {outgoingLinkedEntries.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {outgoingLinkedEntries.map((item) => (
                  <OutgoingLinkRow
                    key={item.targetEntry.id}
                    targetEntry={item.targetEntry}
                    isPinned={item.isPinned}
                    isArchiveView={isArchiveView}
                    onPeek={onPeek}
                    onTogglePin={onTogglePin}
                    onRemove={onRemoveLink}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                fontSize:     "13px",
                color:        "#A8A29E",
                background:   "white",
                border:       "1px solid #E7E5E4",
                borderRadius: "10px",
                padding:      "10px 12px",
              }}>
                אין עדיין קישורים.
              </div>
            )}
          </div>

          {/* Incoming */}
          <div>
            <div style={{
              fontSize:     "12px",
              fontWeight:   700,
              color:        "#78716C",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}>
              אזכורים לפתק הזה
            </div>
            {incomingLinkedEntries.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {incomingLinkedEntries.map((item) => (
                  <IncomingLinkRow key={item.id} sourceEntry={item} onPeek={onPeek} />
                ))}
              </div>
            ) : (
              <div style={{
                fontSize:     "13px",
                color:        "#A8A29E",
                background:   "white",
                border:       "1px solid #E7E5E4",
                borderRadius: "10px",
                padding:      "10px 12px",
              }}>
                אין עדיין אזכורים.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
