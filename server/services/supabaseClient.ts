import { createClient } from "@supabase/supabase-js";
import { ENV } from "../_core/env";

/**
 * Initialize Supabase client for database operations
 * Uses environment variables: SUPABASE_URL and SUPABASE_ANON_KEY
 */
export function initializeSupabaseClient() {
  const supabaseUrl = ENV.supabaseUrl || process.env.SUPABASE_URL;
  const supabaseAnonKey = ENV.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY"
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Get Supabase client instance (singleton pattern)
 */
let supabaseClient: any = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = initializeSupabaseClient();
  }
  return supabaseClient;
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.error("[Supabase] Client not initialized");
      return false;
    }

    const { error } = await client.from("users").select("count()", {
      count: "exact",
      head: true,
    } as any);

    if (error) {
      console.error("[Supabase] Connection test failed:", error.message);
      return false;
    }

    console.log("[Supabase] Connection successful");
    return true;
  } catch (error) {
    console.error("[Supabase] Connection error:", error);
    return false;
  }
}

/**
 * Get Supabase database statistics
 */
export async function getSupabaseStats() {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.error("[Supabase] Client not initialized");
      return null;
    }

    // Get user count
    const { count: userCount } = await client
      .from("users")
      .select("*", { count: "exact", head: true } as any);

    // Get device count
    const { count: deviceCount } = await client
      .from("devices")
      .select("*", { count: "exact", head: true } as any);

    // Get alert count
    const { count: alertCount } = await client
      .from("alerts")
      .select("*", { count: "exact", head: true } as any);

    return {
      users: userCount || 0,
      devices: deviceCount || 0,
      alerts: alertCount || 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Supabase] Failed to get stats:", error);
    return null;
  }
}

/**
 * Supabase real-time subscription for device changes
 */
export function subscribeToDeviceChanges(
  userId: number,
  callback: (payload: any) => void
) {
  const client = getSupabaseClient();
  if (!client) {
    console.error("[Supabase] Client not initialized");
    return null;
  }

  const subscription = client
    .channel(`devices:user_id=eq.${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "devices",
        filter: `userId=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return subscription;
}

/**
 * Unsubscribe from real-time updates
 */
export async function unsubscribeFromDeviceChanges(subscription: any) {
  const client = getSupabaseClient();
  if (!client || !subscription) {
    console.error("[Supabase] Client or subscription not available");
    return;
  }
  await client.removeChannel(subscription);
}
