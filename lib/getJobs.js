// lib/getJobs.js
import { INITIAL } from './seed';

function deriveStatus(a) {
  if (a.assignedCount <= 0) return 'inviting';
  if (a.assignedCount < a.slots) return 'partly_filled';
  return 'filled';
}

// ISO (YYYY-MM-DD) -> UTC ms
function toUTC(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d);
}

// trygg hjelpefunksjon: hent påmeldingsantall selv om feltet mangler i gamle data
function getAppliedCount(a) {
  if (typeof a.appliedCount === 'number') return a.appliedCount;
  return a.appliedByUser ? 1 : 0; // “meg” som fallback
}

export function getJobs({
  allJobs = INITIAL,
  view = 'ledige',
  typeFilter = 'alle',
  query = '',
  role = 'tolk',
  dateFrom = '',
  dateTo = '',
}) {
  const q = query.trim().toLowerCase();
  let base = allJobs;

  // Faner
  if (view === 'ledige') {
    base = base.filter((a) => a.assignedCount < a.slots);
  } else if (view === 'mine-ønsker') {
    if (role === 'admin') {
      base = base.filter((a) => getAppliedCount(a) > 0);          // ← admin: alle som har påmeldinger
    } else {
      base = base.filter((a) => a.appliedByUser && !a.assignedToUser);
    }
  } else if (view === 'mine-tildelte') {
    if (role === 'admin') {
      base = base.filter((a) => a.assignedCount > 0);             // ← admin: alle som har tildelinger
    } else {
      base = base.filter((a) => a.assignedToUser);
    }
  }

  // Type + søk
  if (typeFilter !== 'alle') base = base.filter((a) => a.type === typeFilter);
  if (q) base = base.filter((a) => (`${a.title} ${a.customer} ${a.address}`).toLowerCase().includes(q));

  // Dato (inkluderende)
  let from = toUTC(dateFrom);
  let to = toUTC(dateTo);
  if (from && to && from > to) { const tmp = from; from = to; to = tmp; }
  if (from) base = base.filter((a) => toUTC(a.date) >= from);
  if (to)   base = base.filter((a) => toUTC(a.date) <= to);

  // GDPR + avledede felt
  return base.map((a) => {
    const includeCo = role === 'admin' || (role === 'tolk' && view === 'mine-tildelte' && a.assignedToUser);
    const appliedCount = getAppliedCount(a);
    return {
      ...a,
      appliedCount,                                            // ← nå tilgjengelig i UI
      status: deriveStatus(a),
      coInterpreter: includeCo ? a.coInterpreter : undefined,
    };
  });
}
