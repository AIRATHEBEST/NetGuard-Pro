/**
 * Client-side device identification utilities
 */

export interface DeviceInfo {
  vendor: string;
  deviceType: string;
  icon: string;
  deviceCategory: string;
}

const MAC_VENDOR_MAP: Record<string, DeviceInfo> = {
  "00:1A:2B": { vendor: "Apple", deviceType: "iPhone/iPad/Mac", icon: "📱", deviceCategory: "phone" },
  "A4:C3:F0": { vendor: "Apple", deviceType: "iPhone", icon: "📱", deviceCategory: "phone" },
  "F0:18:98": { vendor: "Apple", deviceType: "MacBook", icon: "💻", deviceCategory: "computer" },
  "00:16:32": { vendor: "Samsung", deviceType: "Samsung Device", icon: "📱", deviceCategory: "phone" },
  "8C:77:12": { vendor: "Samsung", deviceType: "Samsung Phone", icon: "📱", deviceCategory: "phone" },
  "CC:07:AB": { vendor: "Samsung", deviceType: "Samsung TV", icon: "📺", deviceCategory: "tv" },
  "00:E0:FC": { vendor: "Huawei", deviceType: "Huawei Router", icon: "📡", deviceCategory: "router" },
  "28:6C:07": { vendor: "Xiaomi", deviceType: "Xiaomi Device", icon: "📱", deviceCategory: "phone" },
  "00:14:22": { vendor: "Dell", deviceType: "Dell Computer", icon: "💻", deviceCategory: "computer" },
  "00:1F:29": { vendor: "HP", deviceType: "HP Computer", icon: "💻", deviceCategory: "computer" },
  "3C:D9:2B": { vendor: "HP", deviceType: "HP Printer", icon: "🖨️", deviceCategory: "printer" },
  "50:C7:BF": { vendor: "TP-Link", deviceType: "TP-Link Router", icon: "📡", deviceCategory: "router" },
  "B8:27:EB": { vendor: "Raspberry Pi", deviceType: "Raspberry Pi", icon: "🖥️", deviceCategory: "iot" },
  "DC:A6:32": { vendor: "Raspberry Pi", deviceType: "Raspberry Pi", icon: "🖥️", deviceCategory: "iot" },
  "FC:65:DE": { vendor: "Amazon", deviceType: "Amazon Echo/Fire", icon: "🔊", deviceCategory: "iot" },
  "F4:F5:D8": { vendor: "Google", deviceType: "Google Device", icon: "🔊", deviceCategory: "iot" },
  "54:60:09": { vendor: "Google", deviceType: "Chromecast", icon: "📺", deviceCategory: "tv" },
  "00:1A:80": { vendor: "Sony", deviceType: "Sony PlayStation", icon: "🎮", deviceCategory: "gaming" },
  "00:19:FD": { vendor: "Nintendo", deviceType: "Nintendo Switch", icon: "🎮", deviceCategory: "gaming" },
};

export function identifyDeviceFromMac(mac: string): DeviceInfo {
  if (!mac) {
    return { vendor: "Unknown", deviceType: "Unknown Device", icon: "🖥️", deviceCategory: "unknown" };
  }
  const normalized = mac.toUpperCase().replace(/-/g, ":").trim();
  const prefix = normalized.substring(0, 8);
  if (MAC_VENDOR_MAP[prefix]) return MAC_VENDOR_MAP[prefix];
  return { vendor: "Unknown", deviceType: "Unknown Device", icon: "🖥️", deviceCategory: "unknown" };
}

export function getIpContext(ip: string): { isLocal: boolean; networkType: string } {
  if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return { isLocal: true, networkType: "Private Network" };
  }
  if (ip.startsWith("127.")) return { isLocal: true, networkType: "Loopback" };
  return { isLocal: false, networkType: "Public Network" };
}
