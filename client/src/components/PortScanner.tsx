import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldCheck, Search, AlertTriangle, Clock } from "lucide-react";

const RISK_COLORS = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const RISK_ICONS = {
  low: <ShieldCheck className="w-5 h-5 text-green-600" />,
  medium: <Shield className="w-5 h-5 text-yellow-600" />,
  high: <ShieldAlert className="w-5 h-5 text-orange-600" />,
  critical: <ShieldAlert className="w-5 h-5 text-red-600" />,
};

export default function PortScanner() {
  const [target, setTarget] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanType, setScanType] = useState<"quick" | "full">("quick");

  const quickScanMutation = trpc.portScan.quick.useMutation({
    onSuccess: (data) => setScanResult(data),
  });

  const fullScanMutation = trpc.portScan.full.useMutation({
    onSuccess: (data) => setScanResult(data),
  });

  const isScanning = quickScanMutation.isPending || fullScanMutation.isPending;

  const handleScan = () => {
    if (!target.trim()) return;
    setScanResult(null);
    if (scanType === "quick") {
      quickScanMutation.mutate({ ip: target.trim() });
    } else {
      fullScanMutation.mutate({ ip: target.trim(), portRange: "1-1024" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" /> Port Scanner
          </CardTitle>
          <CardDescription>
            Scan device ports to identify running services and security vulnerabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address (e.g. 192.168.0.100)"
              value={target}
              onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleScan()}
              className="flex-1"
            />
            <div className="flex gap-1">
              <Button
                variant={scanType === "quick" ? "default" : "outline"}
                size="sm"
                onClick={() => setScanType("quick")}
              >
                Quick
              </Button>
              <Button
                variant={scanType === "full" ? "default" : "outline"}
                size="sm"
                onClick={() => setScanType("full")}
              >
                Full
              </Button>
            </div>
            <Button onClick={handleScan} disabled={isScanning || !target.trim()}>
              {isScanning ? "Scanning..." : "Scan"}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            {scanType === "quick"
              ? "Quick scan checks ~20 common ports (HTTP, SSH, FTP, RDP, etc.)"
              : "Full scan checks ports 1–1024 — may take 30–60 seconds"}
          </p>

          {isScanning && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-700 text-sm">Scanning {target}... This may take a moment.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {scanResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {RISK_ICONS[scanResult.riskLevel as keyof typeof RISK_ICONS]}
                  Scan Results: {scanResult.ip}
                </CardTitle>
                <CardDescription>
                  {scanResult.hostname && <span>{scanResult.hostname} · </span>}
                  {scanResult.openPorts.length} open ports found ·{" "}
                  <Clock className="w-3 h-3 inline" /> {(scanResult.scanDuration / 1000).toFixed(1)}s
                </CardDescription>
              </div>
              <Badge className={RISK_COLORS[scanResult.riskLevel as keyof typeof RISK_COLORS]}>
                {scanResult.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vulnerabilities */}
            {scanResult.vulnerabilities.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                <h4 className="font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Security Warnings
                </h4>
                {scanResult.vulnerabilities.map((v: string, i: number) => (
                  <p key={i} className="text-sm text-red-700">• {v}</p>
                ))}
              </div>
            )}

            {/* Open Ports Table */}
            {scanResult.openPorts.length > 0 ? (
              <div>
                <h4 className="font-semibold text-sm mb-3 text-gray-700">Open Ports ({scanResult.openPorts.length})</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left p-2 font-medium text-gray-600">Port</th>
                        <th className="text-left p-2 font-medium text-gray-600">Protocol</th>
                        <th className="text-left p-2 font-medium text-gray-600">Service</th>
                        <th className="text-left p-2 font-medium text-gray-600">Version</th>
                        <th className="text-left p-2 font-medium text-gray-600">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanResult.openPorts.map((port: any, i: number) => {
                        const isHighRisk = [21, 23, 445, 3389, 5900].includes(port.port);
                        const isMedRisk = [22, 25, 3306, 5432, 6379, 27017].includes(port.port);
                        return (
                          <tr key={i} className="border-b hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold">{port.port}</td>
                            <td className="p-2 uppercase text-xs">{port.protocol}</td>
                            <td className="p-2">{port.service}</td>
                            <td className="p-2 text-gray-500 text-xs">{port.version || "—"}</td>
                            <td className="p-2">
                              {isHighRisk ? (
                                <Badge className="bg-red-100 text-red-800">High</Badge>
                              ) : isMedRisk ? (
                                <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800">Low</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                <ShieldCheck className="w-10 h-10 mb-2 text-green-500" />
                <p className="text-sm">No open ports found — device appears secure</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
