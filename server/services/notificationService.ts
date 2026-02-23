import { notifyOwner } from "../_core/notification";
import { SecurityAlert, Device } from "@shared/types";

/**
 * Send notification for new device detection
 */
export async function notifyNewDevice(device: Device): Promise<boolean> {
  try {
    return await notifyOwner({
      title: "New Device Detected",
      content: `A new device has connected to your network: ${device.deviceName || device.ipAddress} (${device.vendor || "Unknown"})`,
    });
  } catch (error) {
    console.error("Error sending new device notification:", error);
    return false;
  }
}

/**
 * Send notification for high-risk device
 */
export async function notifyHighRiskDevice(device: Device, riskScore: number): Promise<boolean> {
  try {
    return await notifyOwner({
      title: "High-Risk Device Detected",
      content: `A high-risk device has been detected on your network: ${device.deviceName || device.ipAddress} with risk score ${riskScore}/100. Immediate action may be required.`,
    });
  } catch (error) {
    console.error("Error sending high-risk device notification:", error);
    return false;
  }
}

/**
 * Send notification for suspicious activity
 */
export async function notifySuspiciousActivity(
  device: Device,
  activityDescription: string
): Promise<boolean> {
  try {
    return await notifyOwner({
      title: "Suspicious Activity Detected",
      content: `Suspicious activity detected on ${device.deviceName || device.ipAddress}: ${activityDescription}`,
    });
  } catch (error) {
    console.error("Error sending suspicious activity notification:", error);
    return false;
  }
}

/**
 * Send notification for device blocked
 */
export async function notifyDeviceBlocked(device: Device): Promise<boolean> {
  try {
    return await notifyOwner({
      title: "Device Blocked",
      content: `Device ${device.deviceName || device.ipAddress} has been blocked from network access.`,
    });
  } catch (error) {
    console.error("Error sending device blocked notification:", error);
    return false;
  }
}

/**
 * Send notification for security alert
 */
export async function notifySecurityAlert(alert: SecurityAlert): Promise<boolean> {
  try {
    return await notifyOwner({
      title: `Security Alert: ${alert.title}`,
      content: alert.description || "A security alert has been triggered on your network.",
    });
  } catch (error) {
    console.error("Error sending security alert notification:", error);
    return false;
  }
}

/**
 * Send daily security summary
 */
export async function sendSecuritySummary(
  totalDevices: number,
  onlineDevices: number,
  highRiskDevices: number,
  alertsCount: number
): Promise<boolean> {
  try {
    const summary = `
Daily Network Security Summary:
- Total Devices: ${totalDevices}
- Online Devices: ${onlineDevices}
- High-Risk Devices: ${highRiskDevices}
- Security Alerts: ${alertsCount}

Review your dashboard for more details.
    `.trim();

    return await notifyOwner({
      title: "Daily Security Summary",
      content: summary,
    });
  } catch (error) {
    console.error("Error sending security summary:", error);
    return false;
  }
}

/**
 * Send anomaly detection alert
 */
export async function notifyAnomaly(device: Device, anomalyDescription: string): Promise<boolean> {
  try {
    return await notifyOwner({
      title: "Network Anomaly Detected",
      content: `An unusual pattern has been detected on ${device.deviceName || device.ipAddress}: ${anomalyDescription}`,
    });
  } catch (error) {
    console.error("Error sending anomaly notification:", error);
    return false;
  }
}

/**
 * Send bandwidth spike alert
 */
export async function notifyBandwidthSpike(
  device: Device,
  uploadSpeed: number,
  downloadSpeed: number
): Promise<boolean> {
  try {
    return await notifyOwner({
      title: "Bandwidth Spike Detected",
      content: `Device ${device.deviceName || device.ipAddress} is using unusual bandwidth: Upload ${uploadSpeed} Mbps, Download ${downloadSpeed} Mbps`,
    });
  } catch (error) {
    console.error("Error sending bandwidth spike notification:", error);
    return false;
  }
}
