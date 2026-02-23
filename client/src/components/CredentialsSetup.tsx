import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

interface CredentialsSetupProps {
  onComplete: (credentials: any) => void;
}

export default function CredentialsSetup({ onComplete }: CredentialsSetupProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [jwtSecret, setJwtSecret] = useState("");

  const handleNext = async () => {
    setError("");
    setLoading(true);

    try {
      if (step === 1) {
        // Validate Supabase credentials
        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Please enter Supabase URL and Key");
        }
        if (!supabaseUrl.includes("supabase.co")) {
          throw new Error("Invalid Supabase URL format");
        }
        setStep(2);
      } else if (step === 2) {
        // Validate Database URL
        if (!databaseUrl) {
          throw new Error("Please enter Database URL");
        }
        if (!databaseUrl.includes("postgresql")) {
          throw new Error("Invalid Database URL format");
        }
        setStep(3);
      } else if (step === 3) {
        // Validate JWT Secret
        if (!jwtSecret || jwtSecret.length < 32) {
          throw new Error("JWT Secret must be at least 32 characters");
        }

        // Save credentials to localStorage
        const credentials = {
          supabaseUrl,
          supabaseKey,
          databaseUrl,
          jwtSecret,
          setupComplete: true,
        };
        localStorage.setItem("netguardpro_credentials", JSON.stringify(credentials));

        // Call completion callback
        onComplete(credentials);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-slate-800 border-slate-700">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">NetGuardPro</h1>
          <p className="text-slate-400">Network Security Monitoring</p>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded ${
                  s <= step ? "bg-blue-500" : "bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Supabase */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Supabase Credentials</h2>
            <p className="text-sm text-slate-400">
              Enter your Supabase project details
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Supabase URL
              </label>
              <Input
                placeholder="https://xxxxx.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">
                Found in: Supabase Dashboard → Settings → API
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Supabase Anon Key
              </label>
              <Input
                placeholder="sb_publishable_xxxxx"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                type="password"
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">
                Found in: Supabase Dashboard → Settings → API
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Database */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Database Connection</h2>
            <p className="text-sm text-slate-400">
              Enter your PostgreSQL connection string
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Database URL
              </label>
              <Input
                placeholder="postgresql://user:password@host:5432/database"
                value={databaseUrl}
                onChange={(e) => setDatabaseUrl(e.target.value)}
                type="password"
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">
                Format: postgresql://postgres:password@host:5432/postgres
              </p>
            </div>
          </div>
        )}

        {/* Step 3: JWT Secret */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Security Secret</h2>
            <p className="text-sm text-slate-400">
              Create a secure JWT secret for sessions
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                JWT Secret (min 32 characters)
              </label>
              <Input
                placeholder="Enter a long random string"
                value={jwtSecret}
                onChange={(e) => setJwtSecret(e.target.value)}
                type="password"
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">
                Example: your-super-secret-key-that-is-at-least-32-chars-long
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-4 bg-red-900 border-red-700">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {step === 3 && !error && (
          <Alert className="mb-4 bg-green-900 border-green-700">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">
              All credentials validated ✓
            </AlertDescription>
          </Alert>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Validating..." : step === 3 ? "Complete Setup" : "Next"}
          </Button>
        </div>

        {/* Progress Text */}
        <p className="text-center text-xs text-slate-500 mt-4">
          Step {step} of 3
        </p>
      </Card>
    </div>
  );
}
