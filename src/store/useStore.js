import { create } from "zustand";

const getLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

function orderLinkedEntriesPinnedFirst(linkedEntries) {
  const pinned = [];
  const unpinned = [];

  for (const item of linkedEntries || []) {
    if (item.isPinned) pinned.push(item);
    else unpinned.push(item);
  }

  return [...pinned, ...unpinned];
}

function buildObjectUrl(file) {
  try {
    if (
      typeof URL !== "undefined" &&
      typeof URL.createObjectURL === "function" &&
      file instanceof Blob
    ) {
      return URL.createObjectURL(file);
    }
  } catch (error) {
    console.warn("Failed to create object URL:", error);
  }

  return "";
}

function normalizeContentType(raw) {
  if (
    raw === "file" ||
    raw === "image" ||
    raw === "audio" ||
    raw === "video" ||
    raw === "pdf"
  ) {
    return raw;
  }
  return "text";
}

function deriveBlockType(raw) {
  if (raw === "income" || raw === "expense" || raw === "note") {
    return raw;
  }
  return "note";
}

function deriveAllocationStatus(data = {}) {
  const hasBlockType =
    data.block_type === "income" ||
    data.block_type === "expense" ||
    data.block_type === "note";

  const hasAmount = data.amount !== null && data.amount !== undefined;

  const hasMeaningfulInfo = Boolean(
    hasBlockType || hasAmount || data.financial_kind || data.project_label
  );

  if (!hasMeaningfulInfo) return "new";
  if (hasBlockType) return "sorted";
  return "partial";
}

function normalizeBlock(input = {}, nextCode) {
  const now = getLocalDateTimeString();

  const normalizedPtkiyot = (input.ptkiyot || []).map((ptkit, index) => ({
    id: ptkit.id ?? Date.now() + index,
    content: ptkit.content || "",
    created_at: ptkit.created_at || ptkit.createdAt || now,
    createdAt: ptkit.createdAt || ptkit.created_at || now,
    localCode: ptkit.localCode,
  }));

  const normalizedLinkedEntries = orderLinkedEntriesPinnedFirst(
    input.linkedEntries || []
  );

  const rawContentType =
    input.content_type ||
    input.contentType ||
    (input.file_name || input.file_path || input.mime_type ? "file" : "text");

  const content_type = normalizeContentType(rawContentType);

  const text_content =
    input.text_content ??
    (typeof input.contentPayload === "string"
      ? input.contentPayload
      : input.text_content) ??
    input.content ??
    "";

  const file_path =
    input.file_path ??
    input.contentPayload?.file_path ??
    input.contentPayload?.filePath ??
    input.filePath ??
    "";

  const file_name =
    input.file_name ??
    input.contentPayload?.file_name ??
    input.contentPayload?.fileName ??
    input.fileName ??
    "";

  const mime_type =
    input.mime_type ??
    input.contentPayload?.mime_type ??
    input.contentPayload?.mimeType ??
    input.mimeType ??
    "";

  const block_type = deriveBlockType(input.block_type || input.blockType || input.type);
  const amount = input.amount ?? null;
  const financial_kind = input.financial_kind ?? input.financialKind ?? "";
  const project_label =
    input.project_label ??
    input.projectLabel ??
    input.projectId ??
    "";

  const allocation_status =
    input.allocation_status ||
    (input.isAllocated
      ? "sorted"
      : deriveAllocationStatus({
          block_type,
          amount,
          financial_kind,
          project_label,
        }));

  const created_at = input.created_at || input.createdAt || now;
  const updated_at =
    input.updated_at ||
    input.updatedAt ||
    input.allocatedAt ||
    created_at;

  const id = input.id ?? Date.now() + Math.floor(Math.random() * 1000);

  return {
    ...input,

    id,
    code: input.code ?? nextCode,

    created_at,
    updated_at,
    createdAt: created_at,
    updatedAt: updated_at,

    content_type,
    text_content,
    file_path,
    file_name,
    mime_type,

    contentType: input.contentType || content_type,
    contentPayload:
      input.contentPayload ??
      (content_type === "text"
        ? text_content
        : {
            file_path,
            file_name,
            mime_type,
          }),

    block_type,
    financial_kind,
    amount,
    project_label,
    allocation_status,

    blockType: input.blockType || block_type,
    financialKind: input.financialKind || financial_kind,
    projectLabel: input.projectLabel || project_label,
    allocatedAt: input.allocatedAt || null,
    isAllocated: input.isAllocated ?? allocation_status === "sorted",

    type: input.type || block_type,
    title: input.title || "",
    content: input.content ?? text_content ?? "",
    ptkiyot: normalizedPtkiyot,
    linkedEntries: normalizedLinkedEntries,
    isArchived: input.isArchived ?? false,
  };
}

