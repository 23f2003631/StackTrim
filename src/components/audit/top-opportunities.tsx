"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { flags } from "@/lib/config/flags";
import type { PublicAuditSnapshot } from "@/lib/types/audit";
import { formatCurrency } from "@/lib/utils/format";

interface TopOpportunitiesProps {
  snapshot: PublicAuditSnapshot;
}

export function TopOpportunities({ snapshot }: TopOpportunitiesProps) {
  if (!flags.enableTopOpportunities) return null;

  const actionableRecs = snapshot.recommendations.filter((r) => r.monthlySavings > 0);
  
  if (actionableRecs.length === 0) return null;

  // Find the single highest savings recommendation
  const topRec = actionableRecs.reduce((prev, current) => 
    (current.monthlySavings > prev.monthlySavings) ? current : prev
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="p-1.5 bg-slate-200 text-slate-700 rounded-md mt-0.5">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Highest Impact Move</p>
            <p className="text-sm font-medium text-slate-900">
              {topRec.type === "eliminate" ? "Remove " : "Optimize "} 
              {topRec.toolName}
            </p>
            <p className="text-sm text-emerald-600 font-semibold mt-0.5">
              Saves {formatCurrency(topRec.annualSavings)} / year
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="p-1.5 bg-slate-200 text-slate-700 rounded-md mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fastest Execution</p>
            <p className="text-sm font-medium text-slate-900">
              Audit license usage
            </p>
            <p className="text-xs text-slate-600 mt-1">
              "Rightsize" recommendations can usually be executed without migrating systems.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
