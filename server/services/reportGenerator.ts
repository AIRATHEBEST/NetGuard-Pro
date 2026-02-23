/**
 * Report Generator Service
 * Generates PDF and CSV reports for network security analysis
 */

export interface ReportData {
  generatedAt: Date;
  title: string;
  summary: {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    blockedDevices: number;
    highRiskDevices: number;
    averageRiskScore: number;
    totalAlerts: number;
    unresolvedAlerts: number;
  };
  devices: Array<{
    id: number;
    ipAddress: string;
    macAddress?: string | null;
    deviceName?: string | null;
    vendor?: string | null;
    isOnline: boolean;
    isBlocked: boolean;
    riskScore: number;
    riskLevel: string;
    firstSeen: Date;
    lastSeen: Date;
  }>;
  alerts: Array<{
    id: number;
    alertType: string;
    severity: string;
    title: string;
    description?: string | null;
    isResolved: boolean;
    createdAt: Date;
  }>;
}

/**
 * Generate CSV report from network data
 */
export function generateCsvReport(data: ReportData): string {
  const lines: string[] = [];

  // Header
  lines.push(`NetGuard Pro - Network Security Report`);
  lines.push(`Generated: ${data.generatedAt.toISOString()}`);
  lines.push(``);

  // Summary
  lines.push(`SUMMARY`);
  lines.push(`Total Devices,${data.summary.totalDevices}`);
  lines.push(`Online Devices,${data.summary.onlineDevices}`);
  lines.push(`Offline Devices,${data.summary.offlineDevices}`);
  lines.push(`Blocked Devices,${data.summary.blockedDevices}`);
  lines.push(`High Risk Devices,${data.summary.highRiskDevices}`);
  lines.push(`Average Risk Score,${data.summary.averageRiskScore}`);
  lines.push(`Total Alerts,${data.summary.totalAlerts}`);
  lines.push(`Unresolved Alerts,${data.summary.unresolvedAlerts}`);
  lines.push(``);

  // Devices table
  lines.push(`DEVICES`);
  lines.push(`ID,IP Address,MAC Address,Device Name,Vendor,Status,Blocked,Risk Score,Risk Level,First Seen,Last Seen`);

  for (const device of data.devices) {
    const row = [
      device.id,
      device.ipAddress,
      device.macAddress || "",
      (device.deviceName || "").replace(/,/g, ";"),
      (device.vendor || "").replace(/,/g, ";"),
      device.isOnline ? "Online" : "Offline",
      device.isBlocked ? "Yes" : "No",
      device.riskScore,
      device.riskLevel,
      device.firstSeen.toISOString(),
      device.lastSeen.toISOString(),
    ];
    lines.push(row.join(","));
  }

  lines.push(``);

  // Alerts table
  lines.push(`SECURITY ALERTS`);
  lines.push(`ID,Type,Severity,Title,Description,Resolved,Created At`);

  for (const alert of data.alerts) {
    const row = [
      alert.id,
      alert.alertType,
      alert.severity,
      (alert.title || "").replace(/,/g, ";"),
      (alert.description || "").replace(/,/g, ";"),
      alert.isResolved ? "Yes" : "No",
      alert.createdAt.toISOString(),
    ];
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

/**
 * Generate HTML report (can be converted to PDF on client side)
 */
export function generateHtmlReport(data: ReportData): string {
  const riskColor = (level: string) => {
    switch (level) {
      case "critical": return "#dc2626";
      case "high": return "#ea580c";
      case "medium": return "#d97706";
      default: return "#16a34a";
    }
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "#dc2626";
      case "high": return "#ea580c";
      case "medium": return "#d97706";
      default: return "#16a34a";
    }
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NetGuard Pro - Security Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 40px; border-radius: 16px; margin-bottom: 32px; }
    .header h1 { font-size: 2rem; font-weight: 700; margin-bottom: 8px; }
    .header p { opacity: 0.85; font-size: 0.95rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
    .stat-card .value { font-size: 2rem; font-weight: 700; color: #1e40af; }
    .stat-card .label { font-size: 0.8rem; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .section { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px; }
    .section h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 16px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr:hover td { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge-online { background: #dcfce7; color: #166534; }
    .badge-offline { background: #fee2e2; color: #991b1b; }
    .badge-blocked { background: #fef3c7; color: #92400e; }
    .footer { text-align: center; color: #94a3b8; font-size: 0.8rem; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ NetGuard Pro — Security Report</h1>
      <p>Generated on ${data.generatedAt.toLocaleString()} | ${data.title}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${data.summary.totalDevices}</div>
        <div class="label">Total Devices</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #16a34a;">${data.summary.onlineDevices}</div>
        <div class="label">Online</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #dc2626;">${data.summary.offlineDevices}</div>
        <div class="label">Offline</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #d97706;">${data.summary.blockedDevices}</div>
        <div class="label">Blocked</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #dc2626;">${data.summary.highRiskDevices}</div>
        <div class="label">High Risk</div>
      </div>
      <div class="stat-card">
        <div class="value">${data.summary.averageRiskScore}</div>
        <div class="label">Avg Risk Score</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #7c3aed;">${data.summary.totalAlerts}</div>
        <div class="label">Total Alerts</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #dc2626;">${data.summary.unresolvedAlerts}</div>
        <div class="label">Unresolved</div>
      </div>
    </div>

    <div class="section">
      <h2>📱 Network Devices (${data.devices.length})</h2>
      <table>
        <thead>
          <tr>
            <th>IP Address</th>
            <th>Device Name</th>
            <th>MAC Address</th>
            <th>Vendor</th>
            <th>Status</th>
            <th>Risk Level</th>
            <th>Risk Score</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          ${data.devices.map(d => `
          <tr>
            <td><strong>${d.ipAddress}</strong></td>
            <td>${d.deviceName || "—"}</td>
            <td style="font-family: monospace; font-size: 0.8rem;">${d.macAddress || "—"}</td>
            <td>${d.vendor || "—"}</td>
            <td>
              <span class="badge ${d.isBlocked ? "badge-blocked" : d.isOnline ? "badge-online" : "badge-offline"}">
                ${d.isBlocked ? "Blocked" : d.isOnline ? "Online" : "Offline"}
              </span>
            </td>
            <td><span style="color: ${riskColor(d.riskLevel)}; font-weight: 600;">${d.riskLevel.toUpperCase()}</span></td>
            <td>${d.riskScore}</td>
            <td style="font-size: 0.8rem;">${new Date(d.lastSeen).toLocaleString()}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>🚨 Security Alerts (${data.alerts.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Severity</th>
            <th>Title</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${data.alerts.map(a => `
          <tr>
            <td>${a.alertType.replace(/_/g, " ")}</td>
            <td><span style="color: ${severityColor(a.severity)}; font-weight: 600;">${a.severity.toUpperCase()}</span></td>
            <td>${a.title}</td>
            <td>
              <span class="badge ${a.isResolved ? "badge-online" : "badge-offline"}">
                ${a.isResolved ? "Resolved" : "Active"}
              </span>
            </td>
            <td style="font-size: 0.8rem;">${new Date(a.createdAt).toLocaleString()}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>NetGuard Pro — Advanced Network Security Monitoring | Report generated automatically</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate JSON report
 */
export function generateJsonReport(data: ReportData): string {
  return JSON.stringify(data, null, 2);
}
