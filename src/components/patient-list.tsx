"use client";

import { User, Calendar, Syringe, Heart, AlertTriangle, Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Patient } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface PatientListProps {
  patients: Patient[];
  loading: boolean;
}

export function PatientList({ patients, loading }: PatientListProps) {
  const calculateAge = (dob: string): number => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card className="qdoc-card border-none">
        <CardContent className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c2dcee] border-t-[#116cb6]" />
            <p className="text-sm text-[#5a7d8e]">Loading patients...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (patients.length === 0) {
    return (
      <Card className="qdoc-card border-none">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d6e6f2]">
            <User className="h-8 w-8 text-[#116cb6]" />
          </div>
          <h3 className="text-lg font-semibold text-[#12455a]">
            No patients yet
          </h3>
          <p className="mt-1 text-sm text-[#5a7d8e]">
            Add a patient using the form above, import a CSV, or load mock profiles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#12455a]">
          All Patients
          <span className="ml-2 text-sm font-normal text-[#5a7d8e]">
            ({patients.length})
          </span>
        </h2>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {patients.map((patient, index) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
            >
              <Card className="qdoc-card border-none overflow-hidden">
                <div className="flex">
                  {/* Color accent bar */}
                  <div className="w-1.5 bg-gradient-to-b from-[#116cb6] to-[#0d4d8b]" />

                  <div className="flex-1 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      {/* Patient Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d6e6f2]">
                            <User className="h-5 w-5 text-[#116cb6]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#12455a]">
                              {patient.firstName} {patient.lastName}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-[#5a7d8e]">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Age {calculateAge(patient.dateOfBirth)} •{" "}
                                {patient.gender}
                              </span>
                              {patient.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {patient.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Badges row */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
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
                      </div>

                      {/* Vaccination Summary */}
                      <div className="min-w-0 lg:max-w-md">
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#12455a]">
                          <Syringe className="h-3 w-3 text-[#116cb6]" />
                          Vaccination Records ({patient.vaccinations.length})
                        </div>
                        {patient.vaccinations.length > 0 ? (
                          <div className="rounded-lg border border-[#c2dcee] overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-[#eef4f9] hover:bg-[#eef4f9]">
                                  <TableHead className="text-xs text-[#12455a] h-8 py-1">
                                    Vaccine
                                  </TableHead>
                                  <TableHead className="text-xs text-[#12455a] h-8 py-1">
                                    Dose
                                  </TableHead>
                                  <TableHead className="text-xs text-[#12455a] h-8 py-1">
                                    Date
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {patient.vaccinations
                                  .slice(0, 3)
                                  .map((vax) => (
                                    <TableRow
                                      key={vax.id}
                                      className="hover:bg-[#f8fbfe]"
                                    >
                                      <TableCell className="text-xs text-[#12455a] py-1.5">
                                        {vax.vaccineName.split("(")[0].trim()}
                                      </TableCell>
                                      <TableCell className="text-xs text-[#5a7d8e] py-1.5">
                                        #{vax.doseNumber}
                                      </TableCell>
                                      <TableCell className="text-xs text-[#5a7d8e] py-1.5">
                                        {formatDate(vax.dateGiven)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                            {patient.vaccinations.length > 3 && (
                              <div className="border-t border-[#c2dcee] px-3 py-1.5 text-center text-xs text-[#5a7d8e] bg-[#f8fbfe]">
                                +{patient.vaccinations.length - 3} more records
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[#5a7d8e]">
                            No vaccination records
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
