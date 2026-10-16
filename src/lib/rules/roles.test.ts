import { describe, expect, it } from "vitest";
import { canManageBusinessAccess, canManageRole, homeForRoles, isAdmin, SELF_SELECTABLE_ROLES } from "./roles";

describe("role rules", () => {
  it("only super admins can manage Business upgrades", () => {
    expect(canManageBusinessAccess(["super_admin"])).toBe(true);
    for (const role of SELF_SELECTABLE_ROLES.concat(["moderator", "admin"])) {
      expect(canManageBusinessAccess([role])).toBe(false);
    }
    expect(canManageBusinessAccess([])).toBe(false);
  });
  it("customers cannot manage any role", () => {
    expect(canManageRole(["customer"], "worker")).toBe(false);
  });
  it("admins can grant moderator but not admin", () => {
    expect(canManageRole(["admin"], "moderator")).toBe(true);
    expect(canManageRole(["admin"], "admin")).toBe(false);
  });
  it("super admins can grant admin", () => {
    expect(canManageRole(["super_admin"], "admin")).toBe(true);
  });
  it("users can only self-select customer or worker", () => {
    expect(SELF_SELECTABLE_ROLES).toEqual(["customer", "worker"]);
  });
  it("routes users to the right dashboard", () => {
    expect(homeForRoles([])).toBe("/onboarding");
    expect(homeForRoles(["customer"])).toBe("/customer");
    expect(homeForRoles(["customer", "worker"])).toBe("/worker");
    expect(homeForRoles(["worker", "admin"])).toBe("/admin/users");
    expect(isAdmin(["moderator"])).toBe(false);
  });
});
