// /lib/models.js

/**
 * @typedef {Object} Interpreter
 * @property {string} id
 * @property {string} name
 * @property {"tolk"|"admin"} role
 */

/**
 * @typedef {Object} Assignment
 * @property {string} id
 * @property {string} title
 * @property {string} customer        // kunde/oppdragsgiver
 * @property {string} location
 * @property {string} startISO        // ISO-tidspunkt start
 * @property {string} endISO          // ISO-tidspunkt slutt
 * @property {"draft"|"open"|"partial"|"full"|"cancelled"|"done"} status
 * @property {number} slots           // hvor mange tolker trengs
 * @property {string[]} assignedIds   // ID-er for tildelte tolker
 * @property {string} type            // f.eks "forelesning", "møte" osv.
 * @property {string} notes
 */

export const STATUS = {
  DRAFT: "draft",
  OPEN: "open",
  PARTIAL: "partial",
  FULL: "full",
  CANCELLED: "cancelled",
  DONE: "done",
};

/** @param {Assignment} a */
export function computeStatus(a) {
  if (a.status === STATUS.CANCELLED || a.status === STATUS.DONE) return a.status;
  const c = a.assignedIds?.length ?? 0;
  if (c === 0) return STATUS.OPEN;
  if (c < a.slots) return STATUS.PARTIAL;
  return STATUS.FULL;
}
