"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

export function PatientForm({ onSuccess }: PatientFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "vaccinations",
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

  const onSubmit = async (data: PatientFormData) => {
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
      onSuccess();
    } catch (error) {
      toast.error("Failed to create patient", {
        description: "Please check the form and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* Vaccination History */}
      <Card className="qdoc-card mt-6 border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#12455a]">
            Vaccination History
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                vaccineName: "",
                doseNumber: 1,
                dateGiven: "",
                provider: "",
              })
            }
            className="border-[#116cb6] text-[#116cb6] hover:bg-[#d6e6f2]"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Vaccine
          </Button>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#5a7d8e]">
              No vaccination records yet. Click &quot;Add Vaccine&quot; to add one.
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-[#c2dcee] bg-[#f8fbfe] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-[#116cb6]">
                      Vaccine #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="h-8 w-8 p-0 text-[#d64545] hover:bg-[#fde8e8] hover:text-[#d64545]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label className="text-xs text-[#12455a]">
                        Vaccine Name *
                      </Label>
                      <select
                        {...register(`vaccinations.${index}.vaccineName`)}
                        className="mt-1 flex h-9 w-full rounded-md border border-[#c2dcee] bg-transparent px-3 py-1 text-sm focus:border-[#116cb6] focus:outline-none focus:ring-1 focus:ring-[#116cb6]"
                      >
                        <option value="">Select vaccine</option>
                        {VACCINE_NAMES.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-[#12455a]">
                        Dose Number *
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        {...register(`vaccinations.${index}.doseNumber`)}
                        className="mt-1 border-[#c2dcee]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[#12455a]">
                        Date Given *
                      </Label>
                      <Input
                        type="date"
                        {...register(`vaccinations.${index}.dateGiven`)}
                        className="mt-1 border-[#c2dcee]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[#12455a]">
                        Provider
                      </Label>
                      <Input
                        {...register(`vaccinations.${index}.provider`)}
                        placeholder="Dr. Smith"
                        className="mt-1 border-[#c2dcee]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
