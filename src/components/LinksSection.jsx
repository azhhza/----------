function OutgoingLinkRow({ targetEntry, isPinned, isArchiveView, onPeek, onTogglePin, onRemove }) {
  return (
    <div
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
          onClick={() => onPeek(targetEntry)}
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
            <div style={{ fontSize: "14px", flexShrink: 0 }} title="קישור נעוץ">
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
            onClick={() => onTogglePin(targetEntry.code)}
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
            onClick={() => onRemove(targetEntry.code)}
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
}

function IncomingLinkRow({ sourceEntry, onPeek }) {
  return (
    <button
      onClick={() => onPeek(sourceEntry)}
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
    <div
      style={{
        marginTop: "16px",
        paddingTop: "14px",
        borderTop: "1px solid #e2e8f0",
      }}
    >
      <button
        onClick={onToggleLinksOpen}
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
        {isLinksOpen ? "הסתר קישורים" : `הצג קישורים (${totalLinks})`}
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
                    onClick={onTogglePickerOpen}
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
                        onChange={(e) => onSearchChange(e.target.value)}
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
                              onClick={() => onAddLink(item.code)}
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
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {incomingLinkedEntries.map((item) => (
                  <IncomingLinkRow key={item.id} sourceEntry={item} onPeek={onPeek} />
                ))}
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
  );
}
