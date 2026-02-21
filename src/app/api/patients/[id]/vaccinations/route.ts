import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const addVaccinationSchema = z.object({
  vaccineName: z.string().min(1),
  doseNumber: z.number().int().min(1).default(1),
  dateGiven: z
    .string()
    .min(1)
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  provider: z.string().optional(),
});

export async function POST(
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
    select: { id: true, userId: true },
  });

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  if (patient.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = addVaccinationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const record = await prisma.vaccinationRecord.create({
      data: {
        patientId: id,
        vaccineName: parsed.data.vaccineName,
        doseNumber: parsed.data.doseNumber,
        dateGiven: new Date(parsed.data.dateGiven),
        provider: parsed.data.provider || null,
      },
    });

    return NextResponse.json({
      id: record.id,
      vaccineName: record.vaccineName,
      doseNumber: record.doseNumber,
      dateGiven: record.dateGiven.toISOString().slice(0, 10),
      provider: record.provider ?? undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create vaccination record" },
      { status: 500 }
    );
  }
}
