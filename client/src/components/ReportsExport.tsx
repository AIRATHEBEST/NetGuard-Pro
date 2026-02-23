import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, FileSpreadsheet, Globe, CheckCircle } from "lucide-react";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ReportsExport() {
  const [csvDownloaded, setCsvDownloaded] = useState(false);
  const [htmlDownloaded, setHtmlDownloaded] = useState(false);

  const { data: stats } = trpc.stats.overview.useQuery();
  const { data: devices } = trpc.devices.list.useQuery();

  const csvQuery = trpc.reports.csv.useQuery(undefined, { enabled: false });
  const htmlQuery = trpc.reports.html.useQuery(undefined, { enabled: false });

  const handleDownloadCsv = async () => {
    const result = await csvQuery.refetch();
    if (result.data) {
      downloadFile(result.data.csv, result.data.filename, "text/csv");
      setCsvDownloaded(true);
      setTimeout(() => setCsvDownloaded(false), 3000);
    }
  };

  const handleDownloadHtml = async () => {
    const result = await htmlQuery.refetch();
    if (result.data) {
      downloadFile(result.data.html, result.data.filename, "text/html");
      setHtmlDownloaded(true);
      setTimeout(() => setHtmlDownloaded(false), 3000);
    }
  };

  const handlePreviewHtml = async () => {
    const result = await htmlQuery.refetch();
    if (result.data) {
      const blob = new Blob([result.data.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Summary */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Report Overview
            </CardTitle>
            <CardDescription>Summary of data that will be included in your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.totalDevices}</p>
                <p className="text-xs text-gray-500 mt-1">Total Devices</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.onlineDevices}</p>
                <p className="text-xs text-gray-500 mt-1">Online Devices</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.highRiskDevices}</p>
                <p className="text-xs text-gray-500 mt-1">High Risk</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{(stats as any).totalAlerts || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Total Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CSV Export */}
        <Card className="border-2 hover:border-green-300 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="w-5 h-5 text-green-600" /> CSV Export
            </CardTitle>
            <CardDescription>
              Export all device and alert data as a spreadsheet-compatible CSV file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ All device information (IP, MAC, vendor, risk)</p>
              <p>✓ Security alerts with severity levels</p>
              <p>✓ Network summary statistics</p>
              <p>✓ Compatible with Excel, Google Sheets</p>
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleDownloadCsv}
              disabled={csvQuery.isFetching}
            >
              {csvDownloaded ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Downloaded!
                </>
              ) : csvQuery.isFetching ? (
                "Generating..."
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* HTML Report */}
        <Card className="border-2 hover:border-blue-300 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-blue-600" /> HTML Report
            </CardTitle>
            <CardDescription>
              Generate a professional HTML report with visual formatting — printable as PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Professional visual layout with color coding</p>
              <p>✓ Risk level indicators and badges</p>
              <p>✓ Complete device and alert tables</p>
              <p>✓ Print to PDF from your browser</p>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={handlePreviewHtml}
                disabled={htmlQuery.isFetching}
              >
                <Globe className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                className="flex-1"
                onClick={handleDownloadHtml}
                disabled={htmlQuery.isFetching}
              >
                {htmlDownloaded ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Downloaded!
                  </>
                ) : htmlQuery.isFetching ? (
                  "Generating..."
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download HTML
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 How to create a PDF report</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Click "Preview" to open the HTML report in a new tab</li>
            <li>Press <kbd className="bg-blue-100 px-1 rounded">Ctrl+P</kbd> (or <kbd className="bg-blue-100 px-1 rounded">Cmd+P</kbd> on Mac) to open the print dialog</li>
            <li>Select "Save as PDF" as the destination</li>
            <li>Click "Save" to download your professional PDF report</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
