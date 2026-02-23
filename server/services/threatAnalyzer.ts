import { invokeLLM } from "../_core/llm";
import { Device, SecurityAlert } from "@shared/types";
import { createAlert } from "../db";

interface ThreatAnalysisResult {
  threatLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  recommendations: string[];
  summary: string;
  shouldBlock: boolean;
}

/**
 * Analyze device behavior and security threats using LLM
 */
export async function analyzeDeviceThreat(
  device: Device,
  deviceHistory: any[] = []
): Promise<ThreatAnalysisResult> {
  try {
    const historyContext = deviceHistory
      .slice(0, 10)
      .map((h: any) => `${h.eventType}: ${h.details}`)
      .join("\n");

    const prompt = `
You are a network security expert. Analyze the following device and provide a threat assessment.

Device Information:
- IP Address: ${device.ipAddress}
- MAC Address: ${device.macAddress}
- Vendor: ${device.vendor || "Unknown"}
- Device Type: ${device.deviceType || "Unknown"}
- Current Risk Score: ${device.riskScore}
- Online Status: ${device.isOnline ? "Online" : "Offline"}
- First Seen: ${device.firstSeen}
- Last Seen: ${device.lastSeen}

Recent Activity:
${historyContext || "No recent activity"}

Based on this information, provide:
1. A threat level assessment (low, medium, high, or critical)
2. An updated risk score (0-100)
3. Top 3 security recommendations
4. A brief summary of the threat
5. Whether this device should be blocked (yes/no)

Format your response as JSON with keys: threatLevel, riskScore, recommendations (array), summary, shouldBlock (boolean)
`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a cybersecurity expert specializing in network threat analysis. Provide concise, actionable security assessments.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "threat_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              threatLevel: {
                type: "string",
                enum: ["low", "medium", "high", "critical"],
              },
              riskScore: {
                type: "integer",
                minimum: 0,
                maximum: 100,
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
              summary: {
                type: "string",
              },
              shouldBlock: {
                type: "boolean",
              },
            },
            required: ["threatLevel", "riskScore", "recommendations", "summary", "shouldBlock"],
            additionalProperties: false,
          },
        },
      },
    });

    // Parse the response
    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No response from LLM");
    }

    // Handle both string and array content types
    let content: string;
    if (typeof messageContent === "string") {
      content = messageContent;
    } else if (Array.isArray(messageContent)) {
      // Extract text from content array
      content = messageContent
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
    } else {
      throw new Error("Unexpected response format");
    }

    const analysis = JSON.parse(content);

    return {
      threatLevel: analysis.threatLevel,
      riskScore: analysis.riskScore,
      recommendations: analysis.recommendations,
      summary: analysis.summary,
      shouldBlock: analysis.shouldBlock,
    };
  } catch (error) {
    console.error("Error analyzing device threat:", error);
    // Return conservative assessment on error
    return {
      threatLevel: "medium",
      riskScore: device.riskScore,
      recommendations: ["Monitor this device closely", "Review access logs", "Update firewall rules"],
      summary: "Unable to complete full analysis. Device requires manual review.",
      shouldBlock: false,
    };
  }
}

/**
 * Generate security recommendations for a network
 */
export async function generateNetworkRecommendations(
  devices: Device[],
  alerts: SecurityAlert[]
): Promise<string[]> {
  try {
    const highRiskDevices = devices.filter((d) => d.riskScore > 70);
    const blockedDevices = devices.filter((d) => d.isBlocked === true);
    const recentAlerts = alerts.slice(0, 5);

    const prompt = `
You are a network security consultant. Based on the following network status, provide top 5 actionable security recommendations.

Network Status:
- Total Devices: ${devices.length}
- High Risk Devices: ${highRiskDevices.length}
- Blocked Devices: ${blockedDevices.length}
- Recent Alerts: ${recentAlerts.length}

High Risk Devices:
${highRiskDevices.map((d) => `- ${d.deviceName || d.ipAddress} (Risk: ${d.riskScore})`).join("\n")}

Recent Alerts:
${recentAlerts.map((a) => `- ${a.title}: ${a.description}`).join("\n")}

Provide 5 specific, actionable recommendations to improve network security. Format as a JSON array of strings.
`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a cybersecurity expert. Provide practical, prioritized security recommendations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      return [
        "Monitor high-risk devices closely",
        "Review and update firewall rules",
        "Enable network segmentation",
        "Implement device authentication",
        "Regular security audits",
      ];
    }

    // Handle both string and array content types
    let content: string;
    if (typeof messageContent === "string") {
      content = messageContent;
    } else if (Array.isArray(messageContent)) {
      content = messageContent
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
    } else {
      return [
        "Monitor high-risk devices closely",
        "Review and update firewall rules",
        "Enable network segmentation",
        "Implement device authentication",
        "Regular security audits",
      ];
    }

    // Try to parse as JSON array
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, extract recommendations from text
    }

    return [
      "Monitor high-risk devices closely",
      "Review and update firewall rules",
      "Enable network segmentation",
      "Implement device authentication",
      "Regular security audits",
    ];
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [
      "Monitor high-risk devices closely",
      "Review and update firewall rules",
      "Enable network segmentation",
      "Implement device authentication",
      "Regular security audits",
    ];
  }
}

/**
 * Detect anomalies in device behavior
 */
export async function detectAnomalies(
  device: Device,
  deviceHistory: any[] = []
): Promise<{ isAnomaly: boolean; reason: string; severity: "low" | "medium" | "high" }> {
  try {
    // Simple heuristic-based anomaly detection
    const onlineEvents = deviceHistory.filter((h: any) => h.eventType === "connected");
    const offlineEvents = deviceHistory.filter((h: any) => h.eventType === "disconnected");

    // Check for unusual patterns
    if (onlineEvents.length > 20 && offlineEvents.length > 20) {
      // Device connecting/disconnecting frequently
      return {
        isAnomaly: true,
        reason: "Device showing unusual connection patterns",
        severity: "medium",
      };
    }

    if (device.riskScore > 80) {
      return {
        isAnomaly: true,
        reason: "Device has critical risk score",
        severity: "high",
      };
    }

    if (device.deviceType === "Unknown Device" && device.riskScore > 50) {
      return {
        isAnomaly: true,
        reason: "Unknown device with elevated risk",
        severity: "medium",
      };
    }

    return {
      isAnomaly: false,
      reason: "Device behavior appears normal",
      severity: "low",
    };
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    return {
      isAnomaly: false,
      reason: "Unable to analyze behavior",
      severity: "low",
    };
  }
}

/**
 * Create security alert based on threat analysis
 */
export async function createSecurityAlertFromThreat(
  userId: number,
  device: Device,
  analysis: ThreatAnalysisResult
): Promise<void> {
  try {
    let alertType: "new_device" | "high_risk_device" | "suspicious_activity" | "anomaly_detected" =
      "suspicious_activity";

    if (analysis.threatLevel === "critical") {
      alertType = "high_risk_device";
    }

    const severity = analysis.threatLevel;

    await createAlert({
      userId,
      deviceId: device.id,
      alertType,
      severity,
      title: `Security Alert: ${device.deviceName || device.ipAddress}`,
      description: analysis.summary,
      isResolved: false,
    });
  } catch (error) {
    console.error("Error creating security alert:", error);
  }
}
