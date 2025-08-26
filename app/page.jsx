'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  fetchAllAssignments,
  fetchInterpreters,
  applyForAssignment,
  withdrawApplication,
  assignInterpreter,
  unassignInterpreter,
} from '../lib/mockApi';



// Visninger (UI)
const VIEWS = [
  { id: 'ledige',        label: 'Ledige' },
  { id: 'mine-ønsker',   label: 'Mine ønsker' },
  { id: 'mine-tildelte', label: 'Mine tildelte' },
];

const ADMIN_VIEWS = [
  { id: 'ledige',        label: 'Ledige' },
  { id: 'mine-ønsker',   label: 'Påmeldte' },     // for admin: viser oppdrag med interessenter
  { id: 'mine-tildelte', label: 'Tildelte' },
];

const UI_STATUS = {
  open:      { label: 'Åpne',            className: 'bg-blue-50 text-blue-700 border-blue-200' },
  partial:   { label: 'Delvis bemannet', className: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  full:      { label: 'Bemannet',        className: 'bg-green-50 text-green-800 border-green-200' },
  draft:     { label: 'Kladd',           className: 'bg-purple-50 text-purple-700 border-purple-200' },
  cancelled: { label: 'Avlyst',          className: 'bg-gray-100 text-gray-700 border-gray-200' },
  done:      { label: 'Ferdig',          className: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const STORAGE_KEY = 'tegnsatt-ui-v1';

export default function Page() {
  // Rolle/visning/filtre
  const [role, setRole] = useState('tolk'); // 'tolk' | 'admin'
  const [view, setView] = useState('ledige');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('alle');
  const [sortBy, setSortBy] = useState('date_asc'); // 'date_asc' | 'date_desc'
  const [from, setFrom] = useState(''); // YYYY-MM-DD
  const [to, setTo]     = useState(''); // YYYY-MM-DD
  const [interpreters, setInterpreters] = useState([]);
  


  // Data + UI-state
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const views = role === 'admin' ? ADMIN_VIEWS : VIEWS;

  // Demo: innlogget bruker-id
  const currentUserId = role === 'tolk' ? 'u2' : 'u1';

  // Hjelpere
  const chipClass = (value) =>
    `text-sm px-3 py-1 rounded-full border transition ${value === typeFilter ? 'bg-black text-white border-black' : 'bg-white'}`;

  const tabClass = (value) =>
    `px-3 py-1 rounded-full border text-sm ${value === view ? 'bg-black text-white border-black' : 'bg-white'}`;

  const resetFilters = () => {
    setQuery(''); setTypeFilter('alle'); setSortBy('date_asc');
    setView('ledige'); setOpenId(null); setFrom(''); setTo('');
    try { if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const formatRange = (startISO, endISO) => {
    if (!startISO) return '';
    const s = new Date(startISO);
    const e = endISO ? new Date(endISO) : null;
    const date = s.toLocaleDateString('no-NO');
    const st   = s.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
    const et   = e ? e.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) : '';
    return `${date} ${st}${et ? ' – ' + et : ''}`;
  };

  const toggleDetails = useCallback((id) => {
    setOpenId((curr) => (curr === id ? null : id));
  }, []);

  const load = useCallback(async () => {
  setErr(null);
  setLoading(true);
  try {
    const ass = await fetchAllAssignments();
    setAssignments(ass);

    const ints = await fetchInterpreters();
    setInterpreters(ints);
  } catch (e) {
    setErr(e?.message || 'Noe gikk galt');
  } finally {
    setLoading(false);
  }
}, []);


  // Første innlasting
  useEffect(() => { load(); }, [load]);

  // Les lagret UI-tilstand
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.role) setRole(s.role);
      if (s.view) setView(s.view);
      if (typeof s.query === 'string') setQuery(s.query);
      if (s.typeFilter) setTypeFilter(s.typeFilter);
      if (s.sortBy) setSortBy(s.sortBy);
      if (typeof s.from === 'string') setFrom(s.from);
      if (typeof s.to === 'string') setTo(s.to);
    } catch {}
  }, []);

  // Lagre UI-tilstand
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const s = { role, view, query, typeFilter, sortBy, from, to };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {}
  }, [role, view, query, typeFilter, sortBy, from, to]);

  // Dynamiske typer fra data (for filter-knapper)
  const dynamicTypes = useMemo(() => {
    const set = new Set(assignments.map(a => a.type).filter(Boolean));
    return Array.from(set);
  }, [assignments]);

  const nameById = useMemo(
  () => Object.fromEntries((interpreters || []).map(u => [u.id, u.name])),
  [interpreters]
);
const displayName = (id) => nameById[id] ?? id;

  
  // Filtrering
  const filtered = useMemo(() => {
    let list = [...assignments];

    // type-filter
    if (typeFilter && typeFilter !== 'alle') {
      list = list.filter(a => a.type === typeFilter);
    }

    // fritekst
    const q = (query || '').trim().toLowerCase();
    if (q) {
      list = list.filter(a =>
        [a.title, a.customer, a.location, a.notes]
          .some(v => (v || '').toLowerCase().includes(q))
      );
    }

    // dato-intervall (på startISO)
    const fromDate = from ? new Date(from) : null;
    const toDate   = to   ? new Date(`${to}T23:59:59`) : null;
    if (fromDate) list = list.filter(a => new Date(a.startISO) >= fromDate);
    if (toDate)   list = list.filter(a => new Date(a.startISO) <= toDate);

    // visning
if (view === 'ledige') {
  list = list.filter(
    a => (a.assignedIds?.length ?? 0) < a.slots &&
         a.status !== 'cancelled' &&
         a.status !== 'done'
  );
} else if (view === 'mine-tildelte') {
  if (role === 'tolk') {
    // tolk: kun oppdrag der JEG er tildelt
    list = list.filter(a => (a.assignedIds || []).includes(currentUserId));
  } else {
    // admin: ALLE oppdrag som har minst én tildelt
    list = list.filter(a => (a.assignedIds?.length ?? 0) > 0);
  }
} else if (view === 'mine-ønsker') {
  if (role === 'tolk') {
    list = list.filter(a => (a.wishIds || []).includes(currentUserId));
  } else {
    list = list.filter(a => (a.wishIds?.length ?? 0) > 0);
  }
}


    return list;
  }, [assignments, typeFilter, query, from, to, view, role, currentUserId]);

  // Sortering på startISO
  const displayed = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
    if (sortBy === 'date_desc') arr.reverse();
    return arr;
  }, [filtered, sortBy]);

  // Handlers: tolk melder interesse / trekker ønske
  const applyMe = useCallback(async (a) => {
    try {
      setBusyId(a.id);
      await applyForAssignment({ assignmentId: a.id, userId: currentUserId });
      await load();
    } catch (e) {
      alert(e?.message || 'Klarte ikke å melde interesse.');
    } finally {
      setBusyId(null);
    }
  }, [currentUserId, load]);

  const withdrawMe = useCallback(async (a) => {
    try {
      setBusyId(a.id);
      await withdrawApplication({ assignmentId: a.id, userId: currentUserId });
      await load();
    } catch (e) {
      alert(e?.message || 'Klarte ikke å trekke ønsket.');
    } finally {
      setBusyId(null);
    }
  }, [currentUserId, load]);

