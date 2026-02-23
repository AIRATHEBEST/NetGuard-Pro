/**
 * Router Manager Service
 * Unified interface for managing multiple router types
 * Supports: Huawei, RAIN 101, and extensible for other models
 */

import { scanHuaweiRouter, HuaweiDevice } from "./huaweiScraper";
import { scanRAINRouter, RAINDevice } from "./rainScraper";

export type RouterType = "huawei" | "rain101" | "generic";

export interface RouterConfig {
  type: RouterType;
  ip: string;
  username: string;
  password: string;
}

export interface UnifiedDevice {
  ip: string;
  mac: string;
  hostname?: string;
  deviceType?: string;
  vendor?: string;
  isOnline: boolean;
  lastSeen: Date;
  routerType: RouterType;
  routerIp: string;
  signal?: number;
  bandwidth?: number;
}

export interface ScanResult {
  success: boolean;
  routerType: RouterType;
  routerIp: string;
  devicesFound: number;
  devices: UnifiedDevice[];
  error?: string;
  timestamp: Date;
}

/**
 * Scan a router for connected devices
 */
export async function scanRouter(config: RouterConfig): Promise<ScanResult> {
  const startTime = Date.now();

  try {
    console.log(`[RouterManager] Starting scan for ${config.type} router at ${config.ip}`);

    let devices: any[] = [];

    switch (config.type) {
      case "huawei":
        devices = await scanHuaweiRouter(config.ip, config.username, config.password);
        break;

      case "rain101":
        devices = await scanRAINRouter(config.ip, config.username, config.password);
        break;

      default:
        throw new Error(`Unsupported router type: ${config.type}`);
    }

    // Convert to unified format
    const unifiedDevices: UnifiedDevice[] = devices.map((device) => ({
      ip: device.ip,
      mac: device.mac,
      hostname: device.hostname,
      deviceType: device.deviceType,
      vendor: device.vendor,
      isOnline: device.isOnline,
      lastSeen: device.lastSeen || new Date(),
      routerType: config.type,
      routerIp: config.ip,
      signal: device.signal,
      bandwidth: device.bandwidth,
    }));

    const duration = Date.now() - startTime;
    console.log(
      `[RouterManager] Scan completed in ${duration}ms. Found ${unifiedDevices.length} devices.`
    );

    return {
      success: true,
      routerType: config.type,
      routerIp: config.ip,
      devicesFound: unifiedDevices.length,
      devices: unifiedDevices,
      timestamp: new Date(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(
      `[RouterManager] Scan failed after ${duration}ms: ${errorMessage}`
    );

    return {
      success: false,
      routerType: config.type,
      routerIp: config.ip,
      devicesFound: 0,
      devices: [],
      error: errorMessage,
      timestamp: new Date(),
    };
  }
}

/**
 * Scan multiple routers
 */
export async function scanMultipleRouters(
  configs: RouterConfig[]
): Promise<ScanResult[]> {
  console.log(`[RouterManager] Starting multi-router scan for ${configs.length} routers`);

  const results = await Promise.all(configs.map((config) => scanRouter(config)));

  const successCount = results.filter((r) => r.success).length;
  const totalDevices = results.reduce((sum, r) => sum + r.devicesFound, 0);

  console.log(
    `[RouterManager] Multi-router scan complete. ${successCount}/${configs.length} successful, ${totalDevices} total devices found.`
  );

  return results;
}

/**
 * Block a device on a specific router
 */
export async function blockDeviceOnRouter(
  config: RouterConfig,
  mac: string
): Promise<boolean> {
  try {
    console.log(`[RouterManager] Blocking device ${mac} on ${config.type} router`);

    switch (config.type) {
      case "huawei": {
        const { HuaweiScraper } = await import("./huaweiScraper");
        const scraper = new HuaweiScraper({
          routerIp: config.ip,
          username: config.username,
          password: config.password,
        });
        const authenticated = await scraper.authenticate();
        if (!authenticated) throw new Error("Failed to authenticate");
        const result = await scraper.blockDevice(mac);
        await scraper.logout();
        return result;
      }

      case "rain101": {
        const { RAINScraper } = await import("./rainScraper");
        const scraper = new RAINScraper({
          routerIp: config.ip,
          username: config.username,
          password: config.password,
        });
        const authenticated = await scraper.authenticate();
        if (!authenticated) throw new Error("Failed to authenticate");
        const result = await scraper.blockDevice(mac);
        await scraper.logout();
        return result;
      }

      default:
        throw new Error(`Unsupported router type: ${config.type}`);
    }
  } catch (error) {
    console.error("[RouterManager] Error blocking device:", error);
    return false;
  }
}

/**
 * Unblock a device on a specific router
 */
export async function unblockDeviceOnRouter(
  config: RouterConfig,
  mac: string
): Promise<boolean> {
  try {
    console.log(`[RouterManager] Unblocking device ${mac} on ${config.type} router`);

    switch (config.type) {
      case "huawei": {
        const { HuaweiScraper } = await import("./huaweiScraper");
        const scraper = new HuaweiScraper({
          routerIp: config.ip,
          username: config.username,
          password: config.password,
        });
        const authenticated = await scraper.authenticate();
        if (!authenticated) throw new Error("Failed to authenticate");
        const result = await scraper.unblockDevice(mac);
        await scraper.logout();
        return result;
      }

      case "rain101": {
        const { RAINScraper } = await import("./rainScraper");
        const scraper = new RAINScraper({
          routerIp: config.ip,
          username: config.username,
          password: config.password,
        });
        const authenticated = await scraper.authenticate();
        if (!authenticated) throw new Error("Failed to authenticate");
        const result = await scraper.unblockDevice(mac);
        await scraper.logout();
        return result;
      }

      default:
        throw new Error(`Unsupported router type: ${config.type}`);
    }
  } catch (error) {
    console.error("[RouterManager] Error unblocking device:", error);
    return false;
  }
}

/**
 * Get router statistics
 */
export async function getRouterStats(config: RouterConfig): Promise<any> {
  try {
    console.log(`[RouterManager] Fetching stats for ${config.type} router`);

    switch (config.type) {
      case "huawei": {
        const { HuaweiScraper } = await import("./huaweiScraper");
        const scraper = new HuaweiScraper({
          routerIp: config.ip,
          username: config.username,
          password: config.password,
        });
        const authenticated = await scraper.authenticate();
        if (!authenticated) throw new Error("Failed to authenticate");
        const stats = await scraper.getRouterStats();
        await scraper.logout();
        return stats;
      }

      case "rain101": {
        const { RAINScraper } = await import("./rainScraper");
        const scraper = new RAINScraper({
          routerIp: config.ip,
          username: config.username,
          password: config.password,
        });
        const authenticated = await scraper.authenticate();
        if (!authenticated) throw new Error("Failed to authenticate");
        const stats = await scraper.getRouterStats();
        await scraper.logout();
        return stats;
      }

      default:
        throw new Error(`Unsupported router type: ${config.type}`);
    }
  } catch (error) {
    console.error("[RouterManager] Error fetching stats:", error);
    return null;
  }
}
