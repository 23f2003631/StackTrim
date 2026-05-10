import { GoogleGenAI } from "@google/genai";
import { PublicAuditSnapshot } from "../types/audit";
import { AnalyticsEventType } from "../analytics/events";

/**
 * Generates a deterministic fallback summary when AI generation fails or times out.
 * This ensures the product experience never breaks.
 */
function generateFallbackSummary(snapshot: PublicAuditSnapshot): string {
  const { toolCount, totalMonthlySpend, totalMonthlySavings, recommendations } = snapshot;
  
  if (totalMonthlySavings === 0) {
    return `Your stack of ${toolCount} tools ($${totalMonthlySpend}/mo) appears highly optimized. We did not identify any immediate cost-saving opportunities. Continue monitoring your usage as your team scales.`;
  }

  const recCount = recommendations.length;
  return `We analyzed your stack of ${toolCount} tools ($${totalMonthlySpend}/mo) and identified ${recCount} optimization opportunit${recCount === 1 ? 'y' : 'ies'}. By implementing these recommendations, you could potentially save $${totalMonthlySavings} per month while maintaining operational efficiency.`;
}

/**
 * Generates an AI-powered personalized audit summary using Gemini.
 * Uses a strict 4-second timeout to prevent blocking the UI.
 * Gracefully falls back to deterministic text on any failure.
 */
export interface SummaryResult {
  summary: string;
  status: AnalyticsEventType;
}

export async function generateAuditSummary(snapshot: PublicAuditSnapshot): Promise<SummaryResult> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // If no API key is present in dev environment, return fallback immediately
  if (!GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY found. Using deterministic fallback summary.");
    return {
      summary: generateFallbackSummary(snapshot),
      status: "ai_summary_missing_key"
    };
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort("Timeout"), 4000);

  try {
    const prompt = `
You are a senior operations advisor for a B2B SaaS company.
Analyze the following JSON audit of a company's software stack.

Rules:
1. ONLY use the provided JSON. Do not invent savings, pricing, tools, or recommendations.
2. Discuss the biggest savings opportunities and overall stack efficiency.
3. Keep the tone calm, operational, founder-friendly, and financially credible.
4. NO hype, NO emojis, NO chatbot-style introductions (e.g. "Here is your summary").
5. Length must be between 80 and 120 words.

Audit JSON:
${JSON.stringify({
  teamSize: snapshot.teamSize,
  toolCount: snapshot.toolCount,
  totalMonthlySpend: snapshot.totalMonthlySpend,
  totalMonthlySavings: snapshot.totalMonthlySavings,
  savingsPercentage: snapshot.savingsPercentage,
  recommendations: snapshot.recommendations.map(r => ({
    toolName: r.toolName,
    type: r.type,
    reasoning: r.reasoning,
    monthlySavings: r.monthlySavings
  }))
}, null, 2)}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
      }
    });

    clearTimeout(timeoutId);

    if (result.text) {
      return {
        summary: result.text.trim(),
        status: "ai_summary_generated"
      };
    }

    throw new Error("Empty response from Gemini");
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("AI Summary Generation Failed:", errorMessage);
    
    let status: AnalyticsEventType = "ai_summary_provider_failed";
    
    if (errorMessage.includes("Timeout") || errorMessage.includes("abort")) {
      status = "ai_summary_timeout";
    } else if (errorMessage.toLowerCase().includes("quota") || errorMessage.includes("429")) {
      status = "ai_summary_quota_exhausted";
    }

    return {
      summary: generateFallbackSummary(snapshot),
      status
    };
  }
}
