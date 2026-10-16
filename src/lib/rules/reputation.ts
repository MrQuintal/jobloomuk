/** Reputation rules. Mirrors reviews INSERT policy and public display rules. */

/** Minimum published reviews before an average score is shown publicly. */
export const MIN_REVIEWS_FOR_AVERAGE = 3;
/** Professionals who joined within this many days count as newcomers. */
export const NEWCOMER_DAYS = 90;

export type Completion = { customer_confirmed_at: string | null; worker_confirmed_at: string | null } | null;

/** Mirrors the reviews INSERT policy: both sides confirmed, reviewer is the customer, no existing review. */
export function canReview(c: Completion, isCustomer: boolean, alreadyReviewed: boolean): boolean {
  return !!c?.customer_confirmed_at && !!c?.worker_confirmed_at && isCustomer && !alreadyReviewed;
}

export type Ratings = { quality: number; reliability: number; communication: number; value: number };

export function reviewScore(r: Ratings): number {
  return (r.quality + r.reliability + r.communication + r.value) / 4;
}

/** Average is hidden below the minimum sample size, so one review can't define anyone. */
export function summarise(reviews: Ratings[]): { count: number; average: number | null } {
  const count = reviews.length;
  if (count < MIN_REVIEWS_FOR_AVERAGE) return { count, average: null };
  const avg = reviews.reduce((s, r) => s + reviewScore(r), 0) / count;
  return { count, average: Math.round(avg * 10) / 10 };
}

export function isNewcomer(createdAt: string, now = Date.now()): boolean {
  return now - new Date(createdAt).getTime() < NEWCOMER_DAYS * 86400000;
}

/**
 * Fair discovery: interleave newcomers with established professionals so
 * newcomers are never buried. Subscription status is never an input.
 */
export function fairOrder<T extends { created_at: string }>(list: T[], now = Date.now()): T[] {
  const fresh = list.filter((p) => isNewcomer(p.created_at, now));
  const est = list.filter((p) => !isNewcomer(p.created_at, now));
  const out: T[] = [];
  while (fresh.length || est.length) {
    if (est.length) out.push(est.shift()!);
    if (fresh.length) out.push(fresh.shift()!);
  }
  return out;
}
