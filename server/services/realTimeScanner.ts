/**
 * Real-Time Device Scanner
 * Implements continuous network scanning with real-time updates
 * Supports multiple routers and scheduled scanning
 */

import { scanRouter, RouterConfig, ScanResult } from "./routerManager";
import { createDevice, updateDevice, getDeviceByMac, createDeviceHistory } from "../db";

export interface ScannerConfig {
  userId: number;
  routers: RouterConfig[];
  scanInterval: number; // in seconds
  enableNotifications: boolean;
}

export interface ScannerState {
  isScanning: boolean;
  lastScanTime?: Date;
  nextScanTime?: Date;
  devicesFound: number;
  newDevices: number;
  offlineDevices: number;
  error?: string;
}

class RealTimeScanner {
  private config: ScannerConfig;
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private state: ScannerState = {
    isScanning: false,
    devicesFound: 0,
    newDevices: 0,
    offlineDevices: 0,
  };

  constructor(config: ScannerConfig) {
    this.config = config;
  }

  /**
   * Start continuous scanning
   */
  async start(): Promise<void> {
    if (this.scanInterval) {
      console.log(`[RealTimeScanner] Scanner already running for user ${this.config.userId}`);
      return;
    }

    console.log(
      `[RealTimeScanner] Starting scanner for user ${this.config.userId} with interval ${this.config.scanInterval}s`
    );

    // Perform initial scan
    await this.performScan();

    // Schedule periodic scans
    this.scanInterval = setInterval(async () => {
      await this.performScan();
    }, this.config.scanInterval * 1000);
  }

  /**
   * Stop continuous scanning
   */
  async stop(): Promise<void> {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
      console.log(`[RealTimeScanner] Scanner stopped for user ${this.config.userId}`);
    }
  }

  /**
   * Perform a single scan
   */
  private async performScan(): Promise<void> {
    if (this.state.isScanning) {
      console.log(`[RealTimeScanner] Scan already in progress for user ${this.config.userId}`);
      return;
    }

    this.state.isScanning = true;
    this.state.lastScanTime = new Date();
    this.state.nextScanTime = new Date(Date.now() + this.config.scanInterval * 1000);

    try {
      console.log(`[RealTimeScanner] Starting scan for user ${this.config.userId}`);

      let totalDevices = 0;
      let newDevicesCount = 0;

      // Scan all configured routers
      for (const routerConfig of this.config.routers) {
        try {
          const result = await scanRouter(routerConfig);

          if (result.success) {
            totalDevices += result.devicesFound;

            // Process discovered devices
            for (const device of result.devices) {
              const existingDevice = await getDeviceByMac(device.mac);

              if (!existingDevice) {
                // New device discovered
                newDevicesCount++;

                await createDevice({
                  userId: this.config.userId,
                  ipAddress: device.ip,
                  macAddress: device.mac,
                  vendor: device.vendor,
                  deviceType: device.deviceType,
                  deviceName: device.hostname || device.deviceType || "Unknown Device",
                  isOnline: !!device.isOnline,
                  isBlocked: false,
                  riskScore: this.calculateInitialRiskScore(device),
                  riskLevel: this.calculateRiskLevel(device),
                  lastSeen: new Date(),
                  firstSeen: new Date(),
                });

                console.log(
                  `[RealTimeScanner] New device discovered: ${device.mac} (${device.ip})`
                );

                // Create history entry
                await createDeviceHistory({
                  userId: this.config.userId,
                  deviceId: 0, // Will be set by the database
                  eventType: "connected",
                  details: `New device discovered on ${routerConfig.type} router`,
                });
              } else if (existingDevice.userId === this.config.userId) {
                // Update existing device
                const wasOnline = existingDevice.isOnline === true;
                const isNowOnline = device.isOnline;

                if (wasOnline && !isNowOnline) {
                  // Device went offline
                  console.log(
                    `[RealTimeScanner] Device went offline: ${device.mac} (${device.ip})`
                  );
                  this.state.offlineDevices++;
                } else if (!wasOnline && isNowOnline) {
                  // Device came back online
                  console.log(
                    `[RealTimeScanner] Device came online: ${device.mac} (${device.ip})`
                  );
                }

                await updateDevice(existingDevice.id, {
                  isOnline: !!device.isOnline,
                  lastSeen: new Date(),
                  ipAddress: device.ip, // Update IP in case it changed
                });
              }
            }
          } else {
            console.warn(
              `[RealTimeScanner] Scan failed for ${routerConfig.type} router: ${result.error}`
            );
            this.state.error = result.error;
          }
        } catch (error) {
          console.error(`[RealTimeScanner] Error scanning router:`, error);
          this.state.error = error instanceof Error ? error.message : String(error);
        }
      }

      this.state.devicesFound = totalDevices;
      this.state.newDevices = newDevicesCount;

      console.log(
        `[RealTimeScanner] Scan completed. Found ${totalDevices} devices, ${newDevicesCount} new.`
      );
    } catch (error) {
      console.error(`[RealTimeScanner] Scan error:`, error);
      this.state.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.state.isScanning = false;
    }
  }

  /**
   * Calculate initial risk score for a new device
   */
  private calculateInitialRiskScore(device: any): number {
    let score = 20; // Base score

    // Unknown devices are riskier
    if (device.vendor === "Unknown Vendor") {
      score += 30;
    }

    // Unknown device types are riskier
    if (device.deviceType === "Unknown Device") {
      score += 20;
    }

    // New devices might be suspicious
    score += 10;

    return Math.min(score, 100);
  }

  /**
   * Calculate risk level based on score
   */
  private calculateRiskLevel(device: any): "low" | "medium" | "high" | "critical" {
    const score = this.calculateInitialRiskScore(device);

    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  /**
   * Get current scanner state
   */
  getState(): ScannerState {
    return { ...this.state };
  }

  /**
   * Force an immediate scan
   */
  async forceScan(): Promise<void> {
    await this.performScan();
  }

  /**
   * Update scanner configuration
   */
  updateConfig(config: Partial<ScannerConfig>): void {
    this.config = { ...this.config, ...config };
    console.log(`[RealTimeScanner] Configuration updated for user ${this.config.userId}`);
  }
}

