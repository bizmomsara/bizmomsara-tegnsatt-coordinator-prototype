// lib/getJobs.js
import { INITIAL } from './seed';

// Eneste stedet vi bestemmer hva som er synlig for hvem
export function getJobs({ allJobs = INITIAL, view = 'ledige', typeFilter = 'alle', query = '', role = 'tolk' }) {
  const q = query.trim().toLowerCase();

  let base = allJobs;
  if (view === 'ledige') base = base.filter(a => !a.assigned);
  if (view === 'mine-ønsker') base = base.filter(a => a.appliedByUser && !a.assignedToUser);
  if (view === 'mine-tildelte') base = base.filter(a => a.assignedToUser);

  if (typeFilter !== 'alle') base = base.filter(a => a.type === typeFilter);
  if (q) base = base.filter(a => (`${a.title} ${a.customer} ${a.address}`).toLowerCase().includes(q));

  // GDPR: fjern medtolk med mindre det er legitimt formål
  return base.map(a => {
    const includeCo = role === 'admin' || (role === 'tolk' && view === 'mine-tildelte' && a.assignedToUser);
    if (!includeCo) {
      const { coInterpreter, ...rest } = a;
      return { ...rest, coInterpreter: undefined }; // eksplisitt skjult
    }
    return a;
  });
}
