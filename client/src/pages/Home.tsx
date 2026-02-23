import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { getLoginUrl } from "@/const";
import { Shield, Wifi, AlertCircle, BarChart3, Lock, Zap, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, isAuthenticated, loading, loginWithGoogle } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              NetGuard Pro
            </span>
          </div>
          {isAuthenticated ? (
            <Button onClick={() => navigate("/dashboard")} variant="default">
              Go to Dashboard
            </Button>
          ) : (
            <Button onClick={() => loginWithGoogle()}>
              Sign In with Google
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Advanced Network Security Monitoring
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Monitor all devices on your network, detect threats in real-time, and protect your digital infrastructure with intelligent security analysis.
          </p>
          <Button
            onClick={() => loginWithGoogle()}
            size="lg"
            className="h-12 px-8 text-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">
          Powerful Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Wifi className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Real-Time Device Scanning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                Automatically discover and monitor all devices connected to your network with real-time status updates.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Threat Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                AI-powered threat analysis identifies suspicious behavior and security risks before they become problems.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Device Control</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                Block or unblock devices instantly, manage access permissions, and enforce network policies.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                Track network traffic, bandwidth usage, and device behavior patterns with comprehensive analytics.
              </p>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Smart Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                Receive intelligent notifications for new devices, security threats, and anomalies in real-time.
              </p>
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle>Security Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">
                Get actionable recommendations to improve your network security and protect against threats.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Protect Your Network Today
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Start monitoring your network with NetGuard Pro. Free to get started, no credit card required.
          </p>
          <Button
            onClick={() => loginWithGoogle()}
            size="lg"
            className="h-12 px-8 text-lg bg-white text-blue-600 hover:bg-blue-50"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4 text-center text-slate-600 dark:text-slate-400">
          <p>&copy; 2026 NetGuard Pro. Advanced Network Security Monitoring.</p>
        </div>
      </footer>
    </div>
  );
}
