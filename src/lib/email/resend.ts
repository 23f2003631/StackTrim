import { Resend } from "resend";
import { PublicAuditSnapshot } from "@/lib/types/audit";
import { renderAuditEmailHtml } from "./templates/audit-report";
import { logger } from "@/lib/observability/logger";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

interface EmailResult {
  success: boolean;
  id?: string;
  mocked?: boolean;
  error?: string;
}

export async function sendAuditReportEmail(
  email: string,
  slug: string,
  snapshot: PublicAuditSnapshot,
  aiSummary: string | null,
  companyName?: string
): Promise<EmailResult> {
  const auditUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/share/${slug}`;
  const companyGreeting = companyName ? `for ${companyName}` : "";
  const subject = `Your AI Spend Audit ${companyGreeting}`.trim();

  if (!process.env.RESEND_API_KEY) {
    logger.info("Mock email dispatch", { to: email, subject, link: auditUrl });
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
      logger.error("Email delivery failed", { error: error.message });
      return { success: false, error: error.message };
    }

    logger.metric("Email delivered", { to: email, id: data?.id });
    return { success: true, id: data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Email delivery fatal error", { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}
