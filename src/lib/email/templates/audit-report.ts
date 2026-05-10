import { PublicAuditSnapshot } from "@/lib/types/audit";

import { formatCurrency } from "@/lib/utils/format";

export function renderAuditEmailHtml(
  snapshot: PublicAuditSnapshot,
  aiSummary: string | null,
  slug: string,
  companyName?: string
): string {
  const auditUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/share/${slug}`;
  const companyGreeting = companyName ? ` for ${companyName}` : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AI Spend Audit${companyGreeting}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #171717;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      padding: 24px 32px;
      border-bottom: 1px solid #e5e5e5;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #171717;
    }
    .content {
      padding: 32px;
    }
    .summary-box {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .summary-box h2 {
      margin: 0 0 8px 0;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #166534;
    }
    .summary-box p {
      margin: 0;
      color: #14532d;
      font-size: 15px;
    }
    .metrics {
      display: table;
      width: 100%;
      margin-bottom: 32px;
    }
    .metric {
      display: table-cell;
      width: 33.33%;
    }
    .metric-label {
      font-size: 12px;
      color: #737373;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 600;
      color: #171717;
      margin: 0;
    }
    .metric-value.positive {
      color: #16a34a;
    }
    .button-container {
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background-color: #171717;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 14px;
    }
    .footer {
      padding: 24px 32px;
      background-color: #f9fafb;
      border-top: 1px solid #e5e5e5;
      font-size: 12px;
      color: #737373;
    }
    .footer p {
      margin: 0 0 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>StackTrim Audit Results</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Your deterministic AI spend audit is complete. We analyzed your stack of ${snapshot.toolCount} tools to identify immediate optimization opportunities.</p>
      
      ${aiSummary ? `
      <div class="summary-box">
        <h2>Consultant's Note</h2>
        <p>${aiSummary}</p>
      </div>
      ` : ''}

      <div class="metrics">
        <div class="metric">
          <div class="metric-label">Current Spend</div>
          <div class="metric-value">${formatCurrency(snapshot.totalMonthlySpend)}<span style="font-size:14px;color:#737373;">/mo</span></div>
        </div>
        <div class="metric">
          <div class="metric-label">Identified Savings</div>
          <div class="metric-value positive">${formatCurrency(snapshot.totalMonthlySavings)}<span style="font-size:14px;color:#16a34a;">/mo</span></div>
        </div>
      </div>

      <p>You can view the full line-by-line breakdown, calculation rationale, and actionable recommendations using the secure link below.</p>

      <div class="button-container">
        <a href="${auditUrl}" class="button">View Full Audit Details →</a>
      </div>

      <p>If you have any questions or would like to discuss implementing these changes, reply directly to this email to speak with our operations team.</p>
      
      <p>Best,<br>The StackTrim Team</p>
    </div>
    <div class="footer">
      <p><strong>Methodology:</strong> Savings estimates are conservative and based on public catalog pricing. Actual savings may vary.</p>
      <p><strong>AI Boundaries Disclosure:</strong> Savings calculations are completely deterministic. AI is ONLY used to generate the summary note above.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
