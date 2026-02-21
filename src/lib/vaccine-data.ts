/**
 * Smart Vaccine Recommendation Engine
 * Data sourced from Vaccine.xlsx — 6 vaccines with age, medical risk, and special group criteria.
 */
import {
  evaluateMMRV,
  evaluatePneumococcal,
  evaluateMenCC,
  evaluateFlu,
  evaluateDTaPIPVHib
} from "./vaccine-rules";

export interface VaccineInfo {
  name: string;
  /** Display name matching VACCINE_NAMES in types.ts */
  displayNames: string[];
  ageGroup: string;
  medicalRisk: string[];
  specialGroups: string[];
  /** Parsed age range for matching */
  minAgeMonths: number;
  maxAgeMonths: number;
  /** Total doses in the series */
  totalDoses: number;
  /** Months between doses */
  dosesIntervalMonths: number;
  /** Months until booster needed (0 = one-time) */
  boosterIntervalMonths: number;
}

// Vaccine database derived from Vaccine.xlsx
export const VACCINE_DATABASE: VaccineInfo[] = [
  {
    name: "COVID-19",
    displayNames: ["COVID-19 (Pfizer-BioNTech)", "COVID-19 (Moderna)"],
    ageGroup: "65+",
    medicalRisk: [
      "Chronic/underlying conditions",
      "Diabetes",
      "Heart Disease",
      "COPD",
      "Chronic Kidney Disease",
      "Cancer",
      "Asthma",
      "Hypertension",
      "Liver Disease",
    ],
    specialGroups: [
      "Pregnant",
      "Nursing Home Resident",
      "Healthcare Worker",
      "Age 65+",
    ],
    minAgeMonths: 6, // 6 months+
    maxAgeMonths: 1200,
    totalDoses: 3,
    dosesIntervalMonths: 1,
    boosterIntervalMonths: 12, // annual booster
  },
  {
    name: "Rotavirus",
    displayNames: ["Rotavirus"],
    ageGroup: "Infants 6 weeks–8 months",
    medicalRisk: [],
    specialGroups: [],
    minAgeMonths: 1, // ~6 weeks
    maxAgeMonths: 8,
    totalDoses: 2,
    dosesIntervalMonths: 2,
    boosterIntervalMonths: 0,
  },
  {
    name: "Varicella (Chickenpox)",
    displayNames: ["Varicella (Chickenpox)"],
    ageGroup: "12 months+ (routine at 12 months and 4–6 years)",
    medicalRisk: [
      "Immunocompromised",
      "Autoimmune Disorder",
      "Chronic Kidney Disease",
    ],
    specialGroups: [],
    minAgeMonths: 12,
    maxAgeMonths: 1200,
    totalDoses: 2,
    dosesIntervalMonths: 36, // 2nd dose at 4-6 years
    boosterIntervalMonths: 0,
  },
  {
    name: "Hepatitis B",
    displayNames: ["Hepatitis B"],
    ageGroup: "Young children (before exposure)",
    medicalRisk: ["Liver Disease"],
    specialGroups: [
      "Healthcare Worker",
      "International Traveler",
    ],
    minAgeMonths: 0,
    maxAgeMonths: 1200,
    totalDoses: 3,
    dosesIntervalMonths: 2,
    boosterIntervalMonths: 0,
  },
  {
    name: "Tdap-IPV",
    displayNames: [
      "Tdap (Tetanus, Diphtheria, Pertussis)",
      "Polio (IPV)",
    ],
    ageGroup: "Infants (routine), booster at 4–6 years, catch-up 7–18 years",
    medicalRisk: [],
    specialGroups: ["Pregnant"],
    minAgeMonths: 2,
    maxAgeMonths: 1200,
    totalDoses: 5,
    dosesIntervalMonths: 2,
    boosterIntervalMonths: 120, // every 10 years
  },
  {
    name: "HPV",
    displayNames: ["HPV (Human Papillomavirus)"],
    ageGroup: "Grade 6 students; Females 9–45 years; Males 9–26 years",
    medicalRisk: ["HIV/AIDS", "Immunocompromised", "Cancer"],
    specialGroups: [],
    minAgeMonths: 108, // ~9 years
    maxAgeMonths: 540, // ~45 years
    totalDoses: 3,
    dosesIntervalMonths: 2,
    boosterIntervalMonths: 0,
  },
];

