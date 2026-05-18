import { USER_PERMISSIONS, UserPermission, UserRole } from "../constants/enums";

const ROLE_PERMISSION_MAP: Record<UserRole, UserPermission[]> = {
  user: [
    "content:suggest",
    "review:read",
    "review:create",
    "review:update",
    "review:delete",
  ],
  admin: [...USER_PERMISSIONS],
};

export function normalizeRole(role: unknown): UserRole {
  // Unknown roles are intentionally downgraded to user instead of trusted.
  return role === "admin" ? "admin" : "user";
}

export function normalizePermissions(permissions: unknown): UserPermission[] {
  // JWT/database permission arrays are treated as untrusted input at the auth
  // boundary and filtered against the enum.
  if (!Array.isArray(permissions)) {
    return [];
  }

  const validPermissions = new Set<UserPermission>(USER_PERMISSIONS);

  return permissions.filter(
    (permission): permission is UserPermission =>
      typeof permission === "string" &&
      validPermissions.has(permission as UserPermission),
  );
}

export function getEffectivePermissions(
  role: UserRole,
  permissions: UserPermission[],
): UserPermission[] {
  // Explicit permissions are additive; roles provide the baseline.
  return Array.from(new Set([...ROLE_PERMISSION_MAP[role], ...permissions]));
}
