import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { useAuth } from "@/lib/auth";
import { ALL_ROLES, canManageRole, ROLE_LABELS, type AppRole } from "@/lib/rules/roles";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users | Jobloom admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RoleGate allow={["admin", "super_admin"]}>
      <UsersAdmin />
    </RoleGate>
  ),
});

function UsersAdmin() {
  const { roles: myRoles } = useAuth();
  const qc = useQueryClient();
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

  return (
    <>
      <PageTitle title="Users">Grant or remove roles. Every change is recorded in the audit log.</PageTitle>
      {isLoading && <p className="text-muted-foreground">Loading users…</p>}
      {error && <p className="text-destructive">Couldn't load users. Please try again.</p>}
      {data && data.length === 0 && <p className="text-muted-foreground">No users yet.</p>}
      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr><th className="p-3">Name</th><th className="p-3">Joined</th><th className="p-3">Roles</th><th className="p-3">Status</th></tr>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
