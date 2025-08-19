// lib/seed.js
export const INITIAL = [
  {
    id: 1,
    title: 'Tolkeoppdrag hos NAV',
    customer: 'NAV Kongsberg',
    date: '2025-08-22',
    type: 'tegnspråk',
    address: 'Storgata 12, 3611 Kongsberg',
    coInterpreter: 'Ola Nordmann',
    requesterNotes: 'Viktig: møte varer i 3 timer, behov for pauser underveis.',

    // ny modell for status:
    slots: 2,            // hvor mange tolker trengs
    assignedCount: 0,    // hvor mange er tildelt nå

    // demo-felter for visning:
    appliedByUser: false,
    assignedToUser: false,
  },
  {
    id: 2,
    title: 'Kurs i universell utforming',
    customer: 'Universitetet i Oslo',
    date: '2025-08-25',
    type: 'skrivetolking',
    address: 'Blindern Campus, Auditorium 3',
    coInterpreter: 'Kari Tolkerud',
    requesterNotes: 'Behov for tolk som kan håndtere fagsjargong.',

    slots: 2,
    assignedCount: 0,

    appliedByUser: false,
    assignedToUser: false,
  },
];
