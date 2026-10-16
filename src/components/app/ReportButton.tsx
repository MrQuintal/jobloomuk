import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Target = "profile" | "job" | "review" | "message" | "user";

export function ReportButton({ type, id, label = "Report" }: { type: Target; id: string; label?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!user) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <Flag className="size-3" /> {label}
      </button>
    );
  }
  return (
    <form
      className="mt-2 space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const { error } = await supabase.from("reports").insert({ reporter_id: user.id, target_type: type, target_id: id, reason: reason.trim() });
        if (error) { toast.error("Please give a reason of at least 5 characters."); return; }
        toast.success("Thanks — our team will review this.");
        setOpen(false); setReason("");
      }}
    >
      <Textarea rows={2} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What's wrong?" />
      <div className="flex gap-2">
        <Button size="sm" type="submit" variant="outline" disabled={reason.trim().length < 5}>Send report</Button>
        <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
