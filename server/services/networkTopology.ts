import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface TopologyNode {
  id: string;
  type: "router" | "device" | "gateway" | "unknown";
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
  isOnline: boolean;
  deviceName?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  connectionType?: "wired" | "wireless" | "unknown";
  signalStrength?: number;
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  type: "wired" | "wireless" | "unknown";
  latencyMs?: number;
}

export interface NetworkTopology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  gateway?: string;
  timestamp: Date;
}

/**
 * Discover network topology using ARP and nmap
 */
export async function discoverNetworkTopology(
  subnet?: string
): Promise<NetworkTopology> {
  const nodes: TopologyNode[] = [];
  const edges: TopologyEdge[] = [];

  try {
    // Get default gateway
    const gateway = await getDefaultGateway();

    // Get local network subnet if not provided
    const targetSubnet = subnet || (await getLocalSubnet()) || "192.168.1.0/24";

    // Discover devices via ARP scan (faster than nmap for local network)
    const devices = await discoverDevicesViaArp(targetSubnet);

    // Add gateway as router node
    if (gateway) {
      nodes.push({
        id: `node-${gateway}`,
        type: "router",
        ip: gateway,
        isOnline: true,
        deviceName: "Gateway/Router",
      });
    }

    // Add discovered devices
    for (const device of devices) {
      const nodeId = `node-${device.ip}`;
      nodes.push({
        id: nodeId,
        type: "device",
        ip: device.ip,
        mac: device.mac,
        hostname: device.hostname,
        vendor: device.vendor,
        isOnline: true,
        deviceName: device.hostname || device.ip,
        connectionType: "unknown",
      });

      // Connect each device to the gateway
      if (gateway) {
        edges.push({
          id: `edge-${gateway}-${device.ip}`,
          source: `node-${gateway}`,
          target: nodeId,
          type: "unknown",
        });
      }
    }

    return {
      nodes,
      edges,
      gateway: gateway || undefined,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[NetworkTopology] Error discovering topology:", error);
    return {
      nodes,
      edges,
      timestamp: new Date(),
    };
  }
}

/**
 * Get the default gateway IP
 */
async function getDefaultGateway(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("ip route show default 2>&1");
    const match = stdout.match(/default via (\d+\.\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Get local subnet
 */
async function getLocalSubnet(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("ip route show 2>&1");
    // Find a local route like "192.168.1.0/24 dev eth0"
    const match = stdout.match(/(\d+\.\d+\.\d+\.\d+\/\d+)\s+dev\s+\w+\s+proto\s+kernel/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Discover devices on the local network using nmap ARP scan
 */
async function discoverDevicesViaArp(
  subnet: string
): Promise<Array<{ ip: string; mac: string; hostname: string; vendor: string }>> {
  try {
    // Use nmap for ARP discovery
    const { stdout } = await execAsync(
      `nmap -sn ${subnet} 2>&1`,
      { timeout: 30000 }
    );

    return parseNmapDiscovery(stdout);
  } catch (error) {
    console.error("[NetworkTopology] ARP scan failed:", error);
    return [];
  }
}

/**
 * Parse nmap discovery output
 */
function parseNmapDiscovery(
  output: string
): Array<{ ip: string; mac: string; hostname: string; vendor: string }> {
  const devices: Array<{ ip: string; mac: string; hostname: string; vendor: string }> = [];
  const blocks = output.split(/(?=Nmap scan report)/);

  for (const block of blocks) {
    const ipMatch = block.match(/Nmap scan report for (?:(.+) \()?(\d+\.\d+\.\d+\.\d+)\)?/);
    const macMatch = block.match(/MAC Address: ([A-F0-9:]+)(?: \((.+)\))?/i);

    if (ipMatch) {
      devices.push({
        ip: ipMatch[2],
        mac: macMatch ? macMatch[1] : "",
        hostname: ipMatch[1] || "",
        vendor: macMatch ? macMatch[2] || "" : "",
      });
    }
  }

  return devices;
}

/**
 * Build topology from existing device list (from database)
 */
export function buildTopologyFromDevices(
  devices: Array<{
    id: number;
    ipAddress: string;
    macAddress?: string | null;
    deviceName?: string | null;
    vendor?: string | null;
    isOnline?: boolean | null;
    riskLevel?: string | null;
    connectionType?: string | null;
  }>,
  routerIp?: string
): NetworkTopology {
  const nodes: TopologyNode[] = [];
  const edges: TopologyEdge[] = [];

  // Add router node if IP is provided
  if (routerIp) {
    nodes.push({
      id: `node-router`,
      type: "router",
      ip: routerIp,
      isOnline: true,
      deviceName: "Router/Gateway",
    });
  }

  // Add device nodes
  for (const device of devices) {
    const nodeId = `node-${device.id}`;
    nodes.push({
      id: nodeId,
      type: "device",
      ip: device.ipAddress,
      mac: device.macAddress || undefined,
      deviceName: device.deviceName || device.ipAddress,
      vendor: device.vendor || undefined,
      isOnline: device.isOnline ?? false,
      riskLevel: (device.riskLevel as any) || "low",
      connectionType: (device.connectionType as any) || "unknown",
    });

    // Connect to router
    if (routerIp) {
      edges.push({
        id: `edge-router-${device.id}`,
        source: `node-router`,
        target: nodeId,
        type: "unknown",
      });
    }
  }

  return {
    nodes,
    edges,
    gateway: routerIp,
    timestamp: new Date(),
  };
}
