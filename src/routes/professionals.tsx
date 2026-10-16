import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { PageShell, PageIntro } from "@/components/site/PageShell";
import { listCategories, listPros } from "@/lib/public.functions";
import { pageHead } from "@/lib/seo";

const catsQ = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });
const prosQ = (category?: string) => queryOptions({ queryKey: ["pros", category ?? ""], queryFn: () => listPros({ data: { category } }) });

export const Route = createFileRoute("/professionals")({
  validateSearch: (s: Record<string, unknown>) => ({ category: typeof s.category === "string" ? s.category : undefined }),
  loaderDeps: ({ search }) => ({ category: search.category }),
  loader: ({ context, deps }) => Promise.all([context.queryClient.ensureQueryData(catsQ), context.queryClient.ensureQueryData(prosQ(deps.category))]),
  head: () => pageHead("/professionals", "Find professionals", "Browse independent UK professionals, see their real portfolio work and contact them directly."),
  component: Pros,
});

function Pros() {
  const { category } = Route.useSearch();
  const { data: cats } = useSuspenseQuery(catsQ);
  const { data: pros } = useSuspenseQuery(prosQ(category));
  return (
    <PageShell>
      <PageIntro eyebrow="Find professionals" title="Local people, real work.">Browse profiles and portfolios, then message the professional directly.</PageIntro>
      <section className="container-page pb-20">
        <div className="mb-8 flex flex-wrap gap-2">
          <Link to="/professionals" search={{ category: undefined }} className={`rounded-full border px-3 py-1.5 text-sm ${!category ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>All</Link>
          {cats.map((c) => (
            <Link key={c.id} to="/professionals" search={{ category: c.slug }} className={`rounded-full border px-3 py-1.5 text-sm ${category === c.slug ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{c.name}</Link>
          ))}
        </div>
        {pros.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No published professionals here yet. Jobloom is just getting started — check back soon.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pros.map((p) => (
              <Link key={p.user_id} to="/pro/$slug" params={{ slug: p.slug }} className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
                <h2 className="text-xl font-medium">{p.business_name}</h2>
                {p.headline && <p className="mt-1 text-sm text-muted-foreground">{p.headline}</p>}
                {p.base_area && <p className="mt-3 flex items-center gap-1 text-sm"><MapPin className="size-4" /> {p.base_area} · up to {p.travel_radius_miles} miles</p>}
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
