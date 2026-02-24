import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "../_core/env";

/**
 * Initialize Supabase client for database operations.
 * Uses environment variables: SUPABASE_URL and SUPABASE_ANON_KEY.
 *
 * For server-side operations that need to bypass Row Level Security,
 * set SUPABASE_SERVICE_ROLE_KEY and pass `useServiceRole: true`.
 */
export function initializeSupabaseClient(useServiceRole = false): SupabaseClient {
  const supabaseUrl = ENV.supabaseUrl || process.env.SUPABASE_URL;
  const supabaseKey = useServiceRole
    ? (ENV.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY)
    : (ENV.supabaseAnonKey || process.env.SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      useServiceRole
        ? "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
        : "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY"
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Singleton Supabase client instance (uses anon key by default).
 */
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    // Use service role key on the server side to bypass RLS for admin operations.
    // Token verification via supabase.auth.getUser() still validates the user's JWT.
    const hasServiceRole = !!(ENV.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY);
    supabaseClient = initializeSupabaseClient(hasServiceRole);
  }
  return supabaseClient;
}

/**
 * Test Supabase connection by performing a lightweight query.
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const client = getSupabaseClient();

    // Use a simple count query — correct Supabase JS v2 syntax
    const { error } = await client
      .from("users")
      .select("*", { count: "exact", head: true });

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
 * Get Supabase database statistics (row counts per table).
 */
export async function getSupabaseStats(): Promise<{
  users: number;
  devices: number;
  alerts: number;
  timestamp: string;
} | null> {
  try {
    const client = getSupabaseClient();

    const [usersRes, devicesRes, alertsRes] = await Promise.all([
      client.from("users").select("*", { count: "exact", head: true }),
      client.from("devices").select("*", { count: "exact", head: true }),
      // Table name matches schema: "securityAlerts"
      client.from("securityAlerts").select("*", { count: "exact", head: true }),
    ]);

    return {
      users: usersRes.count ?? 0,
      devices: devicesRes.count ?? 0,
      alerts: alertsRes.count ?? 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Supabase] Failed to get stats:", error);
    return null;
  }
}

/**
 * Subscribe to real-time Postgres changes for a user's devices.
 * The filter uses the column name as stored in the database ("userId").
 */
export function subscribeToDeviceChanges(
  userId: number,
  callback: (payload: unknown) => void
) {
  const client = getSupabaseClient();

  const subscription = client
    .channel(`devices-user-${userId}`)
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
 * Unsubscribe from a real-time channel.
 */
export async function unsubscribeFromDeviceChanges(subscription: ReturnType<SupabaseClient["channel"]>) {
  const client = getSupabaseClient();
  await client.removeChannel(subscription);
}
