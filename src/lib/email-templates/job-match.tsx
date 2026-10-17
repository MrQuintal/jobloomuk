import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  name?: string;
  jobTitle?: string;
  area?: string;
  searchName?: string;
  jobId?: string;
}

function JobMatch({ name, jobTitle = "A new customer job", area, searchName, jobId }: Props) {
  return (
    <Html lang="en-GB">
      <Head />
      <Preview>A new job matches your saved Jobloom search.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>Jobloom</Text>
          <Heading style={styles.heading}>A new job matches your search</Heading>
          <Text>{name ? `Hi ${name},` : "Hi there,"}</Text>
          <Text>{searchName ? `A customer has posted a job matching your saved search “${searchName}”.` : "A customer has posted a job matching your saved search."}</Text>
          <Heading as="h2" style={styles.title}>{jobTitle}</Heading>
          {area && <Text>Area: {area}</Text>}
          <Button href={jobId ? `https://jobloom.co.uk/jobs?job=${jobId}` : "https://jobloom.co.uk/jobs"} style={styles.button}>View this job</Button>
          <Text style={styles.note}>The customer chooses who to contact. A match is not a guarantee of work. Agree scope, price and payment directly with the customer.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: JobMatch,
  subject: "A new job matches your Jobloom search",
  displayName: "Saved-search job match",
  previewData: { name: "Alex", jobTitle: "Replace a kitchen tap", area: "Leeds", searchName: "Local plumbing jobs" },
} satisfies TemplateEntry;

const styles = {
  body: { backgroundColor: "#ffffff", color: "#233e32", fontFamily: "Arial, sans-serif" },
  container: { maxWidth: "560px", padding: "32px 24px" },
  brand: { color: "#244f3d", fontSize: "24px", fontWeight: "700" },
  heading: { fontFamily: "Georgia, serif", fontSize: "28px", lineHeight: "36px" },
  title: { fontSize: "20px", lineHeight: "28px" },
  button: { backgroundColor: "#244f3d", color: "#ffffff", borderRadius: "6px", padding: "12px 20px" },
  note: { color: "#58665e", fontSize: "12px", lineHeight: "20px", marginTop: "24px" },
};