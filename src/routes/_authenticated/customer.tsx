import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/app/AppShell";
import { ComingSoon } from "@/components/site/PageShell";
import { RoleGate } from "@/components/app/RoleGate";

export const Route = createFileRoute("/_authenticated/customer")({
  head: () => ({ meta: [{ title: "My jobs | Jobloom" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RoleGate allow={["customer"]}>
      <PageTitle title="My jobs">Post the work you need done and see who's interested.</PageTitle>
      <div className="grid gap-4 md:grid-cols-2">
        <ComingSoon phase="Phase 3">Posting and managing jobs.</ComingSoon>
        <ComingSoon phase="Phase 4">Messages and visit requests from professionals.</ComingSoon>
      </div>
    </RoleGate>
  ),
});
