import { NextResponse } from "next/server";
import { z } from "zod";
import { getPatientById, updatePatient } from "@/lib/store";
import { getSession } from "@/lib/auth";

const updatePatientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().min(1).optional(),
  gender: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patient = getPatientById(id);

  if (!patient) {
    return NextResponse.json(
      { error: "Patient not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(patient);
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
  const patient = getPatientById(id);

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

    const updated = updatePatient(id, parsed.data);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 400 }
    );
  }
}
