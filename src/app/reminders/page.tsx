"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Syringe,
  Loader2,
  Mail,
  CalendarClock,
} from "lucide-react";
import type { Patient } from "@/lib/types";
import {
  getRecommendations,
  type VaccineRecommendation,
} from "@/lib/vaccine-data";
import { motion } from "framer-motion";

interface ReminderItem {
  patientId: string;
  patientName: string;
  patientEmail: string;
  vaccineName: string;
  dueDate: string;
  doseNumber: number;
  daysUntil: number;
  status: "overdue" | "needed" | "upcoming";
}

export default function RemindersPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const markVaccineComplete = async (item: ReminderItem) => {
    const rid = getReminderId(item);
    setMarkingComplete((prev) => new Set(prev).add(rid));
    try {
      const res = await fetch(`/api/patients/${item.patientId}/vaccinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaccineName: item.vaccineName,
          doseNumber: item.doseNumber,
          dateGiven: new Date().toISOString().slice(0, 10),
        }),
      });
      if (res.ok) {
        await refetchPatients();
      }
    } catch (err) {
      console.error("Failed to mark vaccine:", err);
    } finally {
      setMarkingComplete((prev) => {
        const next = new Set(prev);
        next.delete(rid);
        return next;
      });
    }
  };


  // Build reminder items from all patients
  const reminderItems: ReminderItem[] = patients.flatMap((patient) => {
    const recs = getRecommendations({
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      chronicConditions: patient.chronicConditions || [],
      riskFactors: patient.riskFactors || [],
      vaccinations: patient.vaccinations || [],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return recs
      .filter(
        (r) =>
          r.nextDueDate &&
          r.remainingDoses > 0 &&
          r.status !== "completed"
      )
      .map((rec) => {
        const due = new Date(rec.nextDueDate!);
        due.setHours(0, 0, 0, 0);
        const daysUntil = Math.round(
          (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          patientId: patient.id || "",
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientEmail: patient.email || "",
          vaccineName: rec.vaccine.displayNames[0],
          dueDate: rec.nextDueDate!,
          doseNumber: rec.completedDoses + 1,
          daysUntil,
          status: rec.status as "overdue" | "needed" | "upcoming",
        };
      });
  });

  // Sort: overdue first, then by days until due
  const sortedReminders = [...reminderItems].sort((a, b) => {
    if (a.status === "overdue" && b.status !== "overdue") return -1;
    if (b.status === "overdue" && a.status !== "overdue") return 1;
    return a.daysUntil - b.daysUntil;
  });

  // Filter for within 10 days or overdue
  const urgentReminders = sortedReminders.filter(
    (r) => r.daysUntil <= 10
  );
  const laterReminders = sortedReminders.filter(
    (r) => r.daysUntil > 10
  );

  const getReminderId = (r: ReminderItem) =>
    `${r.patientId}-${r.vaccineName}-${r.dueDate}`;

  const sendReminder = async (item: ReminderItem) => {
    const rid = getReminderId(item);
    if (!item.patientEmail) {
      setErrors((prev) => ({
        ...prev,
        [rid]: "No email address on file for this patient",
      }));
      return;
    }

    setSendingIds((prev) => new Set(prev).add(rid));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[rid];
      return next;
    });

    try {
      const res = await fetch("/api/reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: item.patientEmail,
          patientName: item.patientName,
          vaccineName: item.vaccineName,
          dueDate: item.dueDate,
          doseNumber: item.doseNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send");
      }

      setSentIds((prev) => new Set(prev).add(rid));
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        [rid]: err.message || "Failed to send reminder",
      }));
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(rid);
        return next;
      });
    }
  };

  const sendAllUrgent = async () => {
    setSendingAll(true);
    const toSend = urgentReminders.filter(
      (r) => r.patientEmail && !sentIds.has(getReminderId(r))
    );
    for (const item of toSend) {
      await sendReminder(item);
    }
    setSendingAll(false);
  };

  const getDaysLabel = (days: number) => {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `In ${days} days`;
  };

  const getDaysColor = (days: number) => {
    if (days < 0) return "text-[#d64545]";
    if (days <= 3) return "text-[#d64545]";
    if (days <= 7) return "text-[#b8930e]";
    return "text-[#116cb6]";
  };

  const renderReminderCard = (item: ReminderItem, index: number) => {
    const rid = getReminderId(item);
    const isSending = sendingIds.has(rid);
    const isSent = sentIds.has(rid);
    const error = errors[rid];

    return (
      <motion.div
        key={rid}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
      >
        <div
          className={`rounded-xl border p-4 ${item.daysUntil < 0
            ? "border-[#e57d7d] bg-[#fef5f5]"
            : item.daysUntil <= 3
              ? "border-[#f8d586] bg-[#fffcf5]"
              : "border-[#c2dcee] bg-[#f8fbfe]"
            }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Syringe className="h-4 w-4 text-[#5a7d8e] shrink-0" />
                <span className="font-semibold text-sm text-[#12455a] truncate">
                  {item.vaccineName}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${item.daysUntil < 0
                    ? "border-[#e57d7d] bg-[#fde8e8] text-[#d64545]"
                    : "border-[#f8d586] bg-[#fef9e7] text-[#b8930e]"
                    }`}
                >
                  {item.daysUntil < 0 ? "Overdue" : "Due Soon"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#5a7d8e]">
                <span>{item.patientName}</span>
                <span>Dose #{item.doseNumber}</span>
                <span className={`font-semibold ${getDaysColor(item.daysUntil)}`}>
                  {getDaysLabel(item.daysUntil)}
                </span>
              </div>
              {item.patientEmail && (
                <div className="flex items-center gap-1 mt-1 text-xs text-[#8ba8b8]">
                  <Mail className="h-3 w-3" />
                  {item.patientEmail}
                </div>
              )}
              {error && (
                <p className="mt-1 text-xs text-[#d64545]">{error}</p>
              )}
            </div>

            <div className="shrink-0 flex gap-2">
              <Button
                size="sm"
                onClick={() => markVaccineComplete(item)}
                disabled={markingComplete.has(rid)}
                variant="outline"
                className="border-[#c2e8a0] text-[#5a8a1e] hover:bg-[#e1f5c6]"
              >
                {markingComplete.has(rid) ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                )}
                Done
              </Button>
              {isSent ? (
                <Button
                  size="sm"
                  disabled
                  className="bg-[#e1f5c6] text-[#5a8a1e] border-[#c2e8a0]"
                  variant="outline"
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Sent
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => sendReminder(item)}
                  disabled={isSending || !item.patientEmail}
                  className="bg-[#116cb6] text-white hover:bg-[#0d4d8b]"
                >
                  {isSending ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="mr-1 h-3.5 w-3.5" />
                  )}
                  Send
                </Button>
              )}
            </div>

          </div>
        </div>
      </motion.div>
    );
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
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fde8e8]">
                  <Bell className="h-5 w-5 text-[#d64545]" />
                </div>
                <h1 className="text-3xl font-bold text-[#12455a]">
                  Smart Reminders
                </h1>
              </div>
              <p className="text-[#5a7d8e]">
                Automated alerts for upcoming and overdue vaccinations. Send
                email reminders to patients.
              </p>
            </div>
            {urgentReminders.length > 0 && (
              <Button
                onClick={sendAllUrgent}
                disabled={sendingAll}
                className="bg-[#116cb6] text-white hover:bg-[#0d4d8b]"
              >
                {sendingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send All Urgent
              </Button>
            )}
          </div>
        </motion.div>

        {loading ? (
          <Card className="qdoc-card border-none">
            <CardContent className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#116cb6]" />
                <p className="text-sm text-[#5a7d8e]">
                  Checking for reminders...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : sortedReminders.length === 0 ? (
          <Card className="qdoc-card border-none">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e1f5c6]">
                <CheckCircle2 className="h-8 w-8 text-[#5a8a1e]" />
              </div>
              <h3 className="text-lg font-semibold text-[#12455a]">
                All caught up!
              </h3>
              <p className="mt-1 text-sm text-[#5a7d8e]">
                No upcoming vaccination reminders at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-3 gap-4"
            >
              <Card className="qdoc-card border-none">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fde8e8]">
                    <AlertTriangle className="h-5 w-5 text-[#d64545]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#12455a]">
                      {urgentReminders.filter((r) => r.daysUntil < 0).length}
                    </p>
                    <p className="text-xs text-[#5a7d8e]">Overdue</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="qdoc-card border-none">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fef9e7]">
                    <CalendarClock className="h-5 w-5 text-[#f2c14e]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#12455a]">
                      {urgentReminders.filter((r) => r.daysUntil >= 0).length}
                    </p>
                    <p className="text-xs text-[#5a7d8e]">Within 10 Days</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="qdoc-card border-none">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d6e6f2]">
                    <Clock className="h-5 w-5 text-[#116cb6]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#12455a]">
                      {laterReminders.length}
                    </p>
                    <p className="text-xs text-[#5a7d8e]">Later</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Urgent Reminders */}
            {urgentReminders.length > 0 && (
              <Card className="qdoc-card border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#12455a]">
                    <AlertTriangle className="h-5 w-5 text-[#f2c14e]" />
                    Urgent — Within 10 Days ({urgentReminders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {urgentReminders.map((item, i) =>
                    renderReminderCard(item, i)
                  )}
                </CardContent>
              </Card>
            )}

            {/* Later Reminders */}
            {laterReminders.length > 0 && (
              <Card className="qdoc-card border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#12455a]">
                    <Clock className="h-5 w-5 text-[#116cb6]" />
                    Coming Up Later ({laterReminders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {laterReminders.map((item, i) =>
                    renderReminderCard(item, i)
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
