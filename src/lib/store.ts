// Simple in-memory store for patient and user data
// Will be replaced with Prisma + PostgreSQL for production
import { Patient, User } from "./types";
import { MOCK_PATIENTS } from "./mock-data";

// --- Patient Store ---
let patients: Patient[] = [...MOCK_PATIENTS];
let nextPatientId = patients.length + 1;

export function getAllPatients(): Patient[] {
  return [...patients];
}

export function getPatientsByUserId(userId: string): Patient[] {
  return patients.filter((p) => p.userId === userId);
}

export function getPatientById(id: string): Patient | undefined {
  return patients.find((p) => p.id === id);
}

export function createPatient(
  data: Omit<Patient, "id" | "createdAt" | "updatedAt">
): Patient {
  const now = new Date().toISOString();
  const patient: Patient = {
    ...data,
    id: String(nextPatientId++),
    createdAt: now,
    updatedAt: now,
    vaccinations: data.vaccinations.map((v, i) => ({
      ...v,
      id: `vax-${nextPatientId}-${i}`,
    })),
  };
  patients.push(patient);
  return patient;
}

export function importPatients(
  data: Omit<Patient, "id" | "createdAt" | "updatedAt">[]
): Patient[] {
  return data.map((p) => createPatient(p));
}

export function deletePatient(id: string): boolean {
  const idx = patients.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  patients.splice(idx, 1);
  return true;
}

export function updatePatient(
  id: string,
  data: Partial<Omit<Patient, "id" | "createdAt" | "updatedAt">>
): Patient | undefined {
  const idx = patients.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;

  const existing = patients[idx];
  const updated: Patient = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  patients[idx] = updated;
  return updated;
}

// --- User Store ---
let users: User[] = [];
let nextUserId = 1;

export function getAllUsers(): User[] {
  return [...users];
}

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(
  data: Omit<User, "id" | "createdAt">
): User {
  const user: User = {
    ...data,
    id: String(nextUserId++),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}
