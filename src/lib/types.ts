export interface VaccinationRecord {
  id?: string;
  vaccineName: string;
  doseNumber: number;
  dateGiven: string; // ISO date string
  provider?: string;
}

export interface DueImmunizationRecord {
  vaccineName?: string;
  mbCode?: string;
  doseNumber?: number;
  dueDate?: string;
  status?: string;
}

export interface Patient {
  id?: string;
  userId?: string; // linked to a user account
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  gender: string;
  email?: string;
  phone?: string;
  address?: string;
  personalHealthNumber?: string;
  recipientRelationship?: string;
  streetAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;

  chronicConditions: string[];
  riskFactors: string[];
  vaccinations: VaccinationRecord[];
  nextImmunizationsDue?: DueImmunizationRecord[];
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: string;
}

export const CHRONIC_CONDITIONS = [
  "Diabetes",
  "Asthma",
  "Heart Disease",
  "COPD",
  "Chronic Kidney Disease",
  "Cancer",
  "HIV/AIDS",
  "Liver Disease",
  "Autoimmune Disorder",
  "Hypertension",
  "Asplenia",
  "Cochlear Implant",
] as const;

export const RISK_FACTORS = [
  "Pregnant",
  "Immunocompromised",
  "Healthcare Worker",
  "Age 65+",
  "Smoker",
  "Organ Transplant Recipient",
  "Chronic Lung Disease",
  "Nursing Home Resident",
  "International Traveler",
] as const;

export const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
] as const;

export const VACCINE_NAMES = [
  "COVID-19 (Pfizer-BioNTech)",
  "COVID-19 (Moderna)",
  "Influenza (Flu)",
  "Tdap (Tetanus, Diphtheria, Pertussis)",
  "MMR (Measles, Mumps, Rubella)",
  "Hepatitis A",
  "Hepatitis B",
  "HPV (Human Papillomavirus)",
  "Pneumococcal (PCV13)",
  "Pneumococcal (PPSV23)",
  "Varicella (Chickenpox)",
  "Shingles (Zoster)",
  "Meningococcal",
  "Polio (IPV)",
  "Rotavirus",
] as const;
