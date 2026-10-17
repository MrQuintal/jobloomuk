import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Download, MapPin, Phone } from "lucide-react";
import { ServiceAreaMap } from "@/components/app/ServiceAreaMap";
import { videoEmbedUrl } from "@/lib/rules/media";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getPro } from "@/lib/public.functions";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { WEEKDAYS, isValidMessage } from "@/lib/rules/marketplace";
import { ReportButton } from "@/components/app/ReportButton";
import { UserAvatar, useAvatars } from "@/components/app/UserAvatar";
import { RatingBreakdown } from "@/components/app/StarRating";
import { PhotoLightbox } from "@/components/app/PhotoLightbox";
import defaultBanner from "@/assets/default-profile-banner.png";

const proQ = (slug: string) => queryOptions({ queryKey: ["pro", slug], queryFn: () => getPro({ data: { slug } }) });

export const Route = createFileRoute("/pro/$slug")({
  staticData: { sitemap: true },
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(proQ(params.slug));
    if (!d) throw notFound();
    return { name: d.pro.business_name, headline: d.pro.headline };
  },
  head: ({ loaderData, params }) => {
    const t = loaderData ? `${loaderData.name} | Jobloom` : "Professional | Jobloom";
    const d = loaderData?.headline || "See this professional's portfolio on Jobloom.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
      links: [{ rel: "canonical", href: `/pro/${params.slug}` }],
    };
  },
  notFoundComponent: () => (
    <PageShell><div className="container-page py-24"><h1 className="text-3xl">Professional not found</h1><p className="mt-2 text-muted-foreground">This profile may not be published yet.</p><Link to="/professionals" search={{}} className="mt-4 inline-block underline">Browse professionals</Link></div></PageShell>
  ),
  component: Pro,
});

