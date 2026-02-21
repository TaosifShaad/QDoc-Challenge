import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { sendVaccineReminder } from "@/lib/email";

const sendReminderSchema = z.object({
  to: z.string().email("Valid email is required"),
  patientName: z.string().min(1),
  vaccineName: z.string().min(1),
  dueDate: z.string().min(1),
  doseNumber: z.coerce.number().min(1),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = sendReminderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message, success: false },
        { status: 400 }
      );
    }

    const result = await sendVaccineReminder(parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message || "Failed to send reminder",
        success: false,
      },
      { status: 500 }
    );
  }
}
