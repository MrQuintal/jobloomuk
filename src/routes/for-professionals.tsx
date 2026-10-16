import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/for-professionals")({
  head: () => pageHead("/for-professionals", "For professionals", "Showcase your work, find UK customer jobs and build a reputation on evidence. Simple subscriptions, no commission on your jobs."),
  component: () => (
    <ContentPage
      eyebrow="For professionals"
      title="Be found for the work you're proud of."
      intro="Jobloom is built for independent tradespeople and service professionals who want to win work on merit."
      sections={[
        { title: "A real portfolio", body: "Show projects with photos, the problem you solved and the result — not just a star rating." },
        { title: "What you do most", body: "Highlight your specialisms so customers find you for the work you're best at." },
        { title: "Find customer jobs", body: "Browse jobs posted in your area and show interest in the ones that suit you." },
        { title: "Keep every pound", body: "No commission and no paying per lead. Optional subscriptions unlock extra profile tools." },
      ]}
    >
      <Button asChild variant="bloom" size="lg"><Link to="/auth" search={{ mode: "signup", role: "worker" }}>Join as a professional</Link></Button>
    </ContentPage>
  ),
});
