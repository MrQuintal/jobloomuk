export const PRICING_TIPS_KEY = "category_pricing_tips";
export type PricingTips = Record<string, string[]>;

export function parsePricingTips(value: unknown): PricingTips {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, tips]) => {
    if (!Array.isArray(tips)) return [];
    const clean = tips.filter((tip): tip is string => typeof tip === "string").map((tip) => tip.trim()).filter(Boolean);
    return clean.length ? [[key, clean]] : [];
  }));
}

export function pricingTipsForCategory(value: unknown, slug?: string): string[] {
  const tips = parsePricingTips(value);
  return (slug ? tips[slug] : undefined) ?? tips["general"] ?? [];
}