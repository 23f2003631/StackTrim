"use client";

import { useEffect } from "react";
import type { PublicAuditSnapshot, PublicRecommendation } from "@/lib/types/audit";

interface PrintAuditViewProps {
  snapshot: PublicAuditSnapshot;
  slug: string;
  aiSummary: string | null;
  createdAt: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{rec.reasoning}</p>
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
    // Auto-trigger print dialog after layout renders
    const timer = setTimeout(() => {
      window.print();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="print-page min-h-screen bg-white text-gray-900">
      {/* Print-only styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-page { padding: 0; }
          .no-print { display: none !important; }
          @page { margin: 0.75in; size: letter; }
        }
        @media screen {
          .print-page { max-width: 800px; margin: 0 auto; padding: 2rem; }
        }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between pb-6 border-b border-gray-200 mb-8">
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

      {/* Summary Metrics */}
      <section className="grid grid-cols-3 gap-6 mb-8">
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

      {/* AI Summary */}
      {aiSummary && (
        <section className="mb-8 bg-gray-50 rounded-lg p-5 border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Executive Summary</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{aiSummary}</p>
        </section>
      )}

      {/* Actionable Recommendations */}
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

      {/* Already Optimized */}
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

      {/* Footer */}
      <footer className="pt-6 border-t border-gray-200 mt-12">
        <div className="flex justify-between items-end">
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

      {/* Back Button (screen only) */}
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