/**
 * Additional common vaccines from the app's VACCINE_NAMES list
 * that aren't in the xlsx but are part of standard schedules.
 */
export const EXTRA_VACCINES: VaccineInfo[] = [
  {
    name: "Influenza",
    displayNames: ["Influenza (Flu)"],
    ageGroup: "6 months+",
    medicalRisk: [
      "Diabetes",
      "Asthma",
      "Heart Disease",
      "COPD",
      "Chronic Kidney Disease",
      "Cancer",
      "HIV/AIDS",
      "Liver Disease",
    ],
    specialGroups: [
      "Pregnant",
      "Age 65+",
      "Healthcare Worker",
      "Nursing Home Resident",
    ],
    minAgeMonths: 6,
    maxAgeMonths: 1200,
    totalDoses: 1,
    dosesIntervalMonths: 0,
    boosterIntervalMonths: 12, // annual
  },
  {
    name: "MMR",
    displayNames: ["MMR (Measles, Mumps, Rubella)"],
    ageGroup: "12 months+",
    medicalRisk: [],
    specialGroups: ["Healthcare Worker"],
    minAgeMonths: 12,
    maxAgeMonths: 1200,
    totalDoses: 2,
    dosesIntervalMonths: 36,
    boosterIntervalMonths: 0,
  },
  {
    name: "Shingles",
    displayNames: ["Shingles (Zoster)"],
    ageGroup: "50+",
    medicalRisk: ["Immunocompromised"],
    specialGroups: ["Age 65+"],
    minAgeMonths: 600, // 50 years
    maxAgeMonths: 1200,
    totalDoses: 2,
    dosesIntervalMonths: 2,
    boosterIntervalMonths: 0,
  },
  {
    name: "Pneumococcal",
    displayNames: ["Pneumococcal (PCV13)", "Pneumococcal (PPSV23)"],
    ageGroup: "65+",
    medicalRisk: [
      "Diabetes",
      "Heart Disease",
      "COPD",
      "Chronic Kidney Disease",
      "HIV/AIDS",
      "Liver Disease",
    ],
    specialGroups: ["Age 65+", "Immunocompromised", "Nursing Home Resident"],
    minAgeMonths: 780, // 65 years
    maxAgeMonths: 1200,
    totalDoses: 2,
    dosesIntervalMonths: 12,
    boosterIntervalMonths: 0,
  },
  {
    name: "Hepatitis A",
    displayNames: ["Hepatitis A"],
    ageGroup: "12 months+",
    medicalRisk: ["Liver Disease"],
    specialGroups: ["International Traveler"],
    minAgeMonths: 12,
    maxAgeMonths: 1200,
    totalDoses: 2,
    dosesIntervalMonths: 6,
    boosterIntervalMonths: 0,
  },
  {
    name: "Meningococcal",
    displayNames: ["Meningococcal"],
    ageGroup: "11-18 years",
    medicalRisk: ["Immunocompromised"],
    specialGroups: [],
    minAgeMonths: 132, // 11 years
    maxAgeMonths: 300, // 25 years
    totalDoses: 2,
    dosesIntervalMonths: 60, // booster at 16
    boosterIntervalMonths: 0,
  },
];

export const ALL_VACCINES = [...VACCINE_DATABASE, ...EXTRA_VACCINES];

// ─── Recommendation Engine ───────────────────────────────────────────

export interface VaccineRecommendation {
  vaccine: VaccineInfo;
  reasons: string[];
  status: "completed" | "needed" | "overdue" | "upcoming";
  completedDoses: number;
  remainingDoses: number;
  nextDueDate: string | null; // ISO date
  lastGivenDate: string | null;
}

