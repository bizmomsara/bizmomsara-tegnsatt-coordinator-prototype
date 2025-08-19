// lib/getJobs.js
import { INITIAL } from './seed';

function deriveStatus(a) {
  if (a.assignedCount <= 0) return 'inviting';       // Åpne
  if (a.assignedCount < a.slots) return 'partly_filled'; // Delvis bemannet
  return 'filled';                                    // Bemannet
}

export function getJobs({
  allJobs = INITIAL,
  view = 'ledige',
  typeFilter = 'alle',
  query = '',
  role = 'tolk',
}) {
  const q = query.trim().toLowerCase();
  let base = allJobs;

  // Hvilke kort skal vises i den valgte fanen?
  if (view === 'ledige') {
    base = base.filter((a) => a.assignedCount < a.slots); // Åpne + Delvis bemannet
  } else if (view === 'mine-ønsker') {
    base = base.filter((a) => a.appliedByUser && !a.assignedToUser);
  } else if (view === 'mine-tildelte') {
    base = base.filter((a) => a.assignedToUser);
  }

  // Typefilter + søk
  if (typeFilter !== 'alle') base = base.filter((a) => a.type === typeFilter);
  if (q) {
    base = base.filter((a) =>
      (`${a.title} ${a.customer} ${a.address}`).toLowerCase().includes(q)
    );
  }

  // GDPR: fjern medtolk med mindre det er legitimt formål
  return base.map((a) => {
    const includeCo =
      role === 'admin' || (role === 'tolk' && view === 'mine-tildelte' && a.assignedToUser);
    return {
      ...a,
      status: deriveStatus(a),                   // ← status beregnes automatisk
      coInterpreter: includeCo ? a.coInterpreter : undefined,
    };
  });
}
