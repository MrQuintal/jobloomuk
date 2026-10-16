import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  staticData: { sitemap: true },
  head: () => pageHead("/about", "About", "Why Jobloom exists: a fairer, more transparent UK services platform where good professionals prove their value."),
  component: () => (
    <ContentPage
      eyebrow="About Jobloom"
      title="A fairer alternative to the usual marketplaces."
      intro="Too many platforms make professionals pay for leads and let advertising decide who gets seen. Jobloom is built the other way round."
      sections={[
        { title: "Both sides matter equally", body: "Customers and professionals get the same care, privacy and respect." },
        { title: "Reputation is earned", body: "Credibility comes from real work and genuine reviews — never from a paid upgrade." },
        { title: "Newcomers get a chance", body: "Talented new professionals get fair exposure while they build their name." },
        { title: "No commission", body: "We earn from optional professional subscriptions, not from your jobs." },
      ]}
    />
  ),
});