export interface PatientProfile {

  dateOfBirth: string;
  gender: string;
  chronicConditions: string[];
  riskFactors: string[];
  vaccinations: {
    vaccineName: string;
    doseNumber: number;
    dateGiven: string;
  }[];
}

function normalizeVaccineName(name: string): string {
  return name.split("(")[0].trim().toLowerCase();
}

function getAgeInMonths(dob: string): number {
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  return (
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth())
  );
}

function isEligibleByAge(vaccine: VaccineInfo, ageMonths: number): boolean {
  return ageMonths >= vaccine.minAgeMonths && ageMonths <= vaccine.maxAgeMonths;
}

function isEligibleByMedicalRisk(
  vaccine: VaccineInfo,
  conditions: string[]
): boolean {
  if (vaccine.medicalRisk.length === 0) return false;
  return conditions.some((c) =>
    vaccine.medicalRisk.some(
      (risk) =>
        risk.toLowerCase().includes(c.toLowerCase()) ||
        c.toLowerCase().includes(risk.toLowerCase())
    )
  );
}

function isEligibleBySpecialGroup(
  vaccine: VaccineInfo,
  riskFactors: string[]
): boolean {
  if (vaccine.specialGroups.length === 0) return false;
  return riskFactors.some((f) =>
    vaccine.specialGroups.some(
      (group) =>
        group.toLowerCase().includes(f.toLowerCase()) ||
        f.toLowerCase().includes(group.toLowerCase())
    )
  );
}

function getVaccinationRecords(
  patient: PatientProfile,
  vaccine: VaccineInfo
): { vaccineName: string; doseNumber: number; dateGiven: string }[] {
  return patient.vaccinations.filter((v) =>
    vaccine.displayNames.some(
      (dn) =>
        normalizeVaccineName(dn) === normalizeVaccineName(v.vaccineName)
    )
  );
}

function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
}

/**
 * Get all recommended vaccines for a patient, with status
 */
