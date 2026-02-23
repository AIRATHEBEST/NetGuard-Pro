/**
 * Device Fingerprinting & Geolocation Service
 * Identifies device types based on MAC vendor, open ports, and network behavior
 */

// MAC vendor prefix database (OUI - Organizationally Unique Identifier)
const MAC_VENDOR_PATTERNS: Record<string, { vendor: string; deviceType: string; icon: string }> = {
  // Apple
  "00:1A:2B": { vendor: "Apple", deviceType: "iPhone/iPad/Mac", icon: "📱" },
  "A4:C3:F0": { vendor: "Apple", deviceType: "iPhone", icon: "📱" },
  "F0:18:98": { vendor: "Apple", deviceType: "MacBook", icon: "💻" },
  "3C:22:FB": { vendor: "Apple", deviceType: "Apple Device", icon: "🍎" },
  // Samsung
  "00:16:32": { vendor: "Samsung", deviceType: "Samsung Device", icon: "📱" },
  "8C:77:12": { vendor: "Samsung", deviceType: "Samsung Phone", icon: "📱" },
  "CC:07:AB": { vendor: "Samsung", deviceType: "Samsung TV", icon: "📺" },
  // Huawei
  "00:E0:FC": { vendor: "Huawei", deviceType: "Huawei Router", icon: "📡" },
  "48:DB:50": { vendor: "Huawei", deviceType: "Huawei Device", icon: "📱" },
  "28:31:52": { vendor: "Huawei", deviceType: "Huawei Router", icon: "📡" },
  // Xiaomi
  "28:6C:07": { vendor: "Xiaomi", deviceType: "Xiaomi Device", icon: "📱" },
  "F8:A4:5F": { vendor: "Xiaomi", deviceType: "Xiaomi Phone", icon: "📱" },
  // Dell
  "00:14:22": { vendor: "Dell", deviceType: "Dell Computer", icon: "💻" },
  "14:FE:B5": { vendor: "Dell", deviceType: "Dell Laptop", icon: "💻" },
  // HP
  "00:1F:29": { vendor: "HP", deviceType: "HP Computer", icon: "💻" },
  "3C:D9:2B": { vendor: "HP", deviceType: "HP Printer", icon: "🖨️" },
  // Cisco
  "00:1B:54": { vendor: "Cisco", deviceType: "Cisco Switch", icon: "🔀" },
  "00:0F:23": { vendor: "Cisco", deviceType: "Cisco Router", icon: "📡" },
  // TP-Link
  "50:C7:BF": { vendor: "TP-Link", deviceType: "TP-Link Router", icon: "📡" },
  "14:CC:20": { vendor: "TP-Link", deviceType: "TP-Link Device", icon: "📡" },
  // Netgear
  "00:14:6C": { vendor: "Netgear", deviceType: "Netgear Router", icon: "📡" },
  "A0:21:B7": { vendor: "Netgear", deviceType: "Netgear Device", icon: "📡" },
  // Raspberry Pi
  "B8:27:EB": { vendor: "Raspberry Pi", deviceType: "Raspberry Pi", icon: "🖥️" },
  "DC:A6:32": { vendor: "Raspberry Pi", deviceType: "Raspberry Pi", icon: "🖥️" },
  // Amazon
  "FC:65:DE": { vendor: "Amazon", deviceType: "Amazon Echo/Fire", icon: "🔊" },
  "74:C2:46": { vendor: "Amazon", deviceType: "Amazon Device", icon: "📦" },
  // Google
  "F4:F5:D8": { vendor: "Google", deviceType: "Google Device", icon: "🔊" },
  "54:60:09": { vendor: "Google", deviceType: "Chromecast", icon: "📺" },
  // Sony
  "00:1A:80": { vendor: "Sony", deviceType: "Sony PlayStation", icon: "🎮" },
  "AC:9B:0A": { vendor: "Sony", deviceType: "Sony Device", icon: "📺" },
  // Nintendo
  "00:19:FD": { vendor: "Nintendo", deviceType: "Nintendo Switch", icon: "🎮" },
  "98:B6:E9": { vendor: "Nintendo", deviceType: "Nintendo Device", icon: "🎮" },
};

export interface DeviceFingerprint {
  macAddress: string;
  vendor: string;
  deviceType: string;
  icon: string;
  confidence: "high" | "medium" | "low";
  operatingSystem?: string;
  deviceCategory: "computer" | "phone" | "tablet" | "router" | "iot" | "gaming" | "printer" | "tv" | "unknown";
}

