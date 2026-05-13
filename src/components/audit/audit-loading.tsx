"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const PHASES = [
  "Validating input data...",
  "Running audit engine...",
  "Analyzing pricing against catalog...",
  "Detecting overlaps...",
  "Generating recommendations...",
  "Persisting results...",
];

export function AuditLoading() {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => {
        if (prev < PHASES.length - 1) return prev + 1;
        return prev;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-6"
      >
        <Loader2 className="h-8 w-8 animate-spin text-foreground mx-auto" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Running your audit
          </h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={phaseIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              {PHASES[phaseIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          {PHASES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= phaseIndex
                  ? "w-4 bg-foreground"
                  : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
