"use client";

import { useState } from "react";
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

const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  chronicConditions: z.array(z.string()),
  riskFactors: z.array(z.string()),
  vaccinations: z.array(vaccinationSchema),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onSuccess: () => void;
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

export function PatientForm({ onSuccess }: PatientFormProps) {
  const [submitting, setSubmitting] = useState(false);

  /* Each vaccine gets its own toggle + month/year state */
  const [vaccineSelections, setVaccineSelections] = useState<
    Record<string, VaccineSelection>
  >(
    Object.fromEntries(
      VACCINE_NAMES.map((v) => [
        v,
        { selected: false, month: "", year: "", doses: 1 },
      ])
    )
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      email: "",
      phone: "",
      address: "",
      chronicConditions: [],
      riskFactors: [],
      vaccinations: [],
    },
  });

  const selectedConditions = watch("chronicConditions");
  const selectedRiskFactors = watch("riskFactors");

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
      setVaccineSelections(
        Object.fromEntries(
          VACCINE_NAMES.map((v) => [
            v,
            { selected: false, month: "", year: "", doses: 1 },
          ])
        )
      );
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
              <Label htmlFor="address" className="text-[#12455a]">
                Address
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
                    <div className="mt-3 grid grid-cols-[0.875rem_minmax(0,1fr)] items-start gap-x-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-[#8ba8b8]" />
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <select
                          value={sel.month}
                          onChange={(e) =>
                            updateVaccineField(
                              vaccineName,
                              "month",
                              e.target.value
                            )
                          }
                          className="h-8 flex-[1_1_4rem] min-w-[4rem] rounded-md border border-[#c2dcee] bg-white px-2 pr-6 text-sm text-[#12455a] focus:border-[#116cb6] focus:outline-none focus:ring-1 focus:ring-[#116cb6]"
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
                          className="h-8 w-[7rem] shrink-0 rounded-md border border-[#c2dcee] bg-white px-2 text-sm focus:border-[#116cb6] focus:outline-none focus:ring-1 focus:ring-[#116cb6]"
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
                          className="h-8 w-14 shrink-0 rounded-md border border-[#c2dcee] bg-white px-2 text-center text-sm focus:border-[#116cb6] focus:outline-none focus:ring-1 focus:ring-[#116cb6]"
                        />
                        <span className="shrink-0 whitespace-nowrap text-xs text-[#8ba8b8]">
                          dose(s)
                        </span>
                      </div>
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
