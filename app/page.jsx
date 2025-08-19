'use client';
import { useState } from 'react';

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
  },
];

export default function Page() {
  const [openId, setOpenId] = useState(null);

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Tegnsatt — ledige oppdrag</h1>

      <ul className="space-y-3">
        {SEED.map((a) => (
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
              <div
                id={`details-${a.id}`}
                className="border-t p-4 grid gap-3 md:grid-cols-2"
              >
                <div>
                  <div className="text-sm font-medium">Adresse</div>
                  <div className="text-sm">{a.address}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Medtolk</div>
                  <div className="text-sm">{a.coInterpreter || '—'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm font-medium">Merknader</div>
                  <div className="text-sm">{a.requesterNotes || '—'}</div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