const initialEntries = [
  {
    id: 1,
    code: 1001,
    type: "note",
    title: "",
    content: "פגישה עם לקוח כהן",
    createdAt: "2024-04-01 10:30",
    ptkiyot: [],
    linkedEntries: [],
    isArchived: false,
  },
  {
    id: 2,
    code: 1002,
    type: "task",
    title: "",
    content: "לקנות חומרי בניין",
    createdAt: "2024-04-01 12:15",
    ptkiyot: [],
    linkedEntries: [],
    isArchived: false,
  },
  {
    id: 3,
    code: 1003,
    type: "finance",
    title: "",
    content: 'הוצאה: 250 ש"ח על דלק',
    createdAt: "2024-04-01 14:00",
    ptkiyot: [],
    linkedEntries: [],
    isArchived: false,
  },
];

const useStore = create((set) => ({
  entries: initialEntries.map((entry, index) => normalizeBlock(entry, 1001 + index)),
  nextCode: 1004,

  addEntry: (entry) =>
    set((state) => {
      const normalizedEntry = normalizeBlock(
        {
          ...entry,
          title: entry.title || "",
          ptkiyot: entry.ptkiyot || [],
          linkedEntries: orderLinkedEntriesPinnedFirst(entry.linkedEntries || []),
          isArchived: false,
        },
        state.nextCode
      );

      return {
        entries: [normalizedEntry, ...state.entries],
        nextCode: state.nextCode + 1,
      };
    }),

  dispatchBlock: (payload = {}) =>
    set((state) => {
      const now = getLocalDateTimeString();
      const hasFile =
        payload.file ||
        payload.file_path ||
        payload.file_name ||
        payload.mime_type ||
        payload.contentType === "file" ||
        payload.content_type === "file";

      const file = payload.file;
      const file_path =
        payload.file_path ||
        payload.filePath ||
        payload.contentPayload?.file_path ||
        payload.contentPayload?.filePath ||
        (file ? buildObjectUrl(file) : "");

      const file_name =
        payload.file_name ||
        payload.fileName ||
        payload.contentPayload?.file_name ||
        payload.contentPayload?.fileName ||
        file?.name ||
        "";

      const mime_type =
        payload.mime_type ||
        payload.mimeType ||
        payload.contentPayload?.mime_type ||
        payload.contentPayload?.mimeType ||
        file?.type ||
        "";

      const text_content =
        payload.text_content ??
        payload.text ??
        (typeof payload.contentPayload === "string"
          ? payload.contentPayload
          : payload.content ?? "");

      const content_type = normalizeContentType(
        payload.content_type || payload.contentType || (hasFile ? "file" : "text")
      );

      const block = normalizeBlock(
        {
          ...payload,
          id: payload.id ?? Date.now(),
          created_at: payload.created_at || now,
          updated_at: payload.updated_at || now,
          content_type,
          text_content: content_type === "text" ? text_content : payload.text_content || "",
          file_path: content_type === "text" ? "" : file_path,
          file_name: content_type === "text" ? "" : file_name,
          mime_type: content_type === "text" ? "" : mime_type,
          block_type: payload.block_type || payload.blockType || "note",
          financial_kind: payload.financial_kind || payload.financialKind || "",
          amount: payload.amount ?? null,
          project_label:
            payload.project_label ?? payload.projectLabel ?? payload.projectId ?? "",
          allocation_status: "new",
          ptkiyot: payload.ptkiyot || [],
          content:
            content_type === "text"
              ? text_content
              : payload.content || file_name || "",
          type: payload.type || payload.block_type || payload.blockType || "note",
          contentPayload:
            payload.contentPayload ??
            (content_type === "text"
              ? text_content
              : {
                  file_path: file_path,
                  file_name: file_name,
                  mime_type: mime_type,
                }),
        },
        state.nextCode
      );

      return {
        entries: [block, ...state.entries],
        nextCode: state.nextCode + 1,
      };
    }),

  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id ? { ...entry, isArchived: true } : entry
      ),
    })),

  updateEntry: (id, updates) =>
    set((state) => ({
      entries: state.entries.map((entry) => {
        if (entry.id !== id) return entry;

        const merged = { ...entry, ...updates };
        const updatedAt = getLocalDateTimeString();

        return normalizeBlock(
          {
            ...merged,
            updated_at: updates.updated_at || updates.updatedAt || updatedAt,
          },
          entry.code
        );
      }),
    })),

  allocateBlock: (blockId, allocationUpdates = {}) =>
    set((state) => ({
      entries: state.entries.map((entry) => {
        if (entry.id !== blockId) return entry;

        const updated_at = getLocalDateTimeString();

        const nextData = {
          ...entry,
          ...allocationUpdates,
          block_type:
            allocationUpdates.block_type ??
            allocationUpdates.blockType ??
            entry.block_type,
          financial_kind:
            allocationUpdates.financial_kind ??
            allocationUpdates.financialKind ??
            entry.financial_kind,
          amount:
            allocationUpdates.amount !== undefined
              ? allocationUpdates.amount
              : entry.amount,
          project_label:
            allocationUpdates.project_label ??
            allocationUpdates.projectLabel ??
            allocationUpdates.projectId ??
            entry.project_label,
          updated_at,
          updatedAt: updated_at,
        };

        const allocation_status = deriveAllocationStatus(nextData);

        return normalizeBlock(
          {
            ...nextData,
            allocation_status,
            allocatedAt:
              allocation_status === "sorted"
                ? entry.allocatedAt || updated_at
                : entry.allocatedAt || null,
            isAllocated: allocation_status === "sorted",
          },
          entry.code
        );
      }),
    })),

  addPtkit: (blockId, content) =>
    set((state) => ({
      entries: state.entries.map((entry) => {
        if (entry.id !== blockId) return entry;

        const ptkiyot = entry.ptkiyot || [];
        const baseCode = entry.code ?? entry.id;
        const nextIndex = ptkiyot.length + 1;
        const created_at = getLocalDateTimeString();

        const newPtkit = {
          id: Date.now(),
          content,
          created_at,
          createdAt: created_at,
          localCode: `${baseCode}.${nextIndex}`,
        };

        return {
          ...entry,
          ptkiyot: [...ptkiyot, newPtkit],
          updated_at: created_at,
          updatedAt: created_at,
        };
      }),
    })),

  clearEntries: () =>
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.isArchived ? entry : { ...entry, isArchived: true }
      ),
    })),

  permanentlyDeleteEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((entry) => entry.id !== id),
    })),

  restorePermanentlyDeletedEntry: (entry) =>
    set((state) => ({
      entries: [
        normalizeBlock(entry, entry.code || state.nextCode),
        ...state.entries.filter((e) => e.id !== entry.id),
      ],
    })),

  addLinkedEntry: (entryId, targetCode) =>
    set((state) => {
      const targetCodeNumber = Number(targetCode);
      if (!Number.isFinite(targetCodeNumber)) return state;

      const entry = state.entries.find((e) => e.id === entryId);
      if (!entry) return state;

      if (entry.code === targetCodeNumber) return state;

      const targetExists = state.entries.some((e) => e.code === targetCodeNumber);
      if (!targetExists) return state;

      const linkedEntries = entry.linkedEntries || [];
      const alreadyLinked = linkedEntries.some(
        (item) => item.code === targetCodeNumber
      );
      if (alreadyLinked) return state;

      const nextLinkedEntries = orderLinkedEntriesPinnedFirst([
        ...linkedEntries,
        { code: targetCodeNumber, isPinned: false },
      ]);

      return {
        entries: state.entries.map((e) =>
          e.id === entryId
            ? {
                ...e,
                linkedEntries: nextLinkedEntries,
                updated_at: getLocalDateTimeString(),
                updatedAt: getLocalDateTimeString(),
              }
            : e
        ),
      };
    }),

  removeLinkedEntry: (entryId, targetCode) =>
    set((state) => {
      const targetCodeNumber = Number(targetCode);
      if (!Number.isFinite(targetCodeNumber)) return state;

      const updated_at = getLocalDateTimeString();

      return {
        entries: state.entries.map((entry) => {
          if (entry.id !== entryId) return entry;

          return {
            ...entry,
            linkedEntries: (entry.linkedEntries || []).filter(
              (item) => item.code !== targetCodeNumber
            ),
            updated_at,
            updatedAt: updated_at,
          };
        }),
      };
    }),

  togglePinnedLinkedEntry: (entryId, targetCode) =>
    set((state) => {
      const targetCodeNumber = Number(targetCode);
      if (!Number.isFinite(targetCodeNumber)) return state;

      const updated_at = getLocalDateTimeString();

      return {
        entries: state.entries.map((entry) => {
          if (entry.id !== entryId) return entry;

          const nextLinkedEntries = (entry.linkedEntries || []).map((item) =>
            item.code === targetCodeNumber
              ? { ...item, isPinned: !item.isPinned }
              : item
          );

          return {
            ...entry,
            linkedEntries: orderLinkedEntriesPinnedFirst(nextLinkedEntries),
            updated_at,
            updatedAt: updated_at,
          };
        }),
      };
    }),
}));

export default useStore;