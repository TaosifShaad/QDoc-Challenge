/**
 * Email utility for sending vaccine reminders using Resend
 */
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface ReminderEmailParams {
  to: string;
  patientName: string;
  vaccineName: string;
  dueDate: string;
  doseNumber: number;
}

function buildEmailHtml({
  patientName,
  vaccineName,
  dueDate,
  doseNumber,
}: Omit<ReminderEmailParams, "to">): string {
  const formattedDate = new Date(dueDate).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f5fa;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#116cb6,#0d4d8b);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
        <span style="font-size:28px;">💉</span>
      </div>
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Vaccination Reminder</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">QDoc Vaccine System</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:32px 24px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <p style="color:#12455a;font-size:16px;margin:0 0 20px;">
        Hello <strong>${patientName}</strong>,
      </p>
      <p style="color:#5a7d8e;font-size:14px;line-height:1.6;margin:0 0 24px;">
        This is a friendly reminder that you have an upcoming vaccination:
      </p>

      <!-- Vaccine Card -->
      <div style="background:#f8fbfe;border:1px solid #c2dcee;border-radius:12px;padding:20px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#5a7d8e;font-size:13px;width:120px;">Vaccine</td>
            <td style="padding:8px 0;color:#12455a;font-size:14px;font-weight:600;">${vaccineName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#5a7d8e;font-size:13px;">Dose</td>
            <td style="padding:8px 0;color:#12455a;font-size:14px;font-weight:600;">#${doseNumber}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#5a7d8e;font-size:13px;">Due Date</td>
            <td style="padding:8px 0;color:#116cb6;font-size:14px;font-weight:600;">${formattedDate}</td>
          </tr>
        </table>
      </div>

      <p style="color:#5a7d8e;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Please schedule an appointment with your healthcare provider to receive this vaccination.
      </p>

      <!-- CTA -->
      <div style="text-align:center;">
        <p style="background:#e1f5c6;color:#5a8a1e;border-radius:8px;padding:12px 20px;display:inline-block;font-size:13px;font-weight:600;margin:0;">
          ✅ Stay protected — stay vaccinated!
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px;color:#5a7d8e;font-size:12px;">
      <p style="margin:0;">Sent by QDoc Vaccine System</p>
      <p style="margin:4px 0 0;color:#8ba8b8;">This is an automated reminder.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendVaccineReminder(
  params: ReminderEmailParams
): Promise<{ success: boolean; message: string }> {
  const html = buildEmailHtml(params);

  if (!resend) {
    console.log("━━━ VACCINE REMINDER (no RESEND_API_KEY configured) ━━━");
    console.log(`To: ${params.to}`);
    console.log(`Patient: ${params.patientName}`);
    console.log(`Vaccine: ${params.vaccineName} (Dose #${params.doseNumber})`);
    console.log(`Due: ${params.dueDate}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return {
      success: true,
      message: "Email logged to console (no API key configured)",
    };
  }

  try {
    const { error } = await resend.emails.send({
      from: "QDoc Reminders <onboarding@resend.dev>",
      to: [params.to],
      subject: `💉 Vaccination Reminder: ${params.vaccineName} — Due ${new Date(params.dueDate).toLocaleDateString("en-CA", { month: "long", day: "numeric" })}`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, message: error.message };
    }

    return { success: true, message: "Reminder email sent successfully" };
  } catch (err: any) {
    console.error("Email send error:", err);
    return {
      success: false,
      message: err.message || "Failed to send email",
    };
  }
}
