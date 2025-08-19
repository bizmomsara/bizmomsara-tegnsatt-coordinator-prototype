'use client';
import { useMemo, useState } from 'react';

// Startdata
const INITIAL = [
  {
    id: 1,
    title: 'Tolkeoppdrag hos NAV',
    customer: 'NAV Kongsberg',
    date: '2025-08-22',
    status: 'inviting',
    type: 'tegnspråk',
    address: 'Storgata 12, 3611 Kongsberg',
    coInterpreter: 'Ola Nordmann',
    requesterNotes: 'Viktig: møte varer i 3 timer, behov for pauser underveis.',
    assigned: false,        // globalt tildelt (oppdraget er tatt)
    appliedByUser: false,   // denne brukeren (tolken) har ønsket seg oppdraget
    assignedToUser: false,  // oppdraget er tildelt denne brukeren
  },
  {
    id: 2,
    title: 'Kurs i universell utforming',
    customer: 'Universitetet i Oslo',
    date: '2025-08-25',
    status: 'partly_filled',
    type: 'skrivetolking',
    address: 'Blindern Campus, Auditorium 3',
    coInterpreter: 'Kari Tolkerud',
    requesterNotes: 'Behov for tolk som kan håndtere fagsjargong.',
    assigned: false,
    appliedByUser: false,
    assignedToUser: false,
  },
];

const TYPES = ['tegnspråk', 'skrivetolking'];
const VIEWS = [
  { id: 'ledige', label: 'Ledige' },
  { id: 'mine-ønsker', label: 'Mine ønsker' },
  { id: 'mine-tildelte', label: 'Mine tildelte' },
];

export default function Page() {
  const [role, setRole] = useState('tolk'); // 'tolk' | 'admin'
  const [view, setView] = useState('ledige'); // 'ledige' | 'mine-ønsker' | 'mine-tildelte'
  const [jobs, setJobs] = useState(INITIAL);
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('alle');

  const chipClass = (value) =>
    `text-sm px-3 py-1 rounded-full border transition ${
      value === typeFilter ? 'bg-black text-white border-black' : 'bg-white'
    }`;

  const tabClass = (value) =>
    `px-3 py-1 rounded-full border text-sm ${
      value === view ? 'bg-black text-white border-black' : 'bg-white'
    }`;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = jobs;

    // visningsfilter
    if (view === 'ledige') {
      base = base.filter((a) => !a.assigned); // bare de som ikke er tatt
    } else if (view === 'mine-ønsker') {
      base = base.filter((a) => a.appliedByUser && !a.assignedToUser);
    } else if (view === 'mine-tildelte') {
      base = base.filter((a) => a.assignedToUser);
    }

    // typefilter
    if (typeFilter !== 'alle') {
      base = base.filter((a) => a.type === typeFilter);
    }

    // søk
    if (q) {
      base = base.filter((a) =>
        `${a.title} ${a.customer} ${a.address}`.toLowerCase().includes(q)
      );
    }

    return base;
  }, [jobs, view, typeFilter, query]);

  // handlinger
  const toggleOpen = (id) => setOpenId(openId === id ? null : id);

  const applyFor = (id) =>
    setJobs((prev) =>
      prev.map((a) => (a.id === id ? { ...a, appliedByUser: true } : a))
    );

  const withdraw = (id) =>
    setJobs((prev) =>
      prev.map((a) => (a.id === id ? { ...a, appliedByUser: false } : a))
    );

  // Admin: tildel til bruker (demo)
  const assignToUser = (id) =>
    setJobs((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              assigned: true,        // oppdraget er nå tatt
              assignedToUser: true,  // og tildelt denne brukeren
              appliedByUser: false,  // rydd opp i ønsker
            }
          : a
      )
    );

  return (
    <main className="max-w-3xl mx-auto p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tegnsatt — ledige oppdrag</h1>

        {/* Rolle-velger (demo) */}
        <div className="flex items-center gap-2 text-sm">
          <span>Rolle:</span>
          <button
            type="button"
            onClick={() => setRole('tolk')}
            className={`px-2 py-1 rounded border ${role === 'tolk' ? 'bg-black text-white' : ''}`}
          >
            tolk
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`px-2 py-1 rounded border ${role === 'admin' ? 'bg-black text-white' : ''}`}
          >
            admin
          </button>
        </div>
      </div>

      {/* Tabs: visning */}
      <div className="flex gap-2 mb-3">
        {VIEWS.map((t) => (
          <button key={t.id} className={tabClass(t.id)} onClick={() => setView(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Søk + Typefilter */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Søk (tittel, kunde, sted)"
        className="w-full mb-3 border rounded-lg p-2"
      />
      <div className="flex gap-2 mb-4">
        <button className={chipClass('alle')} onClick={() => setTypeFilter('alle')}>alle</button>
        {TYPES.map((t) => (
          <button key={t} className={chipClass(t)} onClick={() => setTypeFilter(t)}>{t}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="opacity-70">Ingen treff.</div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => {
            const canSeeCoInterpreter =
              role === 'admin' || (role === 'tolk' && view === 'mine-tildelte' && a.assignedToUser);

            return (
              <li key={a.id} className="border rounded-xl bg-white">
                <button
                  type="button"
                  onClick={() => toggleOpen(a.id)}
                  className="w-full text-left p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-sm opacity-70">
                        {a.customer} — {a.date}
                      </div>
                    </div>
                    <span className="text-sm px-2 py-1 rounded-full border">{a.type}</span>
                  </div>
                </button>

                {openId === a.id && (
                  <div className="border-t p-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-medium">Adresse</div>
                      <div className="text-sm">{a.address}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium">Medtolk</div>
                      <div className="text-sm">
                        {canSeeCoInterpreter ? (
                          a.coInterpreter || '—'
                        ) : (
                          <span className="italic opacity-70">Vises etter tildeling</span>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="text-sm font-medium">Merknader</div>
                      <div className="text-sm">{a.requesterNotes || '—'}</div>
                    </div>

                    {/* Handlingsknapper per visning */}
                    <div className="md:col-span-2 flex gap-2 pt-2">
                      {role === 'tolk' && view === 'ledige' && !a.appliedByUser && (
                        <button
                          className="px-3 py-1 rounded border"
                          onClick={() => applyFor(a.id)}
                        >
                          Ønsker oppdraget
                        </button>
                      )}
                      {role === 'tolk' && view === 'mine-ønsker' && a.appliedByUser && (
                        <button
                          className="px-3 py-1 rounded border"
                          onClick={() => withdraw(a.id)}
                        >
                          Trekk ønske
                        </button>
                      )}
                      {role === 'admin' && (
                        <button
                          className="px-3 py-1 rounded border"
                          onClick={() => assignToUser(a.id)}
                        >
                          Tildel til bruker (demo)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
