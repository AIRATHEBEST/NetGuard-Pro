import { SecurityAlert } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface AlertsListProps {
  alerts: SecurityAlert[];
}

export default function AlertsList({ alerts }: AlertsListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
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

  return (
    <div className="space-y-3">
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          No alerts
        </div>
      ) : (
        alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
              alert.isResolved === true
                ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60"
                : getSeverityColor(alert.severity)
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getSeverityIcon(alert.severity)}
            </div>

            {/* Alert Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {alert.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {alert.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {getAlertTypeLabel(alert.alertType)}
                </Badge>
                <span className="text-xs text-slate-500">
                  {format(new Date(alert.createdAt), "MMM d, HH:mm")}
                </span>
                {alert.isResolved === true && (
                  <Badge variant="secondary" className="text-xs">
                    Resolved
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Button */}
            {alert.isResolved === false && (
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                Dismiss
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
