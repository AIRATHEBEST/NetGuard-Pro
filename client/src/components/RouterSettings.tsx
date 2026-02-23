import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function RouterSettings() {
  const [formData, setFormData] = useState({
    routerIp: "",
    routerUsername: "",
    routerPasswordEncrypted: "",
    routerModel: "",
    scanInterval: 300,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Fetch existing settings
  const { data: settings } = trpc.router.settings.useQuery();
  const saveSettingsMutation = trpc.router.saveSettings.useMutation();

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        routerIp: settings.routerIp || "",
        routerUsername: settings.routerUsername || "",
        routerPasswordEncrypted: settings.routerPasswordEncrypted || "",
        routerModel: settings.routerModel || "",
        scanInterval: settings.scanInterval || 300,
      });
    }
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScanIntervalChange = (value: number[]) => {
    setFormData((prev) => ({
      ...prev,
      scanInterval: value[0],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await saveSettingsMutation.mutateAsync({
        routerIp: formData.routerIp,
        routerUsername: formData.routerUsername || undefined,
        routerPasswordEncrypted: formData.routerPasswordEncrypted || undefined,
        routerModel: formData.routerModel || undefined,
        scanInterval: formData.scanInterval,
      });
      toast.success("Router settings saved successfully");
    } catch (error) {
      toast.error("Failed to save router settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Router Connection Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Router Configuration</CardTitle>
          <CardDescription>
            Configure your router connection for device scanning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Router IP */}
            <div className="space-y-2">
              <Label htmlFor="routerIp" className="text-base font-medium">
                Router IP Address
              </Label>
              <Input
                id="routerIp"
                name="routerIp"
                type="text"
                placeholder="192.168.1.1"
                value={formData.routerIp}
                onChange={handleInputChange}
                required
                className="h-10"
              />
              <p className="text-sm text-slate-500">
                The IP address of your router (usually 192.168.1.1 or 192.168.0.1)
              </p>
            </div>

            {/* Router Username */}
            <div className="space-y-2">
              <Label htmlFor="routerUsername" className="text-base font-medium">
                Router Username
              </Label>
              <Input
                id="routerUsername"
                name="routerUsername"
                type="text"
                placeholder="admin"
                value={formData.routerUsername}
                onChange={handleInputChange}
                className="h-10"
              />
              <p className="text-sm text-slate-500">
                Default is usually "admin"
              </p>
            </div>

            {/* Router Password */}
            <div className="space-y-2">
              <Label htmlFor="routerPasswordEncrypted" className="text-base font-medium">
                Router Password
              </Label>
              <Input
                id="routerPasswordEncrypted"
                name="routerPasswordEncrypted"
                type="password"
                placeholder="••••••••"
                value={formData.routerPasswordEncrypted}
                onChange={handleInputChange}
                className="h-10"
              />
              <p className="text-sm text-slate-500">
                Your router's admin password (encrypted in storage)
              </p>
            </div>

            {/* Router Model */}
            <div className="space-y-2">
              <Label htmlFor="routerModel" className="text-base font-medium">
                Router Model (Optional)
              </Label>
              <Input
                id="routerModel"
                name="routerModel"
                type="text"
                placeholder="e.g., TP-Link Archer C80"
                value={formData.routerModel}
                onChange={handleInputChange}
                className="h-10"
              />
              <p className="text-sm text-slate-500">
                Your router model for reference
              </p>
            </div>

            {/* Scan Interval */}
            <div className="space-y-4">
              <Label htmlFor="scanInterval" className="text-base font-medium">
                Scan Interval: {formData.scanInterval} seconds
              </Label>
              <Slider
                value={[formData.scanInterval]}
                onValueChange={handleScanIntervalChange}
                min={60}
                max={3600}
                step={60}
                className="w-full"
              />
              <p className="text-sm text-slate-500">
                How often to scan for new devices (60 seconds to 1 hour)
              </p>
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 text-base font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-0 shadow-lg bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-base">Security Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
          <p>
            • Your router credentials are encrypted and stored securely in our database
          </p>
          <p>
            • We never share your credentials with third parties
          </p>
          <p>
            • Device scanning happens locally on your network
          </p>
          <p>
            • All data is private to your account
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
