import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import type { AppRole } from "@/lib/rules/roles";

/** UI convenience only — the database enforces access on every request. */
export function RoleGate({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { ready, roles } = useAuth();
  if (!ready) return <p className="text-muted-foreground">Loading…</p>;
  if (!roles.some((r) => allow.includes(r))) {
    return (
      <div className="max-w-md rounded-2xl border border-border bg-card p-6">
        <h1 className="text-xl font-medium">You don't have access to this page</h1>
        <p className="mt-2 text-sm text-muted-foreground">This area is for a different type of account.</p>
      </div>
    );
  }
  return <>{children}</>;
}
