import { pageHead } from "@/lib/seo";
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
import { changePlan, createCheckoutSession, createPortalSession } from "@/lib/payments.functions";
import { currentTier, effectiveTier, formatPence, PLAN_FEATURES, PRICE_IDS, PRICES_PENCE, type Interval } from "@/lib/rules/plans";

export const Route = createFileRoute("/_authenticated/billing")({
  staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>): { session_id?: string | undefined } => ({
    session_id: typeof s["session_id"] === "string" ? (s["session_id"] as string) : undefined,
  }),
  head: () => {
    const head = pageHead("/billing", "Plan & billing", "Manage your Jobloom Pro or Business subscription, billing period and payment details.");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: Billing,
});

function Billing() {
  const { user } = useAuth();
  const { session_id } = Route.useSearch();
  const [interval, setInterval] = useState<Interval>("month");
  const [priceId, setPriceId] = useState<string | null>(null);

  const sub = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    refetchInterval: session_id ? 3000 : false,
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("subscriptions").select("*")
        .eq("user_id", user.id).eq("environment", getStripeEnvironment())
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });
  const grant = useQuery({
    queryKey: ["business-access", user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("business_access_grants").select("tier").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return (data?.tier as "pro" | "business" | undefined) ?? null;
    },
  });
  const tier = currentTier(sub.data);
  const accessTier = effectiveTier(sub.data, grant.data ?? null);
  const isComplimentary = !!grant.data && accessTier === grant.data && tier !== accessTier;
  const [switching, setSwitching] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  async function manage() {
    const r = await createPortalSession({ data: { environment: getStripeEnvironment(), returnUrl: window.location.href } });
    if ("error" in r) return void toast.error(r.error);
    window.open(r.url, "_blank");
  }

  async function switchTo(target: string) {
    const label = target.replace("_", " ").replace("monthly", "(monthly)").replace("yearly", "(annual)");
    if (!confirm(`Switch to ${label}? You'll be charged or credited the difference straight away.`)) return;
    setSwitching(target);
    const r = await changePlan({ data: { priceId: target, environment: getStripeEnvironment() } });
    if ("error" in r) { setSwitching(null); return void toast.error(r.error); }
    toast.success("Plan changed — updating your account…");
    setPolling(true);
    for (let i = 0; i < 10; i++) {
      await new Promise((res) => setTimeout(res, 2000));
      const { data: latest } = await sub.refetch();
      if (latest?.price_id === target) break;
    }
    await sub.refetch();
    setPolling(false);
    setSwitching(null);
  }

  const currentPrice = sub.data?.price_id ?? null;

  return (
    <div>
      <PaymentTestModeBanner />
      <PageTitle title="Plan & billing" />
      {isComplimentary ? (
        <div className="mb-6 rounded-2xl border border-bloom bg-card p-5">
          <p className="text-lg">You're on <strong className="capitalize">{accessTier}</strong> <span className="ml-1 rounded-full bg-bloom px-3 py-1 text-xs text-bloom-foreground">Complimentary · Free</span></p>
          <p className="mt-2 text-sm text-muted-foreground">Jobloom has upgraded your account for free. You won't be charged for this plan.{tier !== "free" && ` Your paid ${tier} subscription and its charges are unchanged.`}</p>
        </div>
      ) : (
        <p className="mb-6 text-muted-foreground">
          You're on <strong className="text-foreground capitalize">{tier}</strong>
          {tier === "free" && " (free)"}
          {tier !== "free" && currentPrice && ` (paid, ${currentPrice.endsWith("yearly") ? "annual" : "monthly"})`}.
          {sub.data?.cancel_at_period_end && sub.data.current_period_end && ` Cancelled — paid features end on ${new Date(sub.data.current_period_end).toLocaleDateString("en-GB")}.`}
          {sub.data?.status === "past_due" && " Your last payment failed — please update your card."}
        </p>
      )}
      {session_id && tier === "free" && <p className="mb-6 text-sm">Confirming your payment…</p>}
      {polling && <p className="mb-6 text-sm">Updating your plan…</p>}

      {priceId && tier === "free" ? (
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
            {(["pro", "business"] as const).map((t) => {
              const pid = PRICE_IDS[t][interval];
              const isCurrent = tier !== "free" && currentPrice === pid;
              const isUpgrade = tier === "pro" && t === "business";
              const coveredFree = isComplimentary && (accessTier === t || (accessTier === "business" && t === "pro"));
              return (
                <div key={t} className={`flex flex-col rounded-3xl border bg-card p-6 ${isCurrent || (isComplimentary && accessTier === t) ? "border-bloom" : "border-border"}`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-medium capitalize">{t}</h2>
                    {isComplimentary && accessTier === t ? <span className="rounded-full bg-bloom px-3 py-1 text-xs text-bloom-foreground">Current plan · Complimentary</span>
                      : isCurrent && <span className="rounded-full bg-bloom px-3 py-1 text-xs text-bloom-foreground">Current plan</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{PLAN_FEATURES[t].tagline}</p>
                  <p className="mt-4 font-display text-3xl">{formatPence(PRICES_PENCE[t][interval])}<span className="text-base text-muted-foreground">/{interval}</span></p>
                  <ul className="mt-4 flex flex-1 flex-col gap-1.5 text-sm">
                    {PLAN_FEATURES[t].features.slice(0, 6).map((f) => <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-bloom" />{f}</li>)}
                  </ul>
                  {coveredFree ? (
                    <Button className="mt-6" variant="outline" disabled>Included free</Button>
                  ) : tier === "free" ? (
                    <Button className="mt-6" onClick={() => setPriceId(pid)}>Choose {t}</Button>
                  ) : isCurrent ? (
                    <Button className="mt-6" variant="outline" disabled>Your current plan</Button>
                  ) : (
                    <Button className="mt-6" variant={isUpgrade ? "default" : "outline"} disabled={!!switching} onClick={() => switchTo(pid)}>
                      {switching === pid ? "Switching…" : isUpgrade ? "Upgrade to Business" : t === tier ? `Switch to ${interval === "year" ? "annual" : "monthly"}` : `Switch to ${t}`}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          {tier !== "free" && (
            <Button variant="ghost" className="mt-6" onClick={manage}>Manage payment card, invoices or cancel</Button>
          )}
          <p className="mt-6 text-xs text-muted-foreground">Changes apply straight away; you're charged or credited only the difference. Subscriptions never buy reviews, badges or guaranteed jobs.</p>
        </>
      )}
    </div>
  );
}
