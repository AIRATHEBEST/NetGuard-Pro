import { exec } from "child_process";
import { promisify } from "util";
import * as dns from "dns";

const execAsync = promisify(exec);
const dnsResolve = promisify(dns.resolve);
const dnsReverse = promisify(dns.reverse);
const dnsLookup = promisify(dns.lookup);

export interface PingTestResult {
  host: string;
  ip?: string;
  latencyMs: number | null;
  packetLoss: number;
  minLatency: number | null;
  maxLatency: number | null;
  avgLatency: number | null;
  jitter: number | null;
  isReachable: boolean;
  timestamp: Date;
}

export interface TracerouteHop {
  hop: number;
  ip: string | null;
  hostname: string | null;
  latencyMs: number | null;
  timedOut: boolean;
}

export interface TracerouteResult {
  host: string;
  hops: TracerouteHop[];
  totalHops: number;
  completed: boolean;
  timestamp: Date;
}

export interface DnsLookupResult {
  domain: string;
  ipAddresses: string[];
  reverseDns?: string[];
  recordType: string;
  timestamp: Date;
}

/**
 * Perform a ping test with detailed statistics
 */
export async function performPingTest(
  host: string,
  count: number = 10
): Promise<PingTestResult> {
  try {
    const { stdout } = await execAsync(
      `ping -c ${count} -W 3 ${host} 2>&1`,
      { timeout: 45000 }
    );

    // Parse RTT statistics
    const rttMatch = stdout.match(
      /rtt min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+) ms/
    );

    // Parse packet loss
    const lossMatch = stdout.match(/(\d+)% packet loss/);
    const packetLoss = lossMatch ? parseInt(lossMatch[1]) : 100;

    // Parse IP from ping output
    const ipMatch = stdout.match(/PING .+ \((\d+\.\d+\.\d+\.\d+)\)/);
    const ip = ipMatch ? ipMatch[1] : undefined;

    if (rttMatch) {
      const minLatency = parseFloat(rttMatch[1]);
      const avgLatency = parseFloat(rttMatch[2]);
      const maxLatency = parseFloat(rttMatch[3]);
      const jitter = parseFloat(rttMatch[4]);

      return {
        host,
        ip,
        latencyMs: avgLatency,
        packetLoss,
        minLatency,
        maxLatency,
        avgLatency,
        jitter,
        isReachable: packetLoss < 100,
        timestamp: new Date(),
      };
    }

    return {
      host,
      ip,
      latencyMs: null,
      packetLoss,
      minLatency: null,
      maxLatency: null,
      avgLatency: null,
      jitter: null,
      isReachable: packetLoss < 100,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      host,
      latencyMs: null,
      packetLoss: 100,
      minLatency: null,
      maxLatency: null,
      avgLatency: null,
      jitter: null,
      isReachable: false,
      timestamp: new Date(),
    };
  }
}

/**
 * Perform a traceroute to a host
 */
export async function performTraceroute(
  host: string,
  maxHops: number = 30
): Promise<TracerouteResult> {
  try {
    const { stdout } = await execAsync(
      `traceroute -m ${maxHops} -w 2 ${host} 2>&1`,
      { timeout: 120000 }
    );

    const hops = parseTracerouteOutput(stdout);
    const lastHop = hops[hops.length - 1];
    const completed = lastHop?.ip !== null && !lastHop?.timedOut;

    return {
      host,
      hops,
      totalHops: hops.length,
      completed,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      host,
      hops: [],
      totalHops: 0,
      completed: false,
      timestamp: new Date(),
    };
  }
}

/**
 * Parse traceroute output into structured hops
 */
function parseTracerouteOutput(output: string): TracerouteHop[] {
  const hops: TracerouteHop[] = [];
  const lines = output.split("\n").slice(1); // Skip header line

  for (const line of lines) {
    if (!line.trim()) continue;

    // Match hop number
    const hopMatch = line.match(/^\s*(\d+)\s+/);
    if (!hopMatch) continue;

    const hop = parseInt(hopMatch[1]);

    // Check for timeout (* * *)
    if (line.includes("* * *")) {
      hops.push({ hop, ip: null, hostname: null, latencyMs: null, timedOut: true });
      continue;
    }

    // Match IP and latency: "1  192.168.0.1 (192.168.0.1)  1.234 ms"
    const ipMatch = line.match(/(\d+\.\d+\.\d+\.\d+)/);
    const hostnameMatch = line.match(/\s+(\S+)\s+\(/);
    const latencyMatch = line.match(/([\d.]+) ms/);

    hops.push({
      hop,
      ip: ipMatch ? ipMatch[1] : null,
      hostname: hostnameMatch ? hostnameMatch[1] : null,
      latencyMs: latencyMatch ? parseFloat(latencyMatch[1]) : null,
      timedOut: false,
    });
  }

  return hops;
}

/**
 * Perform DNS lookup for a domain
 */
export async function performDnsLookup(
  domain: string,
  recordType: "A" | "AAAA" | "MX" | "TXT" | "NS" | "CNAME" = "A"
): Promise<DnsLookupResult> {
  try {
    let ipAddresses: string[] = [];

    if (recordType === "A") {
      const result = await dnsLookup(domain, { all: true });
      ipAddresses = Array.isArray(result)
        ? result.map((r: any) => r.address)
        : [(result as any).address];
    } else {
      const records = await dnsResolve(domain, recordType as any);
      ipAddresses = Array.isArray(records)
        ? records.map((r: any) => (typeof r === "string" ? r : JSON.stringify(r)))
        : [String(records)];
    }

    // Try reverse DNS for A records
    let reverseDns: string[] | undefined;
    if (recordType === "A" && ipAddresses.length > 0) {
      try {
        reverseDns = await dnsReverse(ipAddresses[0]);
      } catch {
        // Reverse DNS may not be available
      }
    }

    return {
      domain,
      ipAddresses,
      reverseDns,
      recordType,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      domain,
      ipAddresses: [],
      recordType,
      timestamp: new Date(),
    };
  }
}

/**
 * Reverse DNS lookup for an IP address
 */
export async function reverseDnsLookup(ip: string): Promise<string[]> {
  try {
    return await dnsReverse(ip);
  } catch {
    return [];
  }
}

/**
 * Get network interface information
 */
export async function getNetworkInterfaces(): Promise<any[]> {
  try {
    const { stdout } = await execAsync("ip addr show 2>&1");
    const interfaces: any[] = [];
    const blocks = stdout.split(/\n(?=\d+:)/);

    for (const block of blocks) {
      const nameMatch = block.match(/^\d+:\s+(\S+):/);
      const ipMatch = block.match(/inet\s+(\d+\.\d+\.\d+\.\d+\/\d+)/);
      const macMatch = block.match(/link\/ether\s+(\S+)/);
      const stateMatch = block.match(/state\s+(\S+)/);

      if (nameMatch) {
        interfaces.push({
          name: nameMatch[1],
          ip: ipMatch ? ipMatch[1] : null,
          mac: macMatch ? macMatch[1] : null,
          state: stateMatch ? stateMatch[1] : "UNKNOWN",
        });
      }
    }

    return interfaces;
  } catch {
    return [];
  }
}
