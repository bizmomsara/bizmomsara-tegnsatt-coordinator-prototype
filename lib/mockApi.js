// lib/mockApi.js
import { STATUS, computeStatus } from "./models";

// Konfig: sett med env-variabler hvis du vil (ellers brukes default)
const FAILURE_RATE = Number(process.env.NEXT_PUBLIC_MOCK_FAIL_RATE ?? 0);   // 0 = ingen tullefeil
const LATENCY_MS   = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 300); // millisekunder

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function maybeFail(prob = FAILURE_RATE) {
  if (Math.random() < prob) {
    const error = new Error("Uff! Nettverksglipp. Prøv igjen.");
    error.code = "NETWORK";
    throw error;
  }
}

let _interpreters = [
  { id: "u1", name: "Sara", role: "admin" },
  { id: "u2", name: "Ola Nordmann", role: "tolk" },
  { id: "u3", name: "Kari Nordmann", role: "tolk" },
];

let _assignments = [
  {
    id: "A1",
    title: "Forelesning – INF1001",
    customer: "UiO",
    location: "Blindern, Aud 1",
    startISO: "2025-09-01T10:15:00+02:00",
    endISO:   "2025-09-01T12:00:00+02:00",
    status: STATUS.OPEN,
    slots: 2,
    assignedIds: [],
    type: "forelesning",
    notes: "Møt 15 min før.",
  },
  {
    id: "A2",
    title: "KUD – møte",
    customer: "Kultur- og likestillingsdep.",
    location: "Oslo, R5",
    startISO: "2025-09-02T13:00:00+02:00",
    endISO:   "2025-09-02T14:30:00+02:00",
    status: STATUS.PARTIAL,
    slots: 2,
    assignedIds: ["u2"],
    type: "møte",
    notes: "",
  },
];

// === API-funksjoner ===

export async function fetchAllAssignments() {
  await delay(LATENCY_MS);
  maybeFail(); // bruker FAILURE_RATE
  // Regn ut status dynamisk:
  const data = _assignments.map((a) => ({ ...a, status: computeStatus(a) }));
  // Sorter stigende på start-tid
  data.sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
  return data;
}

export async function fetchInterpreters() {
  await delay(Math.max(150, LATENCY_MS - 100));
  maybeFail();
  return [..._interpreters];
}

export async function assignInterpreter({ assignmentId, interpreterId }) {
  await delay(LATENCY_MS);
  maybeFail();
  const a = _assignments.find((x) => x.id === assignmentId);
  if (!a) throw new Error("Oppdrag ikke funnet");
  if (!a.assignedIds.includes(interpreterId)) {
    a.assignedIds.push(interpreterId);
  }
  a.status = computeStatus(a);
  return { ...a };
}

export async function unassignInterpreter({ assignmentId, interpreterId }) {
  await delay(LATENCY_MS);
  maybeFail();
  const a = _assignments.find((x) => x.id === assignmentId);
  if (!a) throw new Error("Oppdrag ikke funnet");
  a.assignedIds = a.assignedIds.filter((id) => id !== interpreterId);
  a.status = computeStatus(a);
  return { ...a };
}

export async function upsertAssignment(payload) {
  await delay(LATENCY_MS);
  maybeFail();
  const idx = _assignments.findIndex((x) => x.id === payload.id);
  if (idx >= 0) {
    _assignments[idx] = { ..._assignments[idx], ...payload };
  } else {
    _assignments.push(payload);
  }
  const a = _assignments.find((x) => x.id === payload.id);
  a.status = computeStatus(a);
  return { ...a };
}
