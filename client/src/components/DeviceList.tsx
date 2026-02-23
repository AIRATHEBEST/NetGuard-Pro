import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Wifi, WifiOff, Shield, AlertTriangle, MoreVertical, Search,
  Monitor, Smartphone, Laptop, Router, Printer, Tv, RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState } from "react";
import { identifyDeviceFromMac } from "@/lib/deviceUtils";

export default function DeviceList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "offline" | "blocked" | "risk">("all");

  const { data: devices, isLoading, refetch } = trpc.devices.list.useQuery();
  const blockMutation = trpc.devices.block.useMutation();
  const unblockMutation = trpc.devices.unblock.useMutation();
  const utils = trpc.useUtils();

  const handleBlock = async (device: any) => {
    try {
      await blockMutation.mutateAsync({ id: device.id });
      await utils.devices.list.invalidate();
      toast.success(`Device ${device.deviceName || device.ipAddress} blocked`);
    } catch {
      toast.error("Failed to block device");
    }
  };

  const handleUnblock = async (device: any) => {
    try {
      await unblockMutation.mutateAsync({ id: device.id });
      await utils.devices.list.invalidate();
      toast.success(`Device ${device.deviceName || device.ipAddress} unblocked`);
    } catch {
      toast.error("Failed to unblock device");
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600 bg-red-50";
    if (score >= 60) return "text-orange-600 bg-orange-50";
    if (score >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getDeviceIcon = (device: any) => {
    const vendor = (device.vendor || "").toLowerCase();
    const name = (device.deviceName || "").toLowerCase();
    const type = (device.deviceType || "").toLowerCase();
    if (type.includes("router") || vendor.includes("huawei") || vendor.includes("tp-link")) return <Router className="w-5 h-5 text-blue-600" />;
    if (vendor.includes("apple") && (name.includes("iphone") || name.includes("ipad"))) return <Smartphone className="w-5 h-5 text-gray-600" />;
    if (vendor.includes("samsung") || vendor.includes("xiaomi")) return <Smartphone className="w-5 h-5 text-gray-600" />;
    if (name.includes("laptop") || name.includes("macbook") || vendor.includes("dell") || vendor.includes("hp")) return <Laptop className="w-5 h-5 text-gray-600" />;
    if (name.includes("printer") || type.includes("printer")) return <Printer className="w-5 h-5 text-gray-600" />;
    if (name.includes("tv") || name.includes("chromecast")) return <Tv className="w-5 h-5 text-gray-600" />;
    return <Monitor className="w-5 h-5 text-gray-600" />;
  };

  const filteredDevices = (devices || []).filter(device => {
    const matchesSearch =
      !search ||
      (device.deviceName || "").toLowerCase().includes(search.toLowerCase()) ||
      device.ipAddress.includes(search) ||
      (device.macAddress || "").toLowerCase().includes(search.toLowerCase()) ||
      (device.vendor || "").toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "online" && device.isOnline) ||
      (filter === "offline" && !device.isOnline) ||
      (filter === "blocked" && device.isBlocked) ||
      (filter === "risk" && device.riskScore >= 60);

    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="flex items-center gap-2 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading devices...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-600" /> Connected Devices
            </CardTitle>
            <CardDescription>
              {devices?.length || 0} devices discovered · {devices?.filter(d => d.isOnline).length || 0} online
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, IP, MAC, or vendor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "online", "offline", "blocked", "risk"] as const).map(f => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize text-xs"
              >
                {f === "risk" ? "High Risk" : f}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Wifi className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-base font-medium">
              {devices?.length === 0
                ? "No devices found — configure your router settings to start scanning"
                : "No devices match your search"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDevices.map(device => (
              <div
                key={device.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  device.isBlocked
                    ? "bg-red-50 border-red-200"
                    : device.riskScore >= 80
                    ? "bg-orange-50 border-orange-200"
                    : "bg-white border-slate-200 hover:shadow-sm"
                }`}
              >
                {/* Status indicator */}
                <div className="relative flex-shrink-0">
                  {getDeviceIcon(device)}
                  <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    device.isBlocked ? "bg-red-500" :
                    device.isOnline ? "bg-green-500" : "bg-gray-300"
                  }`} />
                </div>

                {/* Device info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {device.deviceName || device.ipAddress}
                    </h3>
                    {device.isBlocked && (
                      <Badge variant="destructive" className="text-xs">BLOCKED</Badge>
                    )}
                    {device.riskScore >= 80 && !device.isBlocked && (
                      <Badge className="bg-orange-100 text-orange-800 text-xs">HIGH RISK</Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 font-mono mt-0.5">
                    {device.ipAddress}
                    {device.macAddress && ` · ${device.macAddress}`}
                  </div>
                  {device.vendor && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      {device.vendor}
                      {device.deviceType && ` · ${device.deviceType}`}
                    </div>
                  )}
                  {device.lastSeen && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      Last seen: {new Date(device.lastSeen).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Risk score */}
                <div className="flex-shrink-0 text-right">
                  <div className={`text-lg font-bold px-2 py-0.5 rounded ${getRiskColor(device.riskScore)}`}>
                    {device.riskScore}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Risk Score</div>
                </div>

                {/* Risk level */}
                <Badge
                  variant={device.riskScore >= 80 ? "destructive" : device.riskScore >= 60 ? "default" : "secondary"}
                  className="flex-shrink-0 capitalize"
                >
                  {device.riskLevel}
                </Badge>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {device.isBlocked ? (
                      <DropdownMenuItem onClick={() => handleUnblock(device)}>
                        Unblock Device
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleBlock(device)} className="text-red-600">
                        Block Device
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>View History</DropdownMenuItem>
                    <DropdownMenuItem>Run Port Scan</DropdownMenuItem>
                    <DropdownMenuItem>Ping Device</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
