import type { PatientProfile, VaccineRecommendation, VaccineInfo } from "./vaccine-data";

export function evaluateMMRV(
  patient: PatientProfile,
  vaccine: VaccineInfo,
  records: { vaccineName: string; doseNumber: number; dateGiven: string }[]
): VaccineRecommendation | null {
  const birthDate = new Date(patient.dateOfBirth);
  const isPregnant = patient.riskFactors.includes("Pregnant");
  const isImmunocompromised = patient.riskFactors.includes("Immunocompromised");
  const isHealthcareWorker = patient.riskFactors.includes("Healthcare Worker");
  const isTraveler = patient.riskFactors.includes("International Traveler");

  // 1. Contraindications
  if (isPregnant || isImmunocompromised) {
    return {
      vaccine,
      reasons: ["Contraindicated: Live vaccine"],
      status: "completed", // Technically shouldn't get it, so mark complete or remove. Let's return null to remove from recs.
      completedDoses: 0,
      remainingDoses: 0,
      nextDueDate: null,
      lastGivenDate: null,
    };
  }

  // 2. Validate doses (Invalid Dose rule)
  const validRecords = records.filter((r) => {
    const givenDate = new Date(r.dateGiven);
    // Dose must be on or after 1st birthday
    const firstBirthday = new Date(birthDate);
    firstBirthday.setFullYear(firstBirthday.getFullYear() + 1);

    // Set hours to 0 for fair date comparison
    givenDate.setHours(0, 0, 0, 0);
    firstBirthday.setHours(0, 0, 0, 0);

    return givenDate >= firstBirthday;
  });

  const completedDoses = validRecords.length;
  // If they have invalid doses, they need to repeat
  const hasInvalidDoses = validRecords.length < records.length;

  // Sort all records to find the absolute last one given
  const sortedAllRecords = [...records].sort(
    (a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime()
  );
  const lastGivenDate = sortedAllRecords.length > 0 ? sortedAllRecords[0].dateGiven : null;

  // 3. Determine required doses
  let requiredDoses = 2; // Routine is 2 doses

  // Healthcare workers & Travelers need 2 valid doses (assuming born after 1970, which is most of our app users)
  // If not high risk, they still need 2 doses normally (12m and 4-6y)

  // 4. Calculate next due date
  let nextDueDate: Date | null = null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (completedDoses === 0) {
    // Need dose 1 at 12 months, or 4 weeks after an invalid dose
    const twelveMonths = new Date(birthDate);
    twelveMonths.setFullYear(twelveMonths.getFullYear() + 1);

    if (hasInvalidDoses && lastGivenDate) {
      // Must be 4 weeks after the invalid dose AND after 1st birthday
      const fourWeeksAfterInvalid = new Date(lastGivenDate);
      fourWeeksAfterInvalid.setDate(fourWeeksAfterInvalid.getDate() + 28);
      nextDueDate = new Date(Math.max(twelveMonths.getTime(), fourWeeksAfterInvalid.getTime()));
    } else {
      nextDueDate = twelveMonths;
    }
  } else if (completedDoses === 1) {
    // Need dose 2 between 4 and 6 years
    const fourYears = new Date(birthDate);
    fourYears.setFullYear(fourYears.getFullYear() + 4);

    if (isHealthcareWorker || isTraveler) {
      // High risk need it ASAP (4 weeks after dose 1)
      const fourWeeksAfterDose1 = new Date(validRecords[0].dateGiven);
      fourWeeksAfterDose1.setDate(fourWeeksAfterDose1.getDate() + 28);
      nextDueDate = fourWeeksAfterDose1;
    } else {
      // Routine wait until 4 years old
      nextDueDate = fourYears;
    }
  }

  const remainingDoses = Math.max(0, requiredDoses - completedDoses);

  let status: "completed" | "needed" | "overdue" | "upcoming" = "completed";
  let nextDueDateStr: string | null = null;

  if (remainingDoses > 0 && nextDueDate) {
    nextDueDateStr = nextDueDate.toISOString().split("T")[0];
    status = nextDueDate <= today ? "overdue" : "upcoming";
    if (!lastGivenDate && nextDueDate <= today) status = "needed";
  }

  const reasons = [];
  if (hasInvalidDoses) reasons.push("Previous dose was invalid (given before 1st birthday)");
  if (isHealthcareWorker || isTraveler) reasons.push("High-risk group: needs 2 valid doses");
  else reasons.push("Routine childhood schedule");

  return {
    vaccine,
    reasons,
    status,
    completedDoses,
    remainingDoses,
    nextDueDate: nextDueDateStr,
    lastGivenDate,
  };
}

export function evaluateFlu(
  patient: PatientProfile,
  vaccine: VaccineInfo,
  records: { vaccineName: string; doseNumber: number; dateGiven: string }[]
): VaccineRecommendation {
  const birthDate = new Date(patient.dateOfBirth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
  const ageInYears = ageInMonths / 12;

  const isPriority = patient.riskFactors.includes("Pregnant") ||
    patient.riskFactors.includes("Age 65+") ||
    patient.riskFactors.includes("Nursing Home Resident") ||
    patient.chronicConditions.length > 0;

  const reasons = [];
  if (isPriority) reasons.push("HIGH PRIORITY: Chronic condition or risk factor");
  else reasons.push("Routine annual vaccine");

  const completedDoses = records.length;
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime()
  );
  const lastRecord = sortedRecords[0];

  let remainingDoses = 0;
  let nextDueDate: Date | null = null;

  if (ageInMonths < 6) {
    // Too young
    let sixMonths = new Date(birthDate);
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    nextDueDate = sixMonths;
    remainingDoses = 1;
    reasons.push("Not eligible until 6 months of age");
  } else {
    // Eligible
    // Check First-Time Rule
    if (ageInYears < 9 && completedDoses === 1) {
      // They had one dose, need the second
      reasons.push("First-Time Rule: needs 2 doses separated by 4 weeks");
      remainingDoses = 1;
      const fourWeeksAfterD1 = new Date(lastRecord.dateGiven);
      fourWeeksAfterD1.setDate(fourWeeksAfterD1.getDate() + 28);
      nextDueDate = new Date(Math.max(today.getTime(), fourWeeksAfterD1.getTime())); // Due if past 4 weeks
    } else if (ageInYears < 9 && completedDoses === 0) {
      reasons.push("First-Time Rule: needs 2 doses separated by 4 weeks");
      remainingDoses = 2; // Needs 2 doses this season
      nextDueDate = today;
    } else {
      // Annual - check if they had one in the last year
      // Simplified: if last dose was over 300 days ago, need a new one
      if (!lastRecord) {
        remainingDoses = 1;
        nextDueDate = today;
      } else {
        const lastGiven = new Date(lastRecord.dateGiven);
        const daysSince = Math.floor((today.getTime() - lastGiven.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 300) {
          remainingDoses = 1;
          nextDueDate = today; // Due now for this season
        } else {
          // Calculate roughly next Fall
          nextDueDate = new Date(lastGiven);
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        }
      }
    }
  }

  let status: "completed" | "needed" | "overdue" | "upcoming" = "completed";
  let nextDueDateStr: string | null = null;

  if (remainingDoses > 0 && nextDueDate) {
    nextDueDateStr = nextDueDate.toISOString().split("T")[0];
    status = nextDueDate <= today ? "overdue" : "upcoming";
    if (completedDoses === 0 && nextDueDate <= today) status = "needed";
  }

  return {
    vaccine,
    reasons,
    status,
    completedDoses,
    remainingDoses,
    nextDueDate: nextDueDateStr,
    lastGivenDate: lastRecord?.dateGiven || null,
  };
}

export function evaluatePneumococcal(
  patient: PatientProfile,
  vaccine: VaccineInfo,
  records: { vaccineName: string; doseNumber: number; dateGiven: string }[]
): VaccineRecommendation {
  const isHighRisk = patient.riskFactors.includes("Immunocompromised") ||
    patient.riskFactors.includes("Cochlear Implant") ||
    patient.chronicConditions.some(c =>
      ["Chronic Lung Disease", "Heart Disease", "Diabetes", "Chronic Kidney Disease", "Asplenia"].includes(c)
    );

  const reasons = [];
  const schedule = isHighRisk ? [2, 4, 6, 18] : [2, 4, 12];
  const requiredDoses = schedule.length;

  if (isHighRisk) reasons.push("High-Risk Schedule: 4 doses (2m, 4m, 6m, 18m)");
  else reasons.push("Routine Schedule: 3 doses (2m, 4m, 12m)");

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime()
  );
  const completedDoses = sortedRecords.length;
  const lastRecord = sortedRecords[0];

  const birthDate = new Date(patient.dateOfBirth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ageInMonths = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

  let remainingDoses = Math.max(0, requiredDoses - completedDoses);
  let nextDueDate: Date | null = null;

  if (remainingDoses > 0) {
    const targetMonths = schedule[completedDoses];
    nextDueDate = new Date(birthDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + targetMonths);
    if (lastRecord) {
      // Ensure minimum 8 weeks (56 days) between doses
      const minNextDate = new Date(lastRecord.dateGiven);
      minNextDate.setDate(minNextDate.getDate() + 56);
      if (nextDueDate < minNextDate) nextDueDate = minNextDate;
    }
  }

  if (isHighRisk && ageInMonths > 24 && completedDoses >= requiredDoses) {
    reasons.push("Alert: Patient is High-Risk and >2 years old. Assess need for Pneu-P-23 booster 8 weeks after last conjugate dose.");
  }

  let status: "completed" | "needed" | "overdue" | "upcoming" = "completed";
  let nextDueDateStr: string | null = null;

  if (remainingDoses > 0 && nextDueDate) {
    nextDueDateStr = nextDueDate.toISOString().split("T")[0];
    status = nextDueDate <= today ? "overdue" : "upcoming";
    if (completedDoses === 0 && nextDueDate <= today) status = "needed";
  }

  return {
    vaccine,
    reasons,
    status,
    completedDoses,
    remainingDoses,
    nextDueDate: nextDueDateStr,
    lastGivenDate: lastRecord?.dateGiven || null,
  };
}

export function evaluateMenCC(
  patient: PatientProfile,
  vaccine: VaccineInfo,
  records: { vaccineName: string; doseNumber: number; dateGiven: string }[]
): VaccineRecommendation {
  const isHighRisk = patient.riskFactors.includes("Immunocompromised") ||
    patient.chronicConditions.includes("Asplenia") ||
    patient.riskFactors.includes("International Traveler");

  const reasons = [];
  const schedule = isHighRisk ? [2, 4, 6, 12] : [12]; // Note: high risk booster is 12-18m, routine is 12m
  const requiredDoses = schedule.length;

  if (isHighRisk) reasons.push("High-Risk Schedule: multi-dose (2m, 4m, 6m, 12-18m)");
  else reasons.push("Routine Schedule: 1 dose at 12 months");

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime()
  );
  const completedDoses = sortedRecords.length;
  const lastRecord = sortedRecords[0];

  const birthDate = new Date(patient.dateOfBirth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let remainingDoses = Math.max(0, requiredDoses - completedDoses);
  let nextDueDate: Date | null = null;

  if (remainingDoses > 0) {
    const targetMonths = schedule[completedDoses];
    nextDueDate = new Date(birthDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + targetMonths);
    if (lastRecord) {
      // Ensure minimum interval (e.g., 8 weeks)
      const minNextDate = new Date(lastRecord.dateGiven);
      minNextDate.setDate(minNextDate.getDate() + 56);
      if (nextDueDate < minNextDate) nextDueDate = minNextDate;
    }
  }

  let status: "completed" | "needed" | "overdue" | "upcoming" = "completed";
  let nextDueDateStr: string | null = null;

  if (remainingDoses > 0 && nextDueDate) {
    nextDueDateStr = nextDueDate.toISOString().split("T")[0];
    status = nextDueDate <= today ? "overdue" : "upcoming";
    if (completedDoses === 0 && nextDueDate <= today) status = "needed";
  }

  return {
    vaccine,
    reasons,
    status,
    completedDoses,
    remainingDoses,
    nextDueDate: nextDueDateStr,
    lastGivenDate: lastRecord?.dateGiven || null,
  };
}

export function evaluateDTaPIPVHib(
  patient: PatientProfile,
  vaccine: VaccineInfo,
  records: { vaccineName: string; doseNumber: number; dateGiven: string }[]
): VaccineRecommendation {
  const reasons = ["Routine primary series (2m, 4m, 6m, 18m)"];
  const schedule = [2, 4, 6, 18];
  const requiredDoses = schedule.length;

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime()
  );
  const completedDoses = sortedRecords.length; // Assumes these are exactly DTaP-IPV-Hib records
  const lastRecord = sortedRecords[0];

  const birthDate = new Date(patient.dateOfBirth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ageInMonths = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

  let remainingDoses = Math.max(0, requiredDoses - completedDoses);
  let nextDueDate: Date | null = null;

  if (remainingDoses > 0) {
    const targetMonths = schedule[completedDoses];
    nextDueDate = new Date(birthDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + targetMonths);
  }

  // Pre-school booster check (between 4 and 6 years -> 48 to 72 months)
  // If primary series is complete, assess for the "DTaP-IPV" booster
  if (completedDoses >= requiredDoses && ageInMonths >= 48) {
    reasons.push("Alert: Primary series complete. Pre-school booster (DTaP-IPV without Hib) is due between 4-6 years.");
  }

  let status: "completed" | "needed" | "overdue" | "upcoming" = "completed";
  let nextDueDateStr: string | null = null;

  if (remainingDoses > 0 && nextDueDate) {
    nextDueDateStr = nextDueDate.toISOString().split("T")[0];
    status = nextDueDate <= today ? "overdue" : "upcoming";
    if (completedDoses === 0 && nextDueDate <= today) status = "needed";
  }

  return {
    vaccine,
    reasons,
    status,
    completedDoses,
    remainingDoses,
    nextDueDate: nextDueDateStr,
    lastGivenDate: lastRecord?.dateGiven || null,
  };
}

function evaluateGenericSequence(
  patient: PatientProfile,
  vaccine: VaccineInfo,
  records: { vaccineName: string; doseNumber: number; dateGiven: string }[],
  totalTargetDoses: number,
  monthsSchedule: number[]
) {
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime()
  );
  const completedDoses = sortedRecords.length;
  let nextDueDate: Date | null = null;
  let remainingDoses = Math.max(0, totalTargetDoses - completedDoses);
  const birthDate = new Date(patient.dateOfBirth);

  if (remainingDoses > 0) {
    const targetMonths = monthsSchedule[completedDoses];
    nextDueDate = new Date(birthDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + targetMonths);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let status: "completed" | "needed" | "overdue" | "upcoming" = "completed";
  let nextDueDateStr: string | null = null;

  if (remainingDoses > 0 && nextDueDate) {
    nextDueDateStr = nextDueDate.toISOString().split("T")[0];
    status = nextDueDate <= today ? "overdue" : "upcoming";
    if (completedDoses === 0 && nextDueDate <= today) status = "needed";
  }

  return {
    vaccine,
    reasons: ["Routine schedule"],
    status,
    completedDoses,
    remainingDoses,
    nextDueDate: nextDueDateStr,
    lastGivenDate: sortedRecords[0]?.dateGiven || null,
  };
}
