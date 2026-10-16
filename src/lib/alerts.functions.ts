import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Emails Pro+ workers whose saved search matches a newly posted job.
// Mirrors trg_job_alerts() matching (in-app alerts stay in the DB trigger).
export const sendJobAlertEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { jobId: string }) => {
    if (!d || typeof d.jobId !== "string" || !/^[0-9a-f-]{36}$/i.test(d.jobId)) throw new Error("Invalid job");
    return d;
  })
  .handler(async ({ data, context }) => {
    // Caller must own the job (checked under RLS as the user).
    const { data: job } = await context.supabase
      .from("jobs").select("id, customer_id, title, description, area, category_id, status")
      .eq("id", data.jobId).eq("customer_id", context.userId).maybeSingle();
    if (!job || job.status !== "open") return { sent: 0 };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const { data: searches } = await supabaseAdmin
      .from("saved_searches").select("worker_id, name, keyword, area, category_id")
      .neq("worker_id", job.customer_id);

    const hay = `${job.title} ${job.description}`.toLowerCase();
    const matched = new Map<string, string>();
    for (const s of searches ?? []) {
      if (matched.has(s.worker_id)) continue;
      if (s.category_id && s.category_id !== job.category_id) continue;
      if (s.keyword && !hay.includes(s.keyword.toLowerCase())) continue;
      if (s.area && !(job.area ?? "").toLowerCase().includes(s.area.toLowerCase())) continue;
      matched.set(s.worker_id, s.name);
    }

    let sent = 0;
    for (const [workerId, searchName] of matched) {
      const { data: ok } = await supabaseAdmin.rpc("tier_at_least", { _u: workerId, _t: "pro" });
      if (!ok) continue;
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(workerId);
      const email = u?.user?.email;
      if (!email) continue;
      const { data: p } = await supabaseAdmin.from("profiles").select("display_name").eq("id", workerId).maybeSingle();
      try {
        const r = await sendTemplateEmail("job-match", email, {
          idempotencyKey: `job-match-${job.id}-${workerId}`,
          templateData: { name: (p as { display_name?: string } | null)?.display_name?.split(" ")[0], jobTitle: job.title, area: job.area, searchName },
        });
        if (r.sent) sent++;
      } catch (e) {
        console.error("job alert email failed", workerId, e);
      }
    }
    return { sent };
  });
