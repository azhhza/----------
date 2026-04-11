/**
 * @typedef {{ code: number, isPinned: boolean }} LinkedEntry
 */

/**
 * @typedef {Object} Ptkit
 * @property {number} id
 * @property {string} content
 * @property {string} createdAt
 * @property {string} localCode
 */

/**
 * @typedef {Object} Entry
 * @property {number|string} id
 * @property {number} code
 * @property {string} type
 * @property {string} title
 * @property {string} content
 * @property {string} createdAt
 * @property {boolean} isArchived
 * @property {Ptkit[]} ptkiyot
 * @property {LinkedEntry[]} linkedEntries
 */

export const EntryType = {
  NOTE: "note",
  TASK: "task",
  FINANCE: "finance",
  REMINDER: "reminder",
  IDEA: "idea",
  ACTIVITY: "activity",
};

/**
 * מחזיר אובייקט התואם לקלט של addEntry ב-store.
 * השדה code נקבע ב-store מתוך nextCode.
 *
 * @param {Object} params
 * @param {number|string} params.id
 * @param {string} params.type
 * @param {string} [params.title]
 * @param {string} params.content
 * @param {string} params.createdAt
 * @param {Ptkit[]} [params.ptkiyot]
 * @param {LinkedEntry[]} [params.linkedEntries]
 * @param {boolean} [params.isArchived]
 */
export const createEntry = ({
  id,
  type,
  title = "",
  content,
  createdAt,
  ptkiyot = [],
  linkedEntries = [],
  isArchived = false,
}) => ({
  id,
  type,
  title,
  content,
  createdAt,
  ptkiyot,
  linkedEntries,
  isArchived,
});