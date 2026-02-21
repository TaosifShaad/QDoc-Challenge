"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { PatientForm } from "@/components/patient-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Syringe,
  Heart,
  Shield,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Save,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import type { Patient } from "@/lib/types";
import {
  CHRONIC_CONDITIONS,
  RISK_FACTORS,
  GENDER_OPTIONS,
  VACCINE_NAMES,
} from "@/lib/types";
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

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
                onClick={() => setShowCreateForm(true)}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Cancel
                </Button>
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
              </div>
            )}
            <PatientForm
              onSuccess={() => {
                setShowCreateForm(false);
                fetchPatients();
              }}
            />
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
