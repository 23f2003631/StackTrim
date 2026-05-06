"use client";

import { ArrowLeft, TrendingDown, DollarSign, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AuditResult, Recommendation } from "@/lib/types/audit";

interface AuditResultsProps {
  result: AuditResult;
  onReset: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  downgrade: "Downgrade",
  consolidate: "Consolidate",
  credit: "Credit Opportunity",
  eliminate: "Eliminate",
  rightsize: "Rightsize",
};

const TYPE_COLORS: Record<string, string> = {
  downgrade: "bg-amber-50 text-amber-700 border-amber-200",
  consolidate: "bg-blue-50 text-blue-700 border-blue-200",
  credit: "bg-purple-50 text-purple-700 border-purple-200",
  eliminate: "bg-red-50 text-red-700 border-red-200",
  rightsize: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Explore",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold">{rec.toolName}</h3>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[rec.type] || ""}`}
              >
                {TYPE_LABELS[rec.type] || rec.type}
              </span>
              <Badge variant="outline" className="text-xs">
                {CONFIDENCE_LABELS[rec.confidence]}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {rec.reasoning}
            </p>
          </div>
          {rec.monthlySavings > 0 && (
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(rec.monthlySavings)}
              </p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AuditResults({ result, onReset }: AuditResultsProps) {
  const actionableRecs = result.recommendations.filter(
    (r) => r.monthlySavings > 0
  );
  const creditRecs = result.recommendations.filter(
    (r) => r.type === "credit"
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          New Audit
        </Button>
        <span className="text-xs text-muted-foreground font-mono">
          {result.id}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-emerald-700">
              <TrendingDown className="h-4 w-4" />
              <p className="text-xs font-medium">Monthly Savings</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-emerald-700 tracking-tight">
              {formatCurrency(result.totalMonthlySavings)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-emerald-700">
              <DollarSign className="h-4 w-4" />
              <p className="text-xs font-medium">Annual Savings</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-emerald-700 tracking-tight">
              {formatCurrency(result.totalAnnualSavings)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              <p className="text-xs font-medium">Current Monthly Spend</p>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {formatCurrency(result.totalMonthlySpend)}
            </p>
            {result.savingsPercentage > 0 && (
              <p className="mt-1 text-xs text-emerald-600 font-medium">
                {result.savingsPercentage}% potential savings identified
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Actionable Recommendations */}
      {actionableRecs.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">
              Savings Opportunities ({actionableRecs.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Ranked by potential monthly savings.
            </p>
          </div>
          {actionableRecs.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>
      )}

      {/* Credit Opportunities */}
      {creditRecs.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">
              Credit Programs to Explore
            </h2>
            <p className="text-xs text-muted-foreground">
              These vendors offer startup or volume credits you may be eligible
              for.
            </p>
          </div>
          {creditRecs.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>
      )}

      {/* No recommendations */}
      {result.recommendations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No savings opportunities found. Your AI stack looks well-optimized!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Footer disclaimer */}
      <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Methodology:</strong> All recommendations are based on
          publicly available pricing data verified as of May 2026. Savings
          estimates are conservative and based on catalog pricing — actual
          savings may vary based on negotiated rates, usage patterns, and
          contract terms. No AI was used to generate these financial
          calculations.
        </p>
      </div>
    </div>
  );
}
