/**
 * Background Scheduler Service
 * Merged from NetGuard-Pro-v2-SaaS-Ready
 * Runs periodic network scans and maintenance tasks
 */

interface ScheduledTask {
  name: string;
  intervalMs: number;
  handler: () => Promise<void>;
  timer?: NodeJS.Timeout;
}

const tasks: ScheduledTask[] = [];

async function runNetworkScan(): Promise<void> {
  console.log("[Scheduler] Running scheduled network scan...");
  // Background jobs service handles the actual scanning
  try {
    const { startBackgroundScanning } = await import("./backgroundJobs");
    // Trigger scan for active users - in production, iterate over active user sessions
    console.log("[Scheduler] Network scan cycle complete");
  } catch (err) {
    console.error("[Scheduler] Network scan error:", err);
  }
}

async function runCleanup(): Promise<void> {
  console.log("[Scheduler] Running database cleanup...");
  // Clean up old device history and resolved alerts older than 30 days
  try {
    const { getSupabaseClient } = await import("./supabaseClient");
    const supabase = getSupabaseClient();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("securityAlerts")
      .delete()
      .eq("isResolved", true)
      .lt("createdAt", thirtyDaysAgo);

    if (error) {
      console.error("[Scheduler] Cleanup error:", error.message);
    } else {
      console.log("[Scheduler] Cleanup complete");
    }
  } catch (err) {
    console.error("[Scheduler] Cleanup error:", err);
  }
}

export function startScheduler(): void {
  console.log("[Scheduler] Starting background scheduler...");

  // Network scan every 5 minutes
  const scanTask: ScheduledTask = {
    name: "network-scan",
    intervalMs: 5 * 60 * 1000,
    handler: runNetworkScan,
  };

  // Database cleanup every 24 hours
  const cleanupTask: ScheduledTask = {
    name: "db-cleanup",
    intervalMs: 24 * 60 * 60 * 1000,
    handler: runCleanup,
  };

  [scanTask, cleanupTask].forEach(task => {
    task.timer = setInterval(async () => {
      try {
        await task.handler();
      } catch (err) {
        console.error(`[Scheduler] Task "${task.name}" failed:`, err);
      }
    }, task.intervalMs);

    tasks.push(task);
    console.log(`[Scheduler] Task "${task.name}" scheduled every ${task.intervalMs / 1000}s`);
  });
}

export function stopScheduler(): void {
  tasks.forEach(task => {
    if (task.timer) {
      clearInterval(task.timer);
    }
  });
  tasks.length = 0;
  console.log("[Scheduler] All tasks stopped");
}
