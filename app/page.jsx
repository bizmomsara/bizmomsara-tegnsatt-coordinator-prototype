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

const STORAGE_KEY = 'tegnsatt-ui-v1';

export default function Page() {
  const [role, setRole] = useState('tolk'); // 'tolk' | 'admin'
  const [view, setView] = useState('ledige'); // 'ledige' | 'mine-ønsker' | 'mine-tildelte'
  const [jobs, setJobs] = useState(INITIAL);
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('alle');
  const [sortBy, setSortBy] = useState('date_asc'); // 'date_asc' | 'date_desc'
  const [from, setFrom] = useState(''); // YYYY-MM-DD
const [to, setTo] = useState('');     // YYYY-MM-DD


  const chipClass = (value) =>
    `text-sm px-3 py-1 rounded-full border transition ${
      value === typeFilter ? 'bg-black text-white border-black' : 'bg-white'
    }`;

  const tabClass = (value) =>
    `px-3 py-1 rounded-full border text-sm ${
      value === view ? 'bg-black text-white border-black' : 'bg-white'
    }`;

  const resetFilters = () => {
  setQuery('');
  setTypeFilter('alle');
  setSortBy('date_asc');
  setView('ledige');
  setOpenId(null);
  setFrom('');   // NY
  setTo('');     // NY
};
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
  } catch (err) {
    // ignorer
  }
}, []);
useEffect(() => {
  if (typeof window === 'undefined') return;
  try {
    const s = { role, view, query, typeFilter, sortBy, from, to };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (err) {
    // ignorer
  }
}, [role, view, query, typeFilter, sortBy, from, to]);


  // GDPR- og visningsfiltrering (fra datalaget)
  const filtered = useMemo(() => {
  return getJobs({
    allJobs: jobs,
    view,
    typeFilter,
    query,
    role,
    dateFrom: from,   // NY
    dateTo: to,       // NY
  });
}, [jobs, view, typeFilter, query, role, from, to]); // ← legg til from, to

  // Sortering på dato
  const displayed = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (sortBy === 'date_desc') arr.reverse();
    return arr;
  }, [filtered, sortBy]);

  // handlinger
  const toggleOpen = (id) => setOpenId(openId === id ? null : id);

  const applyFor = (id) =>
    setJobs((prev) => prev.map((a) => (a.id === id ? { ...a, appliedByUser: true } : a)));

  const withdraw = (id) =>
    setJobs((prev) => prev.map((a) => (a.id === id ? { ...a, appliedByUser: false } : a)));

// Admin: tildel til bruker (demo) – øk assignedCount til maks slots
const assignToUser = (id) => {
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
};

// Admin: fjern en tildeling (demo)
const unassignFromUser = (id) => {
  setJobs((prev) =>
    prev.map((a) =>
      a.id !== id
        ? a
        : {
            ...a,
            assignedCount: Math.max(0, a.assignedCount - 1),
            assignedToUser: false,
          }
    )
  );
};
// Vis dato som DD-MM-YYYY  ⬅️ LIM INN DENNE HER
const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
};
  
  return (
    <main className="max-w-3xl mx-auto p-4">
      {/* Topp: tittel + rolle */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tegnsatt — ledige oppdrag</h1>
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

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        {VIEWS.map((t) => {
  const label =
    role === 'admin'
      ? (t.id === 'mine-ønsker'
          ? 'Påmeldte'
          : t.id === 'mine-tildelte'
          ? 'Tildelte'
          : t.label)
      : t.label;

  return (
    <button key={t.id} className={tabClass(t.id)} onClick={() => setView(t.id)}>
      {label}
    </button>
  );
})}
      </div>

      {/* Søk */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Søk (tittel, kunde, sted)"
        className="w-full mb-3 border rounded-lg p-2"
      />

      {/* Filterlinje */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
  <button className={chipClass('alle')} onClick={() => setTypeFilter('alle')}>alle</button>
  {TYPES.map((t) => (
    <button key={t} className={chipClass(t)} onClick={() => setTypeFilter(t)}>{t}</button>
  ))}

  <button type="button" onClick={resetFilters} className="px-3 py-1 rounded border">
    Nullstill filtre
  </button>
        try { if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY); } catch (err) {}


  {/* NYTT: dato fra/til */}
  <label className="text-sm opacity-70">Fra:</label>
  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
         className="border rounded-lg px-2 py-1 text-sm bg-white" />
  <label className="text-sm opacity-70">Til:</label>
  <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
         className="border rounded-lg px-2 py-1 text-sm bg-white" />

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
  {a.customer} — {formatDate(a.date)}
</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm px-2 py-1 rounded-full border">{a.type}</span>
                    {STATUS[a.status] && (
                      <span
                        className={`text-sm px-2 py-1 rounded-full border ${STATUS[a.status].className}`}
                      >
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
                      {a.coInterpreter ?? (
                        <span className="italic opacity-70">Vises etter tildeling</span>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-sm font-medium">Merknader</div>
                    <div className="text-sm">{a.requesterNotes || '—'}</div>
                  </div>

                                  {/* Handlingsknapper */}
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
                      <>
                        <button
                          className={`px-3 py-1 rounded border ${
                            a.assignedCount >= a.slots ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          onClick={() => assignToUser(a.id)}
                          disabled={a.assignedCount >= a.slots}
                        >
                          Tildel til bruker (demo)
                        </button>

                        {a.assignedCount > 0 && (
                          <button
                            className="px-3 py-1 rounded border"
                            onClick={() => unassignFromUser(a.id)}
                          >
                            Fjern tildeling (demo)
                          </button>
                        )}
                      </>
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
