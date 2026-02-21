import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const vaccinationSchema = z.object({
  vaccineName: z.string().min(1),
  doseNumber: z.number().int().positive(),
  dateGiven: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid vaccination date"),
  provider: z.string().optional().or(z.literal("")),
});

const createPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date of birth"),
  gender: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  personalHealthNumber: z.string().optional().or(z.literal("")),
  recipientRelationship: z.string().optional().or(z.literal("")),
  streetAddress: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  province: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  chronicConditions: z.array(z.string()).default([]),
  riskFactors: z.array(z.string()).default([]),
  vaccinations: z.array(vaccinationSchema).default([]),
});


type PatientWithVaccinations = Prisma.PatientGetPayload<{
  include: { vaccinations: true };
}>;

function toPatientDto(patient: PatientWithVaccinations) {
  return {
    id: patient.id,
    userId: patient.userId ?? undefined,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth.toISOString().slice(0, 10),
    gender: patient.gender,
    email: patient.email ?? undefined,
    phone: patient.phone ?? undefined,
    address: patient.address ?? undefined,
    personalHealthNumber: (patient as any).personalHealthNumber ?? undefined,
    recipientRelationship: (patient as any).recipientRelationship ?? undefined,
    streetAddress: (patient as any).streetAddress ?? undefined,
    city: (patient as any).city ?? undefined,
    province: (patient as any).province ?? undefined,
    postalCode: (patient as any).postalCode ?? undefined,
    chronicConditions: patient.chronicConditions,
    riskFactors: patient.riskFactors,
    vaccinations: patient.vaccinations.map((v) => ({
      id: v.id,
      vaccineName: v.vaccineName,
      doseNumber: v.doseNumber,
      dateGiven: v.dateGiven.toISOString().slice(0, 10),
      provider: v.provider ?? undefined,
    })),
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
  };
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine");

  try {
    if (mine === "true") {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const patients = await prisma.patient.findMany({
        where: { userId: session.userId },
        include: { vaccinations: true },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(patients.map(toPatientDto));
    }

    const patients = await prisma.patient.findMany({
      include: { vaccinations: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(patients.map(toPatientDto));
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPatientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        user: { connect: { id: session.userId } },
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        dateOfBirth: new Date(parsed.data.dateOfBirth),
        gender: parsed.data.gender,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        personalHealthNumber: parsed.data.personalHealthNumber || null,
        recipientRelationship: parsed.data.recipientRelationship || null,
        streetAddress: parsed.data.streetAddress || null,
        city: parsed.data.city || null,
        province: parsed.data.province || null,
        postalCode: parsed.data.postalCode || null,
        chronicConditions: parsed.data.chronicConditions,
        riskFactors: parsed.data.riskFactors,
        vaccinations: {
          create: parsed.data.vaccinations.map((v) => ({
            vaccineName: v.vaccineName,
            doseNumber: v.doseNumber,
            dateGiven: new Date(v.dateGiven),
            provider: v.provider || null,
          })),
        },
      },

      include: { vaccinations: true },
    });

    return NextResponse.json(toPatientDto(patient), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}
