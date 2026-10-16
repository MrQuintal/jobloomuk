import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { LegalMarkdown } from "@/components/site/LegalMarkdown";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => pageHead("/privacy", "Privacy notice", "How jobloom collects, uses, shares and protects personal information under UK data protection law."),
  component: () => (
    <ContentPage eyebrow="Legal" title="Privacy notice" intro="Effective date: 16 October 2026 · Last updated: 16 October 2026">
      <LegalMarkdown source={NOTICE} />
    </ContentPage>
  ),
});

const TBC = "To be confirmed";

const NOTICE = `
## 1. Introduction

jobloom helps customers find professionals and helps professionals advertise their services, showcase their work and discover opportunities.

This Privacy Notice explains how we collect, use, store, share and protect personal information when you visit our website, create an account, use our services, contact us or subscribe to a paid plan.

We aim to handle personal information responsibly, transparently and in accordance with applicable UK data protection law.

## 2. Who is responsible for your information?

The organisation responsible for deciding how and why your personal information is processed is:

**Data controller:** ${TBC}
**Trading name:** jobloom
**Address:** ${TBC}
**Privacy contact:** ${TBC}
**Website:** jobloom.co.uk

If we appoint a Data Protection Officer or are required to identify a representative, the relevant details will be provided here.

## 3. The information we collect

The information we collect depends on how you use jobloom.

### Account and contact information

This may include your name, email address, telephone number, profile photograph, postcode, account credentials and account preferences. If you sign in with Google, we receive your name and email address from Google.

### Professional and business information

If you advertise services, we may collect information such as:

- Your professional or business name.
- Profile description, skills, services and experience.
- Business contact details, telephone number and service categories.
- Portfolio photographs, videos, case studies and descriptions.
- Profile banners and videos.
- Qualifications or insurance details you choose to describe in your profile.
- Base area, travel radius, branches and availability.
- Team member names and roles you add to a Business profile.
- Reviews, ratings and other information associated with your professional profile.

Please avoid submitting sensitive personal information unless it is specifically requested for a lawful and necessary purpose.

### Customer job information

If you post a job or seek a service, we may collect the job description, category, location or approximate service area, budget, requested dates, photographs, contact preferences and related communications.

Please do not include private information about other people in a job advertisement unless you have a lawful reason and permission where required.

### Messages and interactions

We process messages, enquiries, expressions of interest, booking requests, job completion confirmations, reports, reviews, saved searches and other interactions carried out through the platform.

### Subscription and transaction information

If you purchase Pro or Business features, we collect your subscription plan, billing status, renewal date and related billing records.

Card payments are handled by our payment provider, Stripe. We do not store full payment-card details ourselves. jobloom does not handle payments for work arranged between customers and professionals.

### Technical and usage information

We may collect IP address, device and browser information, log data, error reports, pages visited, profile views and security events.

When you search by distance, the postcode or town you enter is sent to postcodes.io, a UK postcode lookup service, to find its approximate location.

### Verification and safety information

jobloom does not currently verify identity, insurance, qualifications or trade registrations, and does not collect identity documents or carry out background checks. We process reports, evidence of suspected misuse and moderation decisions to keep the platform safe.

## 4. How we use your information

We use personal information to:

- Create, maintain and secure accounts.
- Display professional profiles, portfolios and customer job advertisements according to user settings.
- Help customers discover professionals and help professionals find relevant opportunities.
- Facilitate enquiries, introductions and communication.
- Operate search, distance filtering, availability and matching tools, including job alerts.
- Provide reviews, ratings and moderation features.
- Manage Pro and Business subscriptions, billing and renewals.
- Provide customer support and respond to complaints.
- Detect fraud, spam, abuse and security threats.
- Improve the reliability, usability and performance of the platform.
- Send essential account, security, subscription and service notifications, and job alert emails you have set up.
- Send marketing communications where permitted by law and, where required, with your consent.
- Comply with legal obligations and establish, exercise or defend legal claims.

We will not use personal information for purposes that are incompatible with the purposes explained here without a lawful basis and any additional notice or consent required.

## 5. Our lawful bases for processing

Data protection law requires us to have a lawful basis for processing personal information. The appropriate basis depends on the purpose.

We rely on the following bases where applicable:

**Contract:** To create your account, provide requested platform features, manage subscriptions and carry out steps you request before entering into a contract.

**Legitimate interests:** To secure the platform, prevent misuse, respond to support requests, maintain business records, improve our services and facilitate relevant professional discovery, where these interests are not overridden by your rights.

**Legal obligation:** To comply with applicable legal, tax, accounting, regulatory and law-enforcement obligations.

**Consent:** Where required, for marketing communications or optional processing activities. You can withdraw consent where processing relies on it.

We will assess the appropriate lawful basis for each processing activity and update our records and privacy information as our services develop.

## 6. Information visible to other users

jobloom is designed to help people connect. Certain information must therefore be visible to other users for the platform to work.

Depending on your account type and settings, information displayed may include your professional name, business name, profile photograph, services, portfolio, experience, base area, travel radius, branches, telephone number, availability, reviews and job advertisement details.

A published professional profile is visible to visitors who do not have an account and may be indexed by search engines.

Before publishing information, consider whether you want it to be publicly accessible. Do not publish your home address, private telephone number or other sensitive details unless you intend to share them and have considered the risks.

We show only the location information needed for discovery, such as an approximate area. Customers' exact addresses and contact details are shared with a professional only when the customer chooses.

If you post a job, information you include in the advertisement may be visible to signed-in professionals.

## 7. Who we share information with

We may share personal information where necessary with:

- Other jobloom users, according to the information you choose to publish and the interactions you initiate.
- Hosting, database, storage, email and website infrastructure providers.
- Stripe, for subscription payments and billing.
- Google, if you choose to sign in with Google.
- postcodes.io, for postcode lookups when you search by distance.
- Our AI service provider, if you use the optional AI writing help, which receives the text you ask it to improve.
- Professional advisers, auditors, insurers and legal representatives where appropriate.
- Regulators, courts, law enforcement or other authorities where required or legally permitted.
- A successor organisation if the business is sold, reorganised or transferred, subject to appropriate safeguards and applicable law.

Service providers processing information on our behalf are subject to appropriate contractual and security obligations.

We do not sell your personal information. We will not disclose private messages or non-public account information to unrelated third parties for their own marketing.

## 8. International transfers

Some service providers may process or store personal information outside the United Kingdom.

Where personal information is transferred internationally, we use an appropriate transfer mechanism and safeguards where required.

Information about the relevant transfer arrangements can be requested using the contact details in this notice.

## 9. How long we keep information

We keep personal information only for as long as reasonably necessary for the purposes described in this notice, including to provide the service, maintain account security, resolve disputes and meet legal obligations.

For example:

- Account information is generally retained while your account remains active and for a reasonable period afterwards where needed for security, legal or dispute purposes.
- Professional profiles and portfolio content are retained while published and may remain in backups for a limited period after deletion.
- Subscription, billing and accounting records may be retained for the periods required by applicable law.
- Messages and support records may be retained for a defined period to manage disputes, investigate misuse and maintain security.
- Fraud reports and moderation records are retained only for as long as necessary for the relevant safety or legal purpose.

When information is no longer needed, we will delete it or anonymise it where appropriate.

## 10. Cookies and similar technologies

jobloom uses strictly necessary browser storage to:

- Keep you signed in and maintain secure sessions.
- Remember preferences, such as whether notification sounds are on.
- Protect accounts and detect suspicious activity.

We do not currently use advertising or marketing cookies. If we introduce optional analytics or marketing cookies, we will ask for your consent where required and update this notice.

## 11. Marketing and notifications

We send essential messages about accounts, security, enquiries, subscriptions, service changes and other necessary platform operations, plus any job alert emails you set up.

Where permitted, we may also send information about new features and platform updates. We will obtain consent where required and provide a straightforward way to opt out of marketing messages.

Opting out of marketing will not prevent us from sending essential service or account communications.

## 12. Your data protection rights

Subject to the circumstances and applicable law, you may have the right to:

- Request access to personal information we hold about you.
- Ask us to correct inaccurate or incomplete information.
- Ask us to delete information.
- Ask us to restrict certain processing.
- Object to certain processing, including processing based on legitimate interests.
- Receive certain information in a portable format.
- Withdraw consent where processing relies on consent.
- Challenge certain decisions made solely by automated processing where the relevant legal conditions apply.
- Complain to the Information Commissioner's Office (ICO).

These rights are not absolute in every situation. For example, we may need to retain certain information to comply with legal obligations or establish, exercise or defend legal claims.

You can download a copy of your data from **Account & privacy** when signed in. To exercise other rights, contact ${TBC}. We may need to verify your identity before responding.

You can also complain to the UK Information Commissioner's Office at **ico.org.uk** if you are concerned about how your information is handled.

## 13. Account deletion and profile removal

You can request account deletion from **Account & privacy** when signed in, or by contacting us. We aim to handle deletion requests within 30 days.

We will remove or anonymise personal information where appropriate, subject to legal retention requirements, legitimate security needs, unresolved disputes and other lawful reasons for retention.

Some information may remain in backups for a limited period before being overwritten or deleted. Information already copied or shared by other users, or indexed by third-party search engines, may not be removable immediately from those external systems.

Where possible, you should remove public profile content you no longer wish to display before closing your account.

## 14. Security

We use appropriate technical and organisational measures to protect personal information against unauthorised access, loss, misuse, alteration and disclosure.

These include access controls on every record, secure authentication, leaked-password protection, private file storage with time-limited links, encryption in transit, backups, audit logging and restricted staff access.

No online service can guarantee absolute security. You should use a strong password, protect your login credentials and notify us promptly if you suspect unauthorised access to your account.

## 15. Children's privacy

jobloom is intended for people who are legally able to use the relevant services. We do not knowingly collect children's personal information where doing so would be unlawful.

If you believe a child has provided personal information to us inappropriately, contact ${TBC} so we can review the matter.

## 16. Automated tools and recommendations

jobloom uses automated tools to organise search results, sort by distance, match new jobs to saved searches, and offer optional AI writing help for profile and quote text.

We do not make automated decisions that have legal or similarly significant effects on individuals. Automated recommendations are not a guarantee that a professional is suitable for a job or that a customer or professional will enter into an agreement.

## 17. Third-party websites and services

The platform may contain links to third-party websites, professional pages or external services. Those services operate under their own privacy notices and terms.

jobloom is not responsible for the privacy practices of third-party services that it does not control. You should review their privacy information before providing them with personal information.

## 18. Changes to this Privacy Notice

We may update this notice when our services, systems, providers or legal obligations change.

The latest version will be published on our website with its updated date. Where required, we will notify users or obtain consent before introducing new processing activities.

## 19. Contact us

For questions about this Privacy Notice, requests concerning personal information or privacy complaints, contact:

**jobloom Privacy Contact**
**Legal business name:** ${TBC}
**Email:** ${TBC}
**Address:** ${TBC}
**Website:** jobloom.co.uk

We will review and respond to requests in accordance with applicable data protection law.

**jobloom — connecting the right people together.**
`;