const assignUser = useCallback(async (a, userId) => {
  try {
    setBusyId(a.id);
    await assignInterpreter({ assignmentId: a.id, interpreterId: userId });
    await load(); // henter oppdatert liste
  } catch (e) {
    alert(e?.message || 'Klarte ikke å tildele.');
  } finally {
    setBusyId(null);
  }
}, [load]);

const unassignUser = useCallback(async (a, userId) => {
  try {
    setBusyId(a.id);
    await unassignInterpreter({ assignmentId: a.id, interpreterId: userId });
    await load();
  } catch (e) {
    alert(e?.message || 'Klarte ikke å fjerne tildeling.');
  } finally {
    setBusyId(null);
  }
}, [load]);

const assignUser = useCallback(async (a, userId) => {
  if (!confirm(`Tildele ${displayName(userId)} til «${a.title}»?`)) return;
  try {
    setBusyId(a.id);
    await assignInterpreter({ assignmentId: a.id, interpreterId: userId });
    await load();
  } catch (e) {
    alert(e?.message || 'Klarte ikke å tildele.');
  } finally {
    setBusyId(null);
  }
}, [load]);

  const unassignUser = useCallback(async (a, userId) => {
  if (!confirm(`Fjerne ${displayName(userId)} fra «${a.title}»?`)) return;
  try {
    setBusyId(a.id);
    await unassignInterpreter({ assignmentId: a.id, interpreterId: userId });
    await load();
  } catch (e) {
    alert(e?.message || 'Klarte ikke å fjerne tildeling.');
  } finally {
    setBusyId(null);
  }
}, [load]);

  const withdrawMe = useCallback(async (a) => {
  if (!confirm(`Trekk ønsket ditt for «${a.title}»?`)) return;
  try {
    setBusyId(a.id);
    await withdrawApplication({ assignmentId: a.id, userId: currentUserId });
    await load();
  } catch (e) {
    alert(e?.message || 'Klarte ikke å trekke ønsket.');
  } finally {
    setBusyId(null);
  }
}, [currentUserId, load]);

  
  // RENDER
  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <div className="p-4">Laster oppdrag…</div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <div className="text-red-700 mb-3">Feil: {err}</div>
        <button onClick={load} className="px-3 py-1 rounded border bg-white hover:bg-gray-50">
          Prøv igjen
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4">
      {/* Topp: tittel + rolle + oppdater */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tegnsatt — oppdrag</h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="px-2 py-1 rounded border text-sm bg-white hover:bg-gray-50"
            title="Hent siste"
          >
            Oppdater
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <span className="text-sm">Rolle:</span>
          <button
            type="button"
            onClick={() => setRole('tolk')}
            className={`px-2 py-1 rounded border text-sm ${role === 'tolk' ? 'bg-black text-white' : ''}`}
          >
            tolk
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`px-2 py-1 rounded border text-sm ${role === 'admin' ? 'bg-black text-white' : ''}`}
          >
            admin
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        {(role === 'admin' ? ADMIN_VIEWS : VIEWS).map((t) => (
          <button key={t.id} className={tabClass(t.id)} onClick={() => setView(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Søk */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Søk (tittel, kunde, sted, notater)"
        className="w-full mb-3 border rounded-lg p-2"
      />

      {/* Filterlinje */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button className={chipClass('alle')} onClick={() => setTypeFilter('alle')}>alle</button>
        {dynamicTypes.map((t) => (
          <button key={t} className={chipClass(t)} onClick={() => setTypeFilter(t)}>{t}</button>
        ))}

        <button type="button" onClick={resetFilters} className="px-3 py-1 rounded border">
          Nullstill filtre
        </button>

        {/* dato fra/til */}
        <label className="text-sm opacity-70">Fra:</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border rounded-lg px-2 py-1 text-sm bg-white"
        />
        <label className="text-sm opacity-70">Til:</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border rounded-lg px-2 py-1 text-sm bg-white"
        />

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

          {/* Treff-teller */}
      <div className="mb-2 text-sm opacity-70">{displayed.length} treff</div>

      {/* Liste */}
      {displayed.length === 0 ? (
        <div className="opacity-70">Ingen treff.</div>
      ) : (
        <ul className="space-y-3">
          {displayed.map((a) => {
            const myWish = (a.wishIds || []).includes(currentUserId);
            const wishCount = a.wishIds?.length ?? 0;

            return (
              <li key={a.id} className="border rounded-xl bg-white">
                <button
                  type="button"
                  onClick={() => toggleDetails(a.id)}
                  className="w-full text-left p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-sm opacity-70">
                        {a.customer} — {formatRange(a.startISO, a.endISO)}
                      </div>
                      <div className="text-sm opacity-70">{a.location}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {a.type && (
                        <span className="text-sm px-2 py-1 rounded-full border">{a.type}</span>
                      )}

                      <span
                        className="text-sm px-2 py-1 rounded-full border"
                        title="tildelte / slots"
                      >
                        {(a.assignedIds?.length ?? 0)}/{a.slots}
                      </span>

                      {role === 'admin' && wishCount > 0 && (
                        <span className="text-sm px-2 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                          {wishCount} påmeldt{wishCount === 1 ? '' : 'e'}
                        </span>
                      )}

                      {UI_STATUS[a.status] && (
                        <span className={`text-sm px-2 py-1 rounded-full border ${UI_STATUS[a.status].className}`}>
                          {UI_STATUS[a.status].label}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {openId === a.id && (
                  <div className="border-t p-4 grid gap-3 md:grid-cols-2">
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Kunde:</span> {a.customer}</div>
                      <div><span className="font-medium">Sted:</span> {a.location}</div>
                      <div><span className="font-medium">Tid:</span> {formatRange(a.startISO, a.endISO)}</div>
                      <div><span className="font-medium">Type:</span> {a.type || '—'}</div>
                      <div><span className="font-medium">Notater:</span> {a.notes || '—'}</div>
                    </div>
                    
{/* Påmeldte tolker (admin kan tildele) */}
<div className="text-sm">
  <div className="font-medium mb-1">Påmeldte tolker</div>
  {(a.wishIds?.length ?? 0) === 0 ? (
    <div className="opacity-70">Ingen påmeldinger.</div>
  ) : (
    <ul className="list-disc ml-5">
      {a.wishIds.map((id) => {
        const alreadyAssigned = (a.assignedIds || []).includes(id);
        const isFull = (a.assignedIds?.length ?? 0) >= a.slots;
        return (
          <li key={id} className="flex items-center gap-2">
            <span>{displayName(id)}</span>
            {role === 'admin' && (
              <button
                className="ml-auto px-2 py-1 rounded border text-xs"
                onClick={() => assignUser(a, id)}
                disabled={isFull || alreadyAssigned || busyId === a.id}
                title={isFull ? 'Alle plasser er fylt' : (alreadyAssigned ? 'Allerede tildelt' : '')}
              >
                {busyId === a.id ? 'Tildeler…' : 'Tildel'}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  )}
</div>

{/* Tildelte tolker (admin kan fjerne) */}
<div className="text-sm">
  <div className="font-medium mb-1">Tildelte tolker</div>
  {(a.assignedIds?.length ?? 0) === 0 ? (
    <div className="opacity-70">Ingen tildelt ennå.</div>
  ) : (
    <ul className="list-disc ml-5">
      {a.assignedIds.map((id) => (
        <li key={id} className="flex items-center gap-2">
          <span>{displayName(id)}</span>
          {role === 'admin' && (
            <button
              className="ml-auto px-2 py-1 rounded border text-xs"
              onClick={() => unassignUser(a, id)}
              disabled={busyId === a.id}
            >
              {busyId === a.id ? 'Fjerner…' : 'Fjern'}
            </button>
          )}
        </li>
      ))}
    </ul>
  )}
</div>


                    {/* Handlingsknapper for TOLK: meld interesse / trekk ønske */}
                    {role === 'tolk' && (
                      <div className="md:col-span-2 flex gap-2 pt-2">
                        {myWish ? (
                          <button
                            className="px-3 py-1 rounded border"
                            onClick={() => withdrawMe(a)}
                            disabled={busyId === a.id}
                          >
                            {busyId === a.id ? "Trekker…" : "Trekk ønske"}
                          </button>
                        ) : (
                          <button
                            className="px-3 py-1 rounded border"
                            onClick={() => applyMe(a)}
                            disabled={busyId === a.id}
                          >
                            {busyId === a.id ? "Sender…" : "Meld interesse"}
                          </button>
                        )}
                      </div>
                    )}
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
