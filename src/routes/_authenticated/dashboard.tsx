import { pageHead } from "@/lib/seo";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { homeForRoles } from "@/lib/rules/roles";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => {
    const head = pageHead("/dashboard", "Your account", "Open the appropriate Jobloom account area for your assigned roles.");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: Dashboard,
});

function Dashboard() {
  const { ready, roles } = useAuth();
  if (!ready) return <p className="text-muted-foreground">Loading your account…</p>;
  return <Navigate to={homeForRoles(roles)} replace />;
}
