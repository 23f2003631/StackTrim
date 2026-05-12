import type { 
  AuditInput, 
  AuditResult, 
  Recommendation, 
  ToolEntry, 
  OptimizedToolState,
  RecommendationType
} from "@/lib/types/audit";
import { getToolById, pricingCatalog } from "@/lib/engine/catalog";
import { 
  analyzeToolSpend, 
  analyzeToolOverlaps 
} from "@/lib/engine/analyzer";
import { 
  roundCurrency, 
  monthlyToAnnual, 
  savingsPercentage as calcSavingsPercentage 
} from "@/lib/engine/calculations";
import { getPlanPrice } from "@/lib/engine/pricing";

/**
 * Initializes the optimized state for all tools in the stack.
 */
export function initializeToolStates(input: AuditInput): Record<string, OptimizedToolState> {
  const states: Record<string, OptimizedToolState> = {};
  
  for (const entry of input.tools) {
    const catalog = getToolById(entry.toolId);
    states[entry.toolId] = {
      toolId: entry.toolId,
      toolName: catalog?.name || entry.toolId,
      originalPlan: entry.planTier,
      originalSeats: entry.seats,
      originalSpend: entry.monthlySpend,
      currentPlan: entry.planTier,
      currentSeats: entry.seats,
      currentSpend: entry.monthlySpend,
      appliedRecommendationIds: [],
    };
  }
  
  return states;
}

/**
 * Re-analyzes a tool based on its CURRENT state in the pipeline.
 * This ensures that a rightsize recommendation uses the NEW plan price
 * if a downgrade was already applied.
 */
export function analyzeCurrentState(
  state: OptimizedToolState,
  teamSize: number,
  typeFilter: RecommendationType
): Recommendation[] {
  const catalogEntry = getToolById(state.toolId);
  if (!catalogEntry) return [];

  // Create a pseudo-entry representing the CURRENT state
  const currentEntry: ToolEntry = {
    toolId: state.toolId,
    planTier: state.currentPlan,
    monthlySpend: state.currentSpend,
    seats: state.currentSeats,
    useCases: [], // Not needed for analysis
  };

  const allRecs = analyzeToolSpend(currentEntry, teamSize, catalogEntry);
  return allRecs.filter(r => r.type === typeFilter);
}

/**
 * The core sequential optimization engine.
 * Transforms tool states step-by-step to prevent double-counting.
 */
export function runOptimizationPipeline(input: AuditInput): {
  recommendations: Recommendation[];
  toolStates: Record<string, OptimizedToolState>;
  optimizationOrder: string[];
} {
  const toolStates = initializeToolStates(input);
  const recommendations: Recommendation[] = [];
  const optimizationOrder: string[] = [];

  // --- Phase 1: Consolidation (Tool-level) ---
  // Consolidations remove tools, so they must happen first.
  const consolidationCandidates = analyzeToolOverlaps(input.tools, getToolById);
  for (const rec of consolidationCandidates) {
    const state = toolStates[rec.toolId];
    if (!state || state.currentSpend === 0) continue;

    const preSpend = state.currentSpend;
    state.currentSpend = 0;
    state.currentSeats = 0;
    state.appliedRecommendationIds.push(`${rec.type}_${rec.toolId}`);
    
    recommendations.push({
      ...rec,
      preOptimizationSpend: preSpend,
      postOptimizationSpend: 0,
      modifies: "tool",
    });
    optimizationOrder.push(rec.toolId);
  }

  // --- Phase 2: Downgrades (Plan-level) ---
  for (const toolId in toolStates) {
    const state = toolStates[toolId];
    if (state.currentSpend === 0) continue; // Already consolidated

    const downgradeRecs = analyzeCurrentState(state, input.teamSize, "downgrade");
    if (downgradeRecs.length > 0) {
      const rec = downgradeRecs[0]; // Take the best downgrade
      const preSpend = state.currentSpend;
      
      state.currentPlan = rec.calculation?.recommendedPlanId || state.currentPlan;
      state.currentSpend = rec.recommendedSpend;
      state.appliedRecommendationIds.push(`${rec.type}_${rec.toolId}`);
      
      recommendations.push({
        ...rec,
        preOptimizationSpend: preSpend,
        postOptimizationSpend: state.currentSpend,
        modifies: "plan",
      });
      optimizationOrder.push(rec.toolId);
    }
  }

  // --- Phase 3: Rightsizing (Seat-level) ---
  // IMPORTANT: This now uses the NEW plan price from state.currentPlan
  for (const toolId in toolStates) {
    const state = toolStates[toolId];
    if (state.currentSpend === 0) continue;

    const rightsizeRecs = analyzeCurrentState(state, input.teamSize, "rightsize");
    if (rightsizeRecs.length > 0) {
      const rec = rightsizeRecs[0];
      const preSpend = state.currentSpend;
      
      // If we already downgraded, add a contextual note
      const wasDowngraded = state.appliedRecommendationIds.some(id => id.startsWith("downgrade"));
      const contextualNote = wasDowngraded 
        ? "Assumes previous plan optimization" 
        : undefined;

      // Rightsizing now honors the realism engine's seat count
      state.currentSeats = rec.recommendedSeats ?? state.currentSeats;
      state.currentSpend = rec.recommendedSpend;
      state.appliedRecommendationIds.push(`${rec.type}_${rec.toolId}`);
      
      recommendations.push({
        ...rec,
        preOptimizationSpend: preSpend,
        postOptimizationSpend: state.currentSpend,
        contextualNote,
        modifies: "seats",
      });
      optimizationOrder.push(rec.toolId);
    }
  }

  // --- Phase 4: Credits & Keep (Non-savings or metadata) ---
  // (Omitted for now to keep the core savings logic clean, will add back in analyzer integration)

  return { recommendations, toolStates, optimizationOrder };
}

/**
 * Final safeguard to ensure savings never exceed total spend.
 */
export function clampSavings(totalSavings: number, totalSpend: number): number {
  return Math.max(0, Math.min(totalSavings, totalSpend));
}
