import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/app/AppShell";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession, createPortalSession } from "@/lib/payments.functions";
import { currentTier, formatPence, PLAN_FEATURES, PRICE_IDS, PRICES_PENCE, type Interval } from "@/lib/rules/plans";

export const Route = createFileRoute("/_authenticated/billing")({
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof s["session_id"] === "string" ? (s["session_id"] as string) : undefined,
  }),
  head: () => ({ meta: [{ title: "Plan & billing | Jobloom" }, { name: "robots", content: "noindex" }] }),
  component: Billing,
});

function Billing() {
  const { user } = useAuth();
  const { session_id } = Route.useSearch();
  const [interval, setInterval] = useState<Interval>("month");
  const [priceId, setPriceId] = useState<string | null>(null);

  const sub = useQuery({
    queryKey: ["subscription", user!.id],
    refetchInterval: session_id ? 3000 : false,
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*")
        .eq("user_id", user!.id).eq("environment", getStripeEnvironment())
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });
  const tier = currentTier(sub.data);

  async function manage() {
    const r = await createPortalSession({ data: { environment: getStripeEnvironment(), returnUrl: window.location.href } });
    if ("error" in r) return void toast.error(r.error);
    window.open(r.url, "_blank");
  }

  return (
    <div>
      <PaymentTestModeBanner />
      <PageTitle title="Plan & billing" />
      <p className="mb-6 text-muted-foreground">
        You're on <strong className="text-foreground capitalize">{tier}</strong>.
        {sub.data?.cancel_at_period_end && sub.data.current_period_end && ` Cancelled — paid features end on ${new Date(sub.data.current_period_end).toLocaleDateString("en-GB")}.`}
        {sub.data?.status === "past_due" && " Your last payment failed — please update your card."}
      </p>
      {session_id && tier === "free" && <p className="mb-6 text-sm">Confirming your payment…</p>}

      {tier !== "free" ? (
        <Button onClick={manage}>Manage billing, change or cancel plan</Button>
      ) : priceId ? (
        <div className="rounded-3xl border border-border bg-card p-4">
          <EmbeddedCheckoutProvider
            stripe={getStripe()}
            options={{
              fetchClientSecret: async () => {
                const r = await createCheckoutSession({ data: { priceId, environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/billing?session_id={CHECKOUT_SESSION_ID}` } });
                if ("error" in r) throw new Error(r.error);
                return r.clientSecret;
              },
            }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
          <Button variant="ghost" className="mt-4" onClick={() => setPriceId(null)}>Back to plans</Button>
        </div>
      ) : (
        <>
          <div className="mb-6 inline-flex rounded-full border border-border p-1">
            {(["month", "year"] as const).map((i) => (
              <button key={i} onClick={() => setInterval(i)} className={`rounded-full px-4 py-1.5 text-sm ${interval === i ? "bg-forest text-forest-foreground" : ""}`}>
                {i === "month" ? "Monthly" : "Annual — 2 months free"}
              </button>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {(["pro", "business"] as const).map((t) => (
              <div key={t} className="flex flex-col rounded-3xl border border-border bg-card p-6">
                <h2 className="text-2xl font-medium capitalize">{t}</h2>
                <p className="text-sm text-muted-foreground">{PLAN_FEATURES[t].tagline}</p>
                <p className="mt-4 font-display text-3xl">{formatPence(PRICES_PENCE[t][interval])}<span className="text-base text-muted-foreground">/{interval}</span></p>
                <ul className="mt-4 flex flex-1 flex-col gap-1.5 text-sm">
                  {PLAN_FEATURES[t].features.slice(0, 6).map((f) => <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-bloom" />{f}</li>)}
                </ul>
                <Button className="mt-6" onClick={() => setPriceId(PRICE_IDS[t][interval])}>Choose {t}</Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Plan features are rolling out in stages. Subscriptions never buy reviews, badges or guaranteed jobs.</p>
        </>
      )}
    </div>
  );
}
