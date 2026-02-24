/**
 * Role-Based Access Control (RBAC)
 * Merged from NetGuard-Pro-v2-SaaS-Ready
 */

export const Roles = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  TECH: "TECH",
  VIEWER: "VIEWER",
} as const;

export type Role = keyof typeof Roles;

export const Permissions = {
  ALL: "ALL",
  MANAGE_WORKSPACE: "MANAGE_WORKSPACE",
  MANAGE_NETWORK: "MANAGE_NETWORK",
  MANAGE_DEVICES: "MANAGE_DEVICES",
  BLOCK_DEVICES: "BLOCK_DEVICES",
  SCAN: "SCAN",
  VIEW: "VIEW",
  EXPORT_REPORTS: "EXPORT_REPORTS",
} as const;

export type Permission = keyof typeof Permissions;

const rolePermissions: Record<string, string[]> = {
  OWNER: ["ALL"],
  ADMIN: ["MANAGE_WORKSPACE", "MANAGE_NETWORK", "MANAGE_DEVICES", "BLOCK_DEVICES", "SCAN", "VIEW", "EXPORT_REPORTS"],
  TECH: ["MANAGE_DEVICES", "BLOCK_DEVICES", "SCAN", "VIEW", "EXPORT_REPORTS"],
  VIEWER: ["VIEW"],
};

export function hasPermission(role: string, action: string): boolean {
  const perms = rolePermissions[role] ?? [];
  return perms.includes("ALL") || perms.includes(action);
}

export function getRolePermissions(role: string): string[] {
  return rolePermissions[role] ?? [];
}

export function isValidRole(role: string): role is Role {
  return Object.keys(Roles).includes(role);
}
