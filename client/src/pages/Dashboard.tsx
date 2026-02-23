import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle, Wifi, WifiOff, Shield, AlertTriangle, Activity,
  Network, Search, Globe, FileText, BarChart3, Router,
  Cpu, Lock, RefreshCw
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import DeviceList from "@/components/DeviceList";
import AlertsList from "@/components/AlertsList";
import RouterSettings from "@/components/RouterSettings";
import NetworkTopology from "@/components/NetworkTopology";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import PortScanner from "@/components/PortScanner";
import NetworkDiagnostics from "@/components/NetworkDiagnostics";
import ReportsExport from "@/components/ReportsExport";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.stats.overview.useQuery();
  const { data: devices, isLoading: devicesLoading } = trpc.devices.list.useQuery();
  const { data: alerts } = trpc.alerts.list.useQuery({ limit: 5 });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              NetGuard Pro
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Advanced Network Security Monitoring · Welcome, {user.name || "Admin"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchStats()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            <Card className="border-0 shadow-sm col-span-1">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.totalDevices}</div>
                <p className="text-xs text-slate-500">Total Devices</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm col-span-1">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                  <Wifi className="w-4 h-4" />{stats.onlineDevices}
                </div>
                <p className="text-xs text-slate-500">Online</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm col-span-1">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-gray-400 flex items-center justify-center gap-1">
                  <WifiOff className="w-4 h-4" />{stats.offlineDevices}
                </div>
                <p className="text-xs text-slate-500">Offline</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm col-span-1">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                  <Lock className="w-4 h-4" />{stats.blockedDevices}
                </div>
                <p className="text-xs text-slate-500">Blocked</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm col-span-1">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" />{stats.highRiskDevices}
                </div>
                <p className="text-xs text-slate-500">High Risk</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm col-span-1">
              <CardContent className="p-3 text-center">
                <div className={`text-2xl font-bold ${getRiskColor(stats.averageRiskScore)}`}>
                  {stats.averageRiskScore}
                </div>
                <p className="text-xs text-slate-500">Avg Risk</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm col-span-1">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{(stats as any).totalAlerts || 0}</div>
                <p className="text-xs text-slate-500">Alerts</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm col-span-1">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-red-500">{(stats as any).unresolvedAlerts || 0}</div>
                <p className="text-xs text-slate-500">Unresolved</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto mb-6 bg-white shadow-sm p-1 rounded-xl">
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4" /> Devices
            </TabsTrigger>
            <TabsTrigger value="topology" className="flex items-center gap-1.5">
              <Network className="w-4 h-4" /> Topology
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Performance
            </TabsTrigger>
            <TabsTrigger value="portscan" className="flex items-center gap-1.5">
              <Search className="w-4 h-4" /> Port Scan
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="flex items-center gap-1.5">
              <Globe className="w-4 h-4" /> Diagnostics
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              Alerts
              {(stats as any)?.unresolvedAlerts > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                  {(stats as any).unresolvedAlerts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Reports
            </TabsTrigger>
            <TabsTrigger value="router" className="flex items-center gap-1.5">
              <Router className="w-4 h-4" /> Router
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Alerts */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" /> Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts && alerts.length > 0 ? (
                    <div className="space-y-2">
                      {alerts.slice(0, 5).map(alert => (
                        <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            alert.severity === "critical" ? "bg-red-500" :
                            alert.severity === "high" ? "bg-orange-500" :
                            alert.severity === "medium" ? "bg-yellow-500" : "bg-green-500"
                          }`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{alert.title}</p>
                            <p className="text-xs text-gray-500">{new Date(alert.createdAt).toLocaleString()}</p>
                          </div>
                          <Badge
                            variant={alert.severity === "critical" || alert.severity === "high" ? "destructive" : "secondary"}
                            className="flex-shrink-0 text-xs"
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                      <Shield className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No alerts — network looks clean</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Devices */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-blue-500" /> Connected Devices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {devices && devices.length > 0 ? (
                    <div className="space-y-2">
                      {devices.slice(0, 6).map(device => (
                        <div key={device.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            device.isBlocked ? "bg-orange-500" :
                            device.isOnline ? "bg-green-500" : "bg-gray-300"
                          }`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{device.deviceName || device.ipAddress}</p>
                            <p className="text-xs text-gray-400 font-mono">{device.ipAddress}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {device.isBlocked && <Badge variant="outline" className="text-xs text-orange-600">Blocked</Badge>}
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                device.riskLevel === "critical" ? "text-red-600" :
                                device.riskLevel === "high" ? "text-orange-600" :
                                device.riskLevel === "medium" ? "text-yellow-600" : "text-green-600"
                              }`}
                            >
                              {device.riskLevel}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                      <Wifi className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No devices found — scan your router</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Feature Status */}
              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" /> Feature Status
                  </CardTitle>
                  <CardDescription>All 15 Fing-like features — click to navigate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {[
                      { name: "Network Device Discovery", tab: "devices" },
                      { name: "Network Scanning & Mapping", tab: "topology" },
                      { name: "Real-Time Alerts", tab: "alerts" },
                      { name: "Performance Metrics (Latency/Bandwidth)", tab: "performance" },
                      { name: "Security Vulnerability Detection", tab: "devices" },
                      { name: "Port Scanning", tab: "portscan" },
                      { name: "DNS Lookup Tools", tab: "diagnostics" },
                      { name: "Traceroute & Ping", tab: "diagnostics" },
                      { name: "Custom Alerts & Notifications", tab: "alerts" },
                      { name: "Integrations & Router APIs", tab: "router" },
                      { name: "Historical Data & Activity Logs", tab: "devices" },
                      { name: "Secure Login & Sync (Supabase)", tab: "overview" },
                      { name: "Home & Business Mode", tab: "router" },
                      { name: "Geolocation & Device Fingerprinting", tab: "devices" },
                      { name: "Pro-Level Reports (PDF/CSV)", tab: "reports" },
                    ].map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100 cursor-pointer hover:bg-green-100 transition-colors"
                        onClick={() => setActiveTab(feature.tab)}
                      >
                        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        <span className="text-xs text-green-800 font-medium">{feature.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices">
            <DeviceList />
          </TabsContent>

          {/* Topology Tab */}
          <TabsContent value="topology">
            <NetworkTopology />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <PerformanceMetrics />
          </TabsContent>

          {/* Port Scan Tab */}
          <TabsContent value="portscan">
            <PortScanner />
          </TabsContent>

          {/* Diagnostics Tab */}
          <TabsContent value="diagnostics">
            <NetworkDiagnostics />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <AlertsList />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ReportsExport />
          </TabsContent>

          {/* Router Settings Tab */}
          <TabsContent value="router">
            <RouterSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