export function getRecommendations(
  patient: PatientProfile
): VaccineRecommendation[] {
  const ageMonths = getAgeInMonths(patient.dateOfBirth);
  const today = new Date().toISOString().split("T")[0];
  const recommendations: VaccineRecommendation[] = [];

  for (const vaccine of ALL_VACCINES) {
    const reasons: string[] = [];

    // Check eligibility
    const ageEligible = isEligibleByAge(vaccine, ageMonths);
    const medicalEligible = isEligibleByMedicalRisk(
      vaccine,
      patient.chronicConditions
    );
    const specialEligible = isEligibleBySpecialGroup(
      vaccine,
      patient.riskFactors
    );

    if (ageEligible) reasons.push(`Age group: ${vaccine.ageGroup}`);
    if (medicalEligible) reasons.push("Medical risk condition match");
    if (specialEligible) reasons.push("Special group eligibility");

    // Skip if not eligible at all
    if (reasons.length === 0) continue;

    // Check vaccination history
    const records = getVaccinationRecords(patient, vaccine);

    // Apply custom rules if applicable
    let customRec: VaccineRecommendation | null = null;
    const vName = normalizeVaccineName(vaccine.displayNames[0]);
    if (vName.includes("mmr")) {
      customRec = evaluateMMRV(patient, vaccine, records);
    } else if (vName.includes("pneumococcal")) {
      customRec = evaluatePneumococcal(patient, vaccine, records);
    } else if (vName.includes("meningococcal")) {
      customRec = evaluateMenCC(patient, vaccine, records);
    } else if (vName.includes("influenza") || vName.includes("flu")) {
      customRec = evaluateFlu(patient, vaccine, records);
    } else if (vName.includes("tdap") || vName.includes("dtap")) {
      customRec = evaluateDTaPIPVHib(patient, vaccine, records);
    }

    if (customRec) {
      // if evaluating contraindicates completely, it might return null
      recommendations.push(customRec);
      continue;
    }

    // Generic fallback logic for other vaccines
    const completedDoses = records.length;
    const sortedRecords = [...records].sort(
      (a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime()
    );
    const lastRecord = sortedRecords[0];

    let status: VaccineRecommendation["status"];
    let remainingDoses: number;
    let nextDueDate: string | null = null;

    if (completedDoses >= vaccine.totalDoses) {
      // All doses completed — check if booster is needed
      if (vaccine.boosterIntervalMonths > 0 && lastRecord) {
        const boosterDue = addMonths(
          lastRecord.dateGiven,
          vaccine.boosterIntervalMonths
        );
        if (boosterDue <= today) {
          status = "overdue";
          nextDueDate = boosterDue;
          remainingDoses = 1;
        } else {
          status = "completed";
          nextDueDate = boosterDue;
          remainingDoses = 0;
        }
      } else {
        status = "completed";
        remainingDoses = 0;
      }
    } else {
      // Still need more doses
      remainingDoses = vaccine.totalDoses - completedDoses;
      if (lastRecord) {
        nextDueDate = addMonths(
          lastRecord.dateGiven,
          vaccine.dosesIntervalMonths
        );
        status = nextDueDate <= today ? "overdue" : "upcoming";
      } else {
        // Never received — needed now
        status = "needed";
        nextDueDate = today;
      }
    }

    recommendations.push({
      vaccine,
      reasons,
      status,
      completedDoses,
      remainingDoses,
      nextDueDate,
      lastGivenDate: lastRecord?.dateGiven || null,
    });

  }

  return recommendations;
}

/**
 * Get only needed/overdue vaccines
 */
export function getNeededVaccines(
  patient: PatientProfile
): VaccineRecommendation[] {
  return getRecommendations(patient).filter(
    (r) => r.status === "needed" || r.status === "overdue"
  );
}

/**
 * Get only completed vaccines
 */
export function getCompletedVaccines(
  patient: PatientProfile
): VaccineRecommendation[] {
  return getRecommendations(patient).filter((r) => r.status === "completed");
}

/**
 * Get upcoming vaccinations within N days
 */
export function getUpcomingWithinDays(
  patient: PatientProfile,
  days: number = 10
): VaccineRecommendation[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  return getRecommendations(patient).filter(
    (r) =>
      r.nextDueDate &&
      r.nextDueDate >= today &&
      r.nextDueDate <= cutoffStr &&
      r.status !== "completed"
  );
}

/**
 * Get timeline entries (past + future) for a patient
 */
export interface TimelineEntry {
  vaccineName: string;
  date: string;
  type: "completed" | "upcoming" | "overdue";
  doseNumber: number;
  totalDoses: number;
  provider?: string;
  reasons?: string[];
}

export function getTimeline(patient: PatientProfile): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  // Add completed vaccinations
  for (const vax of patient.vaccinations) {
    const matchingVaccine = ALL_VACCINES.find((v) =>
      v.displayNames.some(
        (dn) =>
          normalizeVaccineName(dn) === normalizeVaccineName(vax.vaccineName)
      )
    );
    entries.push({
      vaccineName: vax.vaccineName,
      date: vax.dateGiven,
      type: "completed",
      doseNumber: vax.doseNumber,
      totalDoses: matchingVaccine?.totalDoses || vax.doseNumber,
      provider: (vax as any).provider,
    });
  }

  // Add upcoming/overdue from recommendations
  const recs = getRecommendations(patient);
  const today = new Date().toISOString().split("T")[0];

  for (const rec of recs) {
    if (rec.nextDueDate && rec.remainingDoses > 0) {
      entries.push({
        vaccineName: rec.vaccine.displayNames[0],
        date: rec.nextDueDate,
        type: rec.nextDueDate <= today ? "overdue" : "upcoming",
        doseNumber: rec.completedDoses + 1,
        totalDoses: rec.vaccine.totalDoses,
        reasons: rec.reasons,
      });
    }
  }

  // Sort chronologically
  entries.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return entries;
}
