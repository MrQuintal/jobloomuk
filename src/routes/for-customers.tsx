import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/for-customers")({
  staticData: { sitemap: true },
  head: () => pageHead("/for-customers", "For customers", "Post the job you need doing for free and find trusted, local UK professionals with real portfolios on Jobloom."),
  component: () => (
    <ContentPage
      eyebrow="For customers"
      title="Get the right person for the job."
      intro="Posting a job on Jobloom is free. You stay in control of who you speak to and what you agree."
      sections={[
        { title: "Free to post", body: "No fees for customers. Describe your job once and let suitable professionals come to you." },
        { title: "See the evidence", body: "Portfolios show real projects, so you can judge quality before you get in touch." },
        { title: "Your details stay private", body: "Your exact address and contact details are only shared when you choose." },
        { title: "No middleman on payment", body: "You agree the price and pay your professional directly — we never take a cut." },
      ]}
    >
      <Button asChild variant="bloom" size="lg"><Link to="/auth" search={{ mode: "signup", role: "customer" }}>Create a free account</Link></Button>
    </ContentPage>
  ),
});
