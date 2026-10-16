import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, Images, Scale, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/site/PageShell";
import { pageHead } from "@/lib/seo";
import hero from "@/assets/hero-craft.jpg";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "/",
      "Find trusted local professionals across the UK",
      "Post the job you need doing or browse real portfolios from independent UK professionals. Agree the work and price directly — no commission, ever.",
    ),
  component: Home,
});

const PILLARS = [
  { icon: ClipboardList, title: "Post the job", body: "Describe what you need, where and when. Suitable professionals show interest." },
  { icon: Images, title: "See real work", body: "Every professional has a portfolio of projects they've actually done, with photos and detail." },
  { icon: Scale, title: "Agree it directly", body: "Talk, compare and agree price and payment between yourselves. We never take a cut." },
  { icon: Sprout, title: "Fair for newcomers", body: "Good new professionals get a genuine chance to be seen — reputation is earned, not bought." },
];

function Home() {
  return (
    <PageShell>
      <section className="container-page grid items-center gap-12 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div>
          <p className="eyebrow">For homes and businesses across the UK</p>
          <h1 className="mt-5 text-5xl font-medium leading-[1.02] md:text-7xl">
            Good work, <em className="text-bloom">found</em> fairly.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Jobloom brings people who need work done together with independent professionals who can prove they do it well.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild variant="bloom" size="lg">
              <Link to="/auth" search={{ mode: "signup", role: "customer" }}>I need work done <ArrowRight /></Link>
            </Button>
            <Button asChild variant="pill" size="lg">
              <Link to="/auth" search={{ mode: "signup", role: "worker" }}>I'm a professional</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Free to post a job. No commission on any work.</p>
        </div>
        <div className="relative">
          <img src={hero} alt="A joiner planing a length of oak at a workbench" width={1280} height={1440} className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-soft" />
          <div className="absolute -bottom-6 -left-4 max-w-[15rem] rounded-2xl bg-card p-4 shadow-soft md:-left-10">
            <p className="font-display text-lg leading-snug">"Show the work. Let it speak."</p>
            <p className="mt-1 text-xs text-muted-foreground">The Jobloom principle</p>
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <h2 className="max-w-2xl text-3xl font-medium md:text-5xl">A services platform built on evidence, not ad spend.</h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="bg-card p-7">
              <p.icon className="size-6 text-bloom" />
              <h3 className="mt-5 text-xl font-medium">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-forest text-forest-foreground">
        <div className="container-page grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="eyebrow">For professionals</p>
            <h2 className="mt-4 text-3xl font-medium md:text-5xl">Your work deserves a proper showcase.</h2>
          </div>
          <div className="flex flex-col justify-end gap-6">
            <p className="text-lg text-forest-foreground/80">
              Build a portfolio you're proud of, show what you do most, set where you'll travel, and find customer jobs that suit you. Simple subscriptions — never a commission on your jobs.
            </p>
            <div>
              <Button asChild variant="bloom" size="lg"><Link to="/for-professionals">See how it works for you <ArrowRight /></Link></Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
