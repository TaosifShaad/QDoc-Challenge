import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updatePatientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().min(1).optional(),
  gender: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
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


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: { vaccinations: true },
  });

  if (!patient) {
    return NextResponse.json(
      { error: "Patient not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(toPatientDto(patient));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: { vaccinations: true },
  });

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  if (patient.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updatePatientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        ...(parsed.data.firstName !== undefined
          ? { firstName: parsed.data.firstName }
          : {}),
        ...(parsed.data.lastName !== undefined
          ? { lastName: parsed.data.lastName }
          : {}),
        ...(parsed.data.dateOfBirth !== undefined
          ? { dateOfBirth: new Date(parsed.data.dateOfBirth) }
          : {}),
        ...(parsed.data.gender !== undefined ? { gender: parsed.data.gender } : {}),
        ...(parsed.data.email !== undefined ? { email: parsed.data.email || null } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone || null } : {}),
        ...(parsed.data.address !== undefined
          ? { address: parsed.data.address || null }
          : {}),
      },
      include: { vaccinations: true },
    });

    return NextResponse.json(toPatientDto(updated));
  } catch {
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 400 }
    );
  }
}
