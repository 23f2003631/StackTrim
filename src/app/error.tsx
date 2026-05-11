"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // We purposefully avoid logging stack traces to the UI.
    // In a real app, this would be sent to Sentry/Datadog.
    console.error("Uncaught application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center shadow-sm border border-slate-300">
            <AlertTriangle className="w-6 h-6 text-slate-700" />
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-medium text-slate-900">
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="text-slate-500 text-sm">
              We encountered an unexpected error while processing your request. Our engineering team has been notified.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-100 pt-6">
            <Button 
              onClick={() => reset()} 
              variant="outline" 
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try again
            </Button>
          </CardFooter>
        </Card>
        
        <p className="text-center text-xs text-slate-400 mt-8">
          StackTrim Operational Intelligence
        </p>
      </div>
    </div>
  );
}
