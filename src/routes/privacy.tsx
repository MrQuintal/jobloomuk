import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => pageHead("/privacy", "Privacy notice", "How Jobloom collects, uses and protects personal data under UK GDPR."),
  component: () => (
    <ContentPage eyebrow="Legal" title="Privacy notice" intro="Draft — to be finalised once Jobloom's company details and ICO registration are confirmed.">
      <div className="max-w-2xl space-y-4 text-muted-foreground">
        <p>We collect only what we need to run your account: your name, email, and the details you choose to add to your profile or jobs.</p>
        <p>Customers' exact addresses and contact details are only shared with a professional when the customer chooses.</p>
        <p>You can ask us for a copy of your data or to delete your account. Self-service export and deletion will be added before launch.</p>
      </div>
    </ContentPage>
  ),
});
