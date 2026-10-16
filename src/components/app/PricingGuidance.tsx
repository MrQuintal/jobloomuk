import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PRICING_TIPS_KEY, parsePricingTips, pricingTipsForCategory } from "@/lib/rules/pricing";

function usePricingTips() {
  return useQuery({
    queryKey: [PRICING_TIPS_KEY],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_settings").select("value").eq("key", PRICING_TIPS_KEY).maybeSingle();
      if (error) throw error;
      return parsePricingTips(data?.value);
    },
  });
}

export function PricingGuidance({ slug, name }: { slug?: string; name?: string }) {
  const q = usePricingTips();
  const tips = pricingTipsForCategory(q.data, slug);
  if (!tips.length) return null;
  return (
    <section className="md:col-span-2 border-l-2 border-primary pl-4" aria-label="Pricing guidance">
      <h3 className="font-medium">{name ? `${name}: pricing tips` : "Pricing tips"}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
        {tips.map((tip) => <li key={tip}>{tip}</li>)}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">These are general tips, not a quote or a historical price estimate. Agree the final price directly with your professional.</p>
    </section>
  );
}

export function PricingTipsEditor({ categories }: { categories: { slug: string; name: string }[] }) {
  const q = usePricingTips();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const entries = [{ slug: "general", name: "General pricing tips" }, ...categories];
  return (
    <section>
      <h2 className="text-xl font-medium">Pricing tips</h2>
      {q.isError ? <p className="mt-2 text-sm text-destructive">Pricing tips could not be loaded.</p> : q.isPending ? <p className="mt-2 text-sm text-muted-foreground">Loading…</p> : (
        <form className="mt-4 grid gap-4" onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          const value = { ...q.data };
          for (const [slug, text] of Object.entries(draft)) value[slug] = text.split("\n").map((line) => line.trim()).filter(Boolean);
          const { error } = await supabase.from("platform_settings").update({ value }).eq("key", PRICING_TIPS_KEY).select("key").single();
          setBusy(false);
          if (error) { toast.error("Pricing tips could not be saved"); return; }
          await qc.invalidateQueries({ queryKey: [PRICING_TIPS_KEY] });
          setDraft({});
          toast.success("Pricing tips saved");
        }}>
          {entries.map(({ slug, name }) => (
            <div key={slug}>
              <Label htmlFor={`pricing-${slug}`}>{name}</Label>
              <Textarea id={`pricing-${slug}`} rows={3} value={draft[slug] ?? q.data?.[slug]?.join("\n") ?? ""} onChange={(event) => setDraft((current) => ({ ...current, [slug]: event.target.value }))} />
            </div>
          ))}
          <Button type="submit" variant="forest" className="w-fit" disabled={busy || !Object.keys(draft).length}>Save pricing tips</Button>
        </form>
      )}
    </section>
  );
}