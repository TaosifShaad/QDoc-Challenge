"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Syringe,
  Loader2,
  Calendar,
} from "lucide-react";
import type { Patient } from "@/lib/types";
import { getTimeline, type TimelineEntry } from "@/lib/vaccine-data";
import { motion } from "framer-motion";

export default function TimelinePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState<Set<string>>(new Set());


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

  const refetchPatients = async () => {
    try {
      const res = await fetch("/api/patients?mine=true");
      if (res.ok) setPatients(await res.json());
    } catch { }
  };

  const markVaccineComplete = async (
    patientId: string,
    vaccineName: string,
    doseNumber: number
  ) => {
    const key = `${patientId}-${vaccineName}-${doseNumber}`;
    setMarkingComplete((prev) => new Set(prev).add(key));
    try {
      const res = await fetch(`/api/patients/${patientId}/vaccinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaccineName,
          doseNumber,
          dateGiven: new Date().toISOString().slice(0, 10),
        }),
      });
      if (res.ok) {
        await refetchPatients();
      }
    } catch (err) {
      console.error("Failed to mark vaccine complete:", err);
    } finally {
      setMarkingComplete((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };


  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatMonth = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
    });

  const getTypeStyles = (type: TimelineEntry["type"]) => {
    switch (type) {
      case "completed":
        return {
          dot: "bg-[#8fc748] border-[#e1f5c6]",
          line: "bg-[#c2e8a0]",
          card: "border-[#c2e8a0] bg-[#f5fbee]",
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-[#5a8a1e]" />,
          badge: "border-[#c2e8a0] bg-[#e1f5c6] text-[#5a8a1e]",
          label: "Completed",
        };
      case "overdue":
        return {
          dot: "bg-[#d64545] border-[#fde8e8]",
          line: "bg-[#e57d7d]",
          card: "border-[#e57d7d] bg-[#fef5f5]",
          icon: <AlertTriangle className="h-3.5 w-3.5 text-[#d64545]" />,
          badge: "border-[#e57d7d] bg-[#fde8e8] text-[#d64545]",
          label: "Overdue",
        };
      case "upcoming":
        return {
          dot: "bg-[#116cb6] border-[#d6e6f2]",
          line: "bg-[#c2dcee]",
          card: "border-[#c2dcee] bg-[#f8fbfe]",
          icon: <Clock className="h-3.5 w-3.5 text-[#116cb6]" />,
          badge: "border-[#c2dcee] bg-[#d6e6f2] text-[#116cb6]",
          label: "Upcoming",
        };
    }
  };

  const getDaysUntil = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Group timeline entries by month
  const groupByMonth = (entries: TimelineEntry[]) => {
    const groups: Record<string, TimelineEntry[]> = {};
    for (const entry of entries) {
      const key = formatMonth(entry.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }
    return Object.entries(groups);
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fef9e7]">
              <BarChart3 className="h-5 w-5 text-[#f2c14e]" />
            </div>
            <h1 className="text-3xl font-bold text-[#12455a]">
              Immunization Timeline
            </h1>
          </div>
          <p className="text-[#5a7d8e]">
            Visual timeline of your vaccination history and upcoming doses.
          </p>
        </motion.div>

        {loading ? (
          <Card className="qdoc-card border-none">
            <CardContent className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#116cb6]" />
                <p className="text-sm text-[#5a7d8e]">
                  Building your timeline...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : patients.length === 0 ? (
          <Card className="qdoc-card border-none">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-12 w-12 text-[#c2dcee] mb-4" />
              <h3 className="text-lg font-semibold text-[#12455a]">
                No timeline data
              </h3>
              <p className="mt-1 text-sm text-[#5a7d8e]">
                Create a patient profile with vaccination records to see the
                timeline.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {patients.map((patient, pIndex) => {
              const timeline = getTimeline({
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                chronicConditions: patient.chronicConditions || [],
                riskFactors: patient.riskFactors || [],
                vaccinations: patient.vaccinations || [],
              });

              const pastEntries = timeline.filter(
                (e) => e.type === "completed"
              );
              const futureEntries = timeline.filter(
                (e) => e.type !== "completed"
              );

              const monthGroups = groupByMonth(timeline);

              return (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pIndex * 0.1, duration: 0.4 }}
                >
                  <Card className="qdoc-card border-none overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-[#116cb6] to-[#0d4d8b] text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">
                          {patient.firstName} {patient.lastName}
                        </CardTitle>
                        <div className="flex gap-3 text-sm text-blue-100">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {pastEntries.length} completed
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {futureEntries.length} upcoming
                          </span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      {timeline.length === 0 ? (
                        <div className="py-12 text-center text-sm text-[#5a7d8e]">
                          No vaccination records to display.
                        </div>
                      ) : (
                        <div className="p-6">
                          {monthGroups.map(([month, entries], gIndex) => (
                            <div key={month} className="mb-6 last:mb-0">
                              {/* Month Header */}
                              <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-[#116cb6]" />
                                <span className="text-sm font-bold text-[#12455a]">
                                  {month}
                                </span>
                                <div className="flex-1 h-px bg-[#eef4f9]" />
                              </div>

                              {/* Timeline entries */}
                              <div className="ml-2 space-y-3">
                                {entries.map((entry, eIndex) => {
                                  const styles = getTypeStyles(entry.type);
                                  const daysUntil = getDaysUntil(entry.date);

                                  return (
                                    <motion.div
                                      key={`${entry.vaccineName}-${entry.date}-${eIndex}`}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{
                                        delay:
                                          gIndex * 0.05 + eIndex * 0.03,
                                        duration: 0.3,
                                      }}
                                      className="flex items-start gap-3"
                                    >
                                      {/* Timeline dot & line */}
                                      <div className="flex flex-col items-center pt-1.5">
                                        <div
                                          className={`h-3 w-3 rounded-full border-2 ${styles.dot}`}
                                        />
                                        {eIndex < entries.length - 1 && (
                                          <div
                                            className={`w-0.5 flex-1 mt-1 min-h-[20px] ${styles.line}`}
                                          />
                                        )}
                                      </div>

                                      {/* Card */}
                                      <div
                                        className={`flex-1 rounded-lg border p-3 ${styles.card}`}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <Syringe className="h-3.5 w-3.5 text-[#5a7d8e]" />
                                            <span className="font-semibold text-sm text-[#12455a]">
                                              {entry.vaccineName}
                                            </span>
                                            {entry.reasons && entry.reasons.some((r: string) => r.includes("HIGH PRIORITY")) && (
                                              <Badge className="text-[10px] bg-red-100 text-red-700 border border-red-200">
                                                High Priority
                                              </Badge>
                                            )}
                                            {entry.reasons && entry.reasons.some((r: string) => r.includes("Alert")) && (
                                              <Badge className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200">
                                                Special Alert
                                              </Badge>
                                            )}
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className={`text-[10px] ${styles.badge}`}
                                          >
                                            {styles.icon}
                                            <span className="ml-1">
                                              {styles.label}
                                            </span>
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-[#5a7d8e]">
                                          <span>
                                            {formatDate(entry.date)}
                                          </span>
                                          <span>
                                            Dose {entry.doseNumber}/
                                            {entry.totalDoses}
                                          </span>
                                          {entry.provider && (
                                            <span>
                                              {entry.provider}
                                            </span>
                                          )}
                                          {entry.type !== "completed" && (
                                            <span
                                              className={`font-medium ${daysUntil < 0
                                                ? "text-[#d64545]"
                                                : daysUntil <= 10
                                                  ? "text-[#b8930e]"
                                                  : "text-[#116cb6]"
                                                }`}
                                            >
                                              {daysUntil < 0
                                                ? `${Math.abs(daysUntil)} days overdue`
                                                : daysUntil === 0
                                                  ? "Due today"
                                                  : `In ${daysUntil} days`}
                                            </span>
                                          )}
                                        </div>
                                        {entry.type !== "completed" && (
                                          <div className="mt-2">
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                const pid = patients.find(
                                                  (p) => {
                                                    const tl = getTimeline({
                                                      dateOfBirth: p.dateOfBirth,
                                                      gender: p.gender,
                                                      chronicConditions: p.chronicConditions || [],
                                                      riskFactors: p.riskFactors || [],
                                                      vaccinations: p.vaccinations || [],
                                                    });
                                                    return tl.some(
                                                      (t) =>
                                                        t.vaccineName === entry.vaccineName &&
                                                        t.date === entry.date
                                                    );
                                                  }
                                                );
                                                if (pid) {
                                                  markVaccineComplete(
                                                    pid.id!,
                                                    entry.vaccineName,
                                                    entry.doseNumber
                                                  );
                                                }
                                              }}
                                              disabled={markingComplete.has(
                                                `${patients[0]?.id}-${entry.vaccineName}-${entry.doseNumber}`
                                              )}
                                              className="bg-[#5a8a1e] text-white hover:bg-[#4a7a18] text-xs"
                                            >
                                              {markingComplete.has(
                                                `${patients[0]?.id}-${entry.vaccineName}-${entry.doseNumber}`
                                              ) ? (
                                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                              ) : (
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                              )}
                                              Mark Complete
                                            </Button>
                                          </div>
                                        )}

                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
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
