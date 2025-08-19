'use client';
import React, { useMemo, useState, useEffect } from 'react';

/* ====== Konstanter ====== */
const TYPES = [
  { key: 'tegnspråk', label: 'Tegnspråk' },
  { key: 'skrivetolking', label: 'Skrivetolking' },
  { key: 'tegn_som_støtte', label: 'Tegn som støtte' },
  { key: 'døvblinde', label: 'Døvblinde' },
];

const STATUS = [
  { key: 'inviting', label: 'Åpne' },
  { key: 'partly_filled', label: 'Delvis bemannet' },
  { key: 'staffed', label: 'Bemannet' },
];

function daysFromNow(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

/* Dummy-data med ekstra felter for detaljer */
const SEED = [
  {
    id: 1,
    title: "Tolkeoppdrag hos NAV",
    customer: "NAV Kongsberg",
    date: "2025-08-22",
    status: "inviting",
    type: "tegnspråk",
    address: "Storgata 12, 3611 Kongsberg",
    coInterpreter: "Ola Nordmann",
    requesterNotes: "Viktig: møte varer i 3 timer, behov for pauser underveis."
  },
  {
    id: 2,
    title: "Kurs i universell utforming",
    customer: "Universitetet i Oslo",
    date: "2025-08-25",
    status: "partly_filled",
    type: "skrivetolking",
    address: "Blindern Campus, Auditorium 3",
    coInterpreter: "Kari Tolkerud",
    requesterNotes: "Behov for tolk som kan håndtere fagterminologi."
  }
];


/* ====== Hjelpere ====== */
function fmt(dateIso) {
  const d = new Date(dateIso);
  return d.toLocaleString('no-NO', {
    weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}
function toggle(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

/* ====== Komponent ====== */
export default function Page() {
  // Logg ut
  function logout() {
    document.cookie = 'role=; Max-Age=0; path=/';
    window.location.reload();
  }

  // State
  const [q, setQ] = useState('');
  const [typeSel, setTypeSel] = useState([]);
  const [statusSel, setStatusSel] = useState(['inviting', 'partly_filled']); // admin-filter
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [rushOnly, setRushOnly] = useState(false); // HASTER
  const [role, setRole] = useState('tolk'); // default
  const [expanded, setExpanded] = useState({}); // id -> bool
  const [interest, setInterest] = useState({});  // id -> 'sent' | undefined

  // Hent rolle fra cookie (settes av middleware.ts)
  useEffect(() => {
    const m = document.cookie.match(/(?:^| )role=([^;]+)/);
    if (m && (m[1] === 'admin' || m[1] === 'tolk')) setRole(m[1]);
  }, []);

  // Auto-logout for tolker ved inaktivitet (15 min)
  useEffect(() => {
    if (role !== 'tolk') return;
    const TIMEOUT_MS = 15 * 60 * 1000;
    let timer;
    const reset = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => logout(), TIMEOUT_MS);
    };
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(ev => window.removeEventListener(ev, reset));
    };
  }, [role]);

  // Filtrering/sortering
  const filtered = useMemo(() => {
    let data = [...SEED];

    if (q.trim()) {
      const needle = q.toLowerCase();
      data = data.filter(
        (a) =>
          a.title.toLowerCase().includes(needle) ||
          a.client.toLowerCase().includes(needle) ||
          a.location.toLowerCase().includes(needle)
      );
    }

    if (typeSel.length > 0) data = data.filter((a) => typeSel.includes(a.type));

    // Tolker ser aldri bemannede
    if (role === 'tolk') {
      data = data.filter((a) => a.status !== 'staffed');
    } else {
      if (statusSel.length > 0) data = data.filter((a) => statusSel.includes(a.status));
    }

    // Dato-overlapp
    const fromTs = from ? new Date(from + 'T00:00:00').getTime() : null;
    const toTs = to ? new Date(to + 'T23:59:59').getTime() : null;
    if (fromTs || toTs) {
      data = data.filter((a) => {
        const s = new Date(a.start).getTime();
        const e = new Date(a.end).getTime();
        return (fromTs === null || e >= fromTs) && (toTs === null || s <= toTs);
      });
    }

    // Haster: starter innen 3 dager (fra nå)
    if (rushOnly) {
      const limit = daysFromNow(3).getTime() + (24 * 60 * 60 * 1000 - 1);
      data = data.filter((a) => {
        const s = new Date(a.start).getTime();
        return s >= Date.now() && s <= limit;
      });
    }

    // Sorter på dato
    data.sort((a, b) => {
      const da = new Date(a.start).getTime();
      const db = new Date(b.start).getTime();
      return sortAsc ? da - db : db - da;
    });

    return data;
  }, [q, typeSel, statusSel, from, to, sortAsc, rushOnly, role]);

  // “Ønsker oppdraget”
  function sendInterest(id) {
    setInterest((prev) => ({ ...prev, [id]: 'sent' }));
    // I en ekte løsning: POST /assignments/{id}/interest
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tegnsatt — ledige oppdrag</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Rolle: {role}</span>
            <button
              className="px-3 py-2 rounded-xl border text-sm hover:bg-white"
              onClick={() => {
                setQ(''); setTypeSel([]);
                setStatusSel(['inviting','partly_filled']);
                setFrom(''); setTo('');
                setSortAsc(true); setRushOnly(false);
              }}
            >
              Nullstill filtre
            </button>
            <button
              className="px-3 py-2 rounded-xl border text-sm hover:bg-white"
              onClick={logout}
              title="Logg ut"
            >
              Logg ut
            </button>
          </div>
        </header>

        {/* Filterkort */}
        <section className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
          {/* Filtreringsrad – responsiv grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end">
            {/* Søk */}
            <input
              placeholder="Søk (tittel, kunde, sted)"
              className="border rounded-xl px-3 py-2 sm:col-span-2 lg:col-span-2"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            {/* Fra-dato */}
            <div className="flex items-center gap-2 lg:col-span-1">
              <label className="text-sm text-gray-600 whitespace-nowrap">Fra</label>
              <input
                type="date"
                className="border rounded-xl px-3 py-2 w-full"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            {/* Til-dato */}
            <div className="flex items-center gap-2 lg:col-span-1">
              <label className="text-sm text-gray-600 whitespace-nowrap">Til</label>
              <input
                type="date"
                className="border rounded-xl px-3 py-2 w-full"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            {/* Sorter */}
            <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1 lg:justify-end">
              <span className="text-sm text-gray-600 whitespace-nowrap">Sorter:</span>
              <button
                className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                onClick={() => setSortAsc((s) => !s)}
                title="Sorter etter dato"
              >
                Dato {sortAsc ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Type-chip’er */}
          <div>
            <div className="text-sm text-gray-600 mb-2">Type</div>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  className={
                    'px-3 py-1.5 rounded-full border text-sm ' +
                    (typeSel.includes(t.key)
                      ? 'bg-black text-white border-black'
                      : 'bg-white hover:bg-gray-50')
                  }
                  onClick={() => setTypeSel((arr) => toggle(arr, t.key))}
                  aria-pressed={typeSel.includes(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status – kun for admin */}
          {role === 'admin' && (
            <div>
              <div className="text-sm text-gray-600 mb-2">Status</div>
              <div className="flex flex-wrap gap-2">
                {STATUS.map((s) => (
                  <button
                    key={s.key}
                    className={
                      'px-3 py-1.5 rounded-full border text-sm ' +
                      (statusSel.includes(s.key)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white hover:bg-gray-50')
                    }
                    onClick={() => setStatusSel((arr) => toggle(arr, s.key))}
                    aria-pressed={statusSel.includes(s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Haster */}
          <div className="flex items-center gap-3">
            <button
              className={
                'px-3 py-1.5 rounded-full border text-sm ' +
                (rushOnly ? 'bg-red-600 text-white border-red-600' : 'bg-white hover:bg-gray-50')
              }
              onClick={() => setRushOnly((v) => !v)}
              title="Oppdrag som starter innen 3 dager"
            >
              Haster (≤ 3 dager)
            </button>
          </div>
        </section>

{/* Resultater – bruker native <details> for klikk uten JS */}
<section className="space-y-3">
  <div className="text-sm text-gray-600">{filtered.length} treff</div>

  {filtered.map((a) => (
    <article key={a.id} className="bg-white p-4 rounded-2xl shadow-sm border relative z-0">
      <details className="group">
        <summary
          className="list-none w-full text-left flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-pointer
                     outline-none focus:ring-2 focus:ring-blue-300 rounded-xl"
        >
          <div>
            <h2 className="text-lg font-semibold">{a.title}</h2>
            <p className="text-sm text-gray-600">{a.client} • {a.location}</p>
            <p className="text-sm text-gray-600">{fmt(a.start)} – {fmt(a.end)}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-gray-100 text-sm">
              {TYPES.find((t) => t.key === a.type)?.label}
            </span>
            <span
              className={
                'px-3 py-1.5 rounded-full text-sm ' +
                (a.status === 'staffed'
                  ? 'bg-green-100 text-green-800'
                  : a.status === 'partly_filled'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800')
              }
            >
              {STATUS.find((s) => s.key === a.status)?.label}
            </span>
            {/* Chevron som roterer med CSS, uten JS */}
            <span
              className="ml-1 inline-block transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
              title="Vis/skjul detaljer"
            >
              ▾
            </span>
          </div>
        </summary>

        {/* Detaljseksjon */}
        <div className="mt-4 border-t pt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-sm text-gray-500">Adresse</div>
            <div className="text-sm">{a.address || '—'}</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-gray-500">Medtolk</div>
            <div className="text-sm">{a.coInterpreter || '—'}</div>
          </div>

          <div className="space-y-1 md:col-span-2">
            <div className="text-sm text-gray-500">Forespørsel / spesifikasjoner</div>
            <div className="text-sm">{a.requesterNotes || '—'}</div>
          </div>

          {/* Handlinger */}
          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            {role === 'tolk' && (
              interest[a.id] === 'sent' ? (
                <span className="px-3 py-1.5 rounded-full bg-green-600 text-white text-sm">
                  Interesse sendt
                </span>
              ) : (
                <button
                  className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50"
                  onClick={() => setInterest((prev) => ({ ...prev, [a.id]: 'sent' }))}
                >
                  Ønsker oppdraget
                </button>
              )
            )}

            {role === 'admin' && (
              <button
                className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50"
                onClick={() => alert('(Demo) Admin-handling her — f.eks. Tildel / Inviter')}
              >
                Admin: handling
              </button>
            )}
          </div>
        </div>
      </details>
    </article>
  ))}
</section>
              </div>        {/* slutt på .max-w-5xl wrapper */}
    </div>          {/* slutt på .min-h-screen wrapper */}
  );
}
