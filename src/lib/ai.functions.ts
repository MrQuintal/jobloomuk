import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const KINDS = {
  bio: "Rewrite this tradesperson's profile description so it is clear, friendly and professional. Keep facts unchanged, never invent qualifications, reviews or numbers. Under 120 words.",
  headline: "Write one short profile headline (under 12 words) for this professional based on the notes. Never invent facts.",
  reply: "Write a short, polite reply to a customer job post, introducing the professional and asking any useful questions. Never promise prices or dates not given. Under 100 words.",
  quote: "Turn these notes into a clear indicative quote message to a customer. Make clear it is an estimate agreed directly between them. Never invent figures. Under 150 words.",
} as const;

export const aiWrite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { kind: keyof typeof KINDS; text: string }) => {
    if (!(i.kind in KINDS) || typeof i.text !== "string" || i.text.trim().length < 3 || i.text.length > 4000) throw new Error("Invalid input");
    return i;
  })
  .handler(async ({ data, context }) => {
    const { data: tier } = await context.supabase.rpc("plan_tier", { _u: context.userId });
    if (tier === "free") return { error: "AI writing help is part of Pro and Business." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Lovable-API-Key": process.env["LOVABLE_API_KEY"]!, "X-Lovable-AIG-SDK": "fetch", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: `${KINDS[data.kind]} Use British English. Return only the text.`,
        input: [{ role: "user", content: data.text }],
      }),
    });
    if (res.status === 429) return { error: "Too many requests — try again in a minute." };
    if (res.status === 402) return { error: "AI writing is temporarily unavailable." };
    if (!res.ok || !res.body) return { error: "AI writing failed. Please try again." };
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        try {
          const ev = JSON.parse(l.slice(5).trim()) as { type?: string; delta?: string };
          if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
        } catch { /* ignore keep-alives */ }
      }
    }
    return { text: text.trim() };
  });
