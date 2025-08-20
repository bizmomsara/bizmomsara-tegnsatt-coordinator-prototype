'use client';
import { useMemo, useState } from 'react';

import { getJobs } from '@/lib/getJobs';
import { INITIAL } from '@/lib/seed';

const TYPES = ['tegnspråk', 'skrivetolking'];
const VIEWS = [
  { id: 'ledige', label: 'Ledige' },
  { id: 'mine-ønsker', label: 'Mine ønsker' },
  { id: 'mine-tildelte', label: 'Mine tildelte' },
];
const STATUS = {
  inviting: { label: 'Åpne', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  partly_filled: { label: 'Delvis bemannet', className: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  filled: { label: 'Bemannet', className: 'bg-green-50 text-green-800 border-green-200' },
};

export default function Page() {
  const [role, setRole] = useState('tolk'); // 'tolk' | 'admin'
  const [view, setView] = useState('ledige'); // 'ledige' | 'mine-ønsker' | 'mine-tildelte'
  const [jobs, setJobs] = useState(INITIAL);
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('alle');
  const [sortBy, setSortBy] = useState('date_asc'); // 'date_asc' | 'date_desc'
  const resetFilters = () => {
  setQuery('');
  setTypeFilter('alle');
  setSortBy('date_asc');
  setView('ledige');
  setOpenId(null);
};

  const chipClass = (value) =>
    `text-sm px-3 py-1 rounded-full border transition ${
      value === typeFilter ? 'bg-black text-white border-black' : 'bg-white'
    }`;

  const tabClass = (value) =>
    `px-3 py-1 rounded-full border text-sm ${
      value === view ? 'bg-black text-white border-black' : 'bg-white'
    }`;

  // ✅ Bruk datalaget til filtering + GDPR-minimering
  const filtered = useMemo(() => {
    return getJobs({ allJobs: jobs, view, typeFilter, query, role });
  }, [jobs, view, typeFilter, query, role]);
const displayed = useMemo(() => {
  const arr = [...filtered];                  // lag en kopi av filtered
  arr.sort((a, b) => new Date(a.date) - new Date(b.date)); // sorter stigende på dato
  if (sortBy === 'date_desc') arr.reverse();  // hvis valgt "Dato ↓", snu rekkefølgen
  return arr;                                 // dette er lista vi viser
}, [filtered, sortBy]);
<div className="mb-2 text-sm opacity-70">{displayed.length} treff</div>

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

// Admin: tildel til bruker (demo) – øk assignedCount til maks slots
const assignToUser = (id) =>
  setJobs((prev) =>
    prev.map((a) => {
      if (a.id !== id) return a;
      const nextCount = Math.min(a.assignedCount + 1, a.slots);
      return {
        ...a,
        assignedCount: nextCount, // oppdater antall tildelte
        assignedToUser: true,     // i demoen: tildelt “meg”
        appliedByUser: false,     // rydd bort eventuelt ønske
      };
    })
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
     <div className="flex flex-wrap items-center gap-2 mb-4">
  <button className={chipClass('alle')} onClick={() => setTypeFilter('alle')}>alle</button>
  {TYPES.map((t) => (
    <button key={t} className={chipClass(t)} onClick={() => setTypeFilter(t)}>{t}</button>
  ))}
<div className="flex flex-wrap items-center gap-2 mb-4">
  <button className={chipClass('alle')} onClick={() => setTypeFilter('alle')}>alle</button>
  {TYPES.map((t) => (
    <button key={t} className={chipClass(t)} onClick={() => setTypeFilter(t)}>{t}</button>
  ))}

  <button
    type="button"
    onClick={resetFilters}
    className="px-3 py-1 rounded border"
  >
    Nullstill filtre
  </button>

  <div className="ml-auto flex items-center gap-2">
    <label className="text-sm opacity-70">Sorter:</label>
    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
      className="border rounded-lg px-2 py-1 text-sm bg-white"
    >
      <option value="date_asc">Dato ↑</option>
      <option value="date_desc">Dato ↓</option>
    </select>
  </div>
</div>

  <div className="ml-auto flex items-center gap-2">
    <label className="text-sm opacity-70">Sorter:</label>
    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
      className="border rounded-lg px-2 py-1 text-sm bg-white"
    >
      <option value="date_asc">Dato ↑</option>
      <option value="date_desc">Dato ↓</option>
    </select>
  </div>
</div>
<div className="mb-2 text-sm opacity-70">{displayed.length} treff</div>


      {displayed.length === 0 ? (
        <div className="opacity-70">Ingen treff.</div>
      ) : (
        <ul className="space-y-3">
          {displayed.map((a) => (
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
                  <div className="flex items-center gap-2">
  <span className="text-sm px-2 py-1 rounded-full border">{a.type}</span>
  {STATUS[a.status] && (
    <span className={`text-sm px-2 py-1 rounded-full border ${STATUS[a.status].className}`}>
      {STATUS[a.status].label}
    </span>
  )}
</div>
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
                      {/* getJobs fjerner coInterpreter når bruker ikke har grunnlag for å se det */}
                      {a.coInterpreter ?? (
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
                    {role === 'tolk' && view === 'ledige' && a.appliedByUser === false && (
                      <button className="px-3 py-1 rounded border" onClick={() => applyFor(a.id)}>
                        Ønsker oppdraget
                      </button>
                    )}
                    {role === 'tolk' && view === 'mine-ønsker' && a.appliedByUser === true && (
                      <button className="px-3 py-1 rounded border" onClick={() => withdraw(a.id)}>
                        Trekk ønske
                      </button>
                    )}
                    {role === 'admin' && (
                      <button className="px-3 py-1 rounded border" onClick={() => assignToUser(a.id)}>
                        Tildel til bruker (demo)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
