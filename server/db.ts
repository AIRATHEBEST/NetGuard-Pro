import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, devices, routerSettings, securityAlerts, deviceHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Device queries
export async function getDevicesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devices).where(eq(devices.userId, userId));
}

export async function getDeviceById(deviceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(devices).where(eq(devices.id, deviceId)).limit(1);
  return result[0];
}

export async function getDeviceByMac(mac: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(devices)
    .where(eq(devices.macAddress, mac))
    .limit(1);
  return result[0];
}

export async function createDevice(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(devices).values(data);
}

export async function updateDevice(deviceId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(devices).set(data).where(eq(devices.id, deviceId));
}

// Router settings queries
export async function getRouterSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(routerSettings).where(eq(routerSettings.userId, userId)).limit(1);
  return result[0] || null;
}

export async function createRouterSettings(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(routerSettings).values(data);
}

export async function updateRouterSettings(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(routerSettings).set(data).where(eq(routerSettings.userId, userId));
}

// Security alerts queries
export async function getAlertsByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(securityAlerts)
    .where(eq(securityAlerts.userId, userId))
    .orderBy(desc(securityAlerts.createdAt))
    .limit(limit);
}

export async function createAlert(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(securityAlerts).values(data);
}

// Device history queries
export async function getDeviceHistoryByDeviceId(deviceId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deviceHistory)
    .where(eq(deviceHistory.deviceId, deviceId))
    .orderBy(desc(deviceHistory.createdAt))
    .limit(limit);
}

export async function createDeviceHistory(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(deviceHistory).values(data);
}
