import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const alt = "StackTrim Audit Result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("audits") as any)
    .select("public_snapshot")
    .eq("slug", slug)
    .single();

  const snapshot = data?.public_snapshot as {
    totalAnnualSavings: number;
    totalMonthlySavings: number;
    savingsPercentage: number;
    toolCount?: number;
    toolNames?: string[];
    catalogVersion: string;
  } | null;

  // Fallback for missing data
  const annualSavings = snapshot?.totalAnnualSavings ?? 0;
  const savingsPercentage = snapshot?.savingsPercentage ?? 0;
  const toolCount = snapshot?.toolCount ?? snapshot?.toolNames?.length ?? 0;
  const catalogVersion = snapshot?.catalogVersion ?? "2026.05";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          background: "linear-gradient(145deg, #0a0a0a 0%, #171717 50%, #0f1f15 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#fafafa",
        }}
      >
        {/* Top: Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "#fafafa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 800,
              color: "#0a0a0a",
            }}
          >
            ST
          </div>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#a1a1aa",
            }}
          >
            StackTrim
          </span>
        </div>

        {/* Center: Hero Number */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: 500,
              color: "#6ee7b7",
              letterSpacing: "0.05em",
              textTransform: "uppercase" as const,
            }}
          >
            Annual Savings Identified
          </span>
          <span
            style={{
              fontSize: annualSavings > 99999 ? "88px" : "96px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: "#ecfdf5",
            }}
          >
            {formatCurrency(annualSavings)}
          </span>
          <span
            style={{
              fontSize: "22px",
              fontWeight: 400,
              color: "#71717a",
              marginTop: "4px",
            }}
          >
            {savingsPercentage}% optimization across {toolCount} tool{toolCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Bottom: Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              color: "#52525b",
              fontWeight: 400,
            }}
          >
            Deterministic AI spend audit · Catalog v{catalogVersion}
          </span>
          <span
            style={{
              fontSize: "16px",
              color: "#52525b",
              fontWeight: 400,
            }}
          >
            stacktrim.dev
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
