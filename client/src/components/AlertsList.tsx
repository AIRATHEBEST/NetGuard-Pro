import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info, CheckCircle2, Bell, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AlertsList() {
  const { data: alerts, isLoading, refetch } = trpc.alerts.list.useQuery({ limit: 100 });
  const resolveMutation = trpc.alerts.resolve.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Alert resolved");
    },
    onError: () => toast.error("Failed to resolve alert"),
  });

  const utils = trpc.useUtils();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-50 border-red-200";
      case "high": return "bg-orange-50 border-orange-200";
      case "medium": return "bg-yellow-50 border-yellow-200";
      case "low": return "bg-blue-50 border-blue-200";
      default: return "bg-slate-50 border-slate-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "medium":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case "low":
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      new_device: "New Device",
      high_risk_device: "High Risk Device",
      suspicious_activity: "Suspicious Activity",
      device_blocked: "Device Blocked",
      anomaly_detected: "Anomaly Detected",
      bandwidth_spike: "Bandwidth Spike",
      unauthorized_access: "Unauthorized Access",
    };
    return labels[type] || type;
  };

  const unresolvedAlerts = (alerts || []).filter(a => !a.isResolved);
  const resolvedAlerts = (alerts || []).filter(a => a.isResolved);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="flex items-center gap-2 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading alerts...</span>
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
              <Bell className="w-5 h-5 text-red-500" /> Security Alerts
            </CardTitle>
            <CardDescription>
              {unresolvedAlerts.length} unresolved · {resolvedAlerts.length} resolved
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alerts && alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <CheckCircle2 className="w-12 h-12 mb-4 text-green-400 opacity-60" />
            <p className="text-base font-medium text-green-600">No alerts — your network is clean!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Unresolved alerts first */}
            {unresolvedAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Unresolved ({unresolvedAlerts.length})
                </h4>
                <div className="space-y-2">
                  {unresolvedAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-slate-900">{alert.title}</h4>
                          <Badge
                            variant={alert.severity === "critical" || alert.severity === "high" ? "destructive" : "secondary"}
                            className="flex-shrink-0 capitalize text-xs"
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        {alert.description && (
                          <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {getAlertTypeLabel(alert.alertType)}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {format(new Date(alert.createdAt), "MMM d, HH:mm")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => resolveMutation.mutate({ id: alert.id })}
                        disabled={resolveMutation.isPending}
                      >
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved alerts */}
            {resolvedAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2 mt-4">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Resolved ({resolvedAlerts.length})
                </h4>
                <div className="space-y-2">
                  {resolvedAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-4 p-3 rounded-xl border bg-slate-50 border-slate-200 opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-600 truncate">{alert.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getAlertTypeLabel(alert.alertType)}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {format(new Date(alert.createdAt), "MMM d, HH:mm")}
                          </span>
                          <Badge variant="secondary" className="text-xs">Resolved</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
