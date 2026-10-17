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
  return sub && hasAccess(sub, now) ? tierForPriceId(sub.price_id) : "free";
}

/** Complimentary access changes features, never the paid subscription. The higher of paid and complimentary wins. Mirrors plan_tier(). */
export function effectiveTier(sub: SubRow | null | undefined, grant: boolean | "pro" | "business" | null, now = new Date()): PlanTier {
  const paid = currentTier(sub, now);
  const comp: PlanTier = grant === true ? "business" : grant ? grant : "free";
  return TIER_RANK[comp] > TIER_RANK[paid] ? comp : paid;
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
      "Profile banner",
      "Unlimited portfolio projects, with photos, a description and a YouTube or Vimeo video",
      "Keyword and area filters on Find jobs",
      "Saved searches and instant alerts for matching jobs",
      "Favourite customers",
      "Quote templates",
      "Profile analytics: views, clicks, enquiries and conversion",
      "AI help for your profile, quotes and replies",
      "A response time and an availability status on your profile",
      "Sponsored placement, labelled Sponsored",
    ],
  },
  business: {
    tagline: "For growing businesses and professional teams",
    features: [
      "Everything in Pro",
      "Team members listed on your profile",
      "Branches listed on your profile",
      "Assign leads to team members",
      "A month calendar of visits. Open a day to see who is coming, write a note, request a time, record the amount, or cancel. Both of you are notified",
      "Lead pipeline: new, contacted, quoted, booked, completed and lost",
      "Download a CSV of your leads",
      "Invoices you create and save as a PDF. Customers pay you directly",
    ],
  },
};

export const AVAILABILITY_STATUSES = ["available", "busy", "away"] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const AVAILABILITY_LABEL: Record<AvailabilityStatus, string> = {
  available: "Available",
  busy: "Busy",
  away: "Away",
};

export function availabilityLabel(status: string | null | undefined): string | null {
  if (status === "available" || status === "busy" || status === "away") return AVAILABILITY_LABEL[status];
  return null;
}

/** Label for a median reply time in seconds. Needs a real measurement; callers hide it until there are enough replies. */
export function responseTimeLabel(medianSeconds: number | null | undefined): string | null {
  if (medianSeconds == null || !Number.isFinite(medianSeconds) || medianSeconds < 0) return null;
  if (medianSeconds <= 60 * 60) return "Usually replies within an hour";
  if (medianSeconds <= 4 * 60 * 60) return "Usually replies within a few hours";
  if (medianSeconds <= 24 * 60 * 60) return "Usually replies within a day";
  if (medianSeconds <= 3 * 24 * 60 * 60) return "Usually replies within a few days";
  return "Usually replies within a week";
}

/** Free professionals can show this many portfolio projects; Pro and Business are unlimited. Mirrors the DB trigger. */
export const FREE_PORTFOLIO_LIMIT = 3;

export function canAddPortfolioProject(tier: PlanTier, existing: number) {
  return tier !== "free" || existing < FREE_PORTFOLIO_LIMIT;
}

/** Enquiries as a whole-number percentage of profile views. */
export function conversionRate(views: number, enquiries: number) {
  return views > 0 ? Math.round((enquiries / views) * 100) : 0;
}

export const LEAD_STAGES = ["new", "contacted", "quoted", "booked", "completed", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];
