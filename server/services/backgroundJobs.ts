import { getSupabaseClient } from "./supabaseClient";
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

  // Get user's router settings via Supabase
  const supabase = getSupabaseClient();
  const { data: settings, error } = await supabase
    .from("routerSettings")
    .select("*")
    .eq("userId", userId)
    .limit(1)
    .single();

  if (error || !settings || settings.isEnabled === false) {
    return;
  }

  const scanInterval = (settings.scanInterval || 300) * 1000; // Convert to milliseconds

  // Start the scan interval
  const intervalId = setInterval(async () => {
    try {
      await performDeviceScan(userId, settings.routerIp);
    } catch (err) {
      console.error(`Error during device scan for user ${userId}:`, err);
    }
  }, scanInterval);

  activeScanIntervals.set(userId, intervalId);

  // Perform initial scan immediately
  await performDeviceScan(userId, settings.routerIp);
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

      // Auto-block if recommended and not already blocked
      if (threatAnalysis.shouldBlock && device.isBlocked === false) {
        await updateDevice(device.id, { isBlocked: true });
      }
    }

    // Update last scan time via Supabase
    const supabase = getSupabaseClient();
    await supabase
      .from("routerSettings")
      .update({ lastScanTime: new Date().toISOString() })
      .eq("userId", userId);
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
    const supabase = getSupabaseClient();

    // Get all users with enabled router settings
    const { data: activeUsers, error } = await supabase
      .from("routerSettings")
      .select("userId")
      .eq("isEnabled", true);

    if (error) {
      console.error("[Background Jobs] Failed to fetch active users:", error.message);
      return;
    }

    for (const { userId } of activeUsers ?? []) {
      startBackgroundScanning(userId);
    }

    console.log(`[Background Jobs] Started scanning for ${(activeUsers ?? []).length} users`);
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
