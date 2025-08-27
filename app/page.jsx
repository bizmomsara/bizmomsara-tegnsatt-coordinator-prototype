'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import {
  fetchAllAssignments,
  fetchInterpreters,
  applyForAssignment,
  withdrawApplication,
  assignInterpreter,
  unassignInterpreter,
} from '../lib/mockApi';

// Faner
const VIEWS = [
  { id: 'ledige',        label: 'Ledige' },
  { id: 'mine-ønsker',   label: 'Mine ønsker' },
  { id: 'mine-tildelte', label: 'Tildelte' },
];

const ADMIN_VIEWS = [
  { id: 'ledige',        label: 'Ledige' },
  { id: 'mine-ønsker',   label: 'Påmeldte' },
  { id: 'mine-tildelte', label: 'Tildelte' },
];

// Status-badger (visuell)
const UI_STATUS = {
  open:      { label: 'Åpne',            className: 'bg-blue-50 text-blue-700 border-blue-200' },
  partial:   { label: 'Delvis bemannet', className: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  full:      { label: 'Bemannet',        className: 'bg-green-50 text-green-800 border-green-200' },
  draft:     { label: 'Kladd',           className: 'bg-purple-50 text-purple-700 border-purple-200' },
  cancelled: { label: 'Avlyst',          className: 'bg-gray-100 text-gray-700 border-gray-200' },
  done:      { label: 'Ferdig',          className: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const STORAGE_KEY = 'tegnsatt-ui-v1';

// Små UI-hjelpere
const chipClass = (active, current) =>
  `text-sm px-3 py-1 rounded-full border transition ${active === current ? 'bg-black text-white border-black' : 'bg-white'}`;
const tabClass = (active, current) =>
  `px-3 py-1 rounded-full border text-sm ${active === current ? 'bg-black text-white border-black' : 'bg-white'}`;

export default function Page() {
  // Rolle/visning/filtre
  const [role, setRole] = useState('tolk'); // 'tolk' | 'admin'
  const [view, setView] = useState('ledige');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('alle');
  const [sortBy, setSortBy] = useState('date_asc'); // 'date_asc' | 'date_desc'
  const [from, setFrom] = useState(''); // YYYY-MM-DD
  const [to, setTo]     = useState(''); // YYYY-MM-DD

  // Data/tilstand
  const [assignments, setAssignments] = useState([]);
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Ulest-varsler
  const [seenAssignedIds, setSeenAssignedIds] = useState([]); // tolk
  const [seenWishIds, setSeenWishIds] = useState([]);         // admin

  const views = role === 'admin' ? ADMIN_VIEWS : VIEWS;
  const currentUserId = role === 'tolk' ? 'u2' : 'u1';

  // --- Persistens: les ---
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
      if (Array.isArray(s.seenAssignedIds)) setSeenAssignedIds(s.seenAssignedIds);
      if (Array.isArray(s.seenWishIds)) setSeenWishIds(s.seenWishIds);
    } catch {}
  }, []);

  // Hent data
  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const ass = await fetchAllAssignments();
      setAssignments(Array.isArray(ass) ? ass : []);
      const ints = await fetchInterpreters();
      setInterpreters(Array.isArray(ints) ? ints : []);
    } catch (e) {
      setErr(e?.message || 'Noe gikk galt');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // --- Persistens: lagre ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const s = { role, view, query, typeFilter, sortBy, from, to, seenAssignedIds, seenWishIds };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {}
  }, [role, view, query, typeFilter, sortBy, from, to, seenAssignedIds]()
