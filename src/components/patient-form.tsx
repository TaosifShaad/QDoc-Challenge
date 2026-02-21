"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, Loader2, Syringe, CheckCircle2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CHRONIC_CONDITIONS,
  RISK_FACTORS,
  GENDER_OPTIONS,
  VACCINE_NAMES,
} from "@/lib/types";

const vaccinationSchema = z.object({
  vaccineName: z.string().min(1, "Vaccine name is required"),
  doseNumber: z.coerce.number().min(1, "Dose number must be ≥ 1"),
  dateGiven: z.string().min(1, "Date is required"),
  provider: z.string().optional(),
});

const dueImmunizationSchema = z.object({
  vaccineName: z.string().optional(),
  mbCode: z.string().optional(),
  doseNumber: z.number().optional(),
  dueDate: z.string().optional(),
  status: z.string().optional(),
});

const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  personalHealthNumber: z.string().optional(),
  recipientRelationship: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),

  chronicConditions: z.array(z.string()),
  riskFactors: z.array(z.string()),
  vaccinations: z.array(vaccinationSchema),
  nextImmunizationsDue: z.array(dueImmunizationSchema).optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onSuccess: () => void;
  prefill?: PatientFormPrefill | null;
}

export interface OcrVaccinationPrefill {
  date?: string;
  dates?: string[];
  vaccineName?: string;
  mbCode?: string;
  product?: string;
  lot?: string;
}

export interface PatientFormPrefill {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  personalHealthNumber?: string;
  recipientRelationship?: string;
  streetAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;

  vaccinations?: OcrVaccinationPrefill[];
  nextImmunizationsDue?: Array<{
    vaccineName?: string;
    mbCode?: string;
    doseNumber?: number;
    dueDate?: string;
    status?: string;
  }>;
}

/* ── Month names for selector ───────────────────────────────── */
const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

/* Generate year options (current down to 1940) */
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1939 }, (_, i) =>
  String(currentYear - i)
);

/* ── Vaccine checklist item state ─────────────────────────── */
interface VaccineSelection {
  selected: boolean;
  month: string;
  year: string;
  doses: number;
}

const emptyVaccineSelections = () =>
  Object.fromEntries(
    VACCINE_NAMES.map((v) => [v, { selected: false, month: "", year: "", doses: 1 }])
  ) as Record<string, VaccineSelection>;

const normalizeToken = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

