import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { users, routerSettings, devices } from "../../drizzle/schema";
import { simulateDeviceScan, syncDevicesWithDatabase, calculateRiskScore } from "./deviceScanner";
import { analyzeDeviceThreat, createSecurityAlertFromThreat, detectAnomalies } from "./threatAnalyzer";
import { notifyHighRiskDevice, notifyNewDevice, notifyAnomaly } from "./notificationService";
import { getDevicesByUserId, getDeviceHistoryByDeviceId, updateDevice } from "../db";

// Store active scan intervals
const activeScanIntervals: Map<number, NodeJS.Timeout> = new Map();

/**
 * Start background scanning for a user
 */
export async function startBackgroundScanning(userId: number): Promise<void> {
  // Stop any existing scan for this user
  stopBackgroundScanning(userId);

  // Get user's router settings
  const db = await getDb();
  if (!db) return;

  const settings = await db
    .select()
    .from(routerSettings)
    .where(eq(routerSettings.userId, userId))
    .limit(1);

  if (!settings || settings.length === 0 || settings[0].isEnabled === 0) {
    return;
  }

  const scanInterval = (settings[0].scanInterval || 300) * 1000; // Convert to milliseconds

  // Start the scan interval
  const intervalId = setInterval(async () => {
    try {
      await performDeviceScan(userId, settings[0].routerIp);
    } catch (error) {
      console.error(`Error during device scan for user ${userId}:`, error);
    }
  }, scanInterval);

  activeScanIntervals.set(userId, intervalId);

  // Perform initial scan immediately
  await performDeviceScan(userId, settings[0].routerIp);
}

/**
 * Stop background scanning for a user
 */
export function stopBackgroundScanning(userId: number): void {
  const intervalId = activeScanIntervals.get(userId);
  if (intervalId) {
    clearInterval(intervalId);
    activeScanIntervals.delete(userId);
  }
}

/**
 * Perform a device scan and threat analysis
 */
async function performDeviceScan(userId: number, routerIp: string): Promise<void> {
  try {
    // Simulate device scanning (in production, use real network scanning)
    const scannedDevices = await simulateDeviceScan();

    // Sync with database
    await syncDevicesWithDatabase(userId, scannedDevices);

    // Get all devices for this user
    const allDevices = await getDevicesByUserId(userId);

    // Analyze each device for threats
    for (const device of allDevices) {
      // Get device history
      const history = await getDeviceHistoryByDeviceId(device.id, 20);

      // Analyze threat
      const threatAnalysis = await analyzeDeviceThreat(device, history);

      // Update device risk score
      if (threatAnalysis.riskScore !== device.riskScore) {
        await updateDevice(device.id, {
          riskScore: threatAnalysis.riskScore,
          riskLevel: getRiskLevel(threatAnalysis.riskScore),
        });
      }

      // Check for anomalies
      const anomaly = await detectAnomalies(device, history);
      if (anomaly.isAnomaly) {
        await notifyAnomaly(device, anomaly.reason);
      }

      // Create alert if threat level is high
      if (threatAnalysis.threatLevel === "high" || threatAnalysis.threatLevel === "critical") {
        await createSecurityAlertFromThreat(userId, device, threatAnalysis);
        if (threatAnalysis.riskScore > 80) {
          await notifyHighRiskDevice(device, threatAnalysis.riskScore);
        }
      }

      // Auto-block if recommended
      if (threatAnalysis.shouldBlock && device.isBlocked === 0) {
        await updateDevice(device.id, { isBlocked: 1 });
      }
    }

    // Update last scan time
    const db = await getDb();
    if (db) {
      await db
        .update(routerSettings)
        .set({ lastScanTime: new Date() })
        .where(eq(routerSettings.userId, userId));
    }
  } catch (error) {
    console.error(`Error performing device scan for user ${userId}:`, error);
  }
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * Initialize background jobs for all active users
 */
export async function initializeBackgroundJobs(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Get all users with enabled router settings
    const activeUsers = await db
      .select({ userId: routerSettings.userId })
      .from(routerSettings)
      .where(eq(routerSettings.isEnabled, 1));

    for (const { userId } of activeUsers) {
      startBackgroundScanning(userId);
    }

    console.log(`[Background Jobs] Started scanning for ${activeUsers.length} users`);
  } catch (error) {
    console.error("Error initializing background jobs:", error);
  }
}

/**
 * Cleanup all background jobs
 */
export function cleanupBackgroundJobs(): void {
  activeScanIntervals.forEach((intervalId) => {
    clearInterval(intervalId);
  });
  activeScanIntervals.clear();
  console.log("[Background Jobs] All scanning jobs stopped");
}
