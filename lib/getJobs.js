// lib/getJobs.js
import { INITIAL } from './seed';

function deriveStatus(a) {
  if (a.assignedCount <= 0) return 'inviting';          // Åpne
  if (a.assignedCount < a.slots) return 'partly_filled';// Delvis bemannet
  return 'filled';                                      // Bemannet
}

// Stabil dato-parsing (YYYY-MM-DD -> UTC-millis)
function toUTC(msStr) {
  if (!msStr) return null;
  const [y, m, d] = msStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d);
}

export function getJobs({
  allJobs = INITIAL,
  view = 'ledige',
  typeFilter = 'alle',
  query = '',
  role = 'tolk',
  dateFrom = '',   // NY
  dateTo = '',     // NY
}) {
  const q = query.trim().toLowerCase();
  let base = allJobs;

  // Hvilke kort skal vises i den valgte fanen?
  if (view === 'ledige') {
    base = base.filter((a) => a.assignedCount < a.slots); // Åpne + Delvis
  } else if (view === 'mine-ønsker') {
    base = base.filter((a) => a.appliedByUser && !a.assignedToUser);
  } else if (view === 'mine-tildelte') {
    base = base.filter((a) => a.assignedToUser);
  }

  // Type + søk
  if (typeFilter !== 'alle') base = base.filter((a) => a.type === typeFilter);
  if (q) {
    base = base.filter((a) =>
      (`${a.title} ${a.customer} ${a.address}`).toLowerCase().includes(q)
    );
  }

  // NYTT: datofilter (inkluderende)
  let from = toUTC(dateFrom);
  let to = toUTC(dateTo);
  if (from && to && from > to) { const tmp = from; from = to; to = tmp; } // tåler bytte rekkefølge

  if (from) base = base.filter((a) => toUTC(a.date) >= from);
  if (to)   base = base.filter((a) => toUTC(a.date) <= to);

  // GDPR: skjul medtolk hvis ikke legitimt
  return base.map((a) => {
    const includeCo =
      role === 'admin' || (role === 'tolk' && view === 'mine-tildelte' && a.assignedToUser);
    return {
      ...a,
      status: deriveStatus(a),
      coInterpreter: includeCo ? a.coInterpreter : undefined,
    };
  });
}
