import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => pageHead("/terms", "Terms of use", "The terms for using Jobloom, the UK introductions platform for customers and independent professionals."),
  component: () => (
    <ContentPage eyebrow="Legal" title="Terms of use" intro="Draft — these terms must be reviewed by a UK solicitor before launch.">
      <div className="max-w-2xl space-y-4 text-muted-foreground">
        <p>Jobloom is an introductions and discovery platform. Customers and professionals agree the scope, price and payment of any work directly with each other.</p>
        <p>Jobloom does not collect, hold or process payments for jobs and does not take commission. Jobloom is not a party to any agreement between a customer and a professional.</p>
        <p>Paid professional subscriptions provide platform features only. They do not buy reviews or credential badges, or guarantee jobs.</p>
        <p>Jobloom does not vet professionals or verify their identity, insurance, qualifications or trade registrations. Customers should request appropriate credentials from the professional and check any required registration with the relevant register before agreeing to work.</p>
      </div>
    </ContentPage>
  ),
});
