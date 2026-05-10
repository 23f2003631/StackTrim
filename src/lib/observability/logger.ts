/**
 * Structured Operational Logger.
 * Replaces generic console.log with JSON-friendly structured formats
 * suitable for log aggregators (Datadog, CloudWatch, etc.)
 */

type LogLevel = "info" | "warn" | "error" | "metric";

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload: LogPayload = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  // In production, this would format as JSON for external aggregators.
  // In development, we keep it readable.
  if (process.env.NODE_ENV === "production") {
    console[level === "metric" ? "info" : level](JSON.stringify(payload));
  } else {
    const formattedContext = context ? `\n${JSON.stringify(context, null, 2)}` : "";
    const color =
      level === "error"
        ? "\x1b[31m" // red
        : level === "warn"
        ? "\x1b[33m" // yellow
        : level === "metric"
        ? "\x1b[36m" // cyan
        : "\x1b[32m"; // green

    console[level === "metric" ? "info" : level](
      `[${payload.timestamp}] ${color}[${level.toUpperCase()}]\x1b[0m ${message}${formattedContext}`
    );
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
  metric: (message: string, context?: Record<string, unknown>) => emit("metric", message, context),
};
