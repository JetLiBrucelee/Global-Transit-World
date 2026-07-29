import { Helmet } from "react-helmet-async";
import { useRoute, Link } from "wouter";
import { SITE_URL } from "@/lib/seo";
import { motion } from "framer-motion";
import { useGetCmsSection } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const LEGAL_META: Record<string, { title: string; badge: string }> = {
  "privacy-policy": { title: "Privacy Policy", badge: "Legal" },
  "terms-conditions": { title: "Terms & Conditions", badge: "Legal" },
  "shipping-policy": { title: "Shipping Policy", badge: "Legal" },
  "restricted-items": { title: "Restricted & Prohibited Items", badge: "Legal" },
  "claims": { title: "Claims Policy", badge: "Legal" },
  "cookie-policy": { title: "Cookie Policy", badge: "Legal" },
};

const STATIC_CONTENT: Record<string, string> = {
  "privacy-policy": `
**Effective Date:** January 1, 2024

Sinovera Transit Global ("STG", "we", "our") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal data.

**Information We Collect**
- Contact information (name, email, phone, company)
- Shipment data (addresses, cargo descriptions, tracking events)
- Account credentials for our customer portal
- Usage data and cookies from our website

**How We Use Your Information**
- To process and manage your shipments
- To communicate tracking updates and service notifications
- To comply with customs and regulatory requirements
- To improve our services and website

**Data Sharing**
We share data only with carriers, customs authorities, and agents necessary to fulfill your shipment. We do not sell personal data to third parties.

**Data Retention**
We retain shipment records for 7 years to comply with customs regulations. Account data is retained until you request deletion.

**Your Rights**
Under GDPR and applicable laws, you have the right to access, correct, delete, or export your data. Contact privacy@sinoveratransit.com.

**Contact**
Sinovera Transit Global — privacy@sinoveratransit.com
  `,
  "terms-conditions": `
**Effective Date:** January 1, 2024

These Terms & Conditions govern your use of Sinovera Transit Global's services and website.

**Services**
STG provides international freight forwarding, customs clearance, warehousing, and related logistics services. All services are subject to these terms.

**Booking & Payment**
Freight quotations are valid for 48 hours unless stated otherwise. Payment is due as per agreed terms. STG reserves the right to hold cargo in the event of non-payment.

**Liability**
STG's liability is limited to the value stated in the applicable air waybill, bill of lading, or road consignment note. We strongly recommend cargo insurance for all shipments.

**Force Majeure**
STG is not liable for delays or failures caused by events beyond our reasonable control, including natural disasters, government actions, port congestion, or carrier disruptions.

**Prohibited Goods**
You are responsible for ensuring your cargo complies with all export/import regulations. STG reserves the right to refuse any cargo that is illegal, dangerous, or misrepresented.

**Governing Law**
These terms are governed by the laws of the People's Republic of China.
  `,
  "shipping-policy": `
**Shipping Policy**

STG ships to 180+ countries. The following policies apply to all shipments.

**Packaging**
All goods must be properly packaged to withstand international transit. STG is not liable for damage caused by inadequate packaging.

**Documentation**
Accurate and complete documentation (commercial invoice, packing list, and any required permits) must be provided before shipment. STG may decline cargo with incomplete documentation.

**Dangerous Goods**
DG cargo must be declared in advance and comply with IATA, IMDG, or ADR regulations. Additional handling charges apply.

**Insurance**
STG can arrange cargo insurance on request. Premiums vary by value and mode. We strongly recommend coverage for all international shipments.

**Transit Times**
Published transit times are estimates only. STG is not liable for delays caused by customs, weather, carrier operations, or force majeure events.
  `,
  "restricted-items": `
**Restricted & Prohibited Items**

The following items require special handling, permits, or are prohibited entirely.

**Prohibited Items (Cannot Ship)**
- Illegal drugs and narcotics
- Weapons, firearms, and ammunition (without proper export license)
- Counterfeit goods
- Human remains (without special permit)
- Items banned by destination country import law

**Restricted Items (Require Declaration & Permits)**
- Lithium batteries (standalone): IATA Section II compliance required
- Dangerous goods (chemicals, flammables, oxidizers): IATA/IMDG/ADR compliance
- Food and agricultural products: Phytosanitary certificate required
- Medicines and pharmaceuticals: Import permit at destination
- CITES-listed species: CITES permit required
- Currency and financial instruments: Declaration required above limits
- Radioactive materials: NRC/IAEA compliance

**E-Commerce Restrictions**
Many countries restrict the import value of e-commerce parcels. STG will advise on thresholds and applicable duties.

Contact compliance@sinoveratransit.com for guidance on any item not listed here.
  `,
  "claims": `
**Claims Policy**

**Filing a Claim**
Claims for loss, damage, or shortage must be filed in writing within:
- Air freight: 14 days of delivery (or expected delivery for loss)
- Ocean freight: 3 days for apparent damage; 60 days for concealed damage
- Rail/Road: 7 days for damage; 21 days for loss

**Required Documentation**
- Tracking number and shipment reference
- Original invoice and packing list
- Proof of damage (photos, survey report)
- Delivery receipt noting damage
- Repair estimates or replacement invoices

**Claims Process**
1. Submit claim via claims@sinoveratransit.com
2. STG will acknowledge within 2 business days
3. Investigation: 14–30 business days
4. Settlement offer issued in writing

**Liability Limits**
Unless cargo insurance is taken, STG's liability is limited per applicable international convention (Warsaw/Montreal for air; Hague-Visby for ocean; COTIF-CIM for rail; CMR for road).

We strongly recommend full cargo insurance for all shipments.
  `,
  "cookie-policy": `
**Cookie Policy**

**What Are Cookies?**
Cookies are small text files stored on your device when you visit our website. They help us provide a better experience.

**Cookies We Use**
- Essential cookies: Required for the website to function (login sessions, security)
- Analytics cookies: Help us understand how visitors use our site (e.g. page views, traffic sources)
- Preference cookies: Remember your settings and language preferences
- Marketing cookies: Used to show relevant content (only with your consent)

**Managing Cookies**
You can control cookies through your browser settings. Note that disabling essential cookies may affect website functionality.

**Third-Party Cookies**
We may use third-party services (e.g. analytics providers) that set their own cookies. These are governed by their respective privacy policies.

**Updates**
We may update this policy as our services evolve. Continued use of the site constitutes acceptance.

Contact privacy@sinoveratransit.com for cookie-related enquiries.
  `,
};

