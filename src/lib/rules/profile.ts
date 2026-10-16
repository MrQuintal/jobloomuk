/** Turn a business name into a URL-safe profile slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** A profile can be published only once it has the essentials. */
export function publishBlockers(p: { business_name?: string | null; headline?: string | null; base_area?: string | null; specialismCount: number }): string[] {
  const out: string[] = [];
  if (!p.business_name?.trim()) out.push("Add your business or trading name");
  if (!p.headline?.trim()) out.push("Add a short headline");
  if (!p.base_area?.trim()) out.push("Add the area you're based in");
  if (p.specialismCount < 1) out.push("Choose at least one service");
  return out;
}

export const MAX_PORTFOLIO_IMAGES = 8;
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
