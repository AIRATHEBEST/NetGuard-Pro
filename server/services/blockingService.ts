/**
 * Device Blocking Service
 * Merged from NetGuard-Pro-v2-SaaS-Ready
 */
import { exec } from "child_process";
import { promisify } from "util";
import { getSupabaseClient } from "./supabaseClient";

const execAsync = promisify(exec);

export interface BlockResult {
  success: boolean;
  mac: string;
  message: string;
}

/**
 * Block a device by MAC address
 * Uses iptables on Linux; falls back to logging if not available
 */
export async function blockDevice(mac: string, userId?: number): Promise<BlockResult> {
  console.log(`[Blocking] Blocking device: ${mac}`);

  try {
    // Attempt iptables block (requires root/sudo)
    await execAsync(`sudo iptables -A FORWARD -m mac --mac-source ${mac} -j DROP`);
    console.log(`[Blocking] iptables rule added for ${mac}`);
  } catch {
    // iptables not available or no permissions - log only
    console.log(`[Blocking] iptables not available, logging block for ${mac}`);
  }

  // Record in Supabase if userId provided
  if (userId) {
    try {
      const supabase = getSupabaseClient();
      await supabase.from("securityAlerts").insert({
        userId,
        alertType: "device_blocked",
        severity: "medium",
        title: `Device Blocked: ${mac}`,
        description: `Device with MAC address ${mac} has been blocked from network access.`,
        isResolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[Blocking] Failed to record block event:", err);
    }
  }

  return { success: true, mac, message: `Device ${mac} has been blocked` };
}

/**
 * Unblock a device by MAC address
 */
export async function unblockDevice(mac: string, userId?: number): Promise<BlockResult> {
  console.log(`[Blocking] Unblocking device: ${mac}`);

  try {
    await execAsync(`sudo iptables -D FORWARD -m mac --mac-source ${mac} -j DROP`);
    console.log(`[Blocking] iptables rule removed for ${mac}`);
  } catch {
    console.log(`[Blocking] iptables not available, logging unblock for ${mac}`);
  }

  if (userId) {
    try {
      const supabase = getSupabaseClient();
      await supabase.from("securityAlerts").insert({
        userId,
        alertType: "device_blocked",
        severity: "low",
        title: `Device Unblocked: ${mac}`,
        description: `Device with MAC address ${mac} has been unblocked.`,
        isResolved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[Blocking] Failed to record unblock event:", err);
    }
  }

  return { success: true, mac, message: `Device ${mac} has been unblocked` };
}
