import { getSupabaseClient } from "./services/supabaseClient";
import type { InsertUser, User, Device, DeviceHistory, SecurityAlert, RouterSettings } from "../drizzle/schema";
import { ENV } from "./_core/env";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const supabase = getSupabaseClient();

  const values: Record<string, unknown> = {
    openId: user.openId,
    lastSignedIn: user.lastSignedIn ?? new Date().toISOString(),
  };

  if (user.name !== undefined) values.name = user.name ?? null;
  if (user.email !== undefined) values.email = user.email ?? null;
  if (user.loginMethod !== undefined) values.loginMethod = user.loginMethod ?? null;

  if (user.role !== undefined) {
    values.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
  }

  const { error } = await supabase
    .from("users")
    .upsert(values, { onConflict: "openId" });

  if (error) {
    console.error("[Database] Failed to upsert user:", error.message);
    throw new Error(error.message);
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("openId", openId)
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined; // row not found
    console.error("[Database] Failed to get user:", error.message);
    return undefined;
  }

  return data as User;
}

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

export async function getDevicesByUserId(userId: number): Promise<Device[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("userId", userId);

  if (error) {
    console.error("[Database] Failed to get devices:", error.message);
    return [];
  }

  return (data ?? []) as Device[];
}

export async function getDeviceById(deviceId: number): Promise<Device | undefined> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("id", deviceId)
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined;
    console.error("[Database] Failed to get device:", error.message);
    return undefined;
  }

  return data as Device;
}

export async function getDeviceByMac(mac: string): Promise<Device | undefined> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("macAddress", mac)
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined;
    console.error("[Database] Failed to get device by MAC:", error.message);
    return undefined;
  }

  return data as Device;
}

export async function createDevice(data: Partial<Device>): Promise<Device> {
  const supabase = getSupabaseClient();

  const { data: created, error } = await supabase
    .from("devices")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("[Database] Failed to create device:", error.message);
    throw new Error(error.message);
  }

  return created as Device;
}

export async function updateDevice(deviceId: number, data: Partial<Device>): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("devices")
    .update({ ...data, updatedAt: new Date().toISOString() })
    .eq("id", deviceId);

  if (error) {
    console.error("[Database] Failed to update device:", error.message);
    throw new Error(error.message);
  }
}

// ---------------------------------------------------------------------------
// Router Settings
// ---------------------------------------------------------------------------

export async function getRouterSettings(userId: number): Promise<RouterSettings | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("routerSettings")
    .select("*")
    .eq("userId", userId)
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("[Database] Failed to get router settings:", error.message);
    return null;
  }

  return data as RouterSettings;
}

export async function createRouterSettings(data: Partial<RouterSettings>): Promise<RouterSettings> {
  const supabase = getSupabaseClient();

  const { data: created, error } = await supabase
    .from("routerSettings")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("[Database] Failed to create router settings:", error.message);
    throw new Error(error.message);
  }

  return created as RouterSettings;
}

export async function updateRouterSettings(userId: number, data: Partial<RouterSettings>): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("routerSettings")
    .update({ ...data, updatedAt: new Date().toISOString() })
    .eq("userId", userId);

  if (error) {
    console.error("[Database] Failed to update router settings:", error.message);
    throw new Error(error.message);
  }
}

// ---------------------------------------------------------------------------
// Security Alerts
// ---------------------------------------------------------------------------

export async function getAlertsByUserId(userId: number, limit: number = 50): Promise<SecurityAlert[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("securityAlerts")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Database] Failed to get alerts:", error.message);
    return [];
  }

  return (data ?? []) as SecurityAlert[];
}

export async function createAlert(data: Partial<SecurityAlert>): Promise<SecurityAlert> {
  const supabase = getSupabaseClient();

  const { data: created, error } = await supabase
    .from("securityAlerts")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("[Database] Failed to create alert:", error.message);
    throw new Error(error.message);
  }

  return created as SecurityAlert;
}

// ---------------------------------------------------------------------------
// Device History
// ---------------------------------------------------------------------------

export async function getDeviceHistoryByDeviceId(
  deviceId: number,
  limit: number = 100
): Promise<DeviceHistory[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("deviceHistory")
    .select("*")
    .eq("deviceId", deviceId)
    .order("createdAt", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Database] Failed to get device history:", error.message);
    return [];
  }

  return (data ?? []) as DeviceHistory[];
}

export async function createDeviceHistory(data: Partial<DeviceHistory>): Promise<DeviceHistory> {
  const supabase = getSupabaseClient();

  const { data: created, error } = await supabase
    .from("deviceHistory")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("[Database] Failed to create device history:", error.message);
    throw new Error(error.message);
  }

  return created as DeviceHistory;
}