function Pro() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(proQ(slug));
  const [photo, setPhoto] = useState<{ images: string[]; title: string; start: number } | null>(null);
  if (!data) return null;
  const { pro, projects, slots, reviews, summary, team, bannerUrl, branches } = data;
  useEffect(() => { void supabase.from("profile_events").insert({ worker_id: pro.user_id, kind: "view" }); }, [pro.user_id]);
  const av = useAvatars([pro.user_id]);
  return (
    <PageShell>
      <img src={bannerUrl ?? defaultBanner} alt={bannerUrl ? `${pro.business_name} banner` : "Jobloom banner"} className="h-48 w-full object-cover md:h-72" />
      <section className="container-page grid gap-10 py-14 md:grid-cols-[1fr_22rem]">
        <div>
          <p className="eyebrow">{pro.worker_specialisms.map((s) => s.categories?.name).filter(Boolean).join(" · ")}</p>
          <div className="mt-3 flex items-center gap-4">
            <UserAvatar url={av[pro.user_id]} name={pro.business_name} className="h-16 w-16 md:h-20 md:w-20" />
            <h1 className="text-4xl font-medium md:text-5xl">{pro.business_name}</h1>
          </div>
          {pro.headline && <p className="mt-3 text-lg text-muted-foreground">{pro.headline}</p>}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {pro.phone && <span className="flex items-center gap-1"><Phone className="size-4" /> {pro.phone}</span>}
            {pro.base_area && <span className="flex items-center gap-1"><MapPin className="size-4" /> {pro.base_area}, travels up to {pro.travel_radius_miles} miles</span>}
            {pro.years_experience != null && <span>{pro.years_experience} years' experience</span>}
          </div>
          {pro.bio && <p className="mt-8 whitespace-pre-line leading-relaxed">{pro.bio}</p>}

          {team.length > 0 && (
            <>
              <h2 className="mt-14 text-2xl font-medium">The team</h2>
              <ul className="mt-6 grid gap-4 md:grid-cols-2">
                {team.map((m) => (
                  <li key={m.id} className="rounded-2xl border border-border bg-card p-5">
                    <p className="font-medium">{m.name}</p>
                    {m.role_title && <p className="text-sm text-muted-foreground">{m.role_title}</p>}
                    {m.bio && <p className="mt-2 text-sm">{m.bio}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="mt-14 text-2xl font-medium">Portfolio</h2>
          {projects.length === 0 ? <p className="mt-3 text-muted-foreground">No projects added yet.</p> : (
            <div className="mt-6 grid gap-6">
              {projects.map((p) => (
                <article key={p.id} className="rounded-2xl border border-border bg-card p-5">
                  {p.images.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                      {p.images.map((u, i) => (
                        <button key={u} type="button" className="overflow-hidden rounded-lg" aria-label={`View larger photo from ${p.title}`} onClick={() => setPhoto({ images: p.images.filter((src): src is string => !!src), title: p.title, start: i })}>
                          <img src={u} alt={p.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  {p.video_url && videoEmbedUrl(p.video_url) && (
                    <iframe title={`${p.title} video`} src={videoEmbedUrl(p.video_url)!} className="mb-4 aspect-video w-full rounded-lg print:hidden" loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen />
                  )}
                  <h3 className="text-lg font-medium">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{[p.location_text, p.completed_on && new Date(p.completed_on).toLocaleDateString("en-GB", { month: "long", year: "numeric" })].filter(Boolean).join(" · ")}</p>
                  {p.description && <p className="mt-2 text-sm">{p.description}</p>}
                </article>
              ))}
            </div>
          )}

          <h2 className="mt-14 text-2xl font-medium">Reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Only customers whose job both sides confirmed as finished can leave a review.
            {summary.average != null ? ` Average ${summary.average} out of 5 from ${summary.count} reviews.` : summary.count > 0 ? ` ${summary.count} review${summary.count === 1 ? "" : "s"} so far — an average shows after 3.` : ""}
          </p>
          {reviews.length === 0 ? <p className="mt-3 text-muted-foreground">No reviews yet. Everyone starts somewhere — judge the portfolio.</p> : (
            <ul className="mt-6 space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-medium">{r.reviewer} · {new Date(r.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
                  <div className="mt-2"><RatingBreakdown r={r} /></div>
                  <p className="mt-2 text-sm whitespace-pre-line">{r.body}</p>
                  {r.worker_reply && <p className="mt-3 border-l-2 border-border pl-3 text-sm text-muted-foreground"><span className="font-medium">Reply:</span> {r.worker_reply}</p>}
                  <div className="mt-2"><ReportButton type="review" id={r.id} /></div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="space-y-6">
          <div className="print:hidden"><ContactBox workerId={pro.user_id} name={pro.business_name} /></div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-medium">Usual availability</h2>
            {slots.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Not set — ask in a message.</p> : (
              <ul className="mt-2 space-y-1 text-sm">{slots.map((s, i) => <li key={i}>{WEEKDAYS[s.weekday]} {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</li>)}</ul>
            )}
          </div>
          {pro.base_area && <div className="print:hidden"><ServiceAreaMap area={pro.base_area} radiusMiles={pro.travel_radius_miles} /></div>}
          {branches.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-medium">Branches</h2>
              <ul className="mt-2 space-y-2 text-sm">{branches.map((b) => <li key={b.id}><strong>{b.name}</strong> · {b.area}{b.phone ? ` · ${b.phone}` : ""}</li>)}</ul>
            </div>
          )}
          <div className="space-y-4 print:hidden">
            <Button variant="outline" className="w-full" onClick={() => window.print()}><Download /> Download profile PDF</Button>
            <p className="text-xs text-muted-foreground">Jobloom doesn't handle payments. You agree the price and pay the professional directly.</p>
            <ReportButton type="profile" id={pro.user_id} label="Report this profile" />
          </div>
        </aside>
      </section>
      {photo && <PhotoLightbox images={photo.images} title={photo.title} start={photo.start} onClose={() => setPhoto(null)} />}
    </PageShell>
  );
}

function ContactBox({ workerId, name }: { workerId: string; name: string }) {
  const { user, roles, ready } = useAuth();
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  if (!ready) return null;
  if (!user) {
    return (
      <div className="rounded-2xl bg-secondary p-5">
        <p className="font-medium">Want to contact {name}?</p>
        <Button asChild variant="bloom" className="mt-3 w-full"><Link to="/auth" search={{ mode: "signin" }}>Sign in to message</Link></Button>
      </div>
    );
  }
  if (!roles.includes("customer") || user.id === workerId) return null;
  return (
    <form
      className="rounded-2xl bg-secondary p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!isValidMessage(body)) return;
        setBusy(true);
        const { data, error } = await supabase.rpc("start_conversation_with_worker", { _worker_id: workerId, _body: body.trim() });
        setBusy(false);
        if (error) { toast.error(error.message); return; }
        void supabase.from("profile_events").insert({ worker_id: workerId, kind: "enquiry" });
        navigate({ to: "/messages/$id", params: { id: data } });
      }}
    >
      <p className="font-medium">Message {name}</p>
      <Textarea className="mt-3 bg-background" rows={4} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe what you need done…" />
      <Button type="submit" variant="bloom" className="mt-3 w-full" disabled={busy || !isValidMessage(body)}>Send message</Button>
    </form>
  );
}
