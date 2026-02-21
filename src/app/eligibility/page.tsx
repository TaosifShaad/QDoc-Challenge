"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Syringe,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Heart,
  Info,
  Loader2,
} from "lucide-react";
import type { Patient } from "@/lib/types";
import {
  getRecommendations,
  type VaccineRecommendation,
} from "@/lib/vaccine-data";
import { motion } from "framer-motion";

export default function EligibilityPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch("/api/patients?mine=true");
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
        }
      } catch (error) {
        console.error("Failed to fetch patients:", error);
      } finally {
        setLoading(false);
      }
    }
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

  const statusIcon = (status: VaccineRecommendation["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-[#5a8a1e]" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-[#d64545]" />;
      case "needed":
        return <Clock className="h-4 w-4 text-[#f2c14e]" />;
      case "upcoming":
        return <Clock className="h-4 w-4 text-[#116cb6]" />;
    }
  };

  const statusBadgeClass = (status: VaccineRecommendation["status"]) => {
    switch (status) {
      case "completed":
        return "border-[#c2e8a0] bg-[#e1f5c6] text-[#5a8a1e]";
      case "overdue":
        return "border-[#e57d7d] bg-[#fde8e8] text-[#d64545]";
      case "needed":
        return "border-[#f8d586] bg-[#fef9e7] text-[#b8930e]";
      case "upcoming":
        return "border-[#c2dcee] bg-[#d6e6f2] text-[#116cb6]";
    }
  };

  const statusLabel = (status: VaccineRecommendation["status"]) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "overdue":
        return "Overdue";
      case "needed":
        return "Needed";
      case "upcoming":
        return "Upcoming";
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
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e1f5c6]">
              <Syringe className="h-5 w-5 text-[#8fc748]" />
            </div>
            <h1 className="text-3xl font-bold text-[#12455a]">
              Vaccine Eligibility
            </h1>
          </div>
          <p className="text-[#5a7d8e]">
            Smart recommendations based on your age, medical conditions, risk
            factors, and vaccination history.
          </p>
        </motion.div>

        {loading ? (
          <Card className="qdoc-card border-none">
            <CardContent className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#116cb6]" />
                <p className="text-sm text-[#5a7d8e]">
                  Analyzing your eligibility...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : patients.length === 0 ? (
          <Card className="qdoc-card border-none">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Syringe className="h-12 w-12 text-[#c2dcee] mb-4" />
              <h3 className="text-lg font-semibold text-[#12455a]">
                No patient profiles found
              </h3>
              <p className="mt-1 text-sm text-[#5a7d8e]">
                Create a patient profile first to see vaccine recommendations.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {patients.map((patient, pIndex) => {
              const recs = getRecommendations({
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                chronicConditions: patient.chronicConditions || [],
                riskFactors: patient.riskFactors || [],
                vaccinations: patient.vaccinations || [],
              });

              const completed = recs.filter(
                (r) => r.status === "completed"
              );
              const needed = recs.filter(
                (r) => r.status === "needed" || r.status === "overdue"
              );
              const upcoming = recs.filter(
                (r) => r.status === "upcoming"
              );
              const age = calculateAge(patient.dateOfBirth);

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
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <div className="rounded-lg bg-white/15 px-3 py-1.5 text-center">
                            <p className="text-lg font-bold text-white">
                              {completed.length}
                            </p>
                            <p className="text-[10px] text-blue-100">
                              Done
                            </p>
                          </div>
                          <div className="rounded-lg bg-white/15 px-3 py-1.5 text-center">
                            <p className="text-lg font-bold text-white">
                              {needed.length}
                            </p>
                            <p className="text-[10px] text-blue-100">
                              Needed
                            </p>
                          </div>
                          <div className="rounded-lg bg-white/15 px-3 py-1.5 text-center">
                            <p className="text-lg font-bold text-white">
                              {upcoming.length}
                            </p>
                            <p className="text-[10px] text-blue-100">
                              Upcoming
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-5">
                      {/* Conditions & Risk Factors */}
                      {((patient.chronicConditions &&
                        patient.chronicConditions.length > 0) ||
                        (patient.riskFactors &&
                          patient.riskFactors.length > 0)) && (
                          <>
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
                            <Separator className="bg-[#eef4f9]" />
                          </>
                        )}

                      {/* Overdue & Needed */}
                      {needed.length > 0 && (
                        <div>
                          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#12455a] mb-3">
                            <AlertTriangle className="h-4 w-4 text-[#f2c14e]" />
                            Action Required ({needed.length})
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {needed.map((rec) => (
                              <div
                                key={rec.vaccine.name}
                                className="rounded-xl border border-[#f8d586] bg-[#fffcf5] p-4"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {statusIcon(rec.status)}
                                    <span className="font-semibold text-sm text-[#12455a]">
                                      {rec.vaccine.displayNames[0]}
                                    </span>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${statusBadgeClass(rec.status)}`}
                                  >
                                    {statusLabel(rec.status)}
                                  </Badge>
                                </div>
                                <div className="space-y-1.5 text-xs text-[#5a7d8e]">
                                  <p>
                                    Doses: {rec.completedDoses}/
                                    {rec.vaccine.totalDoses} •{" "}
                                    {rec.remainingDoses} remaining
                                  </p>
                                  {rec.nextDueDate && (
                                    <p className="font-medium text-[#b8930e]">
                                      Due:{" "}
                                      {new Date(
                                        rec.nextDueDate
                                      ).toLocaleDateString("en-CA", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </p>
                                  )}
                                  <div className="flex items-start gap-1 mt-1">
                                    <Info className="h-3 w-3 mt-0.5 shrink-0 text-[#8ba8b8]" />
                                    <span className="text-[#8ba8b8]">
                                      {rec.reasons.join(" • ")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upcoming */}
                      {upcoming.length > 0 && (
                        <>
                          <Separator className="bg-[#eef4f9]" />
                          <div>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#12455a] mb-3">
                              <Clock className="h-4 w-4 text-[#116cb6]" />
                              Upcoming ({upcoming.length})
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {upcoming.map((rec) => (
                                <div
                                  key={rec.vaccine.name}
                                  className="rounded-xl border border-[#c2dcee] bg-[#f8fbfe] p-4"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {statusIcon(rec.status)}
                                      <span className="font-semibold text-sm text-[#12455a]">
                                        {rec.vaccine.displayNames[0]}
                                      </span>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${statusBadgeClass(rec.status)}`}
                                    >
                                      {statusLabel(rec.status)}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 text-xs text-[#5a7d8e]">
                                    <p>
                                      Doses: {rec.completedDoses}/
                                      {rec.vaccine.totalDoses}
                                    </p>
                                    {rec.nextDueDate && (
                                      <p>
                                        Next dose:{" "}
                                        {new Date(
                                          rec.nextDueDate
                                        ).toLocaleDateString("en-CA", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Completed */}
                      {completed.length > 0 && (
                        <>
                          <Separator className="bg-[#eef4f9]" />
                          <div>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#12455a] mb-3">
                              <CheckCircle2 className="h-4 w-4 text-[#5a8a1e]" />
                              Completed ({completed.length})
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {completed.map((rec) => (
                                <Badge
                                  key={rec.vaccine.name}
                                  variant="outline"
                                  className="border-[#c2e8a0] bg-[#e1f5c6] text-[#5a8a1e] text-xs"
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  {rec.vaccine.displayNames[0]}
                                  {rec.lastGivenDate &&
                                    ` (${new Date(rec.lastGivenDate).toLocaleDateString("en-CA", { month: "short", year: "numeric" })})`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {recs.length === 0 && (
                        <p className="text-sm text-[#5a7d8e] text-center py-4">
                          No vaccine recommendations available for this profile.
                        </p>
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
