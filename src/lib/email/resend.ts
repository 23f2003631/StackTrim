import { Resend } from "resend";
import { PublicAuditSnapshot } from "@/lib/types/audit";
import { renderAuditEmailHtml } from "./templates/audit-report";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export async function sendAuditReportEmail(
  email: string, 
  slug: string, 
  snapshot: PublicAuditSnapshot,
  aiSummary: string | null,
  companyName?: string
) {
  const auditUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/share/${slug}`;
  const companyGreeting = companyName ? `for ${companyName}` : "";
  const subject = `Your AI Spend Audit ${companyGreeting}`.trim();

  // If we don't have a real API key, mock the email sending for local development
  if (!process.env.RESEND_API_KEY) {
    console.log("=========================================");
    console.log("Mock Email Dispatch:");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Link: ${auditUrl}`);
    console.log("=========================================");
    return { success: true, mocked: true };
  }

  try {
    const html = renderAuditEmailHtml(snapshot, aiSummary, slug, companyName);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "StackTrim <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
      text: `
Hello,

Here is the link to your StackTrim AI spend audit report:
${auditUrl}

This report contains a deterministic breakdown of your current AI subscriptions and identifies immediate opportunities to rightsize your stack.

If you have any questions or want to discuss implementing these changes, feel free to reply directly to this email.

Best,
The StackTrim Team
      `.trim(),
    });

    if (error) {
      console.error("[Email Delivery Failed] Resend API returned an error:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Email Delivery Success] Audit report sent to ${email} (ID: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (error: any) {
    // Catch-all for network issues, timeouts, or unexpected crashes
    console.error("[Email Delivery Fatal] Unexpected error dispatching email:", error);
    // Return false instead of throwing to protect the upstream lead capture route
    return { success: false, error: error.message || "Unknown error" };
  }
}
