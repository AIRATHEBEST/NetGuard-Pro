-- ============================================================
-- Migration 003: SaaS Workspace & RBAC Tables
-- Merged from NetGuard-Pro-v2-SaaS-Ready
-- ============================================================

-- Workspaces (multi-tenant SaaS)
CREATE TABLE IF NOT EXISTS workspaces (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace Members with RBAC roles
CREATE TABLE IF NOT EXISTS workspace_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,
  role         TEXT NOT NULL DEFAULT 'VIEWER'
                CHECK (role IN ('OWNER','ADMIN','TECH','VIEWER')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Networks within a workspace
CREATE TABLE IF NOT EXISTS networks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  subnet       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user      ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_networks_workspace          ON networks(workspace_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE workspaces        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE networks          ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS (used by server-side operations)
-- RLS policies for authenticated users can be added once auth is fully wired

-- Example: workspace members can see their own workspace
-- CREATE POLICY "Members can view their workspace"
--   ON workspaces FOR SELECT
--   USING (id IN (
--     SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
--   ));
