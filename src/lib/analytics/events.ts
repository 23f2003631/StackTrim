export type AnalyticsEventType =
  | "audit_started"
  | "audit_completed"
  | "audit_failed"
  | "lead_captured"
  | "share_link_copied"
  | "pdf_exported"
  | "public_audit_viewed"
  | "ai_summary_generated"
  | "ai_summary_fallback_used"
  | "ai_summary_quota_exhausted"
  | "ai_summary_timeout"
  | "ai_summary_missing_key"
  | "ai_summary_provider_failed"
  | "consultation_cta_clicked"
  | "pricing_mismatch_detected"
  | "catalog_pricing_reset_clicked"
  | "manual_pricing_override_enabled";

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  auditId?: string;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(event: AnalyticsEvent) {
  try {
    if (typeof window === "undefined") return;

    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    });
  } catch {
    // Silently fail to avoid breaking the user experience
  }
}
