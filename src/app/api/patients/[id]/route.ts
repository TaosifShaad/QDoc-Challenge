import { NextResponse } from "next/server";
import { getPatientById } from "@/lib/store";

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
