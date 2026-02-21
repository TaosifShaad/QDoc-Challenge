"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { PatientForm, type PatientFormPrefill } from "@/components/patient-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Syringe,
  Heart,
  Shield,
  User,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import type { Patient } from "@/lib/types";
import { getRecommendations } from "@/lib/vaccine-data";
import { motion } from "framer-motion";

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  createdAt: string;
}

interface OcrExtractResponse {
  source: "ocr";
  fields: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    email?: string;
    personalHealthNumber?: string;
    recipientRelationship?: string;
    streetAddress?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    ageAtPrinting?: string;
    documentTitle?: string;
    issuingProvince?: string;
    country?: string;
    pageIndicator?: string;
    vaccinesAdministered?: number;
    issuedOn?: string;
  };
  vaccinations: Array<{
    date?: string;
    dates?: string[];
    vaccineName?: string;
    mbCode?: string;
    product?: string;
    lot?: string;
  }>;
  nextImmunizationsDue?: Array<{
    vaccineName?: string;
    mbCode?: string;
    doseNumber?: number;
    dueDate?: string;
    status?: string;
  }>;
  warnings: string[];
  rawText?: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProofUploadForm, setShowProofUploadForm] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [prefill, setPrefill] = useState<PatientFormPrefill | null>(null);
  const [ocrWarnings, setOcrWarnings] = useState<string[]>([]);
  const [ocrDebug, setOcrDebug] = useState<OcrExtractResponse | null>(null);

  const fetchPatients = async () => {
    try {
      const [userRes, patientRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/patients?mine=true"),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }

      if (patientRes.ok) {
        const patientData = await patientRes.json();
        setPatients(patientData);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const calculateAge = (dob: string): number => {
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return Math.max(0, age);
  };

  const splitFullName = (fullName?: string) => {
    if (!fullName) return {};
    const clean = fullName.trim().replace(/\s+/g, " ");
    if (!clean) return {};
    if (clean.includes(",")) {
      const [lastName, firstName] = clean.split(",", 2).map((s) => s.trim());
      return { firstName, lastName };
    }
    const parts = clean.split(" ");
    if (parts.length === 1) return { firstName: parts[0] };
    return {
      firstName: parts.slice(0, -1).join(" "),
      lastName: parts[parts.length - 1],
    };
  };

  const handleProofFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setProofFile(nextFile);
  };

  const handleExtractProof = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!proofFile) {
      toast.error("Please choose an image first.");
      return;
    }

    setUploadingProof(true);
    const controller = new AbortController();
    const timeoutMs = 140_000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const body = new FormData();
      body.append("file", proofFile);

      const res = await fetch("/api/immunization/extract", {
        method: "POST",
        body,
        signal: controller.signal,
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error ?? "Failed to extract vaccination info.");
      }

      const ocr = payload as OcrExtractResponse;
      const fromFullName = splitFullName(ocr.fields.fullName);
      setOcrDebug(ocr);

      setPrefill({
        firstName: ocr.fields.firstName ?? fromFullName.firstName,
        lastName: ocr.fields.lastName ?? fromFullName.lastName,
        dateOfBirth: ocr.fields.dateOfBirth,
        email: ocr.fields.email,
        personalHealthNumber: ocr.fields.personalHealthNumber,
        recipientRelationship: ocr.fields.recipientRelationship,
        streetAddress: ocr.fields.streetAddress,
        city: ocr.fields.city,
        province: ocr.fields.province,
        postalCode: ocr.fields.postalCode,
        ageAtPrinting: ocr.fields.ageAtPrinting,
        vaccinations: ocr.vaccinations,
        nextImmunizationsDue: ocr.nextImmunizationsDue ?? [],
      });

      setOcrWarnings(ocr.warnings ?? []);
      setShowProofUploadForm(false);
      toast.success("OCR complete. Review and submit the pre-filled form.");
      if ((ocr.warnings ?? []).length > 0) {
        toast.warning("Some fields could not be confidently extracted.");
      }
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? `OCR request timed out after ${Math.floor(timeoutMs / 1000)} seconds. Try again once or use a clearer image.`
          : error instanceof Error
            ? error.message
            : "Failed to extract vaccination info.";
      toast.error(message);
    } finally {
      clearTimeout(timeoutId);
      setUploadingProof(false);
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#12455a]">
                Patient Profiles
              </h1>
              <p className="mt-1 text-[#5a7d8e]">
                Manage patient info, vaccination history, and health conditions.
              </p>
            </div>
            {patients.length > 0 && !showCreateForm && (
              <Button
                onClick={() => {
                  setShowCreateForm(true);
                  setShowProofUploadForm(false);
                  setPrefill(null);
                  setOcrWarnings([]);
                }}
                className="bg-[#116cb6] text-white hover:bg-[#0d4d8b]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
            )}
          </div>
        </motion.div>

        {/* User Info */}
        {user && (
          <Card className="qdoc-card mb-6 border-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d6e6f2]">
                  <User className="h-4 w-4 text-[#116cb6]" />
                </div>
                <div>
                  <span className="font-medium text-[#12455a]">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="mx-2 text-[#c2dcee]">•</span>
                  <span className="text-[#5a7d8e]">{user.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card className="qdoc-card border-none">
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#116cb6]" />
            </CardContent>
          </Card>
        ) : showCreateForm || patients.length === 0 ? (
          /* ── CREATE PATIENT FORM ─────────────────────────── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {patients.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#12455a]">
                  Register New Patient
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowProofUploadForm(true);
                      setProofFile(null);
                    }}
                  >
                    Fill from Proof of Vaccination card
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setShowProofUploadForm(false);
                      setProofFile(null);
                      setPrefill(null);
                      setOcrWarnings([]);
                    }}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {patients.length === 0 && (
              <div className="mb-6 rounded-xl border-2 border-dashed border-[#c2dcee] bg-[#f8fbfe] p-6 text-center">
                <Syringe className="mx-auto mb-3 h-10 w-10 text-[#116cb6]" />
                <h2 className="text-lg font-semibold text-[#12455a]">
                  Welcome! Let&apos;s set up your patient profile.
                </h2>
                <p className="mt-1 text-sm text-[#5a7d8e]">
                  Fill in your details below — including any vaccines
                  you&apos;ve already received — so we can generate personalized
                  recommendations.
                </p>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowProofUploadForm(true);
                      setProofFile(null);
                    }}
                  >
                    Fill from Proof of Vaccination card
                  </Button>
                </div>
              </div>
            )}
            {showProofUploadForm ? (
              <Card className="qdoc-card border-none">
                <CardHeader>
                  <CardTitle className="text-lg text-[#12455a]">
                    Upload Proof of Vaccination Card
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleExtractProof}>
                  <div className="space-y-2">
                    <Label htmlFor="proof-upload" className="text-[#12455a]">
                      Upload image
                    </Label>
                    <Input
                      id="proof-upload"
                      type="file"
                      accept="image/*"
                      className="cursor-pointer"
                      onChange={handleProofFileChange}
                    />
                  </div>
                    <div className="flex items-center gap-2">
                      <Button type="submit" disabled={!proofFile || uploadingProof}>
                        {uploadingProof && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Extract and Fill Form
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setShowProofUploadForm(false);
                          setProofFile(null);
                        }}
                      >
                        Back to Register New Patient
                      </Button>
                    </div>
                    {uploadingProof && (
                      <p className="text-xs text-[#5a7d8e]">
                        Running OCR... first run can take up to about 2 minutes.
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            ) : (
              <>
                {ocrWarnings.length > 0 && (
                  <Card className="qdoc-card mb-4 border border-[#f8d586] bg-[#fef9e7]">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-[#12455a]">
                        OCR Notes
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#5a7d8e]">
                        {ocrWarnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {/* {ocrDebug && (
                  <Card className="qdoc-card mb-4 border border-[#c2dcee]">
                    <CardHeader>
                      <CardTitle className="text-sm text-[#12455a]">
                        OCR Debug Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div>
                        <p className="font-medium text-[#12455a]">Extracted Fields</p>
                        <pre className="mt-1 overflow-auto rounded bg-[#f8fbfe] p-2 text-[#5a7d8e]">
{JSON.stringify(ocrDebug.fields, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="font-medium text-[#12455a]">Vaccinations</p>
                        <pre className="mt-1 overflow-auto rounded bg-[#f8fbfe] p-2 text-[#5a7d8e]">
{JSON.stringify(ocrDebug.vaccinations, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="font-medium text-[#12455a]">Next Immunizations Due</p>
                        <pre className="mt-1 overflow-auto rounded bg-[#f8fbfe] p-2 text-[#5a7d8e]">
{JSON.stringify(ocrDebug.nextImmunizationsDue ?? [], null, 2)}
                        </pre>
                      </div>
                      {ocrDebug.rawText && (
                        <div>
                          <p className="font-medium text-[#12455a]">Raw OCR Text</p>
                          <pre className="mt-1 max-h-52 overflow-auto rounded bg-[#f8fbfe] p-2 whitespace-pre-wrap text-[#5a7d8e]">
{ocrDebug.rawText}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )} */}
                <PatientForm
                  prefill={prefill}
                  onSuccess={() => {
                    setShowCreateForm(false);
                    setShowProofUploadForm(false);
                    setProofFile(null);
                    setPrefill(null);
                    setOcrWarnings([]);
                    setOcrDebug(null);
                    fetchPatients();
                  }}
                />
              </>
            )}
          </motion.div>
        ) : (
          /* ── PATIENT LIST ────────────────────────────────── */
          <div className="space-y-6">
            {patients.map((patient, pIndex) => {
              const age = calculateAge(patient.dateOfBirth);
              const recs = getRecommendations({
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                chronicConditions: patient.chronicConditions || [],
                riskFactors: patient.riskFactors || [],
                vaccinations: patient.vaccinations || [],
              });
              const completed = recs.filter((r) => r.status === "completed");
              const needed = recs.filter(
                (r) => r.status === "needed" || r.status === "overdue"
              );

              return (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pIndex * 0.1, duration: 0.4 }}
                >
                  <Card className="qdoc-card border-none overflow-hidden">
                    {/* Patient Header */}
                    <div className="bg-gradient-to-r from-[#116cb6] to-[#0d4d8b] px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-white">
                            {patient.firstName} {patient.lastName}
                          </h2>
                          <p className="text-sm text-blue-100">
                            Age {age} • {patient.gender}
                            {patient.email && ` • ${patient.email}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <div className="rounded-lg bg-white/15 px-3 py-1.5 text-center">
                            <p className="text-lg font-bold text-white">
                              {completed.length}
                            </p>
                            <p className="text-[10px] text-blue-100">Done</p>
                          </div>
                          <div className="rounded-lg bg-white/15 px-3 py-1.5 text-center">
                            <p className="text-lg font-bold text-white">
                              {needed.length}
                            </p>
                            <p className="text-[10px] text-blue-100">Needed</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-4">
                      {/* Conditions & Risk Factors */}
                      {((patient.chronicConditions &&
                        patient.chronicConditions.length > 0) ||
                        (patient.riskFactors &&
                          patient.riskFactors.length > 0)) && (
                          <div className="flex flex-wrap gap-1.5">
                            {(patient.chronicConditions || []).map((c) => (
                              <Badge
                                key={c}
                                variant="outline"
                                className="border-[#e57d7d] bg-[#fde8e8] text-[#d64545] text-xs"
                              >
                                <Heart className="mr-1 h-2.5 w-2.5" />
                                {c}
                              </Badge>
                            ))}
                            {(patient.riskFactors || []).map((f) => (
                              <Badge
                                key={f}
                                variant="outline"
                                className="border-[#f8d586] bg-[#fef9e7] text-[#b8930e] text-xs"
                              >
                                <Shield className="mr-1 h-2.5 w-2.5" />
                                {f}
                              </Badge>
                            ))}
                          </div>
                        )}

                      {/* Vaccination Records */}
                      {patient.vaccinations &&
                        patient.vaccinations.length > 0 && (
                          <>
                            <Separator className="bg-[#eef4f9]" />
                            <div>
                              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#12455a]">
                                <Syringe className="h-4 w-4 text-[#116cb6]" />
                                Vaccination Records (
                                {patient.vaccinations.length})
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {patient.vaccinations.map((v, i) => (
                                  <Badge
                                    key={`${v.vaccineName}-${i}`}
                                    variant="outline"
                                    className="border-[#c2e8a0] bg-[#e1f5c6] text-[#5a8a1e] text-xs"
                                  >
                                    <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                                    {v.vaccineName}
                                    <span className="ml-1 text-[#8ba8b8]">
                                      (
                                      {new Date(v.dateGiven).toLocaleDateString(
                                        "en-CA",
                                        {
                                          month: "short",
                                          year: "numeric",
                                        }
                                      )}
                                      )
                                    </span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                      {/* Needed Vaccines */}
                      {needed.length > 0 && (
                        <>
                          <Separator className="bg-[#eef4f9]" />
                          <div>
                            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#12455a]">
                              <AlertTriangle className="h-4 w-4 text-[#f2c14e]" />
                              Vaccines Needed ({needed.length})
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {needed.map((rec) => (
                                <Badge
                                  key={rec.vaccine.name}
                                  variant="outline"
                                  className="border-[#f8d586] bg-[#fef9e7] text-[#b8930e] text-xs"
                                >
                                  <AlertTriangle className="mr-1 h-2.5 w-2.5" />
                                  {rec.vaccine.displayNames[0]}
                                  {rec.remainingDoses > 0 &&
                                    ` (${rec.remainingDoses} dose${rec.remainingDoses > 1 ? "s" : ""})`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