export default function Legal() {
  const [, params] = useRoute("/legal/:slug");
  const slug = params?.slug ?? "";
  const meta = LEGAL_META[slug];

  const cmsKey = slug.replace(/-/g, "_");
  const { data: cms, isLoading } = useGetCmsSection("legal", {
    query: { queryKey: ["cms", "legal", slug] },
  });

  const cmsContent = (cms ?? []).find(i => i.key === cmsKey)?.value;
  const body = cmsContent ?? STATIC_CONTENT[slug] ?? "This page is not yet available.";

  if (!meta) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-primary mb-4">Page Not Found</h1>
        <Link href="/" className="text-secondary hover:underline text-sm">← Back to Home</Link>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>{meta.title} | Sinovera Transit Global</title>
        <meta name="description" content={`Read the Sinovera Transit Global ${meta.title}. Governing our freight forwarding services for shipments from China worldwide.`} />
        <link rel="canonical" href={`${SITE_URL}/legal/${slug}`} />
        <meta property="og:title" content={`${meta.title} — Sinovera Transit Global`} />
        <meta property="og:description" content={`Read the Sinovera Transit Global ${meta.title}. Governing our freight forwarding services for shipments from China worldwide.`} />
        <meta property="og:url" content={`${SITE_URL}/legal/${slug}`} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      {/* Header */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link href="/" className="inline-flex items-center text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-secondary/20 text-secondary border-secondary/40 mb-4">{meta.badge}</Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold">{meta.title}</h1>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="py-12 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-3xl">
          {isLoading ? (
            <Card className="p-8 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </Card>
          ) : (
            <Card className="p-8">
              <div
                className="prose prose-slate max-w-none text-foreground prose-headings:text-primary prose-strong:text-primary"
                dangerouslySetInnerHTML={{
                  __html: body
                    .split("\n")
                    .map(line =>
                      line.startsWith("**") && line.endsWith("**")
                        ? `<h3 class="text-lg font-bold text-primary mt-6 mb-2">${line.replace(/\*\*/g, "")}</h3>`
                        : line.startsWith("- ")
                        ? `<li class="ml-4 list-disc">${line.slice(2)}</li>`
                        : line
                        ? `<p class="mb-3 text-muted-foreground leading-relaxed">${line}</p>`
                        : ""
                    )
                    .join(""),
                }}
              />
            </Card>
          )}

          {/* Sibling links */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Other Legal Pages</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(LEGAL_META).map(([s, m]) => (
                <Link key={s} href={`/legal/${s}`}>
                  <span className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    s === slug ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
                  }`}>
                    {m.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
