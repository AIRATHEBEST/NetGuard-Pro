import { Device } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Shield, AlertTriangle, MoreVertical } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface DeviceListProps {
  devices: Device[];
}

export default function DeviceList({ devices }: DeviceListProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const blockMutation = trpc.devices.block.useMutation();
  const unblockMutation = trpc.devices.unblock.useMutation();
  const utils = trpc.useUtils();

  const handleBlock = async (device: Device) => {
    try {
      await blockMutation.mutateAsync({ id: device.id });
      await utils.devices.list.invalidate();
      toast.success(`Device ${device.deviceName || device.ipAddress} blocked`);
    } catch (error) {
      toast.error("Failed to block device");
    }
  };

  const handleUnblock = async (device: Device) => {
    try {
      await unblockMutation.mutateAsync({ id: device.id });
      await utils.devices.list.invalidate();
      toast.success(`Device ${device.deviceName || device.ipAddress} unblocked`);
    } catch (error) {
      toast.error("Failed to unblock device");
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (score >= 60) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  };

  const getRiskBadgeVariant = (score: number) => {
    if (score >= 80) return "destructive";
    if (score >= 60) return "default";
    return "secondary";
  };

  return (
    <div className="space-y-3">
      {devices.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          No devices found
        </div>
      ) : (
        devices.map((device) => (
          <div
            key={device.id}
            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
              device.isBlocked
                ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-4 flex-1">
              {/* Device Status Icon */}
              <div className="flex-shrink-0">
                {device.isOnline === 1 ? (
                  <Wifi className="w-6 h-6 text-green-600" />
                ) : (
                  <WifiOff className="w-6 h-6 text-slate-400" />
                )}
              </div>

              {/* Device Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {device.deviceName || device.ipAddress}
                  </h3>
                  {device.isBlocked === 1 && (
                    <Badge variant="destructive" className="text-xs">
                      BLOCKED
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {device.ipAddress} • {device.macAddress}
                </div>
                {device.vendor && (
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    {device.vendor} • {device.deviceType || "Unknown"}
                  </div>
                )}
              </div>
            </div>

            {/* Risk Score and Actions */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Risk Score */}
              <div className="text-right">
                <div className={`text-lg font-bold ${getRiskColor(device.riskScore)}`}>
                  {device.riskScore}
                </div>
                <div className="text-xs text-slate-500">Risk Score</div>
              </div>

              {/* Risk Level Badge */}
              <Badge variant={getRiskBadgeVariant(device.riskScore)}>
                {device.riskLevel}
              </Badge>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {device.isBlocked === 1 ? (
                    <DropdownMenuItem onClick={() => handleUnblock(device)}>
                      Unblock Device
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleBlock(device)}>
                      Block Device
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>View History</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
