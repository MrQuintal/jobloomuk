import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { fairOrder, summarise } from "@/lib/rules/reputation";
import { withSponsored } from "@/lib/rules/media";
import { responseTimeLabel } from "@/lib/rules/plans";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient().from("categories").select("id, slug, name").eq("is_active", true).order("sort_order");
  return data ?? [];
});

export const listPros = createServerFn({ method: "GET" })
  .inputValidator((input: { category?: string }) => input)
  .handler(async ({ data }) => {
    const { data: rows, error } = await publicClient()
      .from("worker_profiles")
      .select("user_id, slug, business_name, headline, base_area, travel_radius_miles, years_experience, created_at, is_sponsored, worker_specialisms(is_primary, categories(slug, name))")
      .eq("is_published", true)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    const list = fairOrder(rows ?? []);
    return withSponsored(data.category ? list.filter((p) => p.worker_specialisms.some((s) => s.categories?.slug === data.category)) : list);
  });

export const getPro = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const wanted = data.slug.trim().toLowerCase();
    const { data: resolved } = await sb.rpc("current_profile_slug", { _slug: wanted });
    if (!resolved) return null;
    if (resolved !== data.slug) return { kind: "redirect" as const, redirectSlug: resolved };
    const { data: pro } = await sb
      .from("worker_profiles")
      .select("user_id, slug, business_name, headline, bio, base_area, travel_radius_miles, years_experience, phone, banner_path, availability_status, worker_specialisms(is_primary, categories(slug, name))")
      .eq("slug", resolved)
      .eq("is_published", true)
      .maybeSingle();
    if (!pro) return null;
    const [{ data: projects }, { data: slots }, { data: reviews }, { data: team }, { data: branches }, { data: replySeconds }] = await Promise.all([
      sb.from("portfolio_projects").select("id, title, description, location_text, completed_on, image_paths, video_url").eq("worker_id", pro.user_id).order("completed_on", { ascending: false }),
      sb.from("availability_slots").select("weekday, start_time, end_time").eq("worker_id", pro.user_id).order("weekday"),
      sb.rpc("worker_reviews", { _worker: pro.user_id }),
      sb.from("team_members").select("id, name, role_title, bio").eq("business_id", pro.user_id).order("created_at"),
      sb.from("branches").select("id, name, area, phone").eq("business_id", pro.user_id).order("created_at"),
      sb.rpc("worker_response_seconds", { _worker: pro.user_id }),
    ]);
    const paths = [...(projects ?? []).flatMap((p) => p.image_paths), ...(pro.banner_path ? [pro.banner_path] : [])];
    const urls: Record<string, string> = {};
    if (paths.length) {
      const { data: signed } = await sb.storage.from("portfolio").createSignedUrls(paths, 60 * 60);
      for (const s of signed ?? []) if (s.path && s.signedUrl) urls[s.path] = s.signedUrl;
    }
    return {
      kind: "profile" as const,
      pro,
      bannerUrl: pro.banner_path ? urls[pro.banner_path] ?? null : null,
      branches: branches ?? [],
      projects: (projects ?? []).map((p) => ({ ...p, images: p.image_paths.map((x) => urls[x]).filter(Boolean) })),
      slots: slots ?? [],
      team: team ?? [],
      reviews: reviews ?? [],
      summary: summarise(reviews ?? []),
      responseLabel: responseTimeLabel(replySeconds),
    };
  });