/** Maps OCR product/vaccine name to one or more known VACCINE_NAMES entries */
const mapProductToVaccineNames = (product: string): string[] => {
  const normalized = normalizeToken(product);
  if (!normalized) return [];

  const results: string[] = [];

  // COVID-19
  if (normalized.includes("pfizer") || normalized.includes("comirnaty")) {
    results.push("COVID-19 (Pfizer-BioNTech)");
  }
  if (normalized.includes("moderna") || normalized.includes("spikevax")) {
    results.push("COVID-19 (Moderna)");
  }

  // Influenza
  if (normalized.includes("influenza") || normalized.includes("flu") || normalized.includes("inf")) {
    results.push("Influenza (Flu)");
  }

  // DTaP-IPV-Hib → Tdap + Polio (Manitoba combo vaccine)
  if (
    normalized.includes("dtap ipv hib") ||
    normalized.includes("dtap ipv") ||
    (normalized.includes("diphtheria") && normalized.includes("tetanus") && normalized.includes("pertussis") && normalized.includes("polio"))
  ) {
    results.push("Tdap (Tetanus, Diphtheria, Pertussis)", "Polio (IPV)");
  } else if (normalized.includes("tdap") || normalized.includes("tetanus") || (normalized.includes("diphtheria") && normalized.includes("pertussis"))) {
    results.push("Tdap (Tetanus, Diphtheria, Pertussis)");
  }

  // MMRV → MMR + Varicella (Manitoba combo)
  if (normalized.includes("mmrv") || (normalized.includes("measles") && normalized.includes("varicella"))) {
    results.push("MMR (Measles, Mumps, Rubella)", "Varicella (Chickenpox)");
  } else {
    if (normalized.includes("mmr") || (normalized.includes("measles") && normalized.includes("mumps"))) {
      results.push("MMR (Measles, Mumps, Rubella)");
    }
    if (normalized.includes("varicella") || normalized.includes("chickenpox")) {
      results.push("Varicella (Chickenpox)");
    }
  }

  // Meningococcal (Men-C-C)
  if (normalized.includes("meningococcal") || normalized.includes("men c c") || normalized.includes("men c")) {
    results.push("Meningococcal");
  }

  // Pneumococcal (Pneu-C-13)
  if (normalized.includes("pneu c 13") || normalized.includes("pcv13") || normalized.includes("pneumococcal conjugate")) {
    results.push("Pneumococcal (PCV13)");
  } else if (normalized.includes("ppsv23") || normalized.includes("pneumococcal polysaccharide")) {
    results.push("Pneumococcal (PPSV23)");
  } else if (normalized.includes("pneumococcal")) {
    results.push("Pneumococcal (PCV13)");
  }

  // Rotavirus (Rota-1)
  if (normalized.includes("rotavirus") || normalized.includes("rota 1") || normalized.includes("rota1")) {
    results.push("Rotavirus");
  }

  // Hepatitis
  if (normalized.includes("hepatitis a") || normalized.includes("hep a")) results.push("Hepatitis A");
  if (normalized.includes("hepatitis b") || normalized.includes("hep b")) results.push("Hepatitis B");

  // HPV
  if (normalized.includes("hpv") || normalized.includes("papillomavirus")) {
    results.push("HPV (Human Papillomavirus)");
  }

  // Shingles
  if (normalized.includes("shingles") || normalized.includes("zoster")) {
    results.push("Shingles (Zoster)");
  }

  // Polio standalone (only if not already added via DTaP combo)
  if (!results.includes("Polio (IPV)") && (normalized.includes("polio") || normalized.includes("ipv"))) {
    results.push("Polio (IPV)");
  }

  return results;
};

/** Compat wrapper: returns the first match or null */
const mapProductToVaccineName = (product: string): string | null =>
  mapProductToVaccineNames(product)[0] ?? null;


