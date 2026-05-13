import { z } from "zod";
import { MAX_TOOLS_PER_AUDIT, MIN_TEAM_SIZE, MAX_TEAM_SIZE } from "@/lib/constants";

export const toolEntrySchema = z.object({
  toolId: z.string().min(1, "Please select a tool"),
  planTier: z.string().min(1, "Please select a plan"),
  monthlySpend: z
    .number({ error: "Enter a valid amount" })
    .min(0, "Spend cannot be negative")
    .max(100000, "Please verify this amount"),
  seats: z
    .number({ error: "Enter number of seats" })
    .int("Seats must be a whole number")
    .min(1, "At least 1 seat required")
    .max(1000, "Please verify seat count"),
  useCases: z.array(z.string()).default([]),
  isManualOverride: z.boolean().default(false).optional(),
});

export const auditInputSchema = z.object({
  companyName: z.string().max(100, "Company name too long").optional(),
  teamSize: z
    .number({ error: "Enter your team size" })
    .int("Team size must be a whole number")
    .min(MIN_TEAM_SIZE, `Minimum team size is ${MIN_TEAM_SIZE}`)
    .max(MAX_TEAM_SIZE, `Maximum team size is ${MAX_TEAM_SIZE}`),
  tools: z
    .array(toolEntrySchema)
    .min(1, "Add at least one tool to audit")
    .max(MAX_TOOLS_PER_AUDIT, `Maximum ${MAX_TOOLS_PER_AUDIT} tools per audit`),
});

export type AuditInputForm = z.infer<typeof auditInputSchema>;
export type ToolEntryForm = z.infer<typeof toolEntrySchema>;
