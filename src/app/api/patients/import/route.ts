import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const importPatientSchema = z.object({
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
  chronicConditions: z.array(z.string()).default([]),
  riskFactors: z.array(z.string()).default([]),
  vaccinations: z
    .array(
      z.object({
        vaccineName: z.string().min(1),
        doseNumber: z.number().int().positive(),
        dateGiven: z
          .string()
          .min(1)
          .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid vaccination date"),
        provider: z.string().optional().or(z.literal("")),
      })
    )
    .default([]),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Expected an array of patients" },
        { status: 400 }
      );
    }

    const parsed = z.array(importPatientSchema).safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const createdPatients = await prisma.$transaction(
      parsed.data.map((p) =>
        prisma.patient.create({
          data: {
            user: { connect: { id: session.userId } },
            firstName: p.firstName,
            lastName: p.lastName,
            dateOfBirth: new Date(p.dateOfBirth),
            gender: p.gender,
            email: p.email || null,
            phone: p.phone || null,
            address: p.address || null,
            chronicConditions: p.chronicConditions,
            riskFactors: p.riskFactors,
            vaccinations: {
              create: p.vaccinations.map((v) => ({
                vaccineName: v.vaccineName,
                doseNumber: v.doseNumber,
                dateGiven: new Date(v.dateGiven),
                provider: v.provider || null,
              })),
            },
          },
          include: { vaccinations: true },
        })
      )
    );

    return NextResponse.json(
      { count: createdPatients.length },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to import patients" },
      { status: 500 }
    );
  }
}
