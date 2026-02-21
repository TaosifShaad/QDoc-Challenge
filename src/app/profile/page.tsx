"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Mail,
  Calendar,
  Syringe,
  Heart,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  Shield,
  Clock,
  Pencil,
  Save,
  X,
} from "lucide-react";
import type { Patient } from "@/lib/types";
import { VACCINE_NAMES, CHRONIC_CONDITIONS, RISK_FACTORS } from "@/lib/types";
import { getRecommendations, type VaccineRecommendation } from "@/lib/vaccine-data";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    chronicConditions: [] as string[],
    riskFactors: [] as string[],
  });

  useEffect(() => {
    async function fetchMyPatients() {
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
    fetchMyPatients();
  }, []);

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return 0;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(0, age);
  };

  const totalVaccinations = patients.reduce(
    (sum, p) => sum + p.vaccinations.length,
    0
  );

  const allConditions = [
    ...new Set(patients.flatMap((p) => p.chronicConditions)),
  ];
  const allRiskFactors = [...new Set(patients.flatMap((p) => p.riskFactors))];

  if (!user) return null;

  const startEditingPatient = (patient: Patient) => {
    setEditingPatientId(patient.id ?? null);
    setEditForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : "",
      gender: patient.gender,
      email: patient.email ?? "",
      phone: patient.phone ?? "",
      address: patient.address ?? "",
      chronicConditions: patient.chronicConditions ?? [],
      riskFactors: patient.riskFactors ?? [],
    });
  };

  const cancelEditingPatient = () => {
    setEditingPatientId(null);
  };

  const savePatientProfile = async (patientId: string) => {
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const updated = await res.json();
      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? updated : p))
      );
      setEditingPatientId(null);
    } catch (error) {
      console.error("Failed to update patient profile:", error);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="qdoc-card mb-6 border-none overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-[#116cb6] to-[#0d4d8b]" />
          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[#d6e6f2] shadow-md">
                  <User className="h-10 w-10 text-[#116cb6]" />
                </div>
                <div className="mb-1">
                  <h1 className="text-2xl font-bold text-[#12455a]">
                    {user.firstName} {user.lastName}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-[#5a7d8e]">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Member since {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                className="mt-4 border-[#d64545] text-[#d64545] hover:bg-[#fde8e8] sm:mt-0"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          {
            label: "Patient Profiles",
            value: patients.length,
            icon: User,
            color: "#116cb6",
            bg: "#d6e6f2",
          },
          {
            label: "Vaccinations",
            value: totalVaccinations,
            icon: Syringe,
            color: "#8fc748",
            bg: "#e1f5c6",
          },
          {
            label: "Conditions",
            value: allConditions.length,
            icon: Heart,
            color: "#d64545",
            bg: "#fde8e8",
          },
          {
            label: "Risk Factors",
            value: allRiskFactors.length,
            icon: Shield,
            color: "#f2c14e",
            bg: "#fef9e7",
          },
        ].map((stat) => (
          <Card key={stat.label} className="qdoc-card border-none">
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: stat.bg }}
              >
                <stat.icon
                  className="h-5 w-5"
                  style={{ color: stat.color }}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#12455a]">
                  {stat.value}
                </p>
                <p className="text-xs text-[#5a7d8e]">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Patient Profiles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {loading ? (
          <Card className="qdoc-card border-none">
            <CardContent className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c2dcee] border-t-[#116cb6]" />
                <p className="text-sm text-[#5a7d8e]">Loading your data...</p>
              </div>
            </CardContent>
          </Card>
        ) : patients.length === 0 ? (
          <Card className="qdoc-card border-none">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d6e6f2]">
                <Syringe className="h-8 w-8 text-[#116cb6]" />
              </div>
              <h3 className="text-lg font-semibold text-[#12455a]">
                No patient profile yet
              </h3>
              <p className="mt-1 text-center text-sm text-[#5a7d8e]">
                Create a patient profile to get personalized vaccine recommendations.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#12455a]">
              Your Patient Profiles
            </h2>
            {patients.map((patient) => {
              const age = calculateAge(patient.dateOfBirth);
              const recs = getRecommendations({
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                chronicConditions: patient.chronicConditions || [],
                riskFactors: patient.riskFactors || [],
                vaccinations: patient.vaccinations || [],
              });
              const completedVaccines = recs.filter((r) => r.status === "completed");
              const neededVaccines = recs.filter(
                (r) => r.status === "needed" || r.status === "overdue"
              );

              return (
                <Card key={patient.id} className="qdoc-card border-none">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-[#12455a]">
                        {patient.firstName} {patient.lastName}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-[#5a7d8e]">
                          <Calendar className="h-4 w-4" />
                          DOB: {formatDate(patient.dateOfBirth)} • Age {age}
                        </div>
                        {editingPatientId === patient.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelEditingPatient()}
                              disabled={savingProfile}
                            >
                              <X className="mr-1 h-3.5 w-3.5" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => patient.id && savePatientProfile(patient.id)}
                              disabled={savingProfile}
                              className="bg-[#116cb6] text-white hover:bg-[#0d4d8b]"
                            >
                              <Save className="mr-1 h-3.5 w-3.5" />
                              Save
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingPatient(patient)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editingPatientId === patient.id && (
                      <div className="grid gap-3 rounded-lg border border-[#c2dcee] bg-[#f8fbfe] p-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-[#12455a]">First Name</Label>
                          <Input
                            value={editForm.firstName}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, firstName: e.target.value }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[#12455a]">Last Name</Label>
                          <Input
                            value={editForm.lastName}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, lastName: e.target.value }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[#12455a]">Date of Birth</Label>
                          <Input
                            type="date"
                            value={editForm.dateOfBirth}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[#12455a]">Gender</Label>
                          <Input
                            value={editForm.gender}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, gender: e.target.value }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[#12455a]">Email</Label>
                          <Input
                            type="email"
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, email: e.target.value }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[#12455a]">Phone</Label>
                          <Input
                            value={editForm.phone}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-[#12455a]">Address</Label>
                          <Input
                            value={editForm.address}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, address: e.target.value }))
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}

                    {/* Conditions & Risk Factors */}
                    {editingPatientId === patient.id ? (
                      <div className="space-y-4 rounded-lg border border-[#c2dcee] bg-[#f8fbfe] p-4">
                        <div>
                          <Label className="text-[#12455a] mb-2 block">Chronic Conditions</Label>
                          <div className="flex flex-wrap gap-2">
                            {CHRONIC_CONDITIONS.map((condition) => {
                              const isSelected = editForm.chronicConditions.includes(condition);
                              return (
                                <Badge
                                  key={condition}
                                  variant={isSelected ? "default" : "outline"}
                                  className={`cursor-pointer select-none transition-all duration-200 ${isSelected
                                    ? "bg-[#116cb6] text-white hover:bg-[#0d4d8b] border-[#116cb6]"
                                    : "border-[#c2dcee] text-[#5a7d8e] hover:border-[#116cb6] hover:text-[#116cb6]"
                                    }`}
                                  onClick={() => {
                                    setEditForm(prev => ({
                                      ...prev,
                                      chronicConditions: isSelected
                                        ? prev.chronicConditions.filter(c => c !== condition)
                                        : [...prev.chronicConditions, condition]
                                    }));
                                  }}
                                >
                                  {condition}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <Label className="text-[#12455a] mb-2 block">Risk Factors</Label>
                          <div className="flex flex-wrap gap-2">
                            {RISK_FACTORS.map((factor) => {
                              const isSelected = editForm.riskFactors.includes(factor);
                              return (
                                <Badge
                                  key={factor}
                                  variant={isSelected ? "default" : "outline"}
                                  className={`cursor-pointer select-none transition-all duration-200 ${isSelected
                                    ? "bg-[#f2c14e] text-[#12455a] hover:bg-[#e6b445] border-[#f2c14e]"
                                    : "border-[#c2dcee] text-[#5a7d8e] hover:border-[#f2c14e] hover:text-[#12455a]"
                                    }`}
                                  onClick={() => {
                                    setEditForm(prev => ({
                                      ...prev,
                                      riskFactors: isSelected
                                        ? prev.riskFactors.filter(f => f !== factor)
                                        : [...prev.riskFactors, factor]
                                    }));
                                  }}
                                >
                                  {factor}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {patient.chronicConditions.map((c) => (
                          <Badge
                            key={c}
                            variant="outline"
                            className="border-[#e57d7d] bg-[#fde8e8] text-[#d64545] text-xs"
                          >
                            <Heart className="mr-1 h-2.5 w-2.5" />
                            {c}
                          </Badge>
                        ))}
                        {patient.riskFactors.map((f) => (
                          <Badge
                            key={f}
                            variant="outline"
                            className="border-[#f8d586] bg-[#fef9e7] text-[#b8930e] text-xs"
                          >
                            <AlertTriangle className="mr-1 h-2.5 w-2.5" />
                            {f}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Smart Vaccine Recommendations */}
                    <Separator className="bg-[#eef4f9]" />
                    <div className="space-y-3">
                      <div>
                        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#12455a]">
                          <CheckCircle2 className="h-4 w-4 text-[#5a8a1e]" />
                          Completed Vaccines ({completedVaccines.length})
                        </h4>
                        <p className="mb-2 text-xs text-[#5a7d8e]">
                          Based on age, conditions, and risk factors
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {completedVaccines.length > 0 ? (
                            completedVaccines.map((rec) => (
                              <Badge
                                key={`done-${rec.vaccine.name}`}
                                variant="outline"
                                className="border-[#c2e8a0] bg-[#e1f5c6] text-[#5a8a1e] text-xs"
                              >
                                <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                                {rec.vaccine.displayNames[0]}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-[#5a7d8e]">No completed vaccines recorded.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#12455a]">
                          <AlertTriangle className="h-4 w-4 text-[#f2c14e]" />
                          Vaccines Needed ({neededVaccines.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {neededVaccines.length > 0 ? (
                            neededVaccines.map((rec) => (
                              <Badge
                                key={`need-${rec.vaccine.name}`}
                                variant="outline"
                                className="border-[#f8d586] bg-[#fef9e7] text-[#b8930e] text-xs"
                              >
                                <AlertTriangle className="mr-1 h-2.5 w-2.5" />
                                {rec.vaccine.displayNames[0]}
                                {rec.remainingDoses > 0 && ` (${rec.remainingDoses} dose${rec.remainingDoses > 1 ? "s" : ""})`}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-[#5a7d8e]">All recommended vaccines are completed! 🎉</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {patient.vaccinations.length > 0 && (
                      <>
                        <Separator className="bg-[#eef4f9]" />
                        <div>
                          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#12455a]">
                            <Syringe className="h-4 w-4 text-[#116cb6]" />
                            Vaccination Records
                          </h4>
                          <div className="overflow-x-auto rounded-lg border border-[#c2dcee]">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-[#eef4f9] hover:bg-[#eef4f9]">
                                  <TableHead className="text-[#12455a]">
                                    Vaccine
                                  </TableHead>
                                  <TableHead className="text-[#12455a]">
                                    Dose
                                  </TableHead>
                                  <TableHead className="text-[#12455a]">
                                    Date
                                  </TableHead>
                                  <TableHead className="text-[#12455a]">
                                    Provider
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {patient.vaccinations.map((vax) => (
                                  <TableRow
                                    key={vax.id}
                                    className="hover:bg-[#f8fbfe]"
                                  >
                                    <TableCell className="font-medium text-[#12455a]">
                                      {vax.vaccineName}
                                    </TableCell>
                                    <TableCell className="text-[#5a7d8e]">
                                      #{vax.doseNumber}
                                    </TableCell>
                                    <TableCell className="text-[#5a7d8e]">
                                      {formatDate(vax.dateGiven)}
                                    </TableCell>
                                    <TableCell className="text-[#5a7d8e]">
                                      {vax.provider || "—"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
