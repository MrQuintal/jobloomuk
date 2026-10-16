import { createFileRoute, Link } from "@tanstack/react-router";
import { formatPence, PLAN_FEATURES, PRICES_PENCE } from "@/lib/rules/plans";
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
        {plans.map((p, i) => {
          const paid = p.slug === "pro" || p.slug === "business" ? (p.slug as "pro" | "business") : null;
          const features = paid ? PLAN_FEATURES[paid].features : (p.features as string[]);
          return (
            <div key={p.id} className={`flex flex-col rounded-3xl border p-8 ${i === 1 ? "border-forest bg-forest text-forest-foreground" : "border-border bg-card"}`}>
              <h2 className="text-2xl font-medium">{p.name}</h2>
              <p className={`mt-1 text-sm ${i === 1 ? "text-forest-foreground/70" : "text-muted-foreground"}`}>{paid ? PLAN_FEATURES[paid].tagline : p.description}</p>
              <p className="mt-6 font-display text-3xl">{paid ? `${formatPence(PRICES_PENCE[paid].month)}/month` : "Free"}</p>
              {paid && <p className={`text-sm ${i === 1 ? "text-forest-foreground/70" : "text-muted-foreground"}`}>or {formatPence(PRICES_PENCE[paid].year)}/year — 2 months free</p>}
              <ul className="mt-6 flex flex-col gap-2 text-sm">
                {features.map((f) => (
                  <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-bloom" />{f}</li>
                ))}
              </ul>
              {paid && <Link to="/billing" className="mt-6 rounded-full bg-bloom px-4 py-2 text-center text-sm font-medium text-bloom-foreground">Choose {p.name}</Link>}
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Prices include VAT where applicable. Cancel any time — you keep paid features until the end of the period you paid for. Plan features are rolling out in stages.</p>
    </ContentPage>
  );
}
