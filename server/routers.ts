import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getDevicesByUserId,
  getDeviceById,
  getDeviceByMac,
  createDevice,
  updateDevice,
  getRouterSettings,
  createRouterSettings,
  updateRouterSettings,
  getAlertsByUserId,
  createAlert,
  getDeviceHistoryByDeviceId,
  createDeviceHistory,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Device management procedures
  devices: router({
    // Get all devices for current user
    list: protectedProcedure.query(async ({ ctx }) => {
      return getDevicesByUserId(ctx.user.id);
    }),

    // Get single device details
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getDeviceById(input.id);
      }),

    // Get device history
    history: protectedProcedure
      .input(z.object({ deviceId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return getDeviceHistoryByDeviceId(input.deviceId, input.limit);
      }),

    // Update device info (name, custom settings)
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          deviceName: z.string().optional(),
          riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const device = await getDeviceById(input.id);
        if (!device || device.userId !== ctx.user.id) {
          throw new Error("Device not found or unauthorized");
        }
        return updateDevice(input.id, {
          deviceName: input.deviceName,
          riskLevel: input.riskLevel,
        });
      }),

    // Block a device
    block: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const device = await getDeviceById(input.id);
        if (!device || device.userId !== ctx.user.id) {
          throw new Error("Device not found or unauthorized");
        }
        await updateDevice(input.id, { isBlocked: 1 });
        await createDeviceHistory({
          deviceId: input.id,
          userId: ctx.user.id,
          eventType: "blocked",
          details: "Device blocked by user",
        });
        return { success: true };
      }),

    // Unblock a device
    unblock: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const device = await getDeviceById(input.id);
        if (!device || device.userId !== ctx.user.id) {
          throw new Error("Device not found or unauthorized");
        }
        await updateDevice(input.id, { isBlocked: 0 });
        await createDeviceHistory({
          deviceId: input.id,
          userId: ctx.user.id,
          eventType: "unblocked",
          details: "Device unblocked by user",
        });
        return { success: true };
      }),
  }),

  // Router settings procedures
  router: router({
    // Get router settings
    settings: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getRouterSettings(ctx.user.id);
      return settings || {
        routerIp: "",
        routerUsername: "",
        routerPasswordEncrypted: "",
        routerModel: "",
        scanInterval: 300,
        isEnabled: 0,
      };
    }),

    // Save or update router settings
    saveSettings: protectedProcedure
      .input(
        z.object({
          routerIp: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Invalid IP address"),
          routerUsername: z.string().optional(),
          routerPasswordEncrypted: z.string().optional(),
          routerModel: z.string().optional(),
          scanInterval: z.number().min(60).max(3600).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await getRouterSettings(ctx.user.id);
        if (existing) {
          return updateRouterSettings(ctx.user.id, input);
        } else {
          return createRouterSettings({
            userId: ctx.user.id,
            ...input,
            scanInterval: input.scanInterval || 300,
          });
        }
      }),
  }),

  // Security alerts procedures
  alerts: router({
    // Get all alerts for current user
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        return getAlertsByUserId(ctx.user.id, input.limit || 50);
      }),

    // Create a new alert
    create: protectedProcedure
      .input(
        z.object({
          deviceId: z.number().optional(),
          alertType: z.enum([
            "new_device",
            "high_risk_device",
            "suspicious_activity",
            "device_blocked",
            "anomaly_detected",
            "bandwidth_spike",
            "unauthorized_access",
          ]),
          severity: z.enum(["low", "medium", "high", "critical"]),
          title: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const alertData: any = {
          userId: ctx.user.id,
          alertType: input.alertType,
          severity: input.severity,
          title: input.title,
          description: input.description || null,
          isResolved: 0,
        };
        if (input.deviceId) {
          alertData.deviceId = input.deviceId;
        }
        return createAlert(alertData);
      }),
  }),

  // Network statistics procedures
  stats: router({
    // Get network overview statistics
    overview: protectedProcedure.query(async ({ ctx }) => {
      const allDevices = await getDevicesByUserId(ctx.user.id);
      const onlineDevices = allDevices.filter(d => d.isOnline === 1);
      const blockedDevices = allDevices.filter(d => d.isBlocked === 1);
      const highRiskDevices = allDevices.filter(d => d.riskScore > 70);

      return {
        totalDevices: allDevices.length,
        onlineDevices: onlineDevices.length,
        offlineDevices: allDevices.length - onlineDevices.length,
        blockedDevices: blockedDevices.length,
        highRiskDevices: highRiskDevices.length,
        averageRiskScore:
          allDevices.length > 0
            ? Math.round(
                allDevices.reduce((sum, d) => sum + d.riskScore, 0) /
                  allDevices.length
              )
            : 0,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
