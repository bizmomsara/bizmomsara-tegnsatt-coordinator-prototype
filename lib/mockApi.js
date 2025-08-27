// lib/mockApi.js
import { STATUS, computeStatus } from "./models";

// Konfig: env-vars (0 i prod)
const FAILURE_RATE = Number(process.env.NEXT_PUBLIC_MOCK_FAIL_RATE ?? 0);
const LATENCY_MS   = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 300);

function delay(ms) { return new Promise((res) => setTimeout(res, ms)); }
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
    wishIds: [],            // <— nye: interesserte tolker
    type: "tegnspråk",
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
    wishIds: ["u3"],        // én tolk har meldt interesse
    type: "skrivetolking",
    notes: "",
  },
];

// === API-funksjoner ===
export async function fetchAllAssignments() {
  await delay(LATENCY_MS); maybeFail();
  const data = _assignments.map((a) => ({ ...a, status: computeStatus(a) }));
  data.sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
  return data;
}

export async function fetchInterpreters() {
  await delay(Math.max(150, LATENCY_MS - 100)); maybeFail();
  return [..._interpreters];
}

// ADMIN: tildel / fjern tildeling
export async function assignInterpreter({ assignmentId, interpreterId }) {
  await delay(LATENCY_MS); maybeFail();
  const a = _assignments.find((x) => x.id === assignmentId);
  if (!a) throw new Error("Oppdrag ikke funnet");
  if (!a.assignedIds.includes(interpreterId)) {
    a.assignedIds.push(interpreterId);
  }
  // Når tildelt: fjern ev. ønske for samme tolk
  a.wishIds = (a.wishIds || []).filter((id) => id !== interpreterId);
  a.status = computeStatus(a);
  return { ...a };
}

export async function unassignInterpreter({ assignmentId, interpreterId }) {
  await delay(LATENCY_MS); maybeFail();
  const a = _assignments.find((x) => x.id === assignmentId);
  if (!a) throw new Error("Oppdrag ikke funnet");
  a.assignedIds = a.assignedIds.filter((id) => id !== interpreterId);
  a.status = computeStatus(a);
  return { ...a };
}

export async function applyForAssignment({ assignmentId, userId }) {
  await delay(LATENCY_MS); maybeFail();
  const a = _assignments.find((x) => x.id === assignmentId);
  if (!a) throw new Error("Oppdrag ikke funnet");

  a.wishIds = a.wishIds || [];

  // Hvis tolken allerede er tildelt: ikke legg til i påmeldte
  if ((a.assignedIds || []).includes(userId)) {
    return { ...a };
  }

  // Legg til én gang (unngå duplikat)
  if (!a.wishIds.includes(userId)) a.wishIds.push(userId);

  return { ...a };
}
