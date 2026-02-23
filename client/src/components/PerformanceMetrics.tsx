import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Wifi, WifiOff, Zap, TrendingUp, AlertTriangle } from "lucide-react";

function LatencyBadge({ ms }: { ms: number | null }) {
  if (ms === null) return <Badge variant="destructive">Unreachable</Badge>;
  if (ms < 10) return <Badge className="bg-green-100 text-green-800">Excellent ({ms.toFixed(1)}ms)</Badge>;
  if (ms < 50) return <Badge className="bg-blue-100 text-blue-800">Good ({ms.toFixed(1)}ms)</Badge>;
  if (ms < 150) return <Badge className="bg-yellow-100 text-yellow-800">Fair ({ms.toFixed(1)}ms)</Badge>;
  return <Badge variant="destructive">Poor ({ms.toFixed(1)}ms)</Badge>;
}

function PacketLossBadge({ loss }: { loss: number }) {
  if (loss === 0) return <Badge className="bg-green-100 text-green-800">0% Loss</Badge>;
  if (loss < 5) return <Badge className="bg-yellow-100 text-yellow-800">{loss}% Loss</Badge>;
  if (loss < 20) return <Badge className="bg-orange-100 text-orange-800">{loss}% Loss</Badge>;
  return <Badge variant="destructive">{loss}% Loss</Badge>;
}

export default function PerformanceMetrics() {
  const [pingTarget, setPingTarget] = useState("");
  const [pingResult, setPingResult] = useState<any>(null);

  const { data: devices } = trpc.devices.list.useQuery();

  const pingMutation = trpc.performance.ping.useMutation({
    onSuccess: (data) => setPingResult(data),
  });

  const batchPingMutation = trpc.performance.pingBatch.useMutation();

  const handlePing = () => {
    if (!pingTarget.trim()) return;
    pingMutation.mutate({ ip: pingTarget.trim(), count: 10 });
  };

  const handleBatchPing = () => {
    if (!devices || devices.length === 0) return;
    const ips = devices.slice(0, 10).map(d => d.ipAddress).filter(Boolean);
    batchPingMutation.mutate({ ips });
  };

  return (
    <div className="space-y-6">
      {/* Ping Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" /> Ping Test
          </CardTitle>
          <CardDescription>Test latency, packet loss, and reachability of any device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address (e.g. 192.168.0.1)"
              value={pingTarget}
              onChange={e => setPingTarget(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handlePing()}
              className="flex-1"
            />
            <Button onClick={handlePing} disabled={pingMutation.isPending || !pingTarget.trim()}>
              {pingMutation.isPending ? "Pinging..." : "Ping"}
            </Button>
          </div>

          {pingResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  {pingResult.isReachable
                    ? <Wifi className="w-6 h-6 text-green-600" />
                    : <WifiOff className="w-6 h-6 text-red-600" />}
                </div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-semibold text-sm">{pingResult.isReachable ? "Reachable" : "Unreachable"}</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500">Avg Latency</p>
                <p className="font-semibold text-sm">
                  {pingResult.avgLatency !== null ? `${pingResult.avgLatency.toFixed(1)}ms` : "—"}
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-xs text-gray-500">Min / Max</p>
                <p className="font-semibold text-sm">
                  {pingResult.minLatency !== null
                    ? `${pingResult.minLatency.toFixed(1)} / ${pingResult.maxLatency?.toFixed(1)}ms`
                    : "—"}
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-xs text-gray-500">Packet Loss</p>
                <p className="font-semibold text-sm">{pingResult.packetLoss}%</p>
              </div>
            </div>
          )}

          {pingResult && (
            <div className="flex flex-wrap gap-2">
              <LatencyBadge ms={pingResult.avgLatency} />
              <PacketLossBadge loss={pingResult.packetLoss} />
              {pingResult.jitter !== null && (
                <Badge variant="outline">Jitter: {pingResult.jitter?.toFixed(1)}ms</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Ping - All Devices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" /> Device Latency Overview
              </CardTitle>
              <CardDescription>Ping all discovered devices to check their status</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchPing}
              disabled={batchPingMutation.isPending || !devices?.length}
            >
              {batchPingMutation.isPending ? "Pinging all..." : "Ping All Devices"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {batchPingMutation.data && batchPingMutation.data.length > 0 ? (
            <div className="space-y-3">
              {batchPingMutation.data.map((result: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${result.isReachable ? "bg-green-500" : "bg-red-400"}`} />
                  <span className="font-mono text-sm font-medium w-32 flex-shrink-0">{result.ip}</span>
                  <div className="flex-1">
                    <Progress
                      value={result.isReachable ? Math.max(0, 100 - (result.latencyMs || 0)) : 0}
                      className="h-2"
                    />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <LatencyBadge ms={result.latencyMs} />
                    <PacketLossBadge loss={result.packetLoss} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Activity className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Click "Ping All Devices" to check latency for all discovered devices</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
