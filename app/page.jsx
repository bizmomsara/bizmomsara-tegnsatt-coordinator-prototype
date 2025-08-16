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

const SEED = [
  { id:'A1', title:'UiO – forelesning PED1100', client:'UiO', type:'skrivetolking',
    status:'inviting', start:daysFromNow(1).toISOString(),
    end:new Date(daysFromNow(1).getTime()+2*60*60*1000).toISOString(),
    location:'Oslo', required_interpreters:2 },
  { id:'A2', title:'NAV – veiledningsmøte', client:'NAV', type:'tegnspråk',
    status:'partly_filled', start:daysFromNow(0).toISOString(),
    end:new Date(daysFromNow(0).getTime()+90*60*1000).toISOString(),
    location:'Drammen (remote mulig)', required_interpreters:2 },
  { id:'A3', title:'Konferanse – parallel session B', client:'KUD', type:'tegn_som_støtte',
    status:'inviting', start:daysFromNow(7).toISOString(),
    end:new Date(daysFromNow(7).getTime()+3*60*60*1000).toISOString(),
    location:'Oslo Kongressenter', required_interpreters:2 },
  { id:'A4', title:'Hjemmebesøk – kommunikasjon døvblind', client:'Kommune', type:'døvblinde',
    status:'staffed', start:daysFromNow(3).toISOString(),
    end:new Date(daysFromNow(3).getTime()+2*60*60*1000).toISOString(),
    location:'Bærum', required_interpreters:2 },
  { id:'A5', title:'Seminar – panelsamtale', client:'OsloMet', type:'tegnspråk',
    status:'inviting', start:daysFromNow(14).toISOString(),
    end:new Date(daysFromNow(14).getTime()+2*60*60*1000).toISOString(),
    location:'Oslo', required_interpreters:2 },
  { id:'A6', title:'Kurs – arbeidsliv og rettigheter', client:'LO', type:'skrivetolking',
    status:'inviting', start:daysFromNow(2).toISOString(),
    end:new Date(daysFromNow(2).getTime()+2*60*60*1000).toISOString(),
    location:'Oslo', required_interpreters:2 },
  { id:'A7', title:'Foreldremøte – grunnskole', client:'Kommune', type:'tegnspråk',
    status:'inviting', start:daysFromNow(5).toISOString(),
    end:new Date(daysFromNow(5).getTime()+90*60*1000).toISOString(),
    location:'Kongsberg', required_interpreters:2 },
  { id:'A8', title:'Legebesøk – spesialist', client:'Viken HF', type:'tegn_som_støtte',
    status:'partly_filled', start:daysFromNow(1).toISOString(),
    end:new Date(daysFromNow(1).getTime()+60*60*1000).toISOString(),
    location:'Drammen', required_interpreters:2 },
  { id:'A9', title:'Workshop – inkluderende formidling', client:'Kulturetaten', type:'skrivetolking',
    status:'inviting', start:daysFromNow(10).toISOString(),
    end:new Date(daysFromNow(10).getTime()+2*60*60*1000).toISOString(),
    location:'Oslo', required_interpreters:2 },
  { id:'A10', title:'Universitet – labøvelse', client:'UiB', type:'tegnspråk',
    status:'staffed', start:daysFromNow(4).toISOString(),
    end:new Date(daysFromNow(4).getTime()+3*60*60*1000).toISOString(),
    location:'Bergen', required_interpreters:2 },
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
          a.client.toLowerCase().inclu
