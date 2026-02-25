import pino from "pino";

const enableStack =
  process.env.NODE_ENV === "development" && process.env.LOG_STACK === "true";

const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: "checkout-api",
  },
  redact: enableStack
    ? undefined
    : {
        paths: ["err", "error", "stack", "details.stack"],
        remove: true,
      },
});

export function getLogger(requestId?: string) {
  if (!requestId) {
    return baseLogger;
  }

  return baseLogger.child({ requestId });
}
