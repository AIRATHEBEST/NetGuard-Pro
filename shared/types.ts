/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Re-export all schema types for convenience
export type {
  Device,
  InsertDevice,
  DeviceHistory,
  InsertDeviceHistory,
  SecurityAlert,
  InsertSecurityAlert,
  RouterSettings,
  InsertRouterSettings,
  NetworkTraffic,
  InsertNetworkTraffic,
  SecurityRecommendation,
  InsertSecurityRecommendation,
  AlertRule,
  InsertAlertRule,
} from "../drizzle/schema";
