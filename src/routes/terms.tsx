import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ContentPage } from "@/components/site/ContentPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => pageHead("/terms", "Terms of use", "The terms for using jobloom, the UK platform connecting customers with independent professionals and businesses."),
  component: TermsPage,
});

const OPERATOR = "Dino Quintal";
const ADDRESS = "33 Albrook Close, Windlesham, Surrey, GU19 5BW";
const EMAIL = "MrQuintal@hotmail.co.uk";

function S({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{n}. {title}</h2>
      {children}
    </section>
  );
}
function L({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-1 pl-6">{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}
function B({ children }: { children: ReactNode }) {
  return <p className="font-semibold text-foreground">{children}</p>;
}

function TermsPage() {
  return (
    <ContentPage eyebrow="Legal" title="Terms of use" intro="Please read these terms carefully before using jobloom.">
      <div className="max-w-3xl space-y-10 leading-relaxed text-muted-foreground">
        <S n={1} title="About jobloom">
          <p>Welcome to jobloom.</p>
          <p>jobloom is an online platform designed to connect customers who need services with professionals and businesses that provide them. The platform allows professionals to showcase their work, advertise their services, build their profiles and reputation, and discover opportunities posted by customers.</p>
          <p>Customers can search for professionals, review their profiles and portfolios, post jobs and contact suitable professionals.</p>
          <p>Our purpose is simple: <strong className="text-foreground">to help the right people find each other and make it easier for them to connect.</strong></p>
          <p>These Terms of Use govern your access to and use of the jobloom website, applications and related services.</p>
          <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 rounded-lg border border-border p-4">
            <dt className="font-semibold text-foreground">Platform operator</dt><dd>{OPERATOR}</dd>
            <dt className="font-semibold text-foreground">Trading name</dt><dd>jobloom</dd>
            <dt className="font-semibold text-foreground">Business address</dt><dd>{ADDRESS}</dd>
            <dt className="font-semibold text-foreground">Contact email</dt><dd>{EMAIL}</dd>
            <dt className="font-semibold text-foreground">Website</dt><dd>jobloom.co.uk</dd>
          </dl>
          <p>By creating an account or using jobloom, you agree to these terms. If you do not agree, you must not use the platform.</p>
        </S>

        <S n={2} title="What jobloom does — and does not do">
          <p>jobloom provides online tools for discovery, advertising, introductions and communication between customers and professionals.</p>
          <p>We may provide features including:</p>
          <L items={["Professional profiles and portfolios.", "Service listings and professional information.", "Customer job advertisements.", "Job discovery, search and matching tools.", "Messaging and contact facilities.", "Availability and service-area information.", "Reviews, ratings and reputation features.", "Free, Pro and Business subscriptions.", "Tools to help professionals manage their presence and discover opportunities."]} />
          <B>jobloom is a platform for connecting people. It is not the provider of the services advertised by its users.</B>
          <p>Unless we expressly state otherwise for a particular feature, jobloom does not employ, engage, supervise or act as the agent of professionals using the platform. A professional's presence on jobloom does not mean that jobloom endorses, employs or guarantees that person.</p>
        </S>

        <S n={3} title="Independent agreements between users">
          <p>When a customer contacts a professional, the parties are responsible for deciding whether to proceed.</p>
          <p>Customers and professionals must independently agree on matters including:</p>
          <L items={["The work or services to be provided.", "The price, quotation, payment method and payment schedule.", "The scope, specifications and expected results.", "Start dates, deadlines and completion arrangements.", "Materials, equipment, access and other requirements.", "Cancellations, refunds, warranties and any aftercare.", "Insurance, qualifications, permissions and other applicable requirements."]} />
          <p>Any agreement for the actual work is between the customer and the professional, not jobloom.</p>
          <p>Users are responsible for ensuring that their agreements are suitable for their circumstances and comply with applicable law.</p>
        </S>

        <S n={4} title="Responsibility for work and transactions">
          <B>jobloom does not carry out, control, supervise or guarantee work arranged between customers and professionals.</B>
          <p>To the extent permitted by law, jobloom is not responsible for the performance, quality, safety, legality, suitability, timeliness or outcome of work arranged directly between users.</p>
          <p>This includes disputes concerning:</p>
          <L items={["Incomplete, delayed, defective or unsatisfactory work.", "Damage to property, loss or injury arising from work.", "Missed appointments or cancellations.", "Disagreements about quotations, pricing or additional charges.", "Non-payment, late payment, refunds or deposits.", "Breaches of agreements between customers and professionals.", "A professional's conduct, competence, qualifications or insurance.", "A customer's conduct, access arrangements or failure to provide information.", "Materials, equipment or products supplied or used during a job."]} />
          <p>Customers and professionals are responsible for checking the suitability of the other party before entering into an agreement. This may include checking identity, references, reviews, qualifications, insurance, licences, right to work where relevant, and any other requirements appropriate to the job.</p>
          <p>Users should take sensible precautions before sharing sensitive information, providing property access, paying deposits or allowing work to begin.</p>
          <p>jobloom may provide reporting, moderation or complaint facilities, but we are not obliged to resolve disputes between users, recover payments, inspect work or enforce their private agreements. We may choose to review reports or take action against accounts where appropriate.</p>
          <p>Nothing in these terms removes any legal responsibility that jobloom cannot lawfully exclude or limit.</p>
        </S>

        <S n={5} title="No guarantee of work, customers or results">
          <p>jobloom provides tools intended to improve discovery and make connections easier. We do not guarantee:</p>
          <L items={["That a professional will receive enquiries, leads, bookings or jobs.", "That a customer will find a suitable professional.", "That a job advertisement will receive responses.", "That a subscription will generate income or business growth.", "That search results, recommendations or matching tools will produce a particular result.", "That a user's profile, credentials, reviews or claims are accurate unless expressly verified and identified as such."]} />
          <p>Results depend on factors including user activity, location, demand, pricing, experience, competition and the information supplied by users.</p>
          <p>Subscriptions purchase access to specified platform features, not guaranteed employment, contracts, revenue or completed jobs.</p>
        </S>

        <S n={6} title="User accounts and eligibility">
          <p>You must provide accurate information when creating and maintaining an account. You must keep your login credentials secure and notify us if you suspect unauthorised access.</p>
          <p>You must not impersonate another person, create fraudulent accounts or misrepresent your identity, experience, qualifications, services or business.</p>
          <p>You must be legally capable of entering into the agreements relevant to your use of the platform. Where a user is under 18, use of the platform is permitted only where legally appropriate and subject to any applicable restrictions we impose.</p>
          <p>You are responsible for activity carried out through your account, except where applicable law provides otherwise.</p>
        </S>

        <S n={7} title="Professional profiles and portfolios">
          <p>Professionals are responsible for the content they publish, including photographs, videos, descriptions, qualifications, prices, service areas and claims about previous work.</p>
          <p>You must have the necessary rights and permissions to upload and display all content you submit.</p>
          <p>You must not:</p>
          <L items={["Publish misleading, fraudulent or materially inaccurate information.", "Present another person's work as your own.", "Upload images or personal information without appropriate permission.", "Claim qualifications, licences, insurance or verification you do not hold.", "Use another person's trademarks or copyrighted material without permission.", "Publish unlawful, abusive, discriminatory or threatening content."]} />
          <p>You grant jobloom a non-exclusive, worldwide, royalty-free licence to host, store, reproduce, format, display and distribute your submitted content as reasonably necessary to operate, promote and provide the platform and its features. This licence lasts for as long as necessary for those purposes and for legitimate backups or legal requirements after removal. It does not transfer ownership of your content to jobloom.</p>
          <p>You remain responsible for your content and may edit or remove it through the available account tools, subject to legitimate retention requirements.</p>
        </S>

        <S n={8} title="Customer job advertisements">
          <p>Customers are responsible for ensuring that job advertisements are accurate, lawful and sufficiently clear for professionals to understand the requested work.</p>
          <p>Customers must not publish fraudulent opportunities, discriminatory requirements prohibited by law, misleading budgets, unlawful requests or advertisements intended to collect information for unrelated purposes.</p>
          <p>Posting a job does not mean that a professional has accepted it or that a contract has been formed.</p>
          <p>Professionals are responsible for deciding whether to respond to an advertisement and whether the proposed work is suitable for them.</p>
        </S>

        <S n={9} title="Reviews, ratings and reputation">
          <p>Reviews and ratings should reflect genuine experiences and must be submitted honestly.</p>
          <p>Users must not buy, sell, fabricate, manipulate or threaten reviews, or submit reviews intended to unfairly damage another person's reputation.</p>
          <p>Where jobloom offers verified reviews or verification indicators, we will explain what the relevant verification means. A verification indicator must not be interpreted as a guarantee of quality, safety, qualifications or future performance.</p>
          <p>We may investigate suspected fraudulent reviews, request supporting information, remove content that breaches these terms or restrict accounts where appropriate. Decisions will be made in accordance with our policies and applicable law.</p>
          <p>Paid subscriptions or advertising must not be represented as proof of professional quality.</p>
        </S>

        <S n={10} title="Subscriptions and paid features">
          <p>jobloom may offer Free, Pro and Business accounts. The features, limits and prices applicable to each plan will be displayed before purchase.</p>
          <p>Paid subscriptions provide access to the features described for the selected plan, which may include enhanced profiles, portfolio tools, advanced search, job alerts, analytics, business management features or other tools.</p>
          <p>Subscriptions are for access to platform features and improved ease of use. They do not guarantee work, enquiries, customers, revenue, search rankings or business success.</p>
          <h3 className="pt-2 font-semibold text-foreground">Billing and renewal</h3>
          <p>Subscription prices, billing intervals, applicable taxes and renewal terms will be shown at checkout.</p>
          <p>Unless the checkout states otherwise, paid subscriptions renew automatically at the end of each billing period until cancelled. You authorise the applicable payment provider to collect the subscription charges you agree to.</p>
          <p>You can cancel through the account settings or the stated support contact. Cancellation will normally prevent the next renewal, with access continuing until the end of the paid period unless the applicable terms or law require otherwise.</p>
          <p>Refunds, trial periods, price changes and cancellation rights will be handled in accordance with the information provided at purchase and applicable law.</p>
          <p>If you are a consumer purchasing online, statutory cancellation rights may apply, including a 14-day cancellation period for certain contracts. The availability and consequences of cancellation depend on the type of service and how it is supplied. We will provide any required information and obtain any required consent before supplying a service where this affects those rights.</p>
          <p>If a payment fails, we may notify you, retry payment, restrict paid features or downgrade your account after giving any notice required by law or the applicable plan terms.</p>
          <p>We may change subscription features or prices prospectively with appropriate notice. Where a change materially affects an existing subscription, you will be informed of any applicable cancellation or other rights.</p>
        </S>

        <S n={11} title="Sponsored placement and visibility">
          <p>Some plans or optional purchases may provide additional promotional tools or sponsored placement.</p>
          <p>Where content is paid for or sponsored, we will identify it appropriately. Payment does not make a professional verified, more qualified or more trustworthy.</p>
          <p>Search results and recommendations may take account of relevance, location, category, profile completeness, availability, user preferences, safety signals and other legitimate factors. We do not promise any particular position or level of visibility.</p>
        </S>

        <S n={12} title="Payments for work">
          <p>jobloom does not collect, hold, distribute or deduct commissions from payments for work arranged directly between customers and professionals, unless we expressly introduce a separate payment service and provide additional terms for it.</p>
          <p>Users must arrange payments for work directly with each other and are responsible for any applicable invoices, taxes, records, refunds and payment disputes.</p>
          <p>Subscription payments to jobloom are separate from payments for work arranged between users.</p>
        </S>

        <S n={13} title="Prohibited conduct">
          <p>You must not use jobloom to:</p>
          <L items={["Commit fraud, scams, theft or other unlawful activity.", "Harass, threaten, stalk or discriminate against users.", "Publish malware, spam or harmful material.", "Scrape, copy or misuse platform data without authorisation.", "Circumvent security, access controls or subscription restrictions.", "Interfere with the operation or integrity of the website.", "Misuse contact information obtained through the platform.", "Circumvent a user's privacy preferences or send unsolicited communications in breach of applicable law.", "Use the platform for unlawful employment, services or commercial activity."]} />
          <p>You must comply with applicable laws and respect the rights and privacy of other users.</p>
        </S>

        <S n={14} title="Moderation, suspension and termination">
          <p>We may review content, investigate reports, remove material or suspend or terminate accounts where reasonably necessary to enforce these terms, protect users, prevent fraud, maintain platform security or comply with law.</p>
          <p>Where appropriate, we may provide notice and an opportunity to respond or appeal. We may act without advance notice where necessary to address serious risks, suspected unlawful conduct or urgent security concerns.</p>
          <p>We may discontinue or change features, but will take reasonable steps to communicate material changes affecting paid users and comply with applicable contractual obligations.</p>
          <p>If your account is suspended or terminated, your right to use the affected features may end. Any treatment of subscription fees, refunds or retained data will be governed by the applicable purchase terms, this agreement and the law.</p>
        </S>

        <S n={15} title="Platform availability and information">
          <p>We aim to provide a useful and reliable service but do not guarantee that the website will always be available, uninterrupted, error-free or compatible with every device.</p>
          <p>Profiles, listings, reviews, availability information, price estimates and other user-submitted material may be incomplete, outdated or inaccurate.</p>
          <p>Any indicative prices, estimates, recommendations or automated suggestions are informational only and should not be treated as a binding quotation, professional advice or a guarantee of cost or outcome.</p>
        </S>

        <S n={16} title="Intellectual property">
          <p>The jobloom name, logo, website design, software and original platform content are owned by or licensed to the platform operator, except for content belonging to users or other third parties.</p>
          <p>You may use jobloom only for its intended purposes and must not copy, modify, distribute, reverse engineer or commercially exploit protected platform materials except where permitted by law or with written permission.</p>
          <p>Nothing in these terms transfers ownership of your own content to jobloom.</p>
        </S>

        <S n={17} title="Data protection and privacy">
          <p>Our handling of personal information is described in the jobloom Privacy Notice, which forms part of the information provided to users about the platform.</p>
          <p>By using jobloom, you acknowledge that personal information will be processed as explained in that notice and in accordance with applicable data protection law.</p>
          <p>Users must respect the privacy of others and must not misuse, copy, disclose or retain personal information obtained through the platform for unrelated or unlawful purposes.</p>
        </S>

        <S n={18} title="Limitation of liability">
          <p>Nothing in these terms excludes or limits liability where exclusion or limitation is prohibited by law, including liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other liability that cannot lawfully be excluded.</p>
          <p>Subject to that protection, jobloom is responsible for providing its own platform services in accordance with applicable law and these terms.</p>
          <p>To the extent permitted by law, jobloom is not responsible for losses arising from agreements, work, payments or dealings between users, or from a user's reliance on information supplied by another user.</p>
          <p>To the extent permitted by law, we are not liable for indirect or consequential losses that were not reasonably foreseeable when the contract was formed.</p>
          <p>Where you use jobloom as a consumer, nothing in these terms removes your statutory rights or any rights you have under applicable consumer protection law.</p>
        </S>

        <S n={19} title="Indemnity for misuse">
          <p>To the extent permitted by law, you may be responsible for reasonable losses, liabilities and costs suffered by jobloom that result directly from your unlawful use of the platform, your fraud, or your material breach of these terms.</p>
          <p>This provision does not make you responsible for losses caused by jobloom's own negligence, breach of contract or other conduct for which the law does not permit responsibility to be transferred to you.</p>
        </S>

        <S n={20} title="Changes to these terms">
          <p>We may update these terms to reflect changes in the platform, our services, legal requirements or security practices.</p>
          <p>We will publish the updated version with a revised effective date and provide additional notice where required. Where a change requires your consent, we will seek it. If you do not agree to a material change, you may stop using the affected services and exercise any applicable cancellation rights.</p>
        </S>

        <S n={21} title="Complaints and contact">
          <p>If you have a concern about jobloom itself, your account, a subscription or platform content, contact us at:</p>
          <p><strong className="text-foreground">Email:</strong> {EMAIL}<br /><strong className="text-foreground">Postal address:</strong> {ADDRESS}</p>
          <p>Complaints about work arranged directly between users should normally be raised with the other party. You may also report suspected fraud, unsafe conduct or breaches of platform rules to jobloom. We may review such reports but do not guarantee a particular outcome.</p>
        </S>

        <S n={22} title="Governing law">
          <p>These terms are governed by the laws of England and Wales, except where mandatory legal protections require otherwise.</p>
          <p>If you are a consumer, you may have the right to bring proceedings in the courts of the part of the United Kingdom where you live, where applicable law provides for that right.</p>
        </S>

        <S n={23} title="Entire agreement">
          <p>These terms, together with any additional terms clearly presented for specific features or subscriptions and the jobloom Privacy Notice, set out the basis on which you may use the platform.</p>
          <p>If any provision is found to be unenforceable, the remaining provisions will continue to apply to the extent permitted by law.</p>
        </S>

        <p className="pt-4 text-lg font-semibold text-foreground">jobloom — connecting the right people together.</p>
      </div>
    </ContentPage>
  );
}
