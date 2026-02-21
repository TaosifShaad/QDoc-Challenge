"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import type { Patient } from "@/lib/types";

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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
  });

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

  useEffect(() => {
    if (patients.length === 0) return;

    const patient = patients[0];
    setForm({
      firstName: patient.firstName || user?.firstName || "",
      lastName: patient.lastName || user?.lastName || "",
      dateOfBirth:
        (patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : "") ||
        (user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : ""),
      gender: patient.gender ?? "",
      email: patient.email || user?.email || "",
      phone: patient.phone ?? "",
      address: patient.address ?? "",
    });
  }, [patients, user]);

  const savePatientProfile = async () => {
    const patient = patients[0];
    if (!patient?.id) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setPatients((prev) => {
        if (prev.length === 0) return prev;
        return [data, ...prev.slice(1)];
      });
      setMessage("Patient profile updated successfully.");
    } catch (e: any) {
      setError(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#12455a]">Patient Profile</h1>
          <p className="mt-2 text-[#5a7d8e]">
            User info and patient table info are shown below. Update empty patient fields as needed.
          </p>
        </div>

        <Card className="qdoc-card mb-6 border-none">
          <CardHeader>
            <CardTitle className="text-[#12455a]">User Information</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="grid gap-4 text-sm text-[#12455a] sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[#5a7d8e]">First Name</p>
                  <p className="font-medium">{user.firstName}</p>
                </div>
                <div>
                  <p className="text-[#5a7d8e]">Last Name</p>
                  <p className="font-medium">{user.lastName}</p>
                </div>
                <div>
                  <p className="text-[#5a7d8e]">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-[#5a7d8e]">Date of Birth</p>
                  <p className="font-medium">
                    {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#5a7d8e]">Unable to load user information.</p>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <Card className="qdoc-card border-none">
            <CardContent className="flex items-center justify-center py-10 text-[#5a7d8e]">
              Loading patient profile...
            </CardContent>
          </Card>
        ) : patients.length === 0 ? (
          <Card className="qdoc-card border-none">
            <CardContent className="py-10 text-center text-[#5a7d8e]">
              No patient-table profile found for this account.
            </CardContent>
          </Card>
        ) : (
          <Card className="qdoc-card border-none">
            <CardHeader>
              <CardTitle className="text-[#12455a]">Edit Patient Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <div className="rounded-md bg-[#e1f5c6] px-3 py-2 text-sm text-[#5a8a1e]">
                  {message}
                </div>
              )}
              {error && (
                <div className="rounded-md bg-[#fde8e8] px-3 py-2 text-sm text-[#d64545]">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-[#12455a]">First Name</Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#12455a]">Last Name</Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#12455a]">Date of Birth</Label>
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#12455a]">Gender</Label>
                  <Input
                    value={form.gender}
                    onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#12455a]">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#12455a]">Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[#12455a]">Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={savePatientProfile}
                disabled={saving}
                className="bg-[#116cb6] text-white hover:bg-[#0d4d8b]"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
}