/**
 * Identify device type from MAC address
 */
export function identifyDeviceFromMac(macAddress: string): DeviceFingerprint {
  if (!macAddress) {
    return {
      macAddress: "",
      vendor: "Unknown",
      deviceType: "Unknown Device",
      icon: "❓",
      confidence: "low",
      deviceCategory: "unknown",
    };
  }

  // Normalize MAC address
  const normalizedMac = macAddress.toUpperCase().replace(/-/g, ":").trim();

  // Try to match first 3 octets (OUI prefix)
  const prefix = normalizedMac.substring(0, 8);
  const match = MAC_VENDOR_PATTERNS[prefix];

  if (match) {
    return {
      macAddress: normalizedMac,
      vendor: match.vendor,
      deviceType: match.deviceType,
      icon: match.icon,
      confidence: "high",
      deviceCategory: categorizeDevice(match.deviceType),
    };
  }

  // Try first 2 octets
  const shortPrefix = normalizedMac.substring(0, 5);
  for (const [key, value] of Object.entries(MAC_VENDOR_PATTERNS)) {
    if (key.startsWith(shortPrefix)) {
      return {
        macAddress: normalizedMac,
        vendor: value.vendor,
        deviceType: value.deviceType,
        icon: value.icon,
        confidence: "medium",
        deviceCategory: categorizeDevice(value.deviceType),
      };
    }
  }

  return {
    macAddress: normalizedMac,
    vendor: "Unknown Vendor",
    deviceType: "Unknown Device",
    icon: "🖥️",
    confidence: "low",
    deviceCategory: "unknown",
  };
}

/**
 * Categorize device type
 */
function categorizeDevice(deviceType: string): DeviceFingerprint["deviceCategory"] {
  const lower = deviceType.toLowerCase();
  if (lower.includes("phone") || lower.includes("iphone") || lower.includes("android")) return "phone";
  if (lower.includes("ipad") || lower.includes("tablet")) return "tablet";
  if (lower.includes("mac") || lower.includes("laptop") || lower.includes("computer") || lower.includes("pc")) return "computer";
  if (lower.includes("router") || lower.includes("switch") || lower.includes("gateway")) return "router";
  if (lower.includes("tv") || lower.includes("chromecast") || lower.includes("fire")) return "tv";
  if (lower.includes("playstation") || lower.includes("xbox") || lower.includes("nintendo")) return "gaming";
  if (lower.includes("printer")) return "printer";
  if (lower.includes("echo") || lower.includes("raspberry") || lower.includes("iot")) return "iot";
  return "unknown";
}

/**
 * Enrich device information with fingerprint data
 */
export function enrichDeviceInfo(
  device: {
    macAddress?: string | null;
    vendor?: string | null;
    deviceName?: string | null;
  }
): {
  vendor: string;
  deviceType: string;
  icon: string;
  deviceCategory: string;
} {
  if (device.macAddress) {
    const fingerprint = identifyDeviceFromMac(device.macAddress);
    return {
      vendor: device.vendor || fingerprint.vendor,
      deviceType: fingerprint.deviceType,
      icon: fingerprint.icon,
      deviceCategory: fingerprint.deviceCategory,
    };
  }

  return {
    vendor: device.vendor || "Unknown",
    deviceType: "Unknown Device",
    icon: "🖥️",
    deviceCategory: "unknown",
  };
}

/**
 * Get approximate geolocation context from IP
 * For local IPs, returns "Local Network" context
 */
export function getIpContext(ip: string): {
  isLocal: boolean;
  networkType: string;
  description: string;
} {
  // Check for local/private IP ranges
  if (
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  ) {
    return {
      isLocal: true,
      networkType: "Private Network",
      description: "Local network device (RFC 1918)",
    };
  }

  if (ip.startsWith("127.")) {
    return {
      isLocal: true,
      networkType: "Loopback",
      description: "Localhost / loopback address",
    };
  }

  if (ip.startsWith("169.254.")) {
    return {
      isLocal: true,
      networkType: "Link-Local",
      description: "Auto-configured link-local address",
    };
  }

  return {
    isLocal: false,
    networkType: "Public Network",
    description: "External / public IP address",
  };
}
