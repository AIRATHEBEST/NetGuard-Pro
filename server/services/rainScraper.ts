/**
 * RAIN 101 Router Scraper Service
 * Handles authentication and device discovery from RAIN 101 routers
 * RAIN 101 is a South African mobile router
 */

import axios, { AxiosInstance } from "axios";

export interface RAINDevice {
  ip: string;
  mac: string;
  hostname?: string;
  deviceType?: string;
  vendor?: string;
  isOnline: boolean;
  lastSeen?: Date;
  signal?: number;
  bandwidth?: number;
}

export interface RAINRouterConfig {
  routerIp: string;
  username: string;
  password: string;
}

export class RAINScraper {
  private client: AxiosInstance;
  private routerIp: string;
  private username: string;
  private password: string;
  private sessionId: string = "";
  private authToken: string = "";
  private isAuthenticated: boolean = false;

  constructor(config: RAINRouterConfig) {
    this.routerIp = config.routerIp;
    this.username = config.username;
    this.password = config.password;

    this.client = axios.create({
      baseURL: `http://${this.routerIp}`,
      timeout: 10000,
      validateStatus: () => true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Authenticate with the RAIN 101 router
   */
  async authenticate(): Promise<boolean> {
    try {
      console.log("[RAIN 101] Attempting authentication...");

      // RAIN 101 typically uses a web interface authentication
      const loginResponse = await this.client.post("/api/auth/login", {
        username: this.username,
        password: this.password,
      });

      if (loginResponse.status === 200 && loginResponse.data) {
        const data = loginResponse.data;

        if (data.token || data.sessionid || data.success) {
          this.authToken = data.token || data.sessionid || this.generateToken();
          this.isAuthenticated = true;

          // Update client headers
          this.client.defaults.headers.common["Authorization"] = `Bearer ${this.authToken}`;
          this.client.defaults.headers.common["X-Auth-Token"] = this.authToken;

          console.log("[RAIN 101] Authentication successful");
          return true;
        }
      }

      // Alternative: Try form-based login
      const formData = new URLSearchParams();
      formData.append("username", this.username);
      formData.append("password", this.password);

      const formLoginResponse = await this.client.post("/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (formLoginResponse.status === 200) {
        this.isAuthenticated = true;
        console.log("[RAIN 101] Authentication successful (form method)");
        return true;
      }

      console.warn("[RAIN 101] Authentication failed");
      return false;
    } catch (error) {
      console.error("[RAIN 101] Authentication error:", error);
      return false;
    }
  }

  /**
   * Generate a simple token for fallback
   */
  private generateToken(): string {
    return Buffer.from(`${this.username}:${this.password}`).toString("base64");
  }

  /**
   * Get connected devices from the RAIN 101 router
   */
  async getConnectedDevices(): Promise<RAINDevice[]> {
    if (!this.isAuthenticated) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with RAIN 101 router");
      }
    }

    try {
      console.log("[RAIN 101] Fetching connected devices...");

      // Try multiple API endpoints specific to RAIN 101
      const endpoints = [
        "/api/devices",
        "/api/network/devices",
        "/api/lan/devices",
        "/api/connected-devices",
        "/api/device/list",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.client.get(endpoint);

          if (response.status === 200 && response.data) {
            const devices = this.parseDevices(response.data);
            if (devices.length > 0) {
              console.log(`[RAIN 101] Found ${devices.length} devices via ${endpoint}`);
              return devices;
            }
          }
        } catch (e) {
          continue;
        }
      }

      // Fallback: Try DHCP client list
      return await this.getDHCPClients();
    } catch (error) {
      console.error("[RAIN 101] Error fetching devices:", error);
      return [];
    }
  }

