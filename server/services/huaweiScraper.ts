/**
 * Huawei Router Scraper Service
 * Handles authentication and device discovery from Huawei routers
 * Supports models: Huawei B535, B715, B818, etc.
 */

import axios, { AxiosInstance } from "axios";

export interface HuaweiDevice {
  ip: string;
  mac: string;
  hostname?: string;
  deviceType?: string;
  vendor?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface HuaweiRouterConfig {
  routerIp: string;
  username: string;
  password: string;
}

export class HuaweiScraper {
  private client: AxiosInstance;
  private routerIp: string;
  private username: string;
  private password: string;
  private sessionId: string = "";
  private authToken: string = "";
  private isAuthenticated: boolean = false;

  constructor(config: HuaweiRouterConfig) {
    this.routerIp = config.routerIp;
    this.username = config.username;
    this.password = config.password;

    this.client = axios.create({
      baseURL: `http://${this.routerIp}`,
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status code
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
  }

  /**
   * Authenticate with the Huawei router
   */
  async authenticate(): Promise<boolean> {
    try {
      console.log("[Huawei] Attempting authentication...");

      // Step 1: Get the login page to extract any CSRF tokens
      const loginPageResponse = await this.client.get("/html/content.html#home");

      // Step 2: Perform login
      const loginResponse = await this.client.post("/api/system/user_login", {
        username: this.username,
        password: this.password,
      });

      if (loginResponse.status === 200 && loginResponse.data) {
        const data = loginResponse.data;

        // Extract session info from response
        if (data.sessionid) {
          this.sessionId = data.sessionid;
          this.authToken = data.sessionid;
          this.isAuthenticated = true;

          // Update client headers with session info
          this.client.defaults.headers.common["Cookie"] = `sessionid=${this.sessionId}`;

          console.log("[Huawei] Authentication successful");
          return true;
        }
      }

      // Alternative: Try direct API authentication
      const altAuthResponse = await this.client.post("/api/user/login", {
        username: this.username,
        password: this.password,
      });

      if (altAuthResponse.status === 200 && altAuthResponse.data?.sessionid) {
        this.sessionId = altAuthResponse.data.sessionid;
        this.authToken = altAuthResponse.data.sessionid;
        this.isAuthenticated = true;
        this.client.defaults.headers.common["Cookie"] = `sessionid=${this.sessionId}`;
        console.log("[Huawei] Authentication successful (alt method)");
        return true;
      }

      console.warn("[Huawei] Authentication failed");
      return false;
    } catch (error) {
      console.error("[Huawei] Authentication error:", error);
      return false;
    }
  }

  /**
   * Get connected devices from the router
   */
  async getConnectedDevices(): Promise<HuaweiDevice[]> {
    if (!this.isAuthenticated) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Huawei router");
      }
    }

    try {
      console.log("[Huawei] Fetching connected devices...");

      // Try multiple API endpoints for device information
      const endpoints = [
        "/api/system/HostInfo",
        "/api/system/host_info",
        "/api/device/info",
        "/api/lan/host-list",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.client.get(endpoint);

          if (response.status === 200 && response.data) {
            const devices = this.parseDevices(response.data);
            if (devices.length > 0) {
              console.log(`[Huawei] Found ${devices.length} devices via ${endpoint}`);
              return devices;
            }
          }
        } catch (e) {
          // Try next endpoint
          continue;
        }
      }

      // Fallback: Try to get DHCP client list
      return await this.getDHCPClients();
    } catch (error) {
      console.error("[Huawei] Error fetching devices:", error);
      return [];
    }
  }

