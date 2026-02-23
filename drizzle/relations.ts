/**
 * Drizzle ORM relations for NetGuardPro schema.
 * Define cross-table relations here as the schema grows.
 */

import { relations } from "drizzle-orm";
import {
  users,
  devices,
  deviceHistory,
  securityAlerts,
  routerSettings,
  networkTraffic,
  securityRecommendations,
  alertRules,
} from "./schema";

export const usersRelations = relations(users, ({ many, one }) => ({
  devices: many(devices),
  securityAlerts: many(securityAlerts),
  routerSettings: one(routerSettings, {
    fields: [users.id],
    references: [routerSettings.userId],
  }),
  networkTraffic: many(networkTraffic),
  securityRecommendations: many(securityRecommendations),
  alertRules: many(alertRules),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  user: one(users, {
    fields: [devices.userId],
    references: [users.id],
  }),
  history: many(deviceHistory),
  securityAlerts: many(securityAlerts),
  networkTraffic: many(networkTraffic),
  securityRecommendations: many(securityRecommendations),
}));

export const deviceHistoryRelations = relations(deviceHistory, ({ one }) => ({
  device: one(devices, {
    fields: [deviceHistory.deviceId],
    references: [devices.id],
  }),
  user: one(users, {
    fields: [deviceHistory.userId],
    references: [users.id],
  }),
}));

export const securityAlertsRelations = relations(securityAlerts, ({ one }) => ({
  user: one(users, {
    fields: [securityAlerts.userId],
    references: [users.id],
  }),
  device: one(devices, {
    fields: [securityAlerts.deviceId],
    references: [devices.id],
  }),
}));

export const routerSettingsRelations = relations(routerSettings, ({ one }) => ({
  user: one(users, {
    fields: [routerSettings.userId],
    references: [users.id],
  }),
}));

export const networkTrafficRelations = relations(networkTraffic, ({ one }) => ({
  user: one(users, {
    fields: [networkTraffic.userId],
    references: [users.id],
  }),
  device: one(devices, {
    fields: [networkTraffic.deviceId],
    references: [devices.id],
  }),
}));

export const securityRecommendationsRelations = relations(securityRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [securityRecommendations.userId],
    references: [users.id],
  }),
  device: one(devices, {
    fields: [securityRecommendations.deviceId],
    references: [devices.id],
  }),
}));

export const alertRulesRelations = relations(alertRules, ({ one }) => ({
  user: one(users, {
    fields: [alertRules.userId],
    references: [users.id],
  }),
}));
