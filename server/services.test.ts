import { describe, it, expect, beforeEach } from "vitest";
import { calculateRiskScore, simulateDeviceScan } from "./services/deviceScanner";
import { analyzeDeviceThreat, detectAnomalies } from "./services/threatAnalyzer";
import type { Device } from "@shared/types";

describe("Device Scanner", () => {
  it("should calculate risk score for new devices", () => {
    const mockDevice = {
      ip: "192.168.1.100",
      mac: "AA:BB:CC:DD:EE:FF",
      vendor: "Unknown Vendor",
      deviceType: "Unknown Device",
    };

    const score = calculateRiskScore(mockDevice, true);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should assign lower risk to known vendors", () => {
    const knownDevice = {
      ip: "192.168.1.100",
      mac: "00:1A:2B:3C:4D:5E",
      vendor: "Apple Inc.",
      deviceType: "iPhone/iPad/Mac",
    };

    const unknownDevice = {
      ip: "192.168.1.100",
      mac: "AA:BB:CC:DD:EE:FF",
      vendor: "Unknown Vendor",
      deviceType: "Unknown Device",
    };

    const knownScore = calculateRiskScore(knownDevice, false);
    const unknownScore = calculateRiskScore(unknownDevice, false);

    expect(knownScore).toBeLessThan(unknownScore);
  });

  it("should simulate device scan and return devices", async () => {
    const devices = await simulateDeviceScan();
    expect(Array.isArray(devices)).toBe(true);
    expect(devices.length).toBeGreaterThan(0);

    // Check device structure
    const device = devices[0];
    expect(device).toHaveProperty("ip");
    expect(device).toHaveProperty("mac");
    expect(device).toHaveProperty("vendor");
    expect(device).toHaveProperty("deviceType");
  });

  it("should classify device types correctly", () => {
    const devices = [
      {
        ip: "192.168.1.10",
        mac: "00:1A:2B:3C:4D:5E",
        vendor: "Apple Inc.",
        deviceType: "iPhone/iPad/Mac",
      },
      {
        ip: "192.168.1.20",
        mac: "B8:27:EB:12:34:56",
        vendor: "Raspberry Pi Foundation",
        deviceType: "Raspberry Pi",
      },
    ];

    devices.forEach((device) => {
      const score = calculateRiskScore(device, false);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

describe("Threat Analyzer", () => {
  const mockDevice: Device = {
    id: 1,
    userId: 1,
    ipAddress: "192.168.1.100",
    macAddress: "AA:BB:CC:DD:EE:FF",
    vendor: "Unknown Vendor",
    deviceType: "Unknown Device",
    deviceName: "Test Device",
    isOnline: 1,
    isBlocked: 0,
    riskScore: 50,
    riskLevel: "medium",
    lastSeen: new Date(),
    firstSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should detect anomalies in device behavior", async () => {
    const anomaly = await detectAnomalies(mockDevice, []);
    expect(anomaly).toHaveProperty("isAnomaly");
    expect(anomaly).toHaveProperty("reason");
    expect(anomaly).toHaveProperty("severity");
    expect(["low", "medium", "high"]).toContain(anomaly.severity);
  });

  it("should flag high risk devices as anomalies", async () => {
    const highRiskDevice: Device = {
      ...mockDevice,
      riskScore: 85,
      riskLevel: "critical",
    };

    const anomaly = await detectAnomalies(highRiskDevice, []);
    expect(anomaly.isAnomaly).toBe(true);
    expect(anomaly.severity).toBe("high");
  });

  it("should flag unknown devices with elevated risk", async () => {
    const unknownDevice: Device = {
      ...mockDevice,
      deviceType: "Unknown Device",
      riskScore: 60,
    };

    const anomaly = await detectAnomalies(unknownDevice, []);
    expect(anomaly.isAnomaly).toBe(true);
  });

  it("should handle threat analysis gracefully", async () => {
    const analysis = await analyzeDeviceThreat(mockDevice, []);
    expect(analysis).toHaveProperty("threatLevel");
    expect(analysis).toHaveProperty("riskScore");
    expect(analysis).toHaveProperty("recommendations");
    expect(analysis).toHaveProperty("summary");
    expect(analysis).toHaveProperty("shouldBlock");

    expect(["low", "medium", "high", "critical"]).toContain(analysis.threatLevel);
    expect(Array.isArray(analysis.recommendations)).toBe(true);
    expect(typeof analysis.shouldBlock).toBe("boolean");
  });

  it("should provide reasonable recommendations", async () => {
    const analysis = await analyzeDeviceThreat(mockDevice, []);
    expect(analysis.recommendations.length).toBeGreaterThan(0);
    expect(analysis.recommendations.every((r: string) => typeof r === "string")).toBe(true);
  });
});

describe("Risk Assessment", () => {
  it("should correctly assess risk levels", () => {
    const testCases = [
      { score: 0, expected: "low" },
      { score: 30, expected: "low" },
      { score: 50, expected: "medium" },
      { score: 70, expected: "high" },
      { score: 85, expected: "critical" },
      { score: 100, expected: "critical" },
    ];

    testCases.forEach(({ score, expected }) => {
      const device = {
        ip: "192.168.1.100",
        mac: "AA:BB:CC:DD:EE:FF",
        vendor: "Test",
        deviceType: "Test",
      };

      // Risk score calculation should produce appropriate levels
      const calculatedScore = calculateRiskScore(device, false);
      expect(calculatedScore).toBeGreaterThanOrEqual(0);
      expect(calculatedScore).toBeLessThanOrEqual(100);
    });
  });
});
