export type AppRole = "customer" | "worker" | "moderator" | "admin" | "super_admin";

export const ALL_ROLES: AppRole[] = ["customer", "worker", "moderator", "admin", "super_admin"];

export const ROLE_LABELS: Record<AppRole, string> = {
  customer: "Customer",
  worker: "Professional",
  moderator: "Moderator",
  admin: "Admin",
  super_admin: "Super admin",
};

export function isAdmin(roles: AppRole[]): boolean {
  return roles.includes("admin") || roles.includes("super_admin");
}

/** Mirrors the super-admin-only admin_set_business_access database function. */
export function canManageBusinessAccess(roles: AppRole[]): boolean {
  return roles.includes("super_admin");
}

/** Mirrors the super-admin-only super_admin_delete_job database function. */
export function canDeleteJobPosts(roles: AppRole[]): boolean {
  return roles.includes("super_admin");
}

/** Which dashboard a signed-in user lands on. */
export function homeForRoles(roles: AppRole[]): "/admin/users" | "/worker" | "/customer" | "/onboarding" {
  if (isAdmin(roles)) return "/admin/users";
  if (roles.includes("worker")) return "/worker";
  if (roles.includes("customer")) return "/customer";
  return "/onboarding";
}

/** Can the acting user change `target` role? Mirrors public.admin_set_role. */
export function canManageRole(actor: AppRole[], target: AppRole): boolean {
  if (!isAdmin(actor)) return false;
  if (target === "admin" || target === "super_admin") return actor.includes("super_admin");
  return true;
}

/** Roles a user may pick for themselves at sign-up. */
export const SELF_SELECTABLE_ROLES: AppRole[] = ["customer", "worker"];
