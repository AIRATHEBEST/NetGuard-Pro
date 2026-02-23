-- ============================================================
-- NetGuardPro — Migration 002: Performance Metrics & Port Scans
-- Run this in your Supabase SQL Editor after 001_initial_schema.sql
-- ============================================================

-- Performance Metrics Table
-- Stores historical latency/ping results per device
CREATE TABLE IF NOT EXISTS "performanceMetrics" (
  id            SERIAL PRIMARY KEY,
  "userId"      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "deviceId"    INTEGER      REFERENCES devices(id) ON DELETE SET NULL,
  "ipAddress"   VARCHAR(45)  NOT NULL,
  "latencyMs"   FLOAT,
  "packetLoss"  INTEGER      NOT NULL DEFAULT 0,
  "isReachable" BOOLEAN      NOT NULL DEFAULT TRUE,
  "minLatency"  FLOAT,
  "maxLatency"  FLOAT,
  "avgLatency"  FLOAT,
  jitter        FLOAT,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Port Scan Results Table
-- Stores results of port scans per device
CREATE TABLE IF NOT EXISTS "portScanResults" (
  id            SERIAL PRIMARY KEY,
  "userId"      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "deviceId"    INTEGER      REFERENCES devices(id) ON DELETE SET NULL,
  "ipAddress"   VARCHAR(45)  NOT NULL,
  hostname      VARCHAR(255),
  "openPorts"   JSONB        NOT NULL DEFAULT '[]',
  "riskLevel"   VARCHAR(20)  NOT NULL DEFAULT 'low',
  vulnerabilities JSONB      NOT NULL DEFAULT '[]',
  "scanDuration" INTEGER,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Network Topology Snapshots Table
-- Stores periodic snapshots of network topology
CREATE TABLE IF NOT EXISTS "topologySnapshots" (
  id            SERIAL PRIMARY KEY,
  "userId"      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nodes         JSONB        NOT NULL DEFAULT '[]',
  edges         JSONB        NOT NULL DEFAULT '[]',
  gateway       VARCHAR(45),
  "deviceCount" INTEGER      NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Diagnostic Logs Table
-- Stores DNS lookups, traceroutes, and ping tests
CREATE TABLE IF NOT EXISTS "diagnosticLogs" (
  id            SERIAL PRIMARY KEY,
  "userId"      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "toolType"    VARCHAR(50)  NOT NULL, -- 'dns', 'ping', 'traceroute', 'reverse_dns'
  target        VARCHAR(255) NOT NULL,
  result        JSONB        NOT NULL DEFAULT '{}',
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user ON "performanceMetrics"("userId");
CREATE INDEX IF NOT EXISTS idx_performance_metrics_device ON "performanceMetrics"("deviceId");
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created ON "performanceMetrics"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_port_scan_user ON "portScanResults"("userId");
CREATE INDEX IF NOT EXISTS idx_port_scan_device ON "portScanResults"("deviceId");
CREATE INDEX IF NOT EXISTS idx_topology_user ON "topologySnapshots"("userId");
CREATE INDEX IF NOT EXISTS idx_diagnostic_user ON "diagnosticLogs"("userId");
CREATE INDEX IF NOT EXISTS idx_diagnostic_created ON "diagnosticLogs"("createdAt" DESC);

-- Row Level Security
ALTER TABLE "performanceMetrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "portScanResults" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "topologySnapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "diagnosticLogs" ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "Users can manage their own performance metrics"
  ON "performanceMetrics" FOR ALL
  USING (auth.uid()::text = (SELECT "openId" FROM users WHERE id = "userId"));

CREATE POLICY "Users can manage their own port scan results"
  ON "portScanResults" FOR ALL
  USING (auth.uid()::text = (SELECT "openId" FROM users WHERE id = "userId"));

CREATE POLICY "Users can manage their own topology snapshots"
  ON "topologySnapshots" FOR ALL
  USING (auth.uid()::text = (SELECT "openId" FROM users WHERE id = "userId"));

CREATE POLICY "Users can manage their own diagnostic logs"
  ON "diagnosticLogs" FOR ALL
  USING (auth.uid()::text = (SELECT "openId" FROM users WHERE id = "userId"));
