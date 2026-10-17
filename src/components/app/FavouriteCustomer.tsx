import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { tierAtLeast, type PlanTier } from "@/lib/rules/plans";

export function FavouriteCustomerButton({ workerId, customerId, tier }: { workerId: string; customerId: string; tier: PlanTier }) {
  const qc = useQueryClient();
  const enabled = tierAtLeast(tier, "pro") && workerId !== customerId;
  const saved = useQuery({
    queryKey: ["favourite-customer", workerId, customerId],
    enabled,
    queryFn: async () => (await supabase.from("favourite_customers").select("id").eq("worker_id", workerId).eq("customer_id", customerId).maybeSingle()).data,
  });
  if (!enabled) return null;
  const on = !!saved.data;
  return (
    <Button
      type="button"
      size="sm"
      variant={on ? "secondary" : "outline"}
      disabled={saved.isLoading}
      onClick={async () => {
        const { error } = on
          ? await supabase.from("favourite_customers").delete().eq("worker_id", workerId).eq("customer_id", customerId)
          : await supabase.from("favourite_customers").insert({ worker_id: workerId, customer_id: customerId });
        if (error) { toast.error(error.message); return; }
        toast.success(on ? "Removed from favourite customers" : "Saved as a favourite customer");
        void qc.invalidateQueries({ queryKey: ["favourite-customer", workerId, customerId] });
        void qc.invalidateQueries({ queryKey: ["favourite-customers", workerId] });
      }}
    >
      {on ? "Saved customer" : "Save customer"}
    </Button>
  );
}
