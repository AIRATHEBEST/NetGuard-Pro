import { execSync, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface PingResult {
  ip: string;
  latencyMs: number | null;
  packetLoss: number;
  isReachable: boolean;
  timestamp: Date;
}

export interface BandwidthMetrics {
  uploadBytesPerSecond: number;
  downloadBytesPerSecond: number;
  totalUploadBytes: number;
  totalDownloadBytes: number;
}

export interface DevicePerformance {
  ip: string;
  latencyMs: number | null;
  packetLoss: number;
  isReachable: boolean;
  uptime: number; // percentage
  lastChecked: Date;
}

/**
 * Ping a device and return latency and packet loss
 */
export async function pingDevice(ip: string, count: number = 4): Promise<PingResult> {
  try {
    // Validate IP format
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      return {
        ip,
        latencyMs: null,
        packetLoss: 100,
        isReachable: false,
        timestamp: new Date(),
      };
    }

    const { stdout } = await execAsync(
      `ping -c ${count} -W 2 ${ip} 2>&1`,
      { timeout: 15000 }
    );

    // Parse latency from ping output
    // e.g. "rtt min/avg/max/mdev = 1.234/2.345/3.456/0.789 ms"
    const rttMatch = stdout.match(/rtt min\/avg\/max\/mdev = [\d.]+\/([\d.]+)\/[\d.]+\/[\d.]+ ms/);
    const latencyMs = rttMatch ? parseFloat(rttMatch[1]) : null;

    // Parse packet loss
    // e.g. "4 packets transmitted, 4 received, 0% packet loss"
    const lossMatch = stdout.match(/(\d+)% packet loss/);
    const packetLoss = lossMatch ? parseInt(lossMatch[1]) : 100;

    return {
      ip,
      latencyMs,
      packetLoss,
      isReachable: packetLoss < 100,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      ip,
      latencyMs: null,
      packetLoss: 100,
      isReachable: false,
      timestamp: new Date(),
    };
  }
}

/**
 * Ping multiple devices concurrently
 */
export async function pingMultipleDevices(ips: string[]): Promise<PingResult[]> {
  const results = await Promise.all(
    ips.map(ip => pingDevice(ip, 3))
  );
  return results;
}

/**
 * Get network interface statistics (bandwidth)
 */
export async function getNetworkStats(): Promise<BandwidthMetrics> {
  try {
    const { stdout } = await execAsync("cat /proc/net/dev 2>&1");
    const lines = stdout.split("\n");
    let totalRxBytes = 0;
    let totalTxBytes = 0;

    for (const line of lines) {
      // Skip header lines and loopback
      if (line.includes(":") && !line.includes("lo:")) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 10) {
          totalRxBytes += parseInt(parts[1]) || 0;
          totalTxBytes += parseInt(parts[9]) || 0;
        }
      }
    }

    return {
      uploadBytesPerSecond: 0, // Would need sampling over time
      downloadBytesPerSecond: 0,
      totalUploadBytes: totalTxBytes,
      totalDownloadBytes: totalRxBytes,
    };
  } catch (error) {
    return {
      uploadBytesPerSecond: 0,
      downloadBytesPerSecond: 0,
      totalUploadBytes: 0,
      totalDownloadBytes: 0,
    };
  }
}

/**
 * Calculate uptime percentage from device history
 */
export function calculateUptimePercentage(
  onlineChecks: number,
  totalChecks: number
): number {
  if (totalChecks === 0) return 0;
  return Math.round((onlineChecks / totalChecks) * 100);
}

/**
 * Get comprehensive performance metrics for a device
 */
export async function getDevicePerformanceMetrics(
  ip: string
): Promise<DevicePerformance> {
  const pingResult = await pingDevice(ip, 5);

  return {
    ip,
    latencyMs: pingResult.latencyMs,
    packetLoss: pingResult.packetLoss,
    isReachable: pingResult.isReachable,
    uptime: pingResult.isReachable ? 100 : 0,
    lastChecked: new Date(),
  };
}

/**
 * Classify latency quality
 */
export function classifyLatency(latencyMs: number | null): "excellent" | "good" | "fair" | "poor" | "unreachable" {
  if (latencyMs === null) return "unreachable";
  if (latencyMs < 10) return "excellent";
  if (latencyMs < 50) return "good";
  if (latencyMs < 150) return "fair";
  return "poor";
}