const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export function PatientForm({ onSuccess, prefill }: PatientFormProps) {
  const [submitting, setSubmitting] = useState(false);

  /* Each vaccine gets its own toggle + month/year state */
  const [vaccineSelections, setVaccineSelections] = useState<Record<string, VaccineSelection>>(emptyVaccineSelections);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema) as any,

    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      email: "",
      phone: "",
      address: "",
      personalHealthNumber: "",
      recipientRelationship: "",
      streetAddress: "",
      city: "",
      province: "",
      postalCode: "",

      chronicConditions: [],
      riskFactors: [],
      vaccinations: [],
      nextImmunizationsDue: [],
    },
  });

  const selectedConditions = watch("chronicConditions");
  const selectedRiskFactors = watch("riskFactors");

  useEffect(() => {
    if (!prefill) return;

    const current = getValues();
    reset({
      ...current,
      firstName: prefill.firstName ?? current.firstName,
      lastName: prefill.lastName ?? current.lastName,
      dateOfBirth:
        prefill.dateOfBirth && isIsoDate(prefill.dateOfBirth)
          ? prefill.dateOfBirth
          : current.dateOfBirth,
      gender: prefill.gender ?? current.gender,
      email: prefill.email ?? current.email,
      personalHealthNumber:
        prefill.personalHealthNumber ?? current.personalHealthNumber,
      recipientRelationship:
        prefill.recipientRelationship ?? current.recipientRelationship,
      streetAddress: prefill.streetAddress ?? current.streetAddress,
      city: prefill.city ?? current.city,
      province: prefill.province ?? current.province,
      postalCode: prefill.postalCode ?? current.postalCode,

      nextImmunizationsDue:
        prefill.nextImmunizationsDue ?? current.nextImmunizationsDue,
      vaccinations: current.vaccinations,
    });

    if (prefill.vaccinations && prefill.vaccinations.length > 0) {
      const nextSelections = emptyVaccineSelections();
      for (const item of prefill.vaccinations) {
        const mappedNames = mapProductToVaccineNames(
          item.product || item.vaccineName || item.mbCode || ""
        );
        if (mappedNames.length === 0) continue;

        // Use all dates from multi-date history rows (each date = one dose)
        const allDates = (item.dates && item.dates.length > 0)
          ? item.dates.filter(isIsoDate)
          : (item.date && isIsoDate(item.date) ? [item.date] : []);
        if (allDates.length === 0) continue;

        // Use the latest date for month/year display
        const latestDate = allDates[allDates.length - 1];
        const year = latestDate.slice(0, 4);
        const month = latestDate.slice(5, 7);

        for (const mappedName of mappedNames) {
          if (!nextSelections[mappedName]) continue;
          const existing = nextSelections[mappedName];
          nextSelections[mappedName] = {
            selected: true,
            month,
            year,
            doses: existing.selected
              ? existing.doses + allDates.length
              : allDates.length,
          };
        }
      }
      setVaccineSelections(nextSelections);
    } else {
      setVaccineSelections(emptyVaccineSelections());
    }
  }, [prefill, getValues, reset]);


  const toggleCondition = (condition: string) => {
    const current = selectedConditions || [];
    if (current.includes(condition)) {
      setValue(
        "chronicConditions",
        current.filter((c) => c !== condition)
      );
    } else {
      setValue("chronicConditions", [...current, condition]);
    }
  };

  const toggleRiskFactor = (factor: string) => {
    const current = selectedRiskFactors || [];
    if (current.includes(factor)) {
      setValue(
        "riskFactors",
        current.filter((f) => f !== factor)
      );
    } else {
      setValue("riskFactors", [...current, factor]);
    }
  };

  /* Toggle a vaccine on/off in the checklist */
  const toggleVaccine = (name: string) => {
    setVaccineSelections((prev) => ({
      ...prev,
      [name]: { ...prev[name], selected: !prev[name].selected },
    }));
  };

  /* Update month/year/doses for a vaccine */
  const updateVaccineField = (
    name: string,
    field: "month" | "year" | "doses",
    value: string | number
  ) => {
    setVaccineSelections((prev) => ({
      ...prev,
      [name]: { ...prev[name], [field]: value },
    }));
  };

  const onSubmit = async (data: PatientFormData) => {
    /* Build vaccinations array from the checklist selections */
    const vaccinations = Object.entries(vaccineSelections)
      .filter(([_, sel]) => sel.selected && sel.month && sel.year)
      .map(([vaccineName, sel]) => ({
        vaccineName,
        doseNumber: sel.doses,
        dateGiven: `${sel.year}-${sel.month}-15`,
        provider: "",
      }));

    /* Validate: if a vaccine is checked but no month/year, warn */
    const incomplete = Object.entries(vaccineSelections).filter(
      ([_, sel]) => sel.selected && (!sel.month || !sel.year)
    );
    if (incomplete.length > 0) {
      toast.error("Please complete vaccine dates", {
        description: `${incomplete.map(([n]) => n).join(", ")} — select month and year.`,
      });
      return;
    }

    data.vaccinations = vaccinations;

    setSubmitting(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to create patient");

      toast.success("Patient created successfully!", {
        description: `${data.firstName} ${data.lastName} has been added.`,
      });
      reset();
      /* Reset vaccine checklist */
      setVaccineSelections(emptyVaccineSelections());
      onSuccess();
    } catch (error) {
      toast.error("Failed to create patient", {
        description: "Please check the form and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = Object.values(vaccineSelections).filter(
    (s) => s.selected
  ).length;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Demographics */}
        <Card className="qdoc-card border-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#12455a]">
              Demographics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-[#12455a]">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  placeholder="John"
                  className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-[#d64545]">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="text-[#12455a]">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  placeholder="Doe"
                  className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-[#d64545]">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth" className="text-[#12455a]">
                  Date of Birth *
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                  className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-xs text-[#d64545]">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="gender" className="text-[#12455a]">
                  Gender *
                </Label>
                <select
                  id="gender"
                  {...register("gender")}
                  className="mt-1 flex h-9 w-full rounded-md border border-[#c2dcee] bg-transparent px-3 py-1 text-sm focus:border-[#116cb6] focus:outline-none focus:ring-1 focus:ring-[#116cb6]"
                >
                  <option value="">Select gender</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <p className="mt-1 text-xs text-[#d64545]">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="qdoc-card border-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#12455a]">
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[#12455a]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john.doe@email.com"
                className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#d64545]">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone" className="text-[#12455a]">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="(204) 555-0000"
                className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
              />
            </div>
            <div>
              <Label htmlFor="streetAddress" className="text-[#12455a]">
                Street Address
              </Label>
              <Input
                id="streetAddress"
                {...register("streetAddress")}
                placeholder="123 Main St"
                className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="city" className="text-[#12455a]">
                  City
                </Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="Winnipeg"
                  className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
                />
              </div>
              <div>
                <Label htmlFor="province" className="text-[#12455a]">
                  Province
                </Label>
                <Input
                  id="province"
                  {...register("province")}
                  placeholder="MB"
                  className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
                />
              </div>
              <div>
                <Label htmlFor="postalCode" className="text-[#12455a]">
                  Postal Code
                </Label>
                <Input
                  id="postalCode"
                  {...register("postalCode")}
                  placeholder="R3C 0V1"
                  className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address" className="text-[#12455a]">
                Address (Legacy / Optional)
              </Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="123 Main St, Winnipeg, MB"
                className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="qdoc-card border-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#12455a]">
              Administrative Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="personalHealthNumber" className="text-[#12455a]">
                Personal Health Number (PHN)
              </Label>
              <Input
                id="personalHealthNumber"
                {...register("personalHealthNumber")}
                placeholder="122123015"
                className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
              />
            </div>
            <div>
              <Label htmlFor="recipientRelationship" className="text-[#12455a]">
                Recipient Relationship
              </Label>
              <Input
                id="recipientRelationship"
                {...register("recipientRelationship")}
                placeholder="To the Parent/Guardian of"
                className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
              />
            </div>

            {(watch("nextImmunizationsDue") || []).length > 0 && (
              <div>
                <p className="text-sm font-medium text-[#12455a]">
                  Next Immunizations Due (from OCR)
                </p>
                <div className="mt-2 space-y-2">
                  {(watch("nextImmunizationsDue") || []).map((due, idx) => (
                    <div
                      key={`${due.vaccineName || "due"}-${idx}`}
                      className="rounded-md border border-[#c2dcee] bg-[#f8fbfe] p-2 text-xs text-[#5a7d8e]"
                    >
                      <p>
                        {due.vaccineName || "Vaccine"} {due.mbCode ? `(${due.mbCode})` : ""}
                      </p>
                      <p>
                        {due.dueDate || "No due date"}
                        {due.doseNumber ? ` • Dose ${due.doseNumber}` : ""}
                        {due.status ? ` • ${due.status}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chronic Conditions */}
        <Card className="qdoc-card border-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#12455a]">
              Chronic Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CHRONIC_CONDITIONS.map((condition) => {
                const isSelected = selectedConditions?.includes(condition);
                return (
                  <Badge
                    key={condition}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer select-none transition-all duration-200 ${isSelected
                      ? "bg-[#116cb6] text-white hover:bg-[#0d4d8b] border-[#116cb6]"
                      : "border-[#c2dcee] text-[#5a7d8e] hover:border-[#116cb6] hover:text-[#116cb6]"
                      }`}
                    onClick={() => toggleCondition(condition)}
                  >
                    {condition}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Risk Factors */}
        <Card className="qdoc-card border-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#12455a]">
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {RISK_FACTORS.map((factor) => {
                const isSelected = selectedRiskFactors?.includes(factor);
                return (
                  <Badge
                    key={factor}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer select-none transition-all duration-200 ${isSelected
                      ? "bg-[#f2c14e] text-[#12455a] hover:bg-[#e6b445] border-[#f2c14e]"
                      : "border-[#c2dcee] text-[#5a7d8e] hover:border-[#f2c14e] hover:text-[#12455a]"
                      }`}
                    onClick={() => toggleRiskFactor(factor)}
                  >
                    {factor}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Vaccination History Checklist ──────────────────────── */}
      <Card className="qdoc-card mt-6 border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-[#12455a]">
                <Syringe className="h-5 w-5 text-[#116cb6]" />
                Vaccination History
              </CardTitle>
              <p className="mt-1 text-sm text-[#5a7d8e]">
                Have you received any of these vaccines? Select each one
                you&apos;ve had and provide the approximate month &amp; year.
              </p>
            </div>
            {selectedCount > 0 && (
              <Badge
                variant="outline"
                className="border-[#c2e8a0] bg-[#e1f5c6] text-[#5a8a1e] text-xs"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {selectedCount} selected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {VACCINE_NAMES.map((vaccineName) => {
              const sel = vaccineSelections[vaccineName];
              return (
                <div
                  key={vaccineName}
                  className={`rounded-xl border-2 p-3 transition-all duration-200 ${sel.selected
                    ? "border-[#8fc748] bg-[#f5fbee] shadow-sm"
                    : "border-[#eef4f9] bg-white hover:border-[#c2dcee]"
                    }`}
                >
                  {/* Toggle row */}
                  <button
                    type="button"
                    onClick={() => toggleVaccine(vaccineName)}
                    className="flex w-full items-center gap-2 text-left"
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${sel.selected
                        ? "border-[#8fc748] bg-[#8fc748] text-white"
                        : "border-[#c2dcee] bg-white"
                        }`}
                    >
                      {sel.selected && (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${sel.selected ? "text-[#12455a]" : "text-[#5a7d8e]"
                        }`}
                    >
                      {vaccineName}
                    </span>
                  </button>

                  {/* Month/Year selectors — visible when selected */}
                  {sel.selected && (
                    <div className="mt-3 flex items-center gap-2 pl-7">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-[#8ba8b8]" />
                      <select
                        value={sel.month}
                        onChange={(e) =>
                          updateVaccineField(
                            vaccineName,
                            "month",
                            e.target.value
                          )
                        }
                        className="flex h-8 w-full rounded-md border border-[#c2dcee] bg-white px-2 text-xs focus:border-[#116cb6] focus:outline-none focus:ring-1 focus:ring-[#116cb6]"
                      >
                        <option value="">Month</option>
                        {MONTHS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={sel.year}
                        onChange={(e) =>
                          updateVaccineField(
                            vaccineName,
                            "year",
                            e.target.value
                          )
                        }
                        className="flex h-8 w-24 flex-shrink-0 rounded-md border border-[#c2dcee] bg-white px-2 text-xs focus:border-[#116cb6] focus:outline-none focus:ring-1 focus:ring-[#116cb6]"
                      >
                        <option value="">Year</option>
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={sel.doses}
                        onChange={(e) =>
                          updateVaccineField(
                            vaccineName,
                            "doses",
                            Number(e.target.value) || 1
                          )
                        }
                        title="Number of doses received"
                        className="flex h-8 w-16 flex-shrink-0 rounded-md border border-[#c2dcee] bg-white px-2 text-center text-xs focus:border-[#116cb6] focus:outline-none focus:ring-1 focus:ring-[#116cb6]"
                      />
                      <span className="flex-shrink-0 text-[10px] text-[#8ba8b8]">
                        dose(s)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-[#116cb6] px-8 text-white hover:bg-[#0d4d8b] disabled:opacity-50"
          size="lg"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Patient
        </Button>
      </div>
    </form>
  );
}