// Global scanner instances
const activeScanners = new Map<number, RealTimeScanner>();

/**
 * Get or create a scanner for a user
 */
export function getOrCreateScanner(config: ScannerConfig): RealTimeScanner {
  if (!activeScanners.has(config.userId)) {
    activeScanners.set(config.userId, new RealTimeScanner(config));
  }
  return activeScanners.get(config.userId)!;
}

/**
 * Start scanning for a user
 */
export async function startScanning(config: ScannerConfig): Promise<void> {
  const scanner = getOrCreateScanner(config);
  await scanner.start();
}

/**
 * Stop scanning for a user
 */
export async function stopScanning(userId: number): Promise<void> {
  const scanner = activeScanners.get(userId);
  if (scanner) {
    await scanner.stop();
    activeScanners.delete(userId);
  }
}

/**
 * Get scanner state for a user
 */
export function getScannerState(userId: number): ScannerState | null {
  const scanner = activeScanners.get(userId);
  return scanner ? scanner.getState() : null;
}

/**
 * Force immediate scan for a user
 */
export async function forceScan(userId: number): Promise<void> {
  const scanner = activeScanners.get(userId);
  if (scanner) {
    await scanner.forceScan();
  }
}

/**
 * Get all active scanners
 */
export function getActiveScanners(): Map<number, RealTimeScanner> {
  return new Map(activeScanners);
}

/**
 * Get scanner states for all active users
 */
export function getAllScannerStates(): Array<{ userId: number; state: ScannerState }> {
  const states: Array<{ userId: number; state: ScannerState }> = [];
  activeScanners.forEach((scanner, userId) => {
    states.push({ userId, state: scanner.getState() });
  });
  return states;
}

/**
 * Stop all scanners
 */
export async function stopAllScanners(): Promise<void> {
  const scannerIds = Array.from(activeScanners.keys());
  for (const userId of scannerIds) {
    const scanner = activeScanners.get(userId);
    if (scanner) {
      await scanner.stop();
    }
  }
  activeScanners.clear();
  console.log("[RealTimeScanner] All scanners stopped");
}
