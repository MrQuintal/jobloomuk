import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { ComingSoon } from "@/components/site/PageShell";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  head: () => pageHead("/contact", "Contact", "Get in touch with the Jobloom team about your account, a professional profile or a complaint."),
  component: () => (
    <ContentPage eyebrow="Contact" title="Talk to the Jobloom team.">
      <div className="space-y-4">
        <p>
          Email us at{" "}
          <a className="font-semibold text-foreground underline decoration-2 underline-offset-4 hover:text-bloom" href="mailto:MrQuintal@hotmail.co.uk">
            MrQuintal@hotmail.co.uk
          </a>
          . Tell us whether it is about your account, a subscription, a professional profile or a complaint, and include any job or message reference you have.
        </p>
        <p>We aim to reply within 2 working days. Complaints about work arranged directly between a customer and a professional should normally be raised with the other party first.</p>
        <ComingSoon phase="a later phase">
          A support and complaints form will be added with the admin support tools, so you can write to us without leaving the site.
        </ComingSoon>
      </div>
    </ContentPage>
  ),
});
