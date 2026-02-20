"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Upload, UserPlus } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { PatientForm } from "@/components/patient-form";
import { CsvUpload } from "@/components/csv-upload";
import { MockProfiles } from "@/components/mock-profiles";
import { PatientList } from "@/components/patient-list";
import type { Patient } from "@/lib/types";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/patients?mine=true");
      const data = await res.json();
      setPatients(data);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#12455a]">Patient Profiles</h1>
          <p className="mt-2 text-[#5a7d8e]">
            Add new patients, import from CSV, or load mock profiles to get started.
          </p>
        </div>

        {/* Input Tabs */}
        <Tabs defaultValue="add" className="mb-10">
          <TabsList className="mb-6 grid w-full max-w-lg grid-cols-3 bg-[#eef4f9]">
            <TabsTrigger
              value="add"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#116cb6] data-[state=active]:shadow-sm"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Patient</span>
            </TabsTrigger>
            <TabsTrigger
              value="csv"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#116cb6] data-[state=active]:shadow-sm"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import CSV</span>
            </TabsTrigger>
            <TabsTrigger
              value="mock"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#116cb6] data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Mock Profiles</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <PatientForm onSuccess={fetchPatients} />
          </TabsContent>

          <TabsContent value="csv">
            <CsvUpload onSuccess={fetchPatients} />
          </TabsContent>

          <TabsContent value="mock">
            <MockProfiles patients={patients} onRefresh={fetchPatients} />
          </TabsContent>
        </Tabs>

        {/* Patient List */}
        <PatientList patients={patients} loading={loading} />
      </div>
    </AuthGuard>
  );
}
