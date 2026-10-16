import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => pageHead("/terms", "Terms of use", "The terms for using Jobloom, the UK introductions platform for customers and independent professionals."),
  component: () => (
    <ContentPage eyebrow="Legal" title="Terms of use" intro="Draft — these terms must be reviewed by a UK solicitor before launch.">
      <div className="max-w-2xl space-y-4 text-muted-foreground">
        <p>Jobloom is an introductions and discovery platform. Customers and professionals agree the scope, price and payment of any work directly with each other.</p>
        <p>Jobloom does not collect, hold or process payments for jobs and does not take commission. Jobloom is not a party to any agreement between a customer and a professional.</p>
        <p>Paid professional subscriptions provide platform features only. They do not influence reviews, verification or which professional a customer chooses.</p>
      </div>
    </ContentPage>
  ),
});
