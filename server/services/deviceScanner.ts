import { exec } from "child_process";
import { promisify } from "util";
import { createDevice, getDeviceByMac, updateDevice, getDevicesByUserId, createDeviceHistory } from "../db";

const execAsync = promisify(exec);

// Vendor lookup database (simplified - in production use a full OUI database)
const vendorDatabase: Record<string, string> = {
  "00:1A:2B": "Apple Inc.",
  "00:50:F2": "Microsoft Corporation",
  "00:0C:29": "VMware Inc.",
  "00:05:69": "Cisco Systems",
  "B8:27:EB": "Raspberry Pi Foundation",
  "DC:A6:32": "Raspberry Pi Foundation",
  "08:00:27": "Oracle VirtualBox",
  "52:54:00": "QEMU",
};

interface ScannedDevice {
  ip: string;
  mac: string;
  vendor?: string;
  deviceType?: string;
  hostname?: string;
}

/**
 * Scan the local network for connected devices using ARP
 * This is a simplified implementation - in production, use a proper network scanning library
 */
export async function scanNetworkDevices(routerIp: string): Promise<ScannedDevice[]> {
  try {
    // Extract network from router IP (e.g., 192.168.1.0/24)
    const parts = routerIp.split(".");
    const network = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;

    // Use arp-scan or nmap if available, otherwise use ping-based discovery
    const devices: ScannedDevice[] = [];

    // Simplified: scan common IP range
    for (let i = 1; i <= 254; i++) {
      const ip = `${parts[0]}.${parts[1]}.${parts[2]}.${i}`;
      try {
        // Try to ping the device
        const { stdout } = await execAsync(`ping -c 1 -W 1 ${ip}`, {
          timeout: 5000,
        }).catch(() => ({ stdout: "" }));

        if (stdout.includes("1 received")) {
          // Device is online, try to get MAC address
          const { stdout: arpOutput } = await execAsync(`arp -n ${ip}`, {
            timeout: 5000,
          }).catch(() => ({ stdout: "" }));

          const macMatch = arpOutput.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
          if (macMatch) {
            const mac = macMatch[0];
            const vendor = getVendorFromMac(mac);
            devices.push({
              ip,
              mac,
              vendor,
              deviceType: classifyDeviceType(vendor),
            });
          }
        }
      } catch (error) {
        // Continue scanning
      }
    }

    return devices;
  } catch (error) {
    console.error("Network scanning error:", error);
    return [];
  }
}

/**
 * Get vendor name from MAC address
 */
function getVendorFromMac(mac: string): string {
  const prefix = mac.substring(0, 8).toUpperCase();
  return vendorDatabase[prefix] || "Unknown Vendor";
}

/**
 * Classify device type based on vendor and characteristics
 */
function classifyDeviceType(vendor: string): string {
  const vendorLower = vendor.toLowerCase();

  if (vendorLower.includes("apple")) return "iPhone/iPad/Mac";
  if (vendorLower.includes("microsoft")) return "Windows Device";
  if (vendorLower.includes("raspberry")) return "Raspberry Pi";
  if (vendorLower.includes("vmware") || vendorLower.includes("virtualbox")) return "Virtual Machine";
  if (vendorLower.includes("cisco") || vendorLower.includes("router")) return "Network Device";
  if (vendorLower.includes("printer")) return "Printer";
  if (vendorLower.includes("camera")) return "IP Camera";
  if (vendorLower.includes("tv") || vendorLower.includes("samsung")) return "Smart TV";
  if (vendorLower.includes("google")) return "Google Device";
  if (vendorLower.includes("amazon")) return "Amazon Device";

  return "Unknown Device";
}

/**
 * Calculate risk score for a device based on various factors
 */
export function calculateRiskScore(device: ScannedDevice, isNewDevice: boolean = false): number {
  let score = 0;

  // New devices get higher initial risk
  if (isNewDevice) {
    score += 20;
  }

  // Unknown vendors are riskier
  if (device.vendor === "Unknown Vendor") {
    score += 15;
  }

  // Certain device types are riskier
  const riskyTypes = ["Unknown Device", "Network Device"];
  if (riskyTypes.includes(device.deviceType || "")) {
    score += 10;
  }

  // IoT devices might have higher risk
  const iotTypes = ["Smart TV", "IP Camera", "Printer"];
  if (iotTypes.includes(device.deviceType || "")) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Sync scanned devices with database
 */
export async function syncDevicesWithDatabase(
  userId: number,
  scannedDevices: ScannedDevice[]
): Promise<void> {
  const existingDevices = await getDevicesByUserId(userId);

  // Check for new devices
  for (const scannedDevice of scannedDevices) {
    const existing = existingDevices.find((d) => d.macAddress === scannedDevice.mac);

    if (!existing) {
      // New device detected
      const riskScore = calculateRiskScore(scannedDevice, true);
      await createDevice({
        userId,
        ipAddress: scannedDevice.ip,
        macAddress: scannedDevice.mac,
        vendor: scannedDevice.vendor,
        deviceType: scannedDevice.deviceType,
        isOnline: 1,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        lastSeen: new Date(),
        firstSeen: new Date(),
      });

      // Note: History entry creation will be done after device is created
      // to get the correct deviceId from the database
    } else {
      // Update existing device
      await updateDevice(existing.id, {
        isOnline: 1,
        lastSeen: new Date(),
        ipAddress: scannedDevice.ip,
      });
    }
  }

  // Check for offline devices
  const scannedMacs = scannedDevices.map((d) => d.mac);
  for (const device of existingDevices) {
    if (!scannedMacs.includes(device.macAddress) && device.isOnline === 1) {
      await updateDevice(device.id, {
        isOnline: 0,
        lastSeen: new Date(),
      });

      // Create history entry
      await createDeviceHistory({
        userId,
        deviceId: device.id,
        eventType: "disconnected",
        details: "Device went offline",
      });
    }
  }
}

/**
 * Get risk level based on score
 */
function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * Simulate device scanning for demo purposes
 */
export async function simulateDeviceScan(): Promise<ScannedDevice[]> {
  return [
    {
      ip: "192.168.1.10",
      mac: "00:1A:2B:3C:4D:5E",
      vendor: "Apple Inc.",
      deviceType: "iPhone/iPad/Mac",
      hostname: "iPhone-User",
    },
    {
      ip: "192.168.1.20",
      mac: "B8:27:EB:12:34:56",
      vendor: "Raspberry Pi Foundation",
      deviceType: "Raspberry Pi",
      hostname: "raspberrypi",
    },
    {
      ip: "192.168.1.30",
      mac: "00:50:F2:AB:CD:EF",
      vendor: "Microsoft Corporation",
      deviceType: "Windows Device",
      hostname: "DESKTOP-USER",
    },
    {
      ip: "192.168.1.40",
      mac: "DC:A6:32:78:9A:BC",
      vendor: "Raspberry Pi Foundation",
      deviceType: "Raspberry Pi",
      hostname: "homeserver",
    },
    {
      ip: "192.168.1.50",
      mac: "AA:BB:CC:DD:EE:FF",
      vendor: "Unknown Vendor",
      deviceType: "Unknown Device",
      hostname: "unknown-device",
    },
  ];
}
