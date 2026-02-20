import { NextResponse } from "next/server";
import { importPatients } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Expected an array of patients" },
        { status: 400 }
      );
    }

    const imported = importPatients(data);
    return NextResponse.json(
      { count: imported.length, patients: imported },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to import patients" },
      { status: 400 }
    );
  }
}
