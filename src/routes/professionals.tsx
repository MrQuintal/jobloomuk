import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { PageShell, PageIntro } from "@/components/site/PageShell";
import { listCategories, listPros } from "@/lib/public.functions";
import { pageHead } from "@/lib/seo";
import { useState } from "react";
import { DistanceFilter } from "@/components/app/DistanceFilter";
import { useGeocode, useGeocodeMany } from "@/lib/geocode";
import { formatMiles, milesBetween, withinRadius } from "@/lib/rules/distance";

const catsQ = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });
const prosQ = (category?: string) => queryOptions({ queryKey: ["pros", category ?? ""], queryFn: () => listPros({ data: category ? { category } : {} }) });

export const Route = createFileRoute("/professionals")({
  staticData: { sitemap: true },
  validateSearch: (s: Record<string, unknown>): { category?: string } => (typeof s["category"] === "string" ? { category: s["category"] } : {}),
  loaderDeps: ({ search }) => ({ category: search.category }),
  loader: ({ context, deps }) => Promise.all([context.queryClient.ensureQueryData(catsQ), context.queryClient.ensureQueryData(prosQ(deps["category"]))]),
  head: () => pageHead("/professionals", "Find professionals", "Browse independent UK professionals, see their real portfolio work and contact them directly."),
  component: Pros,
});

function Pros() {
  const { category } = Route.useSearch();
  const { data: cats } = useSuspenseQuery(catsQ);
  const { data: allPros } = useSuspenseQuery(prosQ(category));
  const [place, setPlace] = useState("");
  const [radius, setRadius] = useState<number | null>(null);
  const me = useGeocode(place);
  const coords = useGeocodeMany(me.data ? allPros.map((p) => p.base_area ?? "") : []);
  const withDist = allPros.map((p) => {
    const c = p.base_area ? coords.get(p.base_area) : null;
    return { ...p, miles: me.data && c ? milesBetween(me.data, c) : null };
  });
  const pros = me.data
    ? withDist.filter((p) => withinRadius(p.miles, radius)).sort((a, b) => (a.miles ?? 1e9) - (b.miles ?? 1e9))
    : withDist;
  return (
    <PageShell>
      <PageIntro eyebrow="Find professionals" title="Local people, real work.">Browse profiles and portfolios, then message the professional directly.</PageIntro>
      <section className="container-page pb-20">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link to="/professionals" search={{}} className={`rounded-full border px-3 py-1.5 text-sm ${!category ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>All</Link>
          {cats.map((c) => (
            <Link key={c.id} to="/professionals" search={{ category: c.slug }} className={`rounded-full border px-3 py-1.5 text-sm ${category === c.slug ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{c.name}</Link>
          ))}
        </div>
        <div className="mb-8">
          <DistanceFilter place={place} onPlace={setPlace} radius={radius} onRadius={setRadius} found={me.isFetched && place.trim().length >= 2 ? !!me.data : null} />
          <p className="mt-2 text-xs text-muted-foreground">Distances are approximate, measured in a straight line from the professional's base area.</p>
        </div>
        {pros.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">{allPros.length ? "No professionals within that distance yet — try a wider radius." : "No published professionals here yet. Jobloom is just getting started — check back soon."}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pros.map((p) => (
              <Link key={p.user_id} to="/pro/$slug" params={{ slug: p.slug }} className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
                {p.sponsored && <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Sponsored</p>}
                <h2 className="text-xl font-medium">{p.business_name}</h2>
                {p.headline && <p className="mt-1 text-sm text-muted-foreground">{p.headline}</p>}
                {p.base_area && <p className="mt-3 flex items-center gap-1 text-sm"><MapPin className="size-4" /> {p.base_area} · up to {p.travel_radius_miles} miles</p>}
                {p.miles != null && (
                  <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium">{formatMiles(p.miles)}</span>
                    {p.miles <= p.travel_radius_miles ? <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">Covers your area</span> : <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">Outside usual travel area</span>}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.worker_specialisms.map((s, i) => s.categories && <span key={i} className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">{s.categories.name}</span>)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
