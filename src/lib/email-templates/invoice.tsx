import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  businessName?: string;
  invoiceNumber?: string;
  customerName?: string;
  description?: string;
  amount?: string;
  issuedOn?: string;
  area?: string;
  phone?: string;
}

function InvoiceEmail({ businessName = "A Jobloom professional", invoiceNumber = "INV-001", customerName = "Customer", description = "", amount = "", issuedOn = "", area, phone }: Props) {
  return (
    <Html lang="en-GB">
      <Head />
      <Preview>{businessName} sent you invoice {invoiceNumber}.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>Jobloom</Text>
          <Heading style={styles.heading}>Invoice {invoiceNumber}</Heading>
          <Text>Hello {customerName},</Text>
          <Text>{businessName} has sent you an invoice{issuedOn ? ` dated ${issuedOn}` : ""}.</Text>
          <Text>{description}</Text>
          <Heading as="h2" style={styles.title}>{amount}</Heading>
          {(area || phone) && <Text>{[area, phone].filter(Boolean).join(" · ")}</Text>}
          <Text style={styles.note}>Pay {businessName} directly. Jobloom does not collect this payment, hold the money, or add a fee.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: InvoiceEmail,
  subject: (data) => `Invoice ${data["invoiceNumber"] ?? ""} from ${data["businessName"] ?? "a Jobloom professional"}`.trim(),
  displayName: "Customer invoice",
  previewData: { businessName: "Lets Fix it", invoiceNumber: "INV-007", customerName: "Alex", description: "Garden clearance, 4 hours", amount: "£150", issuedOn: "17 October 2026", area: "Bagshot", phone: "07700 900123" },
} satisfies TemplateEntry;

const styles = {
  body: { backgroundColor: "#f8f5ef", fontFamily: "Georgia, serif", color: "#1c1917" },
  container: { margin: "0 auto", padding: "32px 24px", maxWidth: "560px" },
  brand: { letterSpacing: "0.08em", textTransform: "uppercase" as const, fontSize: "12px" },
  heading: { fontSize: "28px", fontWeight: "500" },
  title: { fontSize: "22px", fontWeight: "500" },
  note: { fontSize: "13px", color: "#57534e" },
};
