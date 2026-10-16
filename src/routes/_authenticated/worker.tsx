import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/app/AppShell";
import { ComingSoon } from "@/components/site/PageShell";
import { RoleGate } from "@/components/app/RoleGate";

export const Route = createFileRoute("/_authenticated/worker")({
  head: () => ({ meta: [{ title: "My business | Jobloom" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RoleGate allow={["worker"]}>
      <PageTitle title="My business">Build your profile, show your work and find jobs near you.</PageTitle>
      <div className="grid gap-4 md:grid-cols-3">
        <ComingSoon phase="Phase 2">Profile builder, portfolio projects and service areas.</ComingSoon>
        <ComingSoon phase="Phase 3">Browse customer jobs and show interest.</ComingSoon>
        <ComingSoon phase="Phase 4">Availability and booking requests.</ComingSoon>
      </div>
    </RoleGate>
  ),
});
