import type { ReactNode } from "react";

/** Renders a small subset of markdown (##, ###, -, **bold**, paragraphs) for legal pages. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong> : part,
  );
}

export function LegalMarkdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n\s*\n/);
  return (
    <div className="max-w-3xl space-y-4 leading-relaxed text-muted-foreground">
      {blocks.map((b, i) => {
        const t = b.trim();
        if (t.startsWith("### ")) return <h3 key={i} className="pt-2 font-semibold text-foreground">{t.slice(4)}</h3>;
        if (t.startsWith("## ")) return <h2 key={i} className="pt-6 text-xl font-semibold text-foreground">{t.slice(3)}</h2>;
        const lines = t.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return <ul key={i} className="list-disc space-y-1 pl-6">{lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
        }
        return <p key={i}>{lines.map((l, j) => <span key={j}>{j > 0 && <br />}{inline(l.trim())}</span>)}</p>;
      })}
    </div>
  );
}
