"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, TrendingDown, DollarSign, Lightbulb, Shield, CheckCircle2, Bot, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { PublicAuditSnapshot, PublicRecommendation } from "@/lib/types/audit";
import { LeadCaptureForm } from "./lead-capture-form";

interface AuditResultsProps {
  result: PublicAuditSnapshot;
  slug?: string;
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

const TYPE_COLORS: Record<string, string> = {
  downgrade: "bg-amber-50 text-amber-700 border-amber-200",
  consolidate: "bg-blue-50 text-blue-700 border-blue-200",
  credit: "bg-purple-50 text-purple-700 border-purple-200",
  eliminate: "bg-red-50 text-red-700 border-red-200",
  rightsize: "bg-emerald-50 text-emerald-700 border-emerald-200",
  keep: "bg-slate-50 text-slate-600 border-slate-200",
  "switch-vendor": "bg-orange-50 text-orange-700 border-orange-200",
  "review-api-usage": "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Explore",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-emerald-600",
  medium: "text-amber-600",
  low: "text-slate-500",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function RecommendationCard({ rec }: { rec: PublicRecommendation }) {
  const isKeep = rec.type === "keep";
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${isKeep ? "opacity-75" : ""}`}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {isKeep && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              <h3 className="text-base font-semibold">{rec.toolName}</h3>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[rec.type] || ""}`}
              >
                {TYPE_LABELS[rec.type] || rec.type}
              </span>
              <Badge
                variant="outline"
                className={`text-xs ${CONFIDENCE_COLORS[rec.confidence] || ""}`}
              >
                {CONFIDENCE_LABELS[rec.confidence]}
              </Badge>
            </div>
            
            <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl line-clamp-2">
              {rec.reasoning}
            </p>

            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-medium text-primary flex items-center gap-1 hover:underline"
            >
              {isExpanded ? "Hide rationale" : "Why this recommendation?"}
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {isExpanded && (
              <div className="mt-3 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-border/50 animate-in fade-in slide-in-from-top-1">
                <strong>Pricing Verification:</strong> This is a deterministic recommendation based on public pricing. 
                <br className="mb-2" />
                {rec.reasoning}
              </div>
            )}
          </div>
          {rec.monthlySavings > 0 && (
            <div className="sm:text-right shrink-0 bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium mb-0.5">Potential Savings</p>
              <p className="text-2xl font-bold text-emerald-700 tracking-tight">
                {formatCurrency(rec.monthlySavings)}
                <span className="text-sm font-medium text-emerald-600/70 ml-1">/mo</span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AuditResults({ result, slug }: AuditResultsProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(result.metadata?.aiSummary || null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(!result.metadata?.aiSummary);

  const referenceId = slug || result.id;

  useEffect(() => {
    if (result.metadata?.aiSummary) return;
    if (!referenceId) return;
    
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/audit/${referenceId}/summary`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setAiSummary(data.summary);
        }
      } catch (err) {
        console.error("Failed to load AI summary:", err);
      } finally {
        if (isMounted) setIsLoadingSummary(false);
      }
    };
    fetchSummary();
    
    return () => { isMounted = false; };
  }, [referenceId, result.metadata?.aiSummary]);

  const actionableRecs = result.recommendations.filter(
    (r) => r.monthlySavings > 0
  );
  const creditRecs = result.recommendations.filter(
    (r) => r.type === "credit"
  );
  const keepRecs = result.recommendations.filter(
    (r) => r.type === "keep"
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link 
          href="/audit"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1.5 text-muted-foreground -ml-3" })}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          New Audit
        </Link>
        <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-1 rounded-md">
          ID: {referenceId.slice(0, 8)}
        </span>
      </div>

      {/* Hero Summary Cards (Screenshot Priority) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingDown className="h-24 w-24 text-emerald-900" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 text-emerald-800">
              <TrendingDown className="h-4 w-4" />
              <p className="text-sm font-medium">Monthly Savings</p>
            </div>
            <p className="mt-2 text-4xl font-bold text-emerald-900 tracking-tight">
              {formatCurrency(result.totalMonthlySavings)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="h-24 w-24 text-emerald-900" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 text-emerald-800">
              <DollarSign className="h-4 w-4" />
              <p className="text-sm font-medium">Annual Savings</p>
            </div>
            <p className="mt-2 text-4xl font-bold text-emerald-900 tracking-tight">
              {formatCurrency(result.totalAnnualSavings)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              <p className="text-sm font-medium">Current Monthly Spend</p>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {formatCurrency(result.totalMonthlySpend)}
            </p>
            {result.savingsPercentage > 0 && (
              <p className="mt-1 text-sm text-emerald-600 font-medium">
                {result.savingsPercentage}% potential savings identified
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Consultant Summary */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-primary/10 p-1.5 rounded-md">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-primary tracking-tight">Consultant's Note</h3>
        </div>
        {isLoadingSummary ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing operations summary...
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/90">
            {aiSummary}
          </p>
        )}
      </div>

      {/* Overlap Alert */}
      {result.metadata.hasOverlappingTools && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 flex items-start gap-3 shadow-sm">
          <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Overlapping tools detected
            </p>
            <p className="text-sm text-amber-800/90 mt-1 leading-relaxed">
              You have multiple tools in the same category. Consolidation may reduce costs without losing capability. See recommendations below.
            </p>
          </div>
        </div>
      )}

      <Separator />

      {/* Actionable Recommendations */}
      {actionableRecs.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Savings Opportunities ({actionableRecs.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Ranked by potential financial impact.
            </p>
          </div>
          <div className="space-y-3">
            {actionableRecs.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Credit Opportunities */}
      {creditRecs.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Credit Programs to Explore
            </h2>
            <p className="text-sm text-muted-foreground">
              These vendors offer startup or volume credits you may be eligible for.
            </p>
          </div>
          <div className="space-y-3">
            {creditRecs.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Already Optimized Tools */}
      {keepRecs.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Already Optimized ({keepRecs.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              These tools look well-configured. No changes needed.
            </p>
          </div>
          <div className="space-y-3">
            {keepRecs.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Honest Empty State - No recommendations at all */}
      {result.recommendations.length === 0 && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-emerald-900 mb-2">
              Your stack is fully optimized
            </h3>
            <p className="text-emerald-800/80 max-w-md mx-auto leading-relaxed">
              We couldn&apos;t find any obvious savings opportunities. Your seat counts and plan tiers align perfectly with current market benchmarks.
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Lead Capture UX */}
      <div className="max-w-xl mx-auto pt-4">
        <LeadCaptureForm 
          auditSlug={referenceId} 
          isHighSavings={result.totalMonthlySavings > 500}
        />
      </div>

      {/* Footer disclaimer */}
      <div className="rounded-xl border border-border/60 bg-secondary/20 p-5 mt-12">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Methodology:</strong> All recommendations are based on
          publicly available pricing data (catalog v{result.catalogVersion}, engine v{result.engineVersion}). Savings
          estimates are conservative and based on catalog pricing — actual
          savings may vary based on negotiated rates, usage patterns, and
          contract terms. 
          <br className="mb-1 mt-1" />
          <strong>AI Boundaries Disclosure:</strong> Savings calculations are completely deterministic. AI is ONLY used to generate the summary note at the top of this report.
        </p>
      </div>
    </div>
  );
}
