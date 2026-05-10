import { createAdminClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/admin/metric-card";
import { Activity, BarChart3, Database, Users, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { flags } from "@/lib/config/flags";
import { notFound } from "next/navigation";

export const revalidate = 0; // Don't cache the admin dashboard

export default async function InsightsDashboard() {
  if (!flags.enableInternalDashboard) {
    notFound();
  }

  const supabase = createAdminClient();

  // Fetch Aggregate Data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: auditCount } = await (supabase.from("audits") as any).select("*", { count: "exact", head: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: leadCount } = await (supabase.from("leads") as any).select("*", { count: "exact", head: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: audits } = await (supabase.from("audits") as any).select("total_annual_savings");

  const totalSavingsIdentified = audits?.reduce(
    (acc: number, curr: { total_annual_savings: number | null }) => acc + (curr.total_annual_savings || 0),
    0
  ) || 0;

  const leadConversionRate = auditCount && auditCount > 0 
    ? ((leadCount || 0) / auditCount * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" />
            StackTrim Operational Insights
          </h1>
          <p className="text-slate-500 mt-2">Internal telemetry and aggregate platform performance.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <MetricCard
            title="Total Audits Processed"
            value={auditCount || 0}
            icon={<Database className="w-5 h-5" />}
          />
          <MetricCard
            title="Total Identified Savings"
            value={formatCurrency(totalSavingsIdentified)}
            subtitle="Annualized across all audits"
            icon={<TrendingDown className="w-5 h-5" />}
          />
          <MetricCard
            title="Total Leads Captured"
            value={leadCount || 0}
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Lead Conversion Rate"
            value={`${leadConversionRate}%`}
            subtitle="Audits to leads"
            icon={<BarChart3 className="w-5 h-5" />}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-medium text-slate-900">System Health</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Deterministic Engine: Operational
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 mt-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              AI Summary Queue: Operational
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 mt-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Email Dispatch: Operational
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
