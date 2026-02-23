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
    list: protectedProcedure.query(async ({ ctx }) => {
      return getDevicesByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getDeviceById(input.id);
      }),

    history: protectedProcedure
      .input(z.object({ deviceId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return getDeviceHistoryByDeviceId(input.deviceId, input.limit);
      }),

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

    block: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const device = await getDeviceById(input.id);
        if (!device || device.userId !== ctx.user.id) {
          throw new Error("Device not found or unauthorized");
        }
        await updateDevice(input.id, { isBlocked: true });
        await createDeviceHistory({
          deviceId: input.id,
          userId: ctx.user.id,
          eventType: "blocked",
          details: "Device blocked by user",
        });
        return { success: true };
      }),

    unblock: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const device = await getDeviceById(input.id);
        if (!device || device.userId !== ctx.user.id) {
          throw new Error("Device not found or unauthorized");
        }
        await updateDevice(input.id, { isBlocked: false });
        await createDeviceHistory({
          deviceId: input.id,
          userId: ctx.user.id,
          eventType: "unblocked",
          details: "Device unblocked by user",
        });
        return { success: true };
      }),

    // Fingerprint a device based on MAC address
    fingerprint: protectedProcedure
      .input(z.object({ mac: z.string() }))
      .query(async ({ input }) => {
        const { identifyDeviceFromMac } = await import("./services/deviceFingerprint");
        return identifyDeviceFromMac(input.mac);
      }),
  }),

  // Router management procedures
  router: router({
    settings: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getRouterSettings(ctx.user.id);
      return settings || {
        routerIp: "",
        routerUsername: "",
        routerPasswordEncrypted: "",
        routerModel: "",
        scanInterval: 300,
        isEnabled: false,
      };
    }),

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

    scan: protectedProcedure
      .input(
        z.object({
          routerType: z.enum(["huawei", "rain101"]),
          routerIp: z.string(),
          username: z.string(),
          password: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const routerManager = await import("./services/routerManager");
          const result = await routerManager.scanRouter({
            type: input.routerType,
            ip: input.routerIp,
            username: input.username,
            password: input.password,
          });

          if (result.success) {
            for (const device of result.devices) {
              const existingDevice = await getDeviceByMac(device.mac);
              if (existingDevice) {
                await updateDevice(existingDevice.id, {
                  isOnline: !!device.isOnline,
                  lastSeen: new Date(),
                });
              } else {
                await createDevice({
                  userId: ctx.user.id,
                  ipAddress: device.ip,
                  macAddress: device.mac,
                  vendor: device.vendor,
                  deviceType: device.deviceType,
                  deviceName: device.hostname || device.deviceType || "Unknown Device",
                  isOnline: !!device.isOnline,
                  isBlocked: false,
                  riskScore: 30,
                  riskLevel: "low",
                  lastSeen: new Date(),
                  firstSeen: new Date(),
                });
              }
            }
          }

          return result;
        } catch (error) {
          console.error("Router scan error:", error);
          throw new Error("Failed to scan router");
        }
      }),

    blockDevice: protectedProcedure
      .input(
        z.object({
          routerType: z.enum(["huawei", "rain101"]),
          routerIp: z.string(),
          username: z.string(),
          password: z.string(),
          mac: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const routerManager = await import("./services/routerManager");
          const success = await routerManager.blockDeviceOnRouter(
            {
              type: input.routerType,
              ip: input.routerIp,
              username: input.username,
              password: input.password,
            },
            input.mac
          );

          if (success) {
            const device = await getDeviceByMac(input.mac);
            if (device) {
              await updateDevice(device.id, { isBlocked: true });
            }
          }

          return { success };
        } catch (error) {
          console.error("Block device error:", error);
          throw new Error("Failed to block device");
        }
      }),

    unblockDevice: protectedProcedure
      .input(
        z.object({
          routerType: z.enum(["huawei", "rain101"]),
          routerIp: z.string(),
          username: z.string(),
          password: z.string(),
          mac: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const routerManager = await import("./services/routerManager");
          const success = await routerManager.unblockDeviceOnRouter(
            {
              type: input.routerType,
              ip: input.routerIp,
              username: input.username,
              password: input.password,
            },
            input.mac
          );

          if (success) {
            const device = await getDeviceByMac(input.mac);
            if (device) {
              await updateDevice(device.id, { isBlocked: false });
            }
          }

          return { success };
        } catch (error) {
          console.error("Unblock device error:", error);
          throw new Error("Failed to unblock device");
        }
      }),
  }),

  // Security alerts procedures
  alerts: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        return getAlertsByUserId(ctx.user.id, input.limit || 50);
      }),

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

    resolve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getSupabaseClient } = await import("./services/supabaseClient");
        const supabase = getSupabaseClient();
        const { error } = await supabase
          .from("securityAlerts")
          .update({ isResolved: true, resolvedAt: new Date().toISOString() })
          .eq("id", input.id)
          .eq("userId", ctx.user.id);
        if (error) throw new Error(error.message);
        return { success: true };
      }),
  }),

  // Network statistics procedures
  stats: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      const allDevices = await getDevicesByUserId(ctx.user.id);
      const onlineDevices = allDevices.filter(d => d.isOnline === true);
      const blockedDevices = allDevices.filter(d => d.isBlocked === true);
      const highRiskDevices = allDevices.filter(d => d.riskScore > 70);
      const allAlerts = await getAlertsByUserId(ctx.user.id, 1000);
      const unresolvedAlerts = allAlerts.filter(a => !a.isResolved);

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
        totalAlerts: allAlerts.length,
        unresolvedAlerts: unresolvedAlerts.length,
      };
    }),
  }),

  // Performance monitoring procedures
  performance: router({
    // Ping a single device
    ping: protectedProcedure
      .input(z.object({
        ip: z.string(),
        count: z.number().min(1).max(20).optional(),
      }))
      .mutation(async ({ input }) => {
        const { performPingTest } = await import("./services/networkDiagnostics");
        return performPingTest(input.ip, input.count || 10);
      }),

    // Ping multiple devices (batch)
    pingBatch: protectedProcedure
      .input(z.object({ ips: z.array(z.string()).max(20) }))
      .mutation(async ({ input }) => {
        const { pingDevice } = await import("./services/performanceMonitor");
        const results = await Promise.all(
          input.ips.map(ip => pingDevice(ip, 3))
        );
        return results;
      }),

    // Get network interface stats
    networkStats: protectedProcedure.query(async () => {
      const { getNetworkStats } = await import("./services/performanceMonitor");
      return getNetworkStats();
    }),

    // Get device performance metrics
    deviceMetrics: protectedProcedure
      .input(z.object({ ip: z.string() }))
      .query(async ({ input }) => {
        const { getDevicePerformanceMetrics } = await import("./services/performanceMonitor");
        return getDevicePerformanceMetrics(input.ip);
      }),
  }),

  // Port scanning procedures
  portScan: router({
    // Quick scan of common ports
    quick: protectedProcedure
      .input(z.object({ ip: z.string() }))
      .mutation(async ({ input }) => {
        const { quickScan } = await import("./services/portScanner");
        return quickScan(input.ip);
      }),

    // Full port scan with custom range
    full: protectedProcedure
      .input(z.object({
        ip: z.string(),
        portRange: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { scanPorts } = await import("./services/portScanner");
        return scanPorts(input.ip, input.portRange || "1-1024");
      }),
  }),

  // Network diagnostics (DNS, Traceroute)
  diagnostics: router({
    // DNS lookup
    dns: protectedProcedure
      .input(z.object({
        domain: z.string(),
        recordType: z.enum(["A", "AAAA", "MX", "TXT", "NS", "CNAME"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { performDnsLookup } = await import("./services/networkDiagnostics");
        return performDnsLookup(input.domain, input.recordType || "A");
      }),

    // Traceroute
    traceroute: protectedProcedure
      .input(z.object({
        host: z.string(),
        maxHops: z.number().min(1).max(30).optional(),
      }))
      .mutation(async ({ input }) => {
        const { performTraceroute } = await import("./services/networkDiagnostics");
        return performTraceroute(input.host, input.maxHops || 30);
      }),

    // Get network interfaces
    interfaces: protectedProcedure.query(async () => {
      const { getNetworkInterfaces } = await import("./services/networkDiagnostics");
      return getNetworkInterfaces();
    }),

    // Reverse DNS lookup
    reverseDns: protectedProcedure
      .input(z.object({ ip: z.string() }))
      .mutation(async ({ input }) => {
        const { reverseDnsLookup } = await import("./services/networkDiagnostics");
        const hostnames = await reverseDnsLookup(input.ip);
        return { ip: input.ip, hostnames };
      }),
  }),

  // Network topology procedures
  topology: router({
    // Get topology built from existing devices in DB
    get: protectedProcedure.query(async ({ ctx }) => {
      const devices = await getDevicesByUserId(ctx.user.id);
      const routerSettings = await getRouterSettings(ctx.user.id);
      const { buildTopologyFromDevices } = await import("./services/networkTopology");
      return buildTopologyFromDevices(
        devices,
        routerSettings?.routerIp || undefined
      );
    }),

    // Discover live topology via network scan
    discover: protectedProcedure
      .input(z.object({ subnet: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { discoverNetworkTopology } = await import("./services/networkTopology");
        return discoverNetworkTopology(input.subnet);
      }),
  }),

  // Report generation procedures
  reports: router({
    // Generate CSV report
    csv: protectedProcedure.query(async ({ ctx }) => {
      const devices = await getDevicesByUserId(ctx.user.id);
      const alerts = await getAlertsByUserId(ctx.user.id, 1000);
      const onlineDevices = devices.filter(d => d.isOnline === true);
      const blockedDevices = devices.filter(d => d.isBlocked === true);
      const highRiskDevices = devices.filter(d => d.riskScore > 70);
      const unresolvedAlerts = alerts.filter(a => !a.isResolved);

      const { generateCsvReport } = await import("./services/reportGenerator");
      const csv = generateCsvReport({
        generatedAt: new Date(),
        title: "Network Security Report",
        summary: {
          totalDevices: devices.length,
          onlineDevices: onlineDevices.length,
          offlineDevices: devices.length - onlineDevices.length,
          blockedDevices: blockedDevices.length,
          highRiskDevices: highRiskDevices.length,
          averageRiskScore:
            devices.length > 0
              ? Math.round(devices.reduce((sum, d) => sum + d.riskScore, 0) / devices.length)
              : 0,
          totalAlerts: alerts.length,
          unresolvedAlerts: unresolvedAlerts.length,
        },
        devices: devices.map(d => ({
          id: d.id,
          ipAddress: d.ipAddress,
          macAddress: d.macAddress,
          deviceName: d.deviceName,
          vendor: d.vendor,
          isOnline: !!d.isOnline,
          isBlocked: !!d.isBlocked,
          riskScore: d.riskScore,
          riskLevel: d.riskLevel,
          firstSeen: d.firstSeen,
          lastSeen: d.lastSeen,
        })),
        alerts: alerts.map(a => ({
          id: a.id,
          alertType: a.alertType,
          severity: a.severity,
          title: a.title,
          description: a.description,
          isResolved: !!a.isResolved,
          createdAt: a.createdAt,
        })),
      });

      return { csv, filename: `netguard-report-${new Date().toISOString().split("T")[0]}.csv` };
    }),

    // Generate HTML report
    html: protectedProcedure.query(async ({ ctx }) => {
      const devices = await getDevicesByUserId(ctx.user.id);
      const alerts = await getAlertsByUserId(ctx.user.id, 1000);
      const onlineDevices = devices.filter(d => d.isOnline === true);
      const blockedDevices = devices.filter(d => d.isBlocked === true);
      const highRiskDevices = devices.filter(d => d.riskScore > 70);
      const unresolvedAlerts = alerts.filter(a => !a.isResolved);

      const { generateHtmlReport } = await import("./services/reportGenerator");
      const html = generateHtmlReport({
        generatedAt: new Date(),
        title: "Network Security Report",
        summary: {
          totalDevices: devices.length,
          onlineDevices: onlineDevices.length,
          offlineDevices: devices.length - onlineDevices.length,
          blockedDevices: blockedDevices.length,
          highRiskDevices: highRiskDevices.length,
          averageRiskScore:
            devices.length > 0
              ? Math.round(devices.reduce((sum, d) => sum + d.riskScore, 0) / devices.length)
              : 0,
          totalAlerts: alerts.length,
          unresolvedAlerts: unresolvedAlerts.length,
        },
        devices: devices.map(d => ({
          id: d.id,
          ipAddress: d.ipAddress,
          macAddress: d.macAddress,
          deviceName: d.deviceName,
          vendor: d.vendor,
          isOnline: !!d.isOnline,
          isBlocked: !!d.isBlocked,
          riskScore: d.riskScore,
          riskLevel: d.riskLevel,
          firstSeen: d.firstSeen,
          lastSeen: d.lastSeen,
        })),
        alerts: alerts.map(a => ({
          id: a.id,
          alertType: a.alertType,
          severity: a.severity,
          title: a.title,
          description: a.description,
          isResolved: !!a.isResolved,
          createdAt: a.createdAt,
        })),
      });

      return { html, filename: `netguard-report-${new Date().toISOString().split("T")[0]}.html` };
    }),
  }),
});

export type AppRouter = typeof appRouter;
