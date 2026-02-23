import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Network devices table - stores information about devices connected to the network
 */
export const riskLevelEnum = pgEnum("riskLevel", ["low", "medium", "high", "critical"]);

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  macAddress: varchar("macAddress", { length: 17 }).notNull().unique(),
  vendor: varchar("vendor", { length: 255 }),
  deviceType: varchar("deviceType", { length: 100 }),
  deviceName: varchar("deviceName", { length: 255 }),
  isOnline: boolean("isOnline").default(true).notNull(),
  isBlocked: boolean("isBlocked").default(false).notNull(),
  riskScore: integer("riskScore").default(0).notNull(),
  riskLevel: riskLevelEnum("riskLevel").default("low").notNull(),
  lastSeen: timestamp("lastSeen").defaultNow().notNull(),
  firstSeen: timestamp("firstSeen").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

/**
 * Device history table - tracks device connections and disconnections
 */
export const deviceEventTypeEnum = pgEnum("deviceEventType", [
  "connected",
  "disconnected",
  "blocked",
  "unblocked",
  "risk_updated",
]);

export const deviceHistory = pgTable("deviceHistory", {
  id: serial("id").primaryKey(),
  deviceId: integer("deviceId").notNull(),
  userId: integer("userId").notNull(),
  eventType: deviceEventTypeEnum("eventType").notNull(),
  riskScore: integer("riskScore"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeviceHistory = typeof deviceHistory.$inferSelect;
export type InsertDeviceHistory = typeof deviceHistory.$inferInsert;

/**
 * Security alerts table - stores security events and alerts
 */
export const alertTypeEnum = pgEnum("alertType", [
  "new_device",
  "high_risk_device",
  "suspicious_activity",
  "device_blocked",
  "anomaly_detected",
  "bandwidth_spike",
  "unauthorized_access",
]);

export const severityEnum = pgEnum("severity", ["low", "medium", "high", "critical"]);

export const securityAlerts = pgTable("securityAlerts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  deviceId: integer("deviceId"),
  alertType: alertTypeEnum("alertType").notNull(),
  severity: severityEnum("severity").default("medium").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isResolved: boolean("isResolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SecurityAlert = typeof securityAlerts.$inferSelect;
export type InsertSecurityAlert = typeof securityAlerts.$inferInsert;

/**
 * Router settings table - stores router configuration and credentials
 */
export const routerSettings = pgTable("routerSettings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  routerIp: varchar("routerIp", { length: 45 }).notNull(),
  routerUsername: varchar("routerUsername", { length: 255 }),
  routerPasswordEncrypted: text("routerPasswordEncrypted"),
  routerModel: varchar("routerModel", { length: 255 }),
  scanInterval: integer("scanInterval").default(300).notNull(), // in seconds
  isEnabled: boolean("isEnabled").default(true).notNull(),
  lastScanTime: timestamp("lastScanTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RouterSettings = typeof routerSettings.$inferSelect;
export type InsertRouterSettings = typeof routerSettings.$inferInsert;

/**
 * Network traffic data table - stores bandwidth and traffic information
 */
export const networkTraffic = pgTable("networkTraffic", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  deviceId: integer("deviceId"),
  uploadBytesPerSecond: integer("uploadBytesPerSecond").default(0).notNull(),
  downloadBytesPerSecond: integer("downloadBytesPerSecond").default(0).notNull(),
  totalUploadBytes: integer("totalUploadBytes").default(0).notNull(),
  totalDownloadBytes: integer("totalDownloadBytes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NetworkTraffic = typeof networkTraffic.$inferSelect;
export type InsertNetworkTraffic = typeof networkTraffic.$inferInsert;

/**
 * Security recommendations table - stores LLM-generated recommendations
 */
export const recommendationTypeEnum = pgEnum("recommendationType", [
  "block_device",
  "monitor_closely",
  "update_firmware",
  "change_password",
  "isolate_device",
  "investigate_behavior",
  "enable_firewall",
]);

export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "critical"]);

export const securityRecommendations = pgTable("securityRecommendations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  deviceId: integer("deviceId"),
  recommendationType: recommendationTypeEnum("recommendationType").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: priorityEnum("priority").default("medium").notNull(),
  isImplemented: boolean("isImplemented").default(false).notNull(),
  implementedAt: timestamp("implementedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SecurityRecommendation = typeof securityRecommendations.$inferSelect;
export type InsertSecurityRecommendation = typeof securityRecommendations.$inferInsert;

/**
 * Alert rules table - stores user-defined alert rules
 */
export const triggerTypeEnum = pgEnum("triggerType", [
  "new_device",
  "risk_threshold",
  "bandwidth_threshold",
  "device_offline",
  "suspicious_pattern",
]);

export const notificationMethodEnum = pgEnum("notificationMethod", [
  "email",
  "in_app",
  "both",
]);

export const alertRules = pgTable("alertRules", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  ruleName: varchar("ruleName", { length: 255 }).notNull(),
  triggerType: triggerTypeEnum("triggerType").notNull(),
  threshold: integer("threshold"),
  notificationMethod: notificationMethodEnum("notificationMethod").default("both").notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;
