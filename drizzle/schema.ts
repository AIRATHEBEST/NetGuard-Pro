import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Network devices table - stores information about devices connected to the network
 */
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  macAddress: varchar("macAddress", { length: 17 }).notNull().unique(),
  vendor: varchar("vendor", { length: 255 }),
  deviceType: varchar("deviceType", { length: 100 }),
  deviceName: varchar("deviceName", { length: 255 }),
  isOnline: int("isOnline").default(1).notNull(),
  isBlocked: int("isBlocked").default(0).notNull(),
  riskScore: int("riskScore").default(0).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("low").notNull(),
  lastSeen: timestamp("lastSeen").defaultNow().notNull(),
  firstSeen: timestamp("firstSeen").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

/**
 * Device history table - tracks device connections and disconnections
 */
export const deviceHistory = mysqlTable("deviceHistory", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  userId: int("userId").notNull(),
  eventType: mysqlEnum("eventType", ["connected", "disconnected", "blocked", "unblocked", "risk_updated"]).notNull(),
  riskScore: int("riskScore"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeviceHistory = typeof deviceHistory.$inferSelect;
export type InsertDeviceHistory = typeof deviceHistory.$inferInsert;

/**
 * Security alerts table - stores security events and alerts
 */
export const securityAlerts = mysqlTable("securityAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId"),
  alertType: mysqlEnum("alertType", [
    "new_device",
    "high_risk_device",
    "suspicious_activity",
    "device_blocked",
    "anomaly_detected",
    "bandwidth_spike",
    "unauthorized_access"
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isResolved: int("isResolved").default(0).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SecurityAlert = typeof securityAlerts.$inferSelect;
export type InsertSecurityAlert = typeof securityAlerts.$inferInsert;

/**
 * Router settings table - stores router configuration and credentials
 */
export const routerSettings = mysqlTable("routerSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  routerIp: varchar("routerIp", { length: 45 }).notNull(),
  routerUsername: varchar("routerUsername", { length: 255 }),
  routerPasswordEncrypted: text("routerPasswordEncrypted"),
  routerModel: varchar("routerModel", { length: 255 }),
  scanInterval: int("scanInterval").default(300).notNull(), // in seconds
  isEnabled: int("isEnabled").default(1).notNull(),
  lastScanTime: timestamp("lastScanTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RouterSettings = typeof routerSettings.$inferSelect;
export type InsertRouterSettings = typeof routerSettings.$inferInsert;

/**
 * Network traffic data table - stores bandwidth and traffic information
 */
export const networkTraffic = mysqlTable("networkTraffic", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId"),
  uploadBytesPerSecond: int("uploadBytesPerSecond").default(0).notNull(),
  downloadBytesPerSecond: int("downloadBytesPerSecond").default(0).notNull(),
  totalUploadBytes: int("totalUploadBytes").default(0).notNull(),
  totalDownloadBytes: int("totalDownloadBytes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NetworkTraffic = typeof networkTraffic.$inferSelect;
export type InsertNetworkTraffic = typeof networkTraffic.$inferInsert;

/**
 * Security recommendations table - stores LLM-generated recommendations
 */
export const securityRecommendations = mysqlTable("securityRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deviceId: int("deviceId"),
  recommendationType: mysqlEnum("recommendationType", [
    "block_device",
    "monitor_closely",
    "update_firmware",
    "change_password",
    "isolate_device",
    "investigate_behavior",
    "enable_firewall"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  isImplemented: int("isImplemented").default(0).notNull(),
  implementedAt: timestamp("implementedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SecurityRecommendation = typeof securityRecommendations.$inferSelect;
export type InsertSecurityRecommendation = typeof securityRecommendations.$inferInsert;

/**
 * Alert rules table - stores user-defined alert rules
 */
export const alertRules = mysqlTable("alertRules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ruleName: varchar("ruleName", { length: 255 }).notNull(),
  triggerType: mysqlEnum("triggerType", [
    "new_device",
    "risk_threshold",
    "bandwidth_threshold",
    "device_offline",
    "suspicious_pattern"
  ]).notNull(),
  threshold: int("threshold"),
  notificationMethod: mysqlEnum("notificationMethod", ["email", "in_app", "both"]).default("both").notNull(),
  isEnabled: int("isEnabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;