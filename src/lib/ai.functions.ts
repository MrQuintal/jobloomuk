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
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `${KINDS[data.kind]} Use British English. Return only the text.` },
          { role: "user", content: data.text },
        ],
      }),
    });
    if (res.status === 429) return { error: "Too many requests — try again in a minute." };
    if (res.status === 402) return { error: "AI writing is temporarily unavailable." };
    if (!res.ok) return { error: "AI writing failed. Please try again." };
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { text: j.choices?.[0]?.message?.content?.trim() ?? "" };
  });
