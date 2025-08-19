'use client';
import { useMemo, useState } from 'react';

const SEED = [
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
    assigned: false, // ← ikke tildelt (tolk skal ikke se medtolk)
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
    assigned: true, // ← tildelt (tolk kan se medtolk)
  },
];

const TYPES = ['tegnspråk', 'skrivetolking'];

export default function Page() {
  // Demo: rolle-velger for å verifisere logikken (i virkelig løsning kommer rolle fra auth/session)
  const [role, setRole] = useState<'tolk' | 'admin'>('tolk');
  const [openId, setOpenId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'alle' | 'tegnspråk' | 'skrivetolking'>('alle');

  const chipClass = (value: string) =>
    `text-sm px-3 py-1 rounded-full border transition ${
      typeFilter === value ? 'bg-black text-white border-black' : 'bg-white'
    }`;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SEED
      .filter((a) => (typeFilter === 'alle' ? true : a.type === typeFilter))
      .filter((a) =>
        q ? `${a.title} ${a.customer} ${a.address}`.toLowerCase().includes(q) : true
      );
  }, [query, typeFilter]);

  return (
    <main className="max-w-3xl mx-auto p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tegnsatt — ledige oppdrag</h1>

        {/* Rolle-velger for demo */}
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

      {/* Søk */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Søk (tittel, kunde, sted)"
        className="w-full mb-3 border rounded-lg p-2"
      />

      {/* Type-filter */}
      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setTypeFilter('alle')} className={chipClass('alle')}>
          alle
        </button>
        {TYPES.map((t) => (
          <button key={t} type="button" onClick={() => setTypeFilter(t as any)} className={chipClass(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Resultater */}
      {list.length === 0 ? (
        <div className="opacity-70">Ingen treff.</div>
      ) : (
        <ul className="space-y-3">
          {list.map((a) => {
            const canSeeCoInterpreter = role === 'admin' || a.assigned;

            return (
              <li key={a.id} className="border rounded-xl bg-white">
                <button
                  type="button"
                  onClick={() => setOpenId(openId === a.id ? null : a.id)}
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
                  <div id={`details-${a.id}`} className="border-t p-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-medium">Adresse</div>
                      <div className="text-sm">{a.address}</div>
                    </div>

                    {/* Medtolk: skjules for tolk inntil oppdraget er tildelt */}
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
