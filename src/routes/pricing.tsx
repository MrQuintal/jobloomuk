import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ContentPage } from "@/components/site/ContentPage";
import { pageHead } from "@/lib/seo";

const plansQuery = queryOptions({
  queryKey: ["subscription_plans"],
  queryFn: async () => {
    const { data, error } = await supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order");
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/pricing")({
  head: () => pageHead("/pricing", "Pricing", "Jobloom is free for customers. Professionals choose a simple subscription for profile and business tools — never commission on jobs."),
  loader: ({ context }) => context.queryClient.ensureQueryData(plansQuery),
  component: Pricing,
});

function Pricing() {
  const { data: plans } = useSuspenseQuery(plansQuery);
  return (
    <ContentPage
      eyebrow="Pricing"
      title="Free for customers. Fair for professionals."
      intro="Subscriptions pay for profile and business features only. They never buy better reviews, fake badges or guaranteed jobs."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((p, i) => (
          <div key={p.id} className={`flex flex-col rounded-3xl border p-8 ${i === 1 ? "border-forest bg-forest text-forest-foreground" : "border-border bg-card"}`}>
            <h2 className="text-2xl font-medium">{p.name}</h2>
            <p className={`mt-1 text-sm ${i === 1 ? "text-forest-foreground/70" : "text-muted-foreground"}`}>{p.description}</p>
            <p className="mt-6 font-display text-3xl">{p.slug === "free" ? "Free" : "Price coming soon"}</p>
            <ul className="mt-6 flex flex-col gap-2 text-sm">
              {(p.features as string[]).map((f) => (
                <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-bloom" />{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Paid plans aren't available yet — billing launches in a later phase.</p>
    </ContentPage>
  );
}