  /**
   * Get DHCP clients from RAIN 101 router
   */
  private async getDHCPClients(): Promise<RAINDevice[]> {
    try {
      const endpoints = [
        "/api/dhcp/clients",
        "/api/network/dhcp-clients",
        "/api/lan/dhcp",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.client.get(endpoint);

          if (response.status === 200 && response.data) {
            const devices = this.parseDevices(response.data);
            if (devices.length > 0) {
              console.log(`[RAIN 101] Found ${devices.length} DHCP clients`);
              return devices;
            }
          }
        } catch (e) {
          continue;
        }
      }

      return [];
    } catch (error) {
      console.error("[RAIN 101] Error fetching DHCP clients:", error);
      return [];
    }
  }

  /**
   * Parse device information from API response
   */
  private parseDevices(data: any): RAINDevice[] {
    const devices: RAINDevice[] = [];

    if (!data) return devices;

    // Handle different response formats
    const deviceList = Array.isArray(data)
      ? data
      : data.devices ||
        data.clients ||
        data.hosts ||
        data.dhcp_clients ||
        data.connected_devices ||
        [];

    for (const item of deviceList) {
      if (item.ip || item.ipaddr || item.ipAddress) {
        const device: RAINDevice = {
          ip: item.ip || item.ipaddr || item.ipAddress || "",
          mac: item.mac || item.macaddr || item.macAddress || item.hwaddr || "",
          hostname: item.hostname || item.name || item.deviceName || "",
          deviceType: item.type || item.deviceType || "Unknown",
          vendor: item.vendor || this.getVendorFromMac(item.mac || item.macaddr || ""),
          isOnline: item.online !== false && item.status !== "offline" && item.connected !== false,
          lastSeen: new Date(),
          signal: item.signal || item.rssi,
          bandwidth: item.bandwidth || item.speed,
        };

        if (device.ip && device.mac) {
          devices.push(device);
        }
      }
    }

    return devices;
  }

  /**
   * Get vendor from MAC address
   */
  private getVendorFromMac(mac: string): string {
    if (!mac) return "Unknown";

    const macPrefix = mac.substring(0, 8).toUpperCase();

    const vendors: Record<string, string> = {
      "00:1A:2B": "Apple",
      "00:50:F2": "Microsoft",
      "00:0C:6E": "Cisco",
      "08:00:27": "PCS Systemtechnik",
      "52:54:00": "QEMU",
      "B8:27:EB": "Raspberry Pi",
      "DC:A6:32": "Raspberry Pi",
      "AA:BB:CC": "Test Device",
    };

    return vendors[macPrefix] || "Unknown Vendor";
  }

  /**
   * Block a device on RAIN 101 router
   */
  async blockDevice(mac: string): Promise<boolean> {
    if (!this.isAuthenticated) {
      throw new Error("Not authenticated");
    }

    try {
      console.log(`[RAIN 101] Blocking device: ${mac}`);

      const endpoints = [
        "/api/device/block",
        "/api/network/block-device",
        "/api/block",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.client.post(endpoint, {
            mac: mac,
            action: "block",
          });

          if (response.status === 200) {
            console.log(`[RAIN 101] Device blocked successfully`);
            return true;
          }
        } catch (e) {
          continue;
        }
      }

      return false;
    } catch (error) {
      console.error("[RAIN 101] Error blocking device:", error);
      return false;
    }
  }

  /**
   * Unblock a device on RAIN 101 router
   */
  async unblockDevice(mac: string): Promise<boolean> {
    if (!this.isAuthenticated) {
      throw new Error("Not authenticated");
    }

    try {
      console.log(`[RAIN 101] Unblocking device: ${mac}`);

      const endpoints = [
        "/api/device/unblock",
        "/api/network/unblock-device",
        "/api/unblock",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.client.post(endpoint, {
            mac: mac,
            action: "unblock",
          });

          if (response.status === 200) {
            console.log(`[RAIN 101] Device unblocked successfully`);
            return true;
          }
        } catch (e) {
          continue;
        }
      }

      return false;
    } catch (error) {
      console.error("[RAIN 101] Error unblocking device:", error);
      return false;
    }
  }

  /**
   * Get router statistics
   */
  async getRouterStats(): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error("Not authenticated");
    }

    try {
      const endpoints = ["/api/status", "/api/system/status", "/api/router/info"];

      for (const endpoint of endpoints) {
        try {
          const response = await this.client.get(endpoint);
          if (response.status === 200 && response.data) {
            return response.data;
          }
        } catch (e) {
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error("[RAIN 101] Error fetching router stats:", error);
      return null;
    }
  }

  /**
   * Get network bandwidth usage
   */
  async getBandwidthUsage(): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error("Not authenticated");
    }

    try {
      const endpoints = [
        "/api/bandwidth",
        "/api/network/bandwidth",
        "/api/usage",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.client.get(endpoint);
          if (response.status === 200 && response.data) {
            return response.data;
          }
        } catch (e) {
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error("[RAIN 101] Error fetching bandwidth:", error);
      return null;
    }
  }

  /**
   * Logout from router
   */
  async logout(): Promise<boolean> {
    try {
      await this.client.post("/api/auth/logout");
      this.isAuthenticated = false;
      this.authToken = "";
      console.log("[RAIN 101] Logged out successfully");
      return true;
    } catch (error) {
      console.error("[RAIN 101] Error logging out:", error);
      return false;
    }
  }
}

/**
 * Scan RAIN 101 router for connected devices
 */
export async function scanRAINRouter(
  routerIp: string,
  username: string,
  password: string
): Promise<RAINDevice[]> {
  const scraper = new RAINScraper({
    routerIp,
    username,
    password,
  });

  try {
    const authenticated = await scraper.authenticate();
    if (!authenticated) {
      console.warn("[RAIN 101] Failed to authenticate");
      return [];
    }

    const devices = await scraper.getConnectedDevices();
    await scraper.logout();

    return devices;
  } catch (error) {
    console.error("[RAIN 101] Scan error:", error);
    return [];
  }
}
