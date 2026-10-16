import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { homeForRoles } from "@/lib/rules/roles";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | Jobloom" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { ready, roles } = useAuth();
  if (!ready) return <p className="text-muted-foreground">Loading your account…</p>;
  return <Navigate to={homeForRoles(roles)} replace />;
}
