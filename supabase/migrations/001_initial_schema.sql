-- ============================================================
-- NetGuardPro — Initial Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to create all tables.
-- ============================================================

-- Enums
CREATE TYPE role AS ENUM ('user', 'admin');
CREATE TYPE "riskLevel" AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE "deviceEventType" AS ENUM ('connected', 'disconnected', 'blocked', 'unblocked', 'risk_updated');
CREATE TYPE "alertType" AS ENUM (
  'new_device', 'high_risk_device', 'suspicious_activity',
  'device_blocked', 'anomaly_detected', 'bandwidth_spike', 'unauthorized_access'
);
CREATE TYPE severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE "recommendationType" AS ENUM (
  'block_device', 'monitor_closely', 'update_firmware',
  'change_password', 'isolate_device', 'investigate_behavior', 'enable_firewall'
);
CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE "triggerType" AS ENUM (
  'new_device', 'risk_threshold', 'bandwidth_threshold', 'device_offline', 'suspicious_pattern'
);
CREATE TYPE "notificationMethod" AS ENUM ('email', 'in_app', 'both');

-- Users
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  "openId"    VARCHAR(64)  NOT NULL UNIQUE,
  name        TEXT,
  email       VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role        role         NOT NULL DEFAULT 'user',
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Devices
CREATE TABLE IF NOT EXISTS devices (
  id            SERIAL PRIMARY KEY,
  "userId"      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "ipAddress"   VARCHAR(45)  NOT NULL,
  "macAddress"  VARCHAR(17)  NOT NULL UNIQUE,
  vendor        VARCHAR(255),
  "deviceType"  VARCHAR(100),
  "deviceName"  VARCHAR(255),
  "isOnline"    BOOLEAN      NOT NULL DEFAULT TRUE,
  "isBlocked"   BOOLEAN      NOT NULL DEFAULT FALSE,
  "riskScore"   INTEGER      NOT NULL DEFAULT 0,
  "riskLevel"   "riskLevel"  NOT NULL DEFAULT 'low',
  "lastSeen"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "firstSeen"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Device History
CREATE TABLE IF NOT EXISTS "deviceHistory" (
  id          SERIAL PRIMARY KEY,
  "deviceId"  INTEGER           NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  "userId"    INTEGER           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "eventType" "deviceEventType" NOT NULL,
  "riskScore" INTEGER,
  details     TEXT,
  "createdAt" TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- Security Alerts
CREATE TABLE IF NOT EXISTS "securityAlerts" (
  id          SERIAL PRIMARY KEY,
  "userId"    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "deviceId"  INTEGER      REFERENCES devices(id) ON DELETE SET NULL,
  "alertType" "alertType"  NOT NULL,
  severity    severity     NOT NULL DEFAULT 'medium',
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  "isResolved"  BOOLEAN    NOT NULL DEFAULT FALSE,
  "resolvedAt"  TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Router Settings
CREATE TABLE IF NOT EXISTS "routerSettings" (
  id                       SERIAL PRIMARY KEY,
  "userId"                 INTEGER      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "routerIp"               VARCHAR(45)  NOT NULL,
  "routerUsername"         VARCHAR(255),
  "routerPasswordEncrypted" TEXT,
  "routerModel"            VARCHAR(255),
  "scanInterval"           INTEGER      NOT NULL DEFAULT 300,
  "isEnabled"              BOOLEAN      NOT NULL DEFAULT TRUE,
  "lastScanTime"           TIMESTAMPTZ,
  "createdAt"              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Network Traffic
CREATE TABLE IF NOT EXISTS "networkTraffic" (
  id                      SERIAL PRIMARY KEY,
  "userId"                INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "deviceId"              INTEGER REFERENCES devices(id) ON DELETE SET NULL,
  "uploadBytesPerSecond"  INTEGER NOT NULL DEFAULT 0,
  "downloadBytesPerSecond" INTEGER NOT NULL DEFAULT 0,
  "totalUploadBytes"      INTEGER NOT NULL DEFAULT 0,
  "totalDownloadBytes"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Security Recommendations
CREATE TABLE IF NOT EXISTS "securityRecommendations" (
  id                     SERIAL PRIMARY KEY,
  "userId"               INTEGER               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "deviceId"             INTEGER               REFERENCES devices(id) ON DELETE SET NULL,
  "recommendationType"   "recommendationType"  NOT NULL,
  title                  VARCHAR(255)          NOT NULL,
  description            TEXT,
  priority               priority              NOT NULL DEFAULT 'medium',
  "isImplemented"        BOOLEAN               NOT NULL DEFAULT FALSE,
  "implementedAt"        TIMESTAMPTZ,
  "createdAt"            TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- Alert Rules
CREATE TABLE IF NOT EXISTS "alertRules" (
  id                   SERIAL PRIMARY KEY,
  "userId"             INTEGER               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "ruleName"           VARCHAR(255)          NOT NULL,
  "triggerType"        "triggerType"         NOT NULL,
  threshold            INTEGER,
  "notificationMethod" "notificationMethod"  NOT NULL DEFAULT 'both',
  "isEnabled"          BOOLEAN               NOT NULL DEFAULT TRUE,
  "createdAt"          TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_devices_user_id       ON devices("userId");
CREATE INDEX IF NOT EXISTS idx_device_history_device ON "deviceHistory"("deviceId");
CREATE INDEX IF NOT EXISTS idx_device_history_user   ON "deviceHistory"("userId");
CREATE INDEX IF NOT EXISTS idx_alerts_user_id        ON "securityAlerts"("userId");
CREATE INDEX IF NOT EXISTS idx_alerts_created_at     ON "securityAlerts"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_network_traffic_user  ON "networkTraffic"("userId");
CREATE INDEX IF NOT EXISTS idx_recommendations_user  ON "securityRecommendations"("userId");
CREATE INDEX IF NOT EXISTS idx_alert_rules_user      ON "alertRules"("userId");

-- ============================================================
-- Enable Row Level Security (RLS) — users can only see their own data
-- ============================================================
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deviceHistory"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "securityAlerts"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "routerSettings"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "networkTraffic"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "securityRecommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "alertRules"       ENABLE ROW LEVEL SECURITY;

-- NOTE: Define your RLS policies based on your auth strategy.
-- If using Manus OAuth (server-side), use the service role key to bypass RLS.
-- Example policy for devices (adjust auth.uid() mapping to your setup):
-- CREATE POLICY "Users can manage own devices"
--   ON devices FOR ALL
--   USING (true)  -- Replace with actual user check once auth is wired
--   WITH CHECK (true);
