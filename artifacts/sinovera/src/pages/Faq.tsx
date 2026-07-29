import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetCmsSection } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const STATIC_FAQS = [
  {
    q: "How do I track my shipment?",
    a: "Enter your STG tracking number (format: STG-CN-YYYY-XXXXXX) on our Track page or homepage. You'll see real-time status, current location, and estimated delivery date.",
  },
  {
    q: "What is the tracking number format?",
    a: "All STG tracking numbers follow the format STG-CN-YYYY-XXXXXX where YYYY is the year and XXXXXX is a 6-character alphanumeric code. You receive this when your shipment is booked.",
  },
  {
    q: "How long does air freight from China take?",
    a: "Express air freight typically takes 1–3 business days, while economy air takes 5–7 business days. Transit times depend on origin, destination, and customs clearance at the destination country.",
  },
  {
    q: "What is the difference between FCL and LCL ocean freight?",
    a: "FCL (Full Container Load) means you book the entire container exclusively for your cargo. LCL (Less than Container Load) means your cargo is consolidated with other shippers in a shared container — better for smaller volumes.",
  },
  {
    q: "Do you handle customs clearance?",
    a: "Yes. STG has in-house licensed customs brokers for China export and import clearance across 40+ countries. We handle HS code classification, duty calculations, and all required documentation.",
  },
  {
    q: "What items are restricted or prohibited?",
    a: "Certain items require special permits (e.g. lithium batteries, chemicals, food products) and others are prohibited entirely (weapons, drugs, CITES-restricted wildlife). See our Restricted Items page for the full list.",
  },
  {
    q: "Can you ship to my country?",
    a: "We serve 180+ countries across all major regions. Contact us with your destination and cargo details — our team will confirm availability and provide the applicable routing and rates.",
  },
  {
    q: "How do I get a quote?",
    a: "Fill in our online Quote Request form with your origin, destination, cargo details, and preferred service type. We typically respond within 2 business hours.",
  },
  {
    q: "What is the China-Europe rail freight transit time?",
    a: "Rail freight on the China-Europe corridor takes approximately 14–18 transit days, depending on origin city and destination. Departures are weekly from Yiwu, Chengdu, Chongqing, and Xi'an.",
  },
  {
    q: "Do you offer FBA prep services for Amazon sellers?",
    a: "Yes. Our Shenzhen, Yiwu, and Ningbo warehouses offer full FBA prep: FNSKU labeling, poly-bagging, bundling, case pack preparation, and direct shipping to Amazon FCs in US, EU, and UK.",
  },
  {
    q: "What should I do if my shipment is on hold?",
    a: "Your tracking page will show the hold reason and a public message. Common reasons include customs documentation requests, inspection, or payment verification. Contact our support team immediately with your tracking number.",
  },
  {
    q: "How can I pay for freight services?",
    a: "We accept T/T bank transfer, online payment via our portal, and credit accounts for regular clients. Corporate accounts with credit terms are available after a brief onboarding process.",
  },
];

function FaqItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className="border-b last:border-b-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
        onClick={onClick}
        data-testid={`faq-toggle-${q.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
      >
        <span className={`font-semibold text-sm md:text-base transition-colors ${open ? "text-secondary" : "text-primary group-hover:text-secondary"}`}>{q}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-secondary" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-muted-foreground text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const { data: faqCms } = useGetCmsSection("faq", { query: { queryKey: ["cms", "faq"] } });

  // Merge CMS FAQ items with static ones
  const cmsFaqs = (faqCms ?? [])
    .filter(item => item.key.startsWith("q_"))
    .map(item => {
      const aItem = (faqCms ?? []).find(i => i.key === item.key.replace("q_", "a_"));
      return { q: item.value, a: aItem?.value ?? "" };
    })
    .filter(f => f.q && f.a);

  const faqs: { q: string; a: string }[] = cmsFaqs.length > 0
    ? cmsFaqs.map(f => ({ q: f.q ?? "", a: f.a ?? "" }))
    : STATIC_FAQS;

  const toggle = (i: number) => setOpenIdx(openIdx === i ? null : i);

  return (
    <div>
      <Helmet>
        <title>Frequently Asked Questions | Sinovera Transit Global</title>
        <meta name="description" content="Answers to common questions about international freight, shipment tracking, customs clearance, FBA prep, and our services. Find out how STG ships from China to 180+ countries." />
        <meta property="og:title" content="FAQ — Sinovera Transit Global" />
        <meta property="og:description" content="Everything you need to know about freight forwarding, tracking, customs, and STG services." />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Hero */}
      <div className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-secondary/20 text-secondary border-secondary/40 mb-4">FAQ</Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Frequently Asked Questions</h1>
            <p className="text-white/70 text-lg">
              Answers to the most common questions about international freight, tracking, customs, and our services.
            </p>
          </motion.div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="py-16 bg-[#f8fafc]">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="divide-y border border-[#e2e8f0] rounded-xl overflow-hidden bg-white shadow-md">
            {faqs.map((faq, i) => (
              <FaqItem
                key={i}
                q={faq.q}
                a={faq.a}
                open={openIdx === i}
                onClick={() => toggle(i)}
              />
            ))}
          </div>

          <div className="mt-12 text-center p-8 bg-gradient-to-br from-[#0f172a] to-[#1e3a6e] rounded-xl">
            <h3 className="font-bold text-white text-lg mb-2">Still Have Questions?</h3>
            <p className="text-white/60 text-sm mb-5">
              Our logistics experts are available 24/7 to help with any enquiries.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <Button className="bg-[#f5a623] text-[#0f172a] font-bold hover:bg-[#f5a623]/90">Contact Support</Button>
              </Link>
              <Link href="/quote">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">Request a Quote</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
