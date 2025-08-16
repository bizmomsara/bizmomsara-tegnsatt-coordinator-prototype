'use client';
import React, { useMemo, useState, useEffect } from 'react';

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

const SEED = [
  // eksisterende
  {
    id: 'A1',
    title: 'UiO – forelesning PED1100',
    client: 'UiO',
    type: 'skrivetolking',
    status: 'inviting',
    start: daysFromNow(1).toISOString(),
    end: new Date(daysFromNow(1).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Oslo',
    required_interpreters: 2,
  },
  {
    id: 'A2',
    title: 'NAV – veiledningsmøte',
    client: 'NAV',
    type: 'tegnspråk',
    status: 'partly_filled',
    start: daysFromNow(0).toISOString(),
    end: new Date(daysFromNow(0).getTime() + 90 * 60 * 1000).toISOString(),
    location: 'Drammen (remote mulig)',
    required_interpreters: 2,
  },
  {
    id: 'A3',
    title: 'Konferanse – parallel session B',
    client: 'KUD',
    type: 'tegn_som_støtte',
    status: 'inviting',
    start: daysFromNow(7).toISOString(),
    end: new Date(daysFromNow(7).getTime() + 3 * 60 * 60 * 1000).toISOString(),
    location: 'Oslo Kongressenter',
    required_interpreters: 2,
  },
  {
    id: 'A4',
    title: 'Hjemmebesøk – kommunikasjon døvblind',
    client: 'Kommune',
    type: 'døvblinde',
    status: 'staffed',
    start: daysFromNow(3).toISOString(),
    end: new Date(daysFromNow(3).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Bærum',
    required_interpreters: 2,
  },
  {
    id: 'A5',
    title: 'Seminar – panelsamtale',
    client: 'OsloMet',
    type: 'tegnspråk',
    status: 'inviting',
    start: daysFromNow(14).toISOString(),
    end: new Date(daysFromNow(14).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Oslo',
    required_interpreters: 2,
  },
  // ekstra dummy-data
  {
    id: 'A6',
    title: 'Kurs – arbeidsliv og rettigheter',
    client: 'LO',
    type: 'skrivetolking',
    status: 'inviting',
    start: daysFromNow(2).toISOString(),
    end: new Date(daysFromNow(2).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Oslo',
    required_interpreters: 2,
  },
  {
    id: 'A7',
    title: 'Foreldremøte – grunnskole',
    client: 'Kommune',
    type: 'tegnspråk',
    status: 'inviting',
    start: daysFromNow(5).toISOString(),
    end: new Date(daysFromNow(5).getTime() + 90 * 60 * 1000).toISOString(),
    location: 'Kongsberg',
    required_interpreters: 2,
  },
  {
    id: 'A8',
    title: 'Legebesøk – spesialist',
    client: 'Viken HF',
    type: 'tegn_som_støtte',
    status: 'partly_filled',
    start: daysFromNow(1).toISOString(),
    end: new Date(daysFromNow(1).getTime() + 60 * 60 * 1000).toISOString(),
    location: 'Drammen',
    required_interpreters: 2,
  },
  {
    id: 'A9',
    title: 'Workshop – inkluderende formidling',
    client: 'Kulturetaten',
    type: 'skrivetolking',
    status: 'inviting',
    start: daysFromNow(10).toISOString(),
    end: new Date(daysFromNow(10).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Oslo',
    required_interpreters: 2,
  },
  {
    id: 'A10',
    title: 'Universitet – labøvelse',
    client: 'UiB',
    type: 'tegnspråk',
    status: 'staffed',
    start: daysFromNow(4).toISOString(),
    end: new Date(daysFromNow(4).getTime() + 3 * 60 * 60 * 1000).toISOString(),
    location: 'Bergen',
    required_interpreters: 2,
  },
];

function fmt(dateIso) {
  const d = new Date(dateIso);
  return d.toLocaleString('no-NO', {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toggle(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export default function Page() {
function logout() {
  // slett rolle-cookien
  document.cookie = "role=; Max-Age=0; path=/";
  // last siden på nytt
  window.location.reload();
}
  const [q, setQ] = useState('');
  const [typeSel, setTypeSel] = useState([]);
  const [statusSel, setStatusSel] = useState(['inviting', 'partly_filled']); // default: bare ledige
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [rushOnly, setRushOnly] = useState(false); // HASTER
  const [role, setRole] = useState('tolk'); // tolkes som default

  // Les rolle fra cookie (settes i middleware etter innlogging)
  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )role=([^;]+)/);
    if (m && (m[1] === 'admin' || m[1] === 'tolk')) setRole(m[1]);
  }, []);

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

    if (typeSel.length > 0) {
      data = data.filter((a) => typeSel.includes(a.type));
    }

    // Skjul bemannede for tolker helt
    if (role === 'tolk') {
      data = data.filter((a) => a.status !== 'staffed');
    } else {
      // Admin kan filtrere på statusSel
      if (statusSel.length > 0) data = data.filter((a) => statusSel.includes(a.status));
    }

    // Dato-overlapp
    const fromTs = from ? new Date(from + 'T00:00:00').getTime() : null;
    const toTs = to ? new Date(to + 'T23:59:59').getTime() : null;
    if (fromTs || toTs) {
      data = data.filter((a) => {
        const s = new Date(a.start).getTime();
        const e = new Date(a.end).getTime();
        const overlap = (fromTs === null || e >= fromTs) && (toTs === null || s <= toTs);
        return overlap;
      });
    }

    // Haster = starter innen 3 dager
    if (rushOnly) {
      const limit = daysFromNow(3).getTime() + (24 * 60 * 60 * 1000 - 1);
      data = data.filter((a) => new Date(a.start).getTime() <= limit && new Date(a.start).getTime() >= Date.now());
    }

    data.sort((a, b) => {
      const da = new Date(a.start).getTime();
      const db = new Date(b.start).getTime();
      return sortAsc ? da - db : db - da;
    });

    return data;
  }, [q, typeSel, statusSel, from, to, sortAsc, rushOnly, role]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex justify-between items-center mb-6">
  <h1 className="text-2xl font-bold">
    Tegnsatt ledige oppdrag
  </h1>
  <div className="flex items-center gap-4">
    <span className="text-gray-600">
      Rolle: {role}
    </span>
    <button
      onClick={logout}
      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Logg ut
    </button>
  </div>
</header>

        <section className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              placeholder="Søk (tittel, kunde, sted)"
              className="border rounded-xl px-3 py-2"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Fra</label>
              <input
                type="date"
                className="border rounded-xl px-3 py-2"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <label className="text-sm text-gray-600">Til</label>
              <input
                type="date"
                className="border rounded-xl px-3 py-2"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Sorter:</span>
              <button
                className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                onClick={() => setSortAsc((s) => !s)}
                title="Sorter etter dato"
              >
                Dato {sortAsc ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Type */}
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
                  onClick={() =>
                    setTypeSel((arr) => toggle(arr, t.key))
                  }
                  aria-pressed={typeSel.includes(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status (kun admin får velge Bemannet / se filter) */}
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

        {/* Resultater */}
        <section className="space-y-3">
          <div className="text-sm text-gray-600">{filtered.length} treff</div>
          {filtered.map((a) => (
            <article key={a.id} className="bg-white p-4 rounded-2xl shadow-sm border">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{a.title}</h2>
                  <p className="text-sm text-gray-600">{a.client} • {a.location}</p>
                  <p className="text-sm text-gray-600">{fmt(a.start)} – {fmt(a.end)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-gray-100 text-sm">
                    {TYPES.find((t) => t.key === a.type)?.label}
                  </span>
                  {/* Status-badge vises, men tolker får aldri se bemannede i lista uansett */}
                  <span className={
                    'px-3 py-1.5 rounded-full text-sm ' +
                    (a.status === 'staffed'
                      ? 'bg-green-100 text-green-800'
                      : a.status === 'partly_filled'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800')
                  }>
                    {STATUS.find((s) => s.key === a.status)?.label}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
