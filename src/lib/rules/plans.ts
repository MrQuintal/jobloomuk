// Paid plan catalogue for professionals. Price IDs match the payment provider's lookup keys.
export type PlanTier = "free" | "pro" | "business";
export type Interval = "month" | "year";

export const PRICE_IDS = {
  pro: { month: "pro_monthly", year: "pro_yearly" },
  business: { month: "business_monthly", year: "business_yearly" },
} as const;

export const PRICES_PENCE = {
  pro: { month: 600, year: 6000 },
  business: { month: 1000, year: 10000 },
} as const;

const TIER_RANK: Record<PlanTier, number> = { free: 0, pro: 1, business: 2 };

export function tierForPriceId(priceId: string | null | undefined): PlanTier {
  if (!priceId) return "free";
  if (priceId.startsWith("business_")) return "business";
  if (priceId.startsWith("pro_")) return "pro";
  return "free";
}

export type SubRow = { status: string; price_id: string; current_period_end: string | null };

/** Active, trialing and past_due keep access; cancelled keeps access until the paid period ends. */
export function hasAccess(sub: SubRow | null | undefined, now = new Date()): boolean {
  if (!sub) return false;
  const end = sub.current_period_end ? new Date(sub.current_period_end) : null;
  if (["active", "trialing", "past_due"].includes(sub.status)) return !end || end > now;
  if (sub.status === "canceled") return !!end && end > now;
  return false;
}

export function currentTier(sub: SubRow | null | undefined, now = new Date()): PlanTier {
  return hasAccess(sub, now) ? tierForPriceId(sub!.price_id) : "free";
}

export function tierAtLeast(tier: PlanTier, needed: PlanTier) {
  return TIER_RANK[tier] >= TIER_RANK[needed];
}

export function formatPence(p: number) {
  return `£${(p / 100).toFixed(p % 100 ? 2 : 0)}`;
}

export const PLAN_FEATURES: Record<"pro" | "business", { tagline: string; features: string[] }> = {
  pro: {
    tagline: "For people who want to win more work",
    features: [
      "Everything in Free",
      "Enhanced profile with banner, branding and shareable link",
      "Unlimited portfolio projects with photos, videos, case studies and before-and-after galleries",
      "More service categories and specialisms",
      "Advanced job filters by location, distance, budget, category and urgency",
      "Instant alerts for matching jobs",
      "Saved job searches and favourite customers",
      "Enhanced availability calendar and service-area map",
      "Quote templates and indicative pricing tools",
      "Profile analytics: views, enquiries, clicks and conversion",
      "Custom profile URL and downloadable profile PDF",
      "AI-assisted profile descriptions, quotes and replies",
      "Business hours, response-time and availability status",
      "Lead and enquiry dashboard",
      "Optional promoted placement, clearly labelled as sponsored",
    ],
  },
  business: {
    tagline: "For growing businesses and professional teams",
    features: [
      "Everything in Pro",
      "Dedicated business page with logo, branding and gallery",
      "Multiple team-member profiles under one business",
      "Team roles and permissions (owner, manager)",
      "Multiple branches, service areas or locations",
      "Shared team availability and appointment calendar",
      "Central enquiries inbox for the whole business",
      "Assign leads to team members",
      "Company-wide and per-profile analytics",
      "Manage multiple categories, brands or profiles",
      "Customisable service packages and quote templates",
      "Business credentials and document management",
      "Lead pipeline: new, contacted, quoted, completed",
      "Downloadable business reports",
      "Custom business URL and portfolio presentation",
      "Priority support",
    ],
  },
};
