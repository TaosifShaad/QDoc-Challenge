"use client";

import { toast } from "sonner";
import { UserPlus, Calendar, Heart, AlertTriangle, Syringe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MOCK_PATIENTS } from "@/lib/mock-data";
import type { Patient } from "@/lib/types";
import { motion } from "framer-motion";

interface MockProfilesProps {
  patients: Patient[];
  onRefresh: () => void;
}

export function MockProfiles({ patients, onRefresh }: MockProfilesProps) {
  const loadProfile = async (profile: Patient) => {
    // Check if already loaded
    const alreadyExists = patients.some(
      (p) =>
        p.firstName === profile.firstName &&
        p.lastName === profile.lastName &&
        p.dateOfBirth === profile.dateOfBirth
    );

    if (alreadyExists) {
      toast.info(`${profile.firstName} ${profile.lastName} is already loaded.`);
      return;
    }

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          chronicConditions: profile.chronicConditions,
          riskFactors: profile.riskFactors,
          vaccinations: profile.vaccinations,
        }),
      });

      if (!res.ok) throw new Error("Failed to load profile");

      toast.success(`Loaded ${profile.firstName} ${profile.lastName}`, {
        description: "Patient profile has been added to the system.",
      });
      onRefresh();
    } catch (error) {
      toast.error("Failed to load profile");
    }
  };

  const calculateAge = (dob: string): number => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#5a7d8e]">
        Click on a profile card to load it into the system. These are
        pre-configured sample patients with diverse medical backgrounds.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_PATIENTS.map((profile, index) => {
          const isLoaded = patients.some(
            (p) =>
              p.firstName === profile.firstName &&
              p.lastName === profile.lastName &&
              p.dateOfBirth === profile.dateOfBirth
          );
          const age = calculateAge(profile.dateOfBirth);

          return (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Card
                className={`qdoc-card border-none transition-all duration-200 ${isLoaded ? "opacity-60" : "cursor-pointer"
                  }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base text-[#12455a]">
                        {profile.firstName} {profile.lastName}
                      </CardTitle>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[#5a7d8e]">
                        <Calendar className="h-3 w-3" />
                        <span>Age {age}</span>
                        <span>•</span>
                        <span>{profile.gender}</span>
                      </div>
                    </div>
                    {isLoaded ? (
                      <Badge className="bg-[#e1f5c6] text-[#5a8a1e] border-none text-xs">
                        Loaded
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => loadProfile(profile)}
                        className="bg-[#116cb6] text-white hover:bg-[#0d4d8b]"
                      >
                        <UserPlus className="mr-1 h-3 w-3" />
                        Load
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Conditions */}
                  {profile.chronicConditions.length > 0 && (
                    <div>
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#12455a]">
                        <Heart className="h-3 w-3 text-[#d64545]" />
                        Conditions
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {profile.chronicConditions.map((c) => (
                          <Badge
                            key={c}
                            variant="outline"
                            className="border-[#e57d7d] bg-[#fde8e8] text-[#d64545] text-xs"
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {profile.riskFactors.length > 0 && (
                    <div>
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#12455a]">
                        <AlertTriangle className="h-3 w-3 text-[#f2c14e]" />
                        Risk Factors
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {profile.riskFactors.map((f) => (
                          <Badge
                            key={f}
                            variant="outline"
                            className="border-[#f8d586] bg-[#fef9e7] text-[#b8930e] text-xs"
                          >
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator className="bg-[#eef4f9]" />

                  {/* Vaccines */}
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#12455a]">
                      <Syringe className="h-3 w-3 text-[#116cb6]" />
                      Vaccinations ({profile.vaccinations.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {profile.vaccinations.slice(0, 3).map((v) => (
                        <Badge
                          key={v.id}
                          variant="outline"
                          className="border-[#c2dcee] text-[#116cb6] text-xs"
                        >
                          {v.vaccineName.split("(")[0].trim()}
                        </Badge>
                      ))}
                      {profile.vaccinations.length > 3 && (
                        <Badge
                          variant="outline"
                          className="border-[#c2dcee] text-[#5a7d8e] text-xs"
                        >
                          +{profile.vaccinations.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
