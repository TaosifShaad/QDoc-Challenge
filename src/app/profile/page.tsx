"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  LogOut,
  Shield,
  Clock,
} from "lucide-react";
import type { Patient } from "@/lib/types";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

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

  const totalVaccinations = patients.reduce(
    (sum, p) => sum + p.vaccinations.length,
    0
  );

  const allConditions = [
    ...new Set(patients.flatMap((p) => p.chronicConditions)),
  ];
  const allRiskFactors = [...new Set(patients.flatMap((p) => p.riskFactors))];

  if (!user) return null;

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
                No patient profiles yet
              </h3>
              <p className="mt-1 text-center text-sm text-[#5a7d8e]">
                Go to the{" "}
                <a
                  href="/patients"
                  className="font-medium text-[#116cb6] hover:underline"
                >
                  Patients page
                </a>{" "}
                to add your vaccination information.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#12455a]">
              Your Patient Profiles
            </h2>
            {patients.map((patient) => (
              <Card key={patient.id} className="qdoc-card border-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-[#12455a]">
                      {patient.firstName} {patient.lastName}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-[#5a7d8e]">
                      <Calendar className="h-4 w-4" />
                      DOB: {formatDate(patient.dateOfBirth)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Conditions & Risk Factors */}
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

                  {/* Vaccination Records */}
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
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
