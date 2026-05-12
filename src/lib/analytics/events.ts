/**
 * Core event tracking architecture.
 * Supports strongly typed events to prevent analytics drift.
 */

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

/**
 * Client-side tracking utility.
 * Posts to our internal `/api/events` route so credentials never leak.
 */
export async function trackEvent(event: AnalyticsEvent) {
  try {
    // Only track in browser environment to avoid SSR double-firing
    if (typeof window === "undefined") return;

    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      // Use keepalive so it completes even if the user navigates away
      keepalive: true, 
    });
  } catch (error) {
    // Silently fail in client so we don't break the user experience
    console.error("Failed to track event:", error);
  }
}
