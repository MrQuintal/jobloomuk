import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { canDeleteJobPosts } from "@/lib/rules/roles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DeleteJobPostButton({ jobId, title }: { jobId: string; title: string }) {
  const { roles } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  if (!canDeleteJobPosts(roles)) return null;

  async function remove() {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("super_admin_delete_job", {
        _job_id: jobId, _reason: reason.trim() || undefined,
      });
      if (error) throw error;
      setOpen(false);
      setReason("");
      await Promise.all(["open-jobs", "moderation-jobs", "my-jobs", "audit", "convs", "moderation"].map(
        (key) => qc.invalidateQueries({ queryKey: [key] }),
      ));
      toast.success("Job post deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (error as { message?: string }).message ?? "Couldn't delete the post. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
      <Trash2 className="size-4" />Delete post
    </Button>
    <AlertDialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
      <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this job post?</AlertDialogTitle>
          <AlertDialogDescription>
            “{title}” will be permanently removed. This cannot be undone. Existing conversations and messages will remain.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <label className="grid gap-2 text-sm">
          Reason (optional)
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} disabled={busy} />
        </label>
        <AlertDialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" disabled={busy} onClick={() => void remove()}>
            <Trash2 className="size-4" />{busy ? "Deleting…" : "Delete post"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}