"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ArrowRight, Loader2, AlertCircle } from "lucide-react";

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
import { AuditResults } from "@/components/audit/audit-results";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DEFAULT_TOOL = {
  toolId: "",
  planTier: "",
  monthlySpend: 0,
  seats: 1,
  useCases: [] as string[],
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

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedTools = watch("tools");

  // LocalStorage persistence
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("stacktrim_form_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only restore if valid structure exists
        if (parsed && Array.isArray(parsed.tools)) {
          // Reset form with saved values, keeping default structure if missing fields
          Object.keys(parsed).forEach((key) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(key as any, parsed[key]);
          });
        }
      } catch (e) {
        console.warn("Failed to parse saved form state", e);
      }
    }
  }, [setValue]);

  // Save on changes
  useEffect(() => {
    if (isMounted) {
      const subscription = watch((value) => {
        localStorage.setItem("stacktrim_form_state", JSON.stringify(value));
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, isMounted]);

  async function onSubmit(data: AuditInputForm) {
    setIsAnalyzing(true);
    setServerError(null);

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
      
      // Clear persistence on success
      localStorage.removeItem("stacktrim_form_state");
      
      // Redirect to public result page
      router.push(`/share/${slug}`);
    } catch (error) {
      console.error("Submission error:", error);
      setServerError(error instanceof Error ? error.message : "An unexpected error occurred");
      setIsAnalyzing(false);
    }
  }

  // Prevent hydration mismatch by not rendering form until mounted
  if (!isMounted) {
    return null; // Or a simple skeleton loader
  }

  // Get available plans for a selected tool
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
      {/* Company & Team Info */}
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

      {/* Tool Entries */}
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
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Tool Select */}
                  <div className="space-y-2">
                    <Label className="text-sm">Tool</Label>
                    <Select
                      value={selectedToolId || ""}
                      onValueChange={(value: string | null) => {
                        setValue(`tools.${index}.toolId`, value ?? "");
                        setValue(`tools.${index}.planTier`, "");
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

                  {/* Plan Select */}
                  <div className="space-y-2">
                    <Label className="text-sm">Plan</Label>
                    <Select
                      value={watchedTools?.[index]?.planTier || ""}
                      onValueChange={(value: string | null) =>
                        setValue(`tools.${index}.planTier`, value ?? "")
                      }
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

                  {/* Monthly Spend */}
                  <div className="space-y-2">
                    <Label className="text-sm">Monthly spend ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      {...register(`tools.${index}.monthlySpend`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.tools?.[index]?.monthlySpend && (
                      <p className="text-xs text-destructive">
                        {errors.tools[index].monthlySpend?.message}
                      </p>
                    )}
                  </div>

                  {/* Seats */}
                  <div className="space-y-2">
                    <Label className="text-sm">Seats</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="1"
                      {...register(`tools.${index}.seats`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.tools?.[index]?.seats && (
                      <p className="text-xs text-destructive">
                        {errors.tools[index].seats?.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Remove button */}
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit */}
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
