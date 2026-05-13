"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, useWatch, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ArrowRight, Loader2, AlertCircle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { auditInputSchema, type AuditInputForm } from "@/lib/validations/audit";
import { pricingCatalog, getToolById } from "@/lib/engine/catalog";
import { 
  getPlanPrice, 
  computeExpectedSpend, 
  computeDeviation, 
  classifyMismatchSeverity 
} from "@/lib/engine/pricing";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuditLoading } from "./audit-loading";
import { trackEvent } from "@/lib/analytics/events";

const DEFAULT_TOOL = {
  toolId: "",
  planTier: "",
  monthlySpend: 0,
  seats: 1,
  useCases: [] as string[],
  isManualOverride: false,
};

export function SpendForm() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<AuditInputForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(auditInputSchema) as any,
    defaultValues: {
      companyName: "",
      teamSize: 5,
      tools: [{ ...DEFAULT_TOOL }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tools",
  });

  const watchedTools = useWatch({
    control,
    name: "tools",
  });


  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);


  useEffect(() => {
    if (!isMounted) return;
    
    const saved = localStorage.getItem("stacktrim_form_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.tools)) {
          Object.keys(parsed).forEach((key) => {
            const field = key as keyof AuditInputForm;
            setValue(field, parsed[field]);
          });
        }
      } catch (e) {
        console.warn("Failed to parse saved form state", e);
      }
    }
  }, [setValue, isMounted]);

  const watchRef = useRef(watch);
  useEffect(() => {
    watchRef.current = watch;
  }, [watch]);


  useEffect(() => {
    if (isMounted) {
      const subscription = watchRef.current((value) => {
        localStorage.setItem("stacktrim_form_state", JSON.stringify(value));
      });
      return () => subscription.unsubscribe();
    }
  }, [isMounted]);

  const onSubmit: SubmitHandler<AuditInputForm> = async (data) => {
    setIsAnalyzing(true);
    setServerError(null);

    trackEvent({ type: "audit_started" });

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate audit");
      }

      const { slug } = await response.json();
      

      localStorage.removeItem("stacktrim_form_state");
      
      router.push(`/share/${slug}`);
    } catch (error) {
      console.error("Submission error:", error);
      trackEvent({ type: "audit_failed" });
      setServerError(error instanceof Error ? error.message : "An unexpected error occurred");
      setIsAnalyzing(false);
    }
  }


  if (!isMounted) {
    return null;
  }


  if (isAnalyzing) {
    return <AuditLoading />;
  }


  function getPlansForTool(toolId: string) {
    const tool = getToolById(toolId);
    return tool?.plans ?? [];
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            Team details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm">
                Company name{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="companyName"
                placeholder="Acme Inc."
                {...register("companyName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamSize" className="text-sm">
                Team size
              </Label>
              <Input
                id="teamSize"
                type="number"
                min={1}
                placeholder="5"
                {...register("teamSize", { valueAsNumber: true })}
              />
              {errors.teamSize && (
                <p className="text-xs text-destructive">
                  {errors.teamSize.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">AI Tools</h2>
            <p className="text-xs text-muted-foreground">
              Add each AI tool your team pays for.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...DEFAULT_TOOL })}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Tool
          </Button>
        </div>

        {errors.tools?.root && (
          <p className="text-xs text-destructive">
            {errors.tools.root.message}
          </p>
        )}

        {fields.map((field, index) => {
          const selectedToolId = watchedTools?.[index]?.toolId;
          const availablePlans = selectedToolId
            ? getPlansForTool(selectedToolId)
            : [];

          return (
            <Card key={field.id} className="relative">
              <CardContent className="pt-6">
                

                {(() => {
                  const toolData = watchedTools?.[index];
                  const isManualOverride = toolData?.isManualOverride;
                  let mismatchSeverity = "none";
                  let isMismatch = false;
                  let expectedSpend = 0;

                  if (toolData?.toolId && toolData?.planTier && toolData?.seats && toolData?.monthlySpend !== undefined) {
                    const planPrice = getPlanPrice(toolData.toolId, toolData.planTier);
                    expectedSpend = computeExpectedSpend(planPrice, toolData.seats);
                    const deviation = computeDeviation(toolData.monthlySpend, expectedSpend);
                    mismatchSeverity = classifyMismatchSeverity(deviation);
                    isMismatch = mismatchSeverity === "medium" || mismatchSeverity === "high" || mismatchSeverity === "extreme";
                  }

                  return (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">

                  <div className="space-y-2">
                    <Label className="text-sm">Tool</Label>
                    <Select
                      value={selectedToolId || ""}
                      onValueChange={(value: string | null) => {
                        setValue(`tools.${index}.toolId`, value ?? "");
                        setValue(`tools.${index}.planTier`, "");
                        

                        const tool = getValues(`tools.${index}`);
                        if (!tool.isManualOverride && value && tool.planTier && tool.seats) {
                          const price = getPlanPrice(value, tool.planTier);
                          setValue(`tools.${index}.monthlySpend`, computeExpectedSpend(price, tool.seats));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {pricingCatalog.tools.map((tool) => (
                          <SelectItem key={tool.id} value={tool.id}>
                            {tool.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.tools?.[index]?.toolId && (
                      <p className="text-xs text-destructive">
                        {errors.tools[index].toolId?.message}
                      </p>
                    )}
                  </div>


                  <div className="space-y-2">
                    <Label className="text-sm">Plan</Label>
                    <Select
                      value={watchedTools?.[index]?.planTier || ""}
                      onValueChange={(value: string | null) => {
                        setValue(`tools.${index}.planTier`, value ?? "");
                        

                        const tool = getValues(`tools.${index}`);
                        if (!tool.isManualOverride && tool.toolId && value && tool.seats) {
                          const price = getPlanPrice(tool.toolId, value);
                          setValue(`tools.${index}.monthlySpend`, computeExpectedSpend(price, tool.seats));
                        }
                      }}
                      disabled={!selectedToolId}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            selectedToolId
                              ? "Select a plan"
                              : "Select tool first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                            {plan.monthlyPricePerSeat > 0 &&
                              ` — $${plan.monthlyPricePerSeat}/seat/mo`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.tools?.[index]?.planTier && (
                      <p className="text-xs text-destructive">
                        {errors.tools[index].planTier?.message}
                      </p>
                    )}
                  </div>


                  <div className="space-y-2">
                    <Label className="text-sm">Monthly spend ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      {...register(`tools.${index}.monthlySpend`, {
                        valueAsNumber: true,
                        onChange: () => {
                          const tool = getValues(`tools.${index}`);
                          if (!tool.isManualOverride) {
                            setValue(`tools.${index}.isManualOverride`, true);
                            trackEvent({ type: "manual_pricing_override_enabled" });
                          }
                        }
                      })}
                    />
                    {errors.tools?.[index]?.monthlySpend && (
                      <p className="text-xs text-destructive">
                        {errors.tools[index].monthlySpend?.message}
                      </p>
                    )}
                  </div>


                  <div className="space-y-2">
                    <Label className="text-sm">Seats</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="1"
                      {...register(`tools.${index}.seats`, {
                        valueAsNumber: true,
                        onChange: (e) => {
                          const seats = e.target.valueAsNumber;
                          const tool = getValues(`tools.${index}`);
                          if (!tool.isManualOverride && tool.toolId && tool.planTier && seats) {
                            const price = getPlanPrice(tool.toolId, tool.planTier);
                            setValue(`tools.${index}.monthlySpend`, computeExpectedSpend(price, seats));
                          }
                        }
                      })}
                    />
                    {errors.tools?.[index]?.seats && (
                      <p className="text-xs text-destructive">
                        {errors.tools[index].seats?.message}
                      </p>
                    )}
                  </div>
                </div>


                {isMismatch && isManualOverride && (
                  <div className="mt-4 flex items-start gap-3 rounded-md bg-amber-50/50 p-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-500/20">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-amber-800">
                        Custom pricing active
                      </p>
                      <p className="text-amber-700/80 leading-relaxed" title="Your entered spend differs significantly from publicly available pricing data. This may indicate enterprise contracts, negotiated discounts, or custom billing arrangements.">
                        This pricing differs significantly from catalog expectations.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 gap-1.5"
                      onClick={() => {
                        setValue(`tools.${index}.monthlySpend`, expectedSpend);
                        setValue(`tools.${index}.isManualOverride`, false);
                        trackEvent({ type: "catalog_pricing_reset_clicked" });
                      }}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Use catalog pricing
                    </Button>
                  </div>
                )}
                

                {fields.length > 1 && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="gap-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                )}
                </>
              );
            })()}
              </CardContent>
            </Card>
          );
        })}
      </div>


      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isAnalyzing}
          className="gap-2 px-6"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Run Audit
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
