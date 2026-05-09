"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

interface LeadCaptureFormProps {
  auditSlug: string;
  isHighSavings: boolean;
}

export function LeadCaptureForm({ auditSlug, isHighSavings }: LeadCaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const website_url = formData.get("website_url"); // Honeypot
    const consultationIntent = formData.get("consultationIntent") === "on";

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website_url, // Honeypot field
          consultationIntent,
          auditSlug,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save lead");
      }

      setIsSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 p-6 text-center"
      >
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-3" />
        <h3 className="font-semibold text-lg text-foreground">Report sent</h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
          We&apos;ve emailed you a permanent link to this audit.
          {isHighSavings && " Our team will review your results and follow up shortly."}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className="rounded-xl border border-border/60 bg-background shadow-sm p-6 sm:p-8"
    >
      <div className="mb-6">
        <h3 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          {isHighSavings ? "Discuss these savings" : "Email me this report"}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          {isHighSavings
            ? "Your potential savings exceed $500/mo. Enter your email to receive a copy of this report and optionally schedule a brief consultation."
            : "Save this audit for your records. Enter your email to receive a permanent link."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Honeypot field - invisible to real users */}
        <div aria-hidden="true" className="hidden">
          <input type="url" name="website_url" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="space-y-2">
          <label htmlFor="lead-email" className="text-sm font-medium">
            Work Email
          </label>
          <Input
            id="lead-email"
            name="email"
            type="email"
            required
            placeholder="founder@startup.com"
            disabled={isSubmitting}
            autoComplete="email"
          />
        </div>

        {isHighSavings && (
          <div className="flex items-start gap-3 py-2">
            <input
              type="checkbox"
              id="consultationIntent"
              name="consultationIntent"
              defaultChecked
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="consultationIntent"
              className="text-sm text-muted-foreground"
            >
              I&apos;m interested in a free 15-minute consultation with a Credex
              optimization expert to help implement these savings.
            </label>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive font-medium" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : isHighSavings ? (
            "Send Report & Request Consultation"
          ) : (
            "Email me this report"
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-4">
          No spam. No lists. Just your deterministic audit results.
        </p>
      </form>
    </motion.div>
  );
}
