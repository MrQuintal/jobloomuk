import type { ReactNode } from "react";
import { PageIntro, PageShell } from "./PageShell";

export type Section = { title: string; body: ReactNode };

export function ContentPage({ eyebrow, title, intro, sections, children }: { eyebrow: string; title: string; intro?: ReactNode; sections?: Section[]; children?: ReactNode }) {
  return (
    <PageShell>
      <PageIntro eyebrow={eyebrow} title={title}>{intro}</PageIntro>
      {sections && (
        <section className="container-page grid gap-6 pb-20 md:grid-cols-2">
          {sections.map((s, i) => (
            <div key={s.title} className="rounded-3xl border border-border bg-card p-8">
              <span className="font-display text-sm text-bloom">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-2 text-2xl font-medium">{s.title}</h2>
              <div className="mt-3 text-muted-foreground">{s.body}</div>
            </div>
          ))}
        </section>
      )}
      {children && <section className="container-page pb-20">{children}</section>}
    </PageShell>
  );
}
