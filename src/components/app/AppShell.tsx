import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, Hammer, Users, ScrollText, LogOut, ClipboardList, Search, MessageSquare, Bell, ShieldCheck, Settings, UserCog , CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { isAdmin, ROLE_LABELS } from "@/lib/rules/roles";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: unread = 0 } = useQuery({
    queryKey: ["unread", user?.id],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async () => (await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null)).count ?? 0,
  });
  const links = [
    roles.includes("customer") && { to: "/customer", label: "My jobs", icon: ClipboardList },
    roles.includes("worker") && { to: "/worker", label: "My business", icon: Hammer },
    roles.includes("worker") && { to: "/jobs", label: "Find jobs", icon: Search },
    roles.includes("worker") && { to: "/billing", label: "Plan & billing", icon: CreditCard },
    (roles.includes("customer") || roles.includes("worker")) && { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/notifications", label: unread ? `Notifications (${unread})` : "Notifications", icon: Bell },
    { to: "/account", label: "Account & privacy", icon: UserCog },
    isAdmin(roles) && { to: "/admin/settings", label: "Overview", icon: Settings },
    (isAdmin(roles) || roles.includes("moderator")) && { to: "/admin/moderation", label: "Moderation", icon: ShieldCheck },
    isAdmin(roles) && { to: "/admin/users", label: "Users", icon: Users },
    isAdmin(roles) && { to: "/admin/audit", label: "Audit log", icon: ScrollText },
  ].filter(Boolean) as { to: "/customer" | "/worker" | "/billing" | "/jobs" | "/messages" | "/notifications" | "/account" | "/admin/settings" | "/admin/moderation" | "/admin/users" | "/admin/audit"; label: string; icon: typeof LayoutDashboard }[];

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      <aside className="flex flex-col gap-6 bg-sidebar p-5 text-sidebar-foreground md:min-h-screen">
        <Logo inverted />
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent font-medium" }}>
              <l.icon className="size-4" /> {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden text-xs md:block">
          <p className="truncate text-sidebar-foreground/80">{user?.email}</p>
          <p className="mt-1 text-sidebar-foreground/60">{roles.map((r) => ROLE_LABELS[r]).join(" · ") || "No role yet"}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 -ml-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut /> Sign out
          </Button>
        </div>
      </aside>
      <main className="p-5 md:p-10">{children}</main>
    </div>
  );
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-medium md:text-4xl">{title}</h1>
      {children && <p className="mt-2 max-w-2xl text-muted-foreground">{children}</p>}
    </div>
  );
}
