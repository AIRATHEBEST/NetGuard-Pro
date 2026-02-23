import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface PortInfo {
  port: number;
  protocol: "tcp" | "udp";
  state: "open" | "closed" | "filtered";
  service: string;
  version?: string;
}

export interface ScanResult {
  ip: string;
  hostname?: string;
  openPorts: PortInfo[];
  totalScanned: number;
  scanDuration: number;
  timestamp: Date;
  riskLevel: "low" | "medium" | "high" | "critical";
  vulnerabilities: string[];
}

// Common ports and their services
const COMMON_PORTS: Record<number, string> = {
  21: "FTP",
  22: "SSH",
  23: "Telnet",
  25: "SMTP",
  53: "DNS",
  80: "HTTP",
  110: "POP3",
  143: "IMAP",
  443: "HTTPS",
  445: "SMB",
  3306: "MySQL",
  3389: "RDP",
  5432: "PostgreSQL",
  5900: "VNC",
  6379: "Redis",
  8080: "HTTP-Alt",
  8443: "HTTPS-Alt",
  27017: "MongoDB",
};

// High-risk ports that indicate potential vulnerabilities
const HIGH_RISK_PORTS = [21, 23, 445, 3389, 5900];
const MEDIUM_RISK_PORTS = [22, 25, 110, 143, 3306, 5432, 6379, 27017];

/**
 * Scan ports on a device using nmap
 */
export async function scanPorts(
  ip: string,
  portRange: string = "1-1024"
): Promise<ScanResult> {
  const startTime = Date.now();

  try {
    // Validate IP
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      throw new Error("Invalid IP address");
    }

    // Run nmap scan with service detection
    // -sV: service version detection
    // -T4: aggressive timing
    // --open: only show open ports
    // -p: port range
    const { stdout } = await execAsync(
      `nmap -sV -T4 --open -p ${portRange} ${ip} 2>&1`,
      { timeout: 60000 }
    );

    const openPorts = parseNmapOutput(stdout);
    const scanDuration = Date.now() - startTime;
    const { riskLevel, vulnerabilities } = assessRisk(openPorts);

    // Extract hostname if available
    const hostnameMatch = stdout.match(/Nmap scan report for (.+?) \(/);
    const hostname = hostnameMatch ? hostnameMatch[1] : undefined;

    return {
      ip,
      hostname,
      openPorts,
      totalScanned: parseInt(portRange.split("-")[1] || "1024"),
      scanDuration,
      timestamp: new Date(),
      riskLevel,
      vulnerabilities,
    };
  } catch (error) {
    const scanDuration = Date.now() - startTime;
    return {
      ip,
      openPorts: [],
      totalScanned: 0,
      scanDuration,
      timestamp: new Date(),
      riskLevel: "low",
      vulnerabilities: [],
    };
  }
}

/**
 * Quick scan of most common ports
 */
export async function quickScan(ip: string): Promise<ScanResult> {
  const commonPortList = Object.keys(COMMON_PORTS).join(",");
  return scanPorts(ip, commonPortList);
}

/**
 * Parse nmap output to extract port information
 */
function parseNmapOutput(output: string): PortInfo[] {
  const ports: PortInfo[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    // Match lines like: "80/tcp   open  http    Apache httpd 2.4.41"
    const match = line.match(/^(\d+)\/(tcp|udp)\s+(open|closed|filtered)\s+(\S+)(?:\s+(.+))?/);
    if (match) {
      const port = parseInt(match[1]);
      const protocol = match[2] as "tcp" | "udp";
      const state = match[3] as "open" | "closed" | "filtered";
      const service = match[4] || COMMON_PORTS[port] || "unknown";
      const version = match[5]?.trim();

      ports.push({ port, protocol, state, service, version });
    }
  }

  return ports;
}

/**
 * Assess security risk based on open ports
 */
function assessRisk(ports: PortInfo[]): { riskLevel: "low" | "medium" | "high" | "critical"; vulnerabilities: string[] } {
  const vulnerabilities: string[] = [];
  let maxRisk = 0;

  for (const port of ports) {
    if (port.state !== "open") continue;

    if (HIGH_RISK_PORTS.includes(port.port)) {
      maxRisk = Math.max(maxRisk, 3);
      if (port.port === 23) vulnerabilities.push("Telnet (port 23) is open — unencrypted remote access");
      if (port.port === 21) vulnerabilities.push("FTP (port 21) is open — unencrypted file transfer");
      if (port.port === 445) vulnerabilities.push("SMB (port 445) is open — potential ransomware vector");
      if (port.port === 3389) vulnerabilities.push("RDP (port 3389) is open — remote desktop exposed");
      if (port.port === 5900) vulnerabilities.push("VNC (port 5900) is open — remote desktop exposed");
    } else if (MEDIUM_RISK_PORTS.includes(port.port)) {
      maxRisk = Math.max(maxRisk, 2);
      if (port.port === 22) vulnerabilities.push("SSH (port 22) is open — ensure strong authentication");
      if (port.port === 3306) vulnerabilities.push("MySQL (port 3306) is exposed — database should not be public");
      if (port.port === 5432) vulnerabilities.push("PostgreSQL (port 5432) is exposed — database should not be public");
      if (port.port === 6379) vulnerabilities.push("Redis (port 6379) is exposed — often misconfigured without auth");
      if (port.port === 27017) vulnerabilities.push("MongoDB (port 27017) is exposed — check authentication");
    } else if (port.port < 1024) {
      maxRisk = Math.max(maxRisk, 1);
    }
  }

  const riskLevels: Array<"low" | "medium" | "high" | "critical"> = ["low", "medium", "high", "critical"];
  return {
    riskLevel: riskLevels[Math.min(maxRisk, 3)],
    vulnerabilities,
  };
}

/**
 * Scan multiple devices
 */
export async function scanMultipleDevices(ips: string[]): Promise<ScanResult[]> {
  // Scan sequentially to avoid overloading the network
  const results: ScanResult[] = [];
  for (const ip of ips) {
    const result = await quickScan(ip);
    results.push(result);
  }
  return results;
}
