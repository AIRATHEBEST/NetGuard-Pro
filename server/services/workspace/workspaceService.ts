/**
 * Workspace Service - SaaS multi-tenant workspace management
 * Merged from NetGuard-Pro-v2-SaaS-Ready
 */
import { getSupabaseClient } from "../supabaseClient";

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
}

export async function createWorkspace(name: string, userId?: string): Promise<Workspace> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("workspaces")
    .insert({ name })
    .select()
    .single();

  if (error) {
    console.error("[Workspace] Failed to create workspace:", error.message);
    // Fallback: return in-memory workspace if table doesn't exist yet
    return { id: crypto.randomUUID(), name, created_at: new Date().toISOString() };
  }

  // Add creator as owner if userId provided
  if (userId && data) {
    await addWorkspaceMember(data.id, userId, "OWNER");
  }

  return data as Workspace;
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Workspace] Failed to get workspaces:", error.message);
    return [];
  }
  return (data ?? []) as Workspace[];
}

export async function getWorkspaceById(id: string): Promise<Workspace | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("[Workspace] Failed to get workspace:", error.message);
    return null;
  }
  return data as Workspace;
}

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: string
): Promise<WorkspaceMember | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspaceId, user_id: userId, role })
    .select()
    .single();

  if (error) {
    console.error("[Workspace] Failed to add member:", error.message);
    return null;
  }
  return data as WorkspaceMember;
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("[Workspace] Failed to get members:", error.message);
    return [];
  }
  return (data ?? []) as WorkspaceMember[];
}
