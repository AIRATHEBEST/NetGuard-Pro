import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Wifi, WifiOff, Shield, AlertTriangle, Activity, Settings } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import DeviceList from "@/components/DeviceList";
import AlertsList from "@/components/AlertsList";
import RouterSettings from "@/components/RouterSettings";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch data
  const { data: stats, isLoading: statsLoading } = trpc.stats.overview.useQuery();
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

  const getRiskBadgeVariant = (score: number) => {
    if (score >= 80) return "destructive";
    if (score >= 60) return "default";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            NetGuard Pro
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Advanced Network Security Monitoring
          </p>
        </div>

        {/* Statistics Cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.totalDevices}
                </div>
                <p className="text-xs text-slate-500 mt-1">Connected to network</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                  <Wifi className="w-4 h-4" /> Online
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.onlineDevices}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.totalDevices > 0
                    ? Math.round((stats.onlineDevices / stats.totalDevices) * 100)
                    : 0}
                  % online
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> At Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.highRiskDevices}
                </div>
                <p className="text-xs text-slate-500 mt-1">High risk score</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Blocked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.blockedDevices}
                </div>
                <p className="text-xs text-slate-500 mt-1">Devices blocked</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Avg Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getRiskColor(stats.averageRiskScore)}`}>
                  {stats.averageRiskScore}
                </div>
                <p className="text-xs text-slate-500 mt-1">Network average</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Devices</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {alerts && alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Devices Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Connected Devices</CardTitle>
                <CardDescription>
                  Real-time monitoring of all devices on your network
                </CardDescription>
              </CardHeader>
              <CardContent>
                {devicesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p>Loading devices...</p>
                  </div>
                ) : devices && devices.length > 0 ? (
                  <DeviceList devices={devices} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Wifi className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No devices found. Configure your router settings to start scanning.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>
                  Recent security events and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts && alerts.length > 0 ? (
                  <AlertsList alerts={alerts} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Shield className="w-12 h-12 text-green-300 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No alerts. Your network is secure!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Network Analytics</CardTitle>
                <CardDescription>
                  Traffic patterns and device behavior analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <Activity className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Analytics dashboard coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <RouterSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
