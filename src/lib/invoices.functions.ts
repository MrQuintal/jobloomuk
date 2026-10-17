import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { formatPence } from "@/lib/rules/plans";
import { invoiceNumberLabel } from "@/lib/rules/invoice";

export const sendInvoiceEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { invoiceId: string }) => {
    if (!d || typeof d.invoiceId !== "string" || !/^[0-9a-f-]{36}$/i.test(d.invoiceId)) throw new Error("Invalid invoice");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: invoice } = await context.supabase
      .from("invoices")
      .select("id, number, customer_name, customer_email, description, amount_pence, issued_on, business_name, business_area, business_phone")
      .eq("id", data.invoiceId)
      .eq("worker_id", context.userId)
      .maybeSingle();
    if (!invoice) return { error: "Invoice not found" };
    if (!invoice.customer_email) return { error: "Add the customer's email on the invoice before sending it" };
    const { data: userData } = await context.supabase.auth.getUser();
    const replyTo = userData.user?.email;
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    try {
      const result = await sendTemplateEmail("invoice", invoice.customer_email, {
        idempotencyKey: `invoice-${invoice.id}-${new Date().toISOString().slice(0, 16)}`,
        ...(replyTo ? { replyTo } : {}),
        templateData: {
          businessName: invoice.business_name,
          invoiceNumber: invoiceNumberLabel(invoice.number),
          customerName: invoice.customer_name,
          description: invoice.description,
          amount: formatPence(invoice.amount_pence),
          issuedOn: new Date(invoice.issued_on).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
          area: invoice.business_area,
          phone: invoice.business_phone,
        },
      });
      if (!result.sent) return { error: "That email address can't receive messages right now" };
      return { sent: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "The invoice email could not be sent" };
    }
  });