  /**
   * Get DHCP clients from the router
   */
  private async getDHCPClients(): Promise<HuaweiDevice[]> {
    try {
      const endpoints = [
        "/api/system/dhcp_client",
        "/api/system/dhcp-clients",
        "/api/lan/dhcp-clients",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.client.get(endpoint);

          if (response.status === 200 && response.data) {
            const devices = this.parseDevices(response.data);
            if (devices.length > 0) {
              console.log(`[Huawei] Found ${devices.length} DHCP clients`);
              return devices;
            }
          }
        } catch (e) {
          continue;
        }
      }

      return [];
    } catch (error) {
      console.error("[Huawei] Error fetching DHCP clients:", error);
      return [];
    }
  }

  /**
   * Parse device information from API response
   */
  private parseDevices(data: any): HuaweiDevice[] {
    const devices: HuaweiDevice[] = [];

    if (!data) return devices;

    // Handle different response formats
    const deviceList = Array.isArray(data)
      ? data
      : data.devices || data.hosts || data.dhcp_clients || data.clients || [];

    for (const item of deviceList) {
      if (item.ip || item.ipaddr || item.ipAddress) {
        const device: HuaweiDevice = {
          ip: item.ip || item.ipaddr || item.ipAddress || "",
          mac: item.mac || item.macaddr || item.macAddress || item.hwaddr || "",
          hostname: item.hostname || item.name || item.deviceName || "",
          deviceType: item.type || item.deviceType || "Unknown",
          vendor: item.vendor || this.getVendorFromMac(item.mac || item.macaddr || ""),
          isOnline: item.online !== false && item.status !== "offline",
          lastSeen: new Date(),
        };

        if (device.ip && device.mac) {
          devices.push(device);
        }
      }
    }

    return devices;
  }

  /**
   * Get vendor name from MAC address
   */
  private getVendorFromMac(mac: string): string {
    if (!mac) return "Unknown";

    const macPrefix = mac.substring(0, 8).toUpperCase();

    // Common vendor MAC prefixes
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
   * Block a device on the router
   */
  async blockDevice(mac: string): Promise<boolean> {
    if (!this.isAuthenticated) {
      throw new Error("Not authenticated");
    }

    try {
      console.log(`[Huawei] Blocking device: ${mac}`);

      const endpoints = [
        { url: "/api/system/block_device", method: "post" },
        { url: "/api/device/block", method: "post" },
        { url: "/api/lan/block-device", method: "post" },
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.client.post(endpoint.url, {
            mac: mac,
            block: 1,
          });

          if (response.status === 200) {
            console.log(`[Huawei] Device blocked successfully`);
            return true;
          }
        } catch (e) {
          continue;
        }
      }

      return false;
    } catch (error) {
      console.error("[Huawei] Error blocking device:", error);
      return false;
    }
  }

  /**
   * Unblock a device on the router
   */
  async unblockDevice(mac: string): Promise<boolean> {
    if (!this.isAuthenticated) {
      throw new Error("Not authenticated");
    }

    try {
      console.log(`[Huawei] Unblocking device: ${mac}`);

      const endpoints = [
        { url: "/api/system/block_device", method: "post" },
        { url: "/api/device/unblock", method: "post" },
        { url: "/api/lan/unblock-device", method: "post" },
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.client.post(endpoint.url, {
            mac: mac,
            block: 0,
          });

          if (response.status === 200) {
            console.log(`[Huawei] Device unblocked successfully`);
            return true;
          }
        } catch (e) {
          continue;
        }
      }

      return false;
    } catch (error) {
      console.error("[Huawei] Error unblocking device:", error);
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
      const endpoints = [
        "/api/system/status",
        "/api/system/router_status",
        "/api/device/status",
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
      console.error("[Huawei] Error fetching router stats:", error);
      return null;
    }
  }

  /**
   * Logout from the router
   */
  async logout(): Promise<boolean> {
    try {
      await this.client.post("/api/user/logout");
      this.isAuthenticated = false;
      this.sessionId = "";
      this.authToken = "";
      console.log("[Huawei] Logged out successfully");
      return true;
    } catch (error) {
      console.error("[Huawei] Error logging out:", error);
      return false;
    }
  }
}

/**
 * Scan Huawei router for connected devices
 */
export async function scanHuaweiRouter(
  routerIp: string,
  username: string,
  password: string
): Promise<HuaweiDevice[]> {
  const scraper = new HuaweiScraper({
    routerIp,
    username,
    password,
  });

  try {
    const authenticated = await scraper.authenticate();
    if (!authenticated) {
      console.warn("[Huawei] Failed to authenticate");
      return [];
    }

    const devices = await scraper.getConnectedDevices();
    await scraper.logout();

    return devices;
  } catch (error) {
    console.error("[Huawei] Scan error:", error);
    return [];
  }
}
