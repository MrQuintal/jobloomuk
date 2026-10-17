import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Loader2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { useAuth } from "@/lib/auth";
import { ALL_ROLES, canManageBusinessAccess, canManageRole, ROLE_LABELS, type AppRole } from "@/lib/rules/roles";

export const Route = createFileRoute("/_authenticated/admin/users")({
  staticData: { sitemap: false },
  head: () => {
    const head = pageHead("/admin/users", "Admin users", "Manage Jobloom account roles and account status with audited owner controls.");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: () => (
    <RoleGate allow={["admin", "super_admin"]}>
      <UsersAdmin />
    </RoleGate>
  ),
});

function UsersAdmin() {
  const { roles: myRoles } = useAuth();
  const qc = useQueryClient();
  const canUpgrade = canManageBusinessAccess(myRoles);
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const grants = useQuery({
    queryKey: ["admin-business-grants"],
    enabled: canUpgrade,
    queryFn: async () => {
      const { data, error } = await supabase.from("business_access_grants").select("user_id, tier");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, account_status, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (e1 || e2) throw e1 ?? e2;
      return (profiles ?? []).map((p) => ({ ...p, roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole) }));
    },
  });

  async function toggle(userId: string, role: AppRole, grant: boolean) {
    const { error } = await supabase.rpc("admin_set_role", { _user_id: userId, _role: role, _grant: grant });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${grant ? "Granted" : "Removed"} ${ROLE_LABELS[role]}`);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  async function changePlan(userId: string, name: string, tier: "pro" | "business" | null) {
    if (!canUpgrade || pendingUser) return;
    const label = tier === "pro" ? "Pro" : "Business";
    const prompt = tier
      ? `Give ${name} a complimentary ${label} plan for free? ${label} tools unlock immediately. Existing subscription charges are unchanged.`
      : `Remove the complimentary plan for ${name}? Their access returns to their paid plan, or Free. Existing subscription charges are unchanged.`;
    if (!window.confirm(prompt)) return;
    setPendingUser(userId);
    try {
      const { error } = await supabase.rpc("admin_set_complimentary_tier", { _user_id: userId, _tier: tier as string });
      if (error) throw error;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-business-grants"] }),
        qc.invalidateQueries({ queryKey: ["business-access"] }),
        qc.invalidateQueries({ queryKey: ["tier"] }),
        qc.invalidateQueries({ queryKey: ["admin-audit"] }),
      ]);
      toast.success(tier ? `Complimentary ${label} granted` : "Complimentary plan removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't change the plan. Please try again.");
    } finally {
      setPendingUser(null);
    }
  }

  return (
    <>
      <PageTitle title="Users">Grant or remove roles. Every change is recorded in the audit log.</PageTitle>
      {isLoading && <p className="text-muted-foreground">Loading users…</p>}
      {error && <p className="text-destructive">Couldn't load users. Please try again.</p>}
      {canUpgrade && grants.error && <p className="text-destructive">Couldn't load Business access. Please refresh and try again.</p>}
      {data && data.length === 0 && <p className="text-muted-foreground">No users yet.</p>}
      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr><th className="p-3">Name</th><th className="p-3">Joined</th><th className="p-3">Roles</th><th className="p-3">Status</th>{canUpgrade && <th className="p-3">Business access</th>}</tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3 font-medium">{u.display_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString("en-GB")}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_ROLES.map((r) => {
                        const has = u.roles.includes(r);
                        const allowed = canManageRole(myRoles, r);
                        return (
                          <button
                            key={r}
                            disabled={!allowed}
                            onClick={() => toggle(u.id, r, !has)}
                            className={`rounded-full border px-2.5 py-0.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${has ? "border-forest bg-forest text-forest-foreground" : "border-border text-muted-foreground hover:border-foreground"}`}
                          >
                            {ROLE_LABELS[r]}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3">
                    <button
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs hover:border-foreground"
                      onClick={async () => {
                        const next = u.account_status === "suspended" ? "active" : "suspended";
                        const { error } = await supabase.rpc("admin_set_account_status", { _user: u.id, _status: next });
                        if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-users"] });
                      }}
                    >
                      {u.account_status === "suspended" ? "Suspended · reactivate" : "Active · suspend"}
                    </button>
                  </td>
                  {canUpgrade && (
                    <td className="p-3">
                      {u.roles.includes("worker") || grants.data?.some((g) => g.user_id === u.id) ? (
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="text-xs text-muted-foreground">{grants.data?.some((g) => g.user_id === u.id) ? "Complimentary Business" : "No complimentary upgrade"}</span>
                          <Button size="sm" variant="outline" disabled={pendingUser !== null || grants.isPending || !!grants.error}
                            onClick={() => changeBusinessAccess(u.id, u.display_name ?? "this professional", !grants.data?.some((g) => g.user_id === u.id))}>
                            {pendingUser === u.id ? <Loader2 className="animate-spin" /> : grants.data?.some((g) => g.user_id === u.id) ? <Undo2 /> : <Building2 />}
                            {grants.data?.some((g) => g.user_id === u.id) ? "Remove upgrade" : "Upgrade to Business"}
                          </Button>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
