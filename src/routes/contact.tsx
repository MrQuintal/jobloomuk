import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { ComingSoon } from "@/components/site/PageShell";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => pageHead("/contact", "Contact", "Get in touch with the Jobloom team about your account, a professional profile or a complaint."),
  component: () => (
    <ContentPage eyebrow="Contact" title="Talk to the Jobloom team.">
      <ComingSoon phase="a later phase">
        A support and complaints form will be added with the admin support tools. Until then, the contact email for jobloom.co.uk still needs to be confirmed.
      </ComingSoon>
    </ContentPage>
  ),
});
