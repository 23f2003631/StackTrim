import { GoogleGenAI } from "@google/genai";
import { PublicAuditSnapshot } from "../types/audit";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
export async function generateAuditSummary(snapshot: PublicAuditSnapshot): Promise<string> {
  // If no API key is present in dev environment, return fallback immediately
  if (!GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY found. Using deterministic fallback summary.");
    return generateFallbackSummary(snapshot);
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2, // Low temperature for deterministic/conservative output
      }
    }, {
      signal: abortController.signal
    });

    clearTimeout(timeoutId);

    if (response.text) {
      return response.text.trim();
    }

    throw new Error("Empty response from Gemini");
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("AI Summary Generation Failed:", error.message || error);
    return generateFallbackSummary(snapshot);
  }
}
