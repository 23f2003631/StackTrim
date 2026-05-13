"use client";

import { useEffect } from "react";
import type { PublicAuditSnapshot, PublicRecommendation } from "@/lib/types/audit";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface PrintAuditViewProps {
  snapshot: PublicAuditSnapshot;
  slug: string;
  aiSummary: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  downgrade: "Downgrade",
  consolidate: "Consolidate",
  credit: "Credit Opportunity",
  eliminate: "Eliminate",
  rightsize: "Rightsize",
  keep: "Optimized",
  "switch-vendor": "Switch Vendor",
  "review-api-usage": "Review API",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Explore",
};

function PrintRecommendation({ rec, index }: { rec: PublicRecommendation; index: number }) {
  return (
    <div className="print-rec border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">
              {index + 1}. {rec.toolName}
            </span>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {TYPE_LABELS[rec.type] || rec.type}
            </span>
            <span className="text-xs text-gray-400">
              {CONFIDENCE_LABELS[rec.confidence]} confidence
            </span>
            {rec.customContractLikely && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                Custom pricing
              </span>
            )}
            {rec.contextualNote && (
              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 bg-gray-50 px-1 py-0.5 rounded border border-gray-100">
                {rec.contextualNote}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">{rec.reasoning}</p>
          
          {rec.reasoningDetails?.detectedSignals && (
            <div className="flex flex-wrap gap-2 mb-1">
              {rec.reasoningDetails.detectedSignals.map((signal, i) => (
                <span key={i} className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 italic">
                  • {signal}
                </span>
              ))}
            </div>
          )}
        </div>
        {rec.monthlySavings > 0 && (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-emerald-700">
              {formatCurrency(rec.monthlySavings)}
              <span className="text-sm font-normal text-gray-500">/mo</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PrintAuditView({ snapshot, slug, aiSummary, createdAt }: PrintAuditViewProps) {
  const actionableRecs = snapshot.recommendations.filter((r) => r.monthlySavings > 0);
  const keepRecs = snapshot.recommendations.filter((r) => r.type === "keep");
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://stacktrim.dev";

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="print-page min-h-screen bg-white text-gray-900">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-900">
            <span className="text-xs font-bold text-white">ST</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">StackTrim</h1>
            <p className="text-xs text-gray-500">AI Spend Audit Report</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>Generated {formatDate(createdAt)}</p>
          <p>Catalog v{snapshot.catalogVersion} · Engine v{snapshot.engineVersion}</p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-emerald-50 rounded-lg p-5 border border-emerald-200">
          <p className="text-xs font-medium text-emerald-700 mb-1">Monthly Savings</p>
          <p className="text-3xl font-bold text-emerald-900 tracking-tight">
            {formatCurrency(snapshot.totalMonthlySavings)}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-5 border border-emerald-200">
          <p className="text-xs font-medium text-emerald-700 mb-1">Annual Savings</p>
          <p className="text-3xl font-bold text-emerald-900 tracking-tight">
            {formatCurrency(snapshot.totalAnnualSavings)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-1">Current Monthly Spend</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {formatCurrency(snapshot.totalMonthlySpend)}
          </p>
          {snapshot.savingsPercentage > 0 && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              {snapshot.savingsPercentage}% savings identified
            </p>
          )}
        </div>
      </section>

      {aiSummary && (
        <section className="mb-8 bg-gray-50/50 rounded-lg p-5 border border-gray-200">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Executive Summary</h2>
          <p className="text-sm text-gray-700 leading-relaxed italic border-l-2 border-gray-200 pl-4">
            &quot;{aiSummary}&quot;
          </p>
        </section>
      )}

      <section className="mb-12 page-break-after">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Audit Methodology & Trust Modeling</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-1">Deterministic Optimization</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Savings calculations are derived strictly from public catalog data (v{snapshot.catalogVersion}). No AI is used for financial computation. Analysis is bounded by actual user-entered spend to account for custom enterprise contracts.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-1">Savings Realism Level: <span className="uppercase text-emerald-700">{snapshot.metadata.savingsRealismLevel}</span></h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                This audit assumes a <strong>{snapshot.metadata.savingsRealismLevel}</strong> approach to cost reduction. Conservative seat rightsizing (60-80% of excess) is applied to maintain organizational operational buffer.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-1">Confidence Scoring</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Confidence levels are degraded based on pricing consistency (mismatch severity: {snapshot.metadata.maxMismatchSeverity}) and organizational complexity assumptions. High confidence indicates reliable public pricing and simple migration paths.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-1">Operational Philosophy</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                StackTrim prioritizes <strong>believability</strong> over maximum theoretical savings. Recommendations account for migration friction, feature redundancy, and seat-utilization inertia typical of growing engineering teams.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-amber-50/50 border border-amber-100 rounded text-[10px] text-amber-800 leading-relaxed">
          <strong>Enterprise Pricing Disclaimer:</strong> Identified deviations suggest potential custom contract terms. Recommendations should be validated against actual contract addendums, as negotiated volume discounts or legacy credits may impact final savings realization.
        </div>
      </section>

      {actionableRecs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Savings Opportunities ({actionableRecs.length})
          </h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-100 px-5">
              {actionableRecs.map((rec, i) => (
                <PrintRecommendation key={i} rec={rec} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {keepRecs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Already Optimized ({keepRecs.length})
          </h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-100 px-5">
              {keepRecs.map((rec, i) => (
                <PrintRecommendation key={i} rec={rec} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="pt-6 border-t border-gray-200 mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="text-xs text-gray-400 space-y-1">
            <p>
              <strong>Methodology:</strong> All recommendations based on publicly available pricing data.
              Savings estimates are conservative. AI is only used for narrative summarization.
            </p>
            <p>
              Report link: {siteUrl}/share/{slug}
            </p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p className="font-medium">StackTrim</p>
            <p>stacktrim.dev</p>
          </div>
        </div>
      </footer>

      <div className="no-print mt-8 flex justify-center gap-4">
        <a
          href={`/share/${slug}`}
          className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2"
        >
          ← Back to audit
        </a>
        <button
          onClick={() => window.print()}
          className="text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
