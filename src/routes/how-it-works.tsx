import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/how-it-works")({
  head: () => pageHead("/how-it-works", "How it works", "How Jobloom introduces UK customers and independent professionals — post a job or browse portfolios, then agree the work directly."),
  component: () => (
    <ContentPage
      eyebrow="How it works"
      title="Two ways in. One honest introduction."
      intro="Customers can post a job or search for a professional. Professionals can showcase their work and find jobs. Then you talk and agree everything directly."
      sections={[
        { title: "Customers post a job", body: "Describe the work, your area and timing. Suitable professionals can show interest and you choose who to talk to." },
        { title: "Or browse professionals", body: "Compare real portfolios, specialisms, service areas and credible reviews from verified work." },
        { title: "Talk and agree directly", body: "Message, arrange a visit and agree price and payment between yourselves. Jobloom never holds your money." },
        { title: "Build a fair reputation", body: "Reviews come from real introductions. New professionals get fair exposure so quality — not budget — rises to the top." },
      ]}
    />
  ),
});
