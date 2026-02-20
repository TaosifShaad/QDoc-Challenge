import { NextResponse } from "next/server";
import { getAllPatients, getPatientsByUserId, createPatient } from "@/lib/store";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine");

  if (mine === "true") {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const patients = getPatientsByUserId(session.userId);
    return NextResponse.json(patients);
  }

  const patients = getAllPatients();
  return NextResponse.json(patients);
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const data = await request.json();

    // Attach userId if logged in
    if (session) {
      data.userId = session.userId;
    }

    const patient = createPatient(data);
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 400 }
    );
  }
}
