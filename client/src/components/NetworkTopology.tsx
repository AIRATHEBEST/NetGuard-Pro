import { useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, RefreshCw, Router, Monitor, Smartphone, Laptop, Printer, Tv } from "lucide-react";

interface TopologyNode {
  id: string;
  type: string;
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
  isOnline: boolean;
  deviceName?: string;
  riskLevel?: string;
  connectionType?: string;
}

interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

function getDeviceIcon(node: TopologyNode) {
  if (node.type === "router") return <Router className="w-6 h-6 text-blue-600" />;
  const vendor = (node.vendor || "").toLowerCase();
  const name = (node.deviceName || "").toLowerCase();
  if (vendor.includes("apple") || name.includes("iphone") || name.includes("ipad")) return <Smartphone className="w-5 h-5 text-gray-600" />;
  if (vendor.includes("samsung") || vendor.includes("xiaomi")) return <Smartphone className="w-5 h-5 text-gray-600" />;
  if (name.includes("laptop") || name.includes("macbook")) return <Laptop className="w-5 h-5 text-gray-600" />;
  if (name.includes("printer")) return <Printer className="w-5 h-5 text-gray-600" />;
  if (name.includes("tv") || name.includes("chromecast")) return <Tv className="w-5 h-5 text-gray-600" />;
  return <Monitor className="w-5 h-5 text-gray-600" />;
}

function getRiskColor(riskLevel?: string) {
  switch (riskLevel) {
    case "critical": return "border-red-500 bg-red-50";
    case "high": return "border-orange-500 bg-orange-50";
    case "medium": return "border-yellow-500 bg-yellow-50";
    default: return "border-green-500 bg-green-50";
  }
}

function NodeCard({ node, index, total }: { node: TopologyNode; index: number; total: number }) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = Math.min(280, 60 + total * 25);
  const x = 50 + (radius / 3.5) * Math.cos(angle);
  const y = 50 + (radius / 3.5) * Math.sin(angle);

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 shadow-sm bg-white cursor-pointer hover:shadow-md transition-shadow ${getRiskColor(node.riskLevel)} ${!node.isOnline ? "opacity-50" : ""}`}
        style={{ minWidth: "80px", maxWidth: "100px" }}
      >
        <div className="relative">
          {getDeviceIcon(node)}
          <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white ${node.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
        </div>
        <span className="text-xs font-medium text-center truncate w-full text-center" title={node.deviceName || node.ip}>
          {node.deviceName ? node.deviceName.substring(0, 12) : node.ip}
        </span>
        <span className="text-xs text-gray-400">{node.ip}</span>
      </div>
    </div>
  );
}

export default function NetworkTopology() {
  const { data: topology, isLoading, refetch, isFetching } = trpc.topology.get.useQuery();
  const discoverMutation = trpc.topology.discover.useMutation({
    onSuccess: () => refetch(),
  });

  const deviceNodes = useMemo(() => {
    if (!topology) return [];
    return topology.nodes.filter(n => n.type !== "router");
  }, [topology]);

  const routerNode = useMemo(() => {
    if (!topology) return null;
    return topology.nodes.find(n => n.type === "router");
  }, [topology]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" /> Network Topology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-600" /> Network Topology
            </CardTitle>
            <CardDescription>
              Visual map of your network — {topology?.nodes.length || 0} nodes, {topology?.edges.length || 0} connections
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => discoverMutation.mutate({})}
              disabled={discoverMutation.isPending}
            >
              {discoverMutation.isPending ? "Scanning..." : "Live Scan"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!topology || topology.nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Network className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No topology data yet</p>
            <p className="text-sm mt-1">Scan your router to discover devices</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Topology Visualization */}
            <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200 overflow-hidden" style={{ height: "400px" }}>
              {/* SVG Lines connecting devices to router */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {deviceNodes.map((_, index) => {
                  const angle = (index / deviceNodes.length) * 2 * Math.PI - Math.PI / 2;
                  const radius = Math.min(280, 60 + deviceNodes.length * 25);
                  const x2 = 50 + (radius / 3.5) * Math.cos(angle);
                  const y2 = 50 + (radius / 3.5) * Math.sin(angle);
                  return (
                    <line
                      key={index}
                      x1="50%"
                      y1="50%"
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      opacity="0.6"
                    />
                  );
                })}
              </svg>

              {/* Router at center */}
              <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: "50%", top: "50%", zIndex: 10 }}>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-blue-500 bg-blue-50 shadow-lg">
                  <Router className="w-8 h-8 text-blue-600" />
                  <span className="text-xs font-bold text-blue-700">Router</span>
                  <span className="text-xs text-blue-500">{routerNode?.ip || topology.gateway || "Gateway"}</span>
                </div>
              </div>

              {/* Device nodes in a circle */}
              {deviceNodes.map((node, index) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  index={index}
                  total={deviceNodes.length}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" /> Online
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-400" /> Offline
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-red-500 bg-red-50" /> Critical Risk
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-orange-500 bg-orange-50" /> High Risk
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-green-500 bg-green-50" /> Low Risk
              </div>
            </div>

            {/* Device list */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {deviceNodes.map(node => (
                <div key={node.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border text-xs">
                  {getDeviceIcon(node)}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{node.deviceName || node.ip}</p>
                    <p className="text-gray-400">{node.ip}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${node.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
