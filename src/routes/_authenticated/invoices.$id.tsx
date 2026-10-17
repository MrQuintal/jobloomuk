import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { sendInvoiceEmail } from "@/lib/invoices.functions";
import { invoiceNumberLabel } from "@/lib/rules/invoice";
import { formatPence } from "@/lib/rules/plans";

export const Route = createFileRoute("/_authenticated/invoices/$id")({
  staticData: { sitemap: false },
  head: () => {
    const head = pageHead("/invoices/$id", "Invoice", "A Jobloom invoice from a professional. Pay them directly.");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: InvoicePage,
});

function InvoicePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const q = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => (await supabase.from("invoices").select("*").eq("id", id).eq("worker_id", user!.id).maybeSingle()).data,
  });
  if (q.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const invoice = q.data;
  if (!invoice) return <p>Invoice not found.</p>;
  const issued = new Date(invoice.issued_on).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <article className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap gap-2 print:hidden">
        <Button type="button" variant="outline" asChild><Link to="/tools">Back to Pro tools</Link></Button>
        <Button type="button" variant="forest" onClick={() => window.print()}>Save as PDF</Button>
        {invoice.customer_email && (
          <Button type="button" variant="outline" disabled={sending} onClick={async () => {
            setSending(true);
            const result = await sendInvoiceEmail({ data: { invoiceId: invoice.id } }).catch(() => ({ error: "The invoice email could not be sent" }));
            setSending(false);
            if ("error" in result && result.error) { toast.error(result.error); return; }
            toast.success(`Sent to ${invoice.customer_email}`);
          }}>{sending ? "Sending…" : `Email ${invoice.customer_email}`}</Button>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card p-8 print:border-0 print:p-0">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Invoice</p>
        <h1 className="mt-1 text-3xl font-medium">{invoiceNumberLabel(invoice.number)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{issued}</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">From</p>
            <p className="mt-1 font-medium">{invoice.business_name}</p>
            {invoice.business_area && <p className="text-sm">{invoice.business_area}</p>}
            {invoice.business_phone && <p className="text-sm">{invoice.business_phone}</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">To</p>
            <p className="mt-1 font-medium">{invoice.customer_name}</p>
            {invoice.customer_email && <p className="text-sm">{invoice.customer_email}</p>}
          </div>
        </div>
        <p className="mt-8 whitespace-pre-line">{invoice.description}</p>
        <p className="mt-8 font-display text-4xl">{formatPence(invoice.amount_pence)}</p>
        <p className="mt-6 text-sm text-muted-foreground">Pay {invoice.business_name} directly. Jobloom does not collect this payment, hold the money, or add a fee.</p>
      </div>
    </article>
  );
}
