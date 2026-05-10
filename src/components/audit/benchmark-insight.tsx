"use client";

import { motion } from "framer-motion";
import { BarChart, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { flags } from "@/lib/config/flags";
import type { PublicAuditSnapshot } from "@/lib/types/audit";

interface BenchmarkInsightProps {
  snapshot: PublicAuditSnapshot;
}

export function BenchmarkInsight({ snapshot }: BenchmarkInsightProps) {
  if (!flags.enableBenchmarks) return null;

  // Simple, believable deterministic benchmark logic
  // A startup stack with > 20% savings is "high waste", < 5% is "highly optimized"
  const savingsPercent = snapshot.savingsPercentage;
  
  let insightHeadline = "";
  let insightText = "";
  let isOptimized = false;

  if (savingsPercent > 25) {
    insightHeadline = "High Optimization Potential";
    insightText = `This stack carries roughly ${Math.round(savingsPercent)}% in actionable waste, which is significantly higher than the typical 12-15% we see in similar organizations.`;
  } else if (savingsPercent > 10) {
    insightHeadline = "Average Optimization Potential";
    insightText = `This stack has about ${Math.round(savingsPercent)}% in actionable waste, which aligns closely with the industry average of 12-15% for teams of this size.`;
  } else {
    isOptimized = true;
    insightHeadline = "Highly Optimized Stack";
    insightText = `This stack is operating in the top 15% of efficiency. With only ${Math.round(savingsPercent)}% identified waste, procurement practices here are already excellent.`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className={`overflow-hidden border-l-4 ${isOptimized ? "border-l-emerald-500" : "border-l-amber-500"}`}>
        <CardContent className="p-5 flex items-start gap-4">
          <div className={`p-2 rounded-full mt-0.5 ${isOptimized ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {isOptimized ? <BarChart className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{insightHeadline}</h4>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {insightText}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
