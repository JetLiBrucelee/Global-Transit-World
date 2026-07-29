import { Helmet } from "react-helmet-async";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { Plane, Anchor, Train, Truck, ShieldCheck, Package, CheckCircle, ArrowRight, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SERVICE_DATA: Record<string, {
  icon: React.ElementType;
  title: string;
  tagline: string;
  heroDesc: string;
  sections: { heading: string; body: string }[];
  features: string[];
  transit: string;
  idealFor: string[];
}> = {
  "air-freight": {
    icon: Plane,
    title: "Air Freight",
    tagline: "Fastest Global Delivery",
    heroDesc: "Express air cargo solutions connecting China to 180+ countries. We partner with IATA-accredited airlines for daily departures from Shenzhen, Shanghai, Beijing, and Guangzhou.",
    sections: [
      { heading: "Express & Deferred Options", body: "We offer both express (next-flight-out) and economy deferred services depending on your timeline and budget. Our team monitors flights 24/7 to ensure cargo arrives on schedule." },
      { heading: "Dangerous Goods Expertise", body: "STG holds IATA Dangerous Goods certification. We handle lithium batteries, chemicals, and other regulated commodities with full DG documentation (MSDS, packing declarations)." },
      { heading: "Pharma & Cold Chain", body: "Temperature-controlled air freight with IATA CEIV Pharma-compliant handling. We maintain cold-chain integrity from factory to final delivery, with full audit trails." },
    ],
    features: ["Express & deferred options", "DG & lithium battery handling", "Pharma-grade cold chain", "Real-time flight tracking", "Door-to-door delivery", "Customs pre-clearance"],
    transit: "1–7 days",
    idealFor: ["E-commerce & retail", "Electronics", "Pharmaceuticals", "Fashion & apparel", "Automotive spare parts"],
  },
  "ocean-freight": {
    icon: Anchor,
    title: "Ocean Freight",
    tagline: "Cost-Effective FCL & LCL",
    heroDesc: "Full Container Load and Less than Container Load services from all major Chinese ports to every ocean gateway worldwide.",
    sections: [
      { heading: "FCL Services", body: "Dedicated 20', 40', 40'HC, and 45' containers. We negotiate preferential rates with COSCO, MSC, Maersk, and Evergreen. Weekly sailings from Shenzhen, Ningbo, Shanghai, and Qingdao." },
      { heading: "LCL Consolidation", body: "For smaller shipments that don't fill a container, our LCL consolidation service groups your cargo with other shippers to reduce cost. Departures every 3–7 days to major ports." },
      { heading: "Reefer & Special Cargo", body: "Refrigerated containers for food, chemicals, and temperature-sensitive goods. We also handle OOG (out-of-gauge), breakbulk, and project cargo." },
    ],
    features: ["FCL & LCL consolidation", "Reefer & OOG cargo", "Dangerous goods (IMO)", "Port-to-port & door-to-door", "Bill of Lading management", "Demurrage dispute handling"],
    transit: "14–45 days",
    idealFor: ["Furniture & homeware", "Industrial equipment", "Building materials", "Bulk commodities", "E-commerce stockpiling"],
  },
  "rail-freight": {
    icon: Train,
    title: "Rail Freight",
    tagline: "Eurasian Land Bridge",
    heroDesc: "The China-Europe Railway Express connects Chinese manufacturing hubs to European cities in 14–18 days — faster than ocean, more affordable than air.",
    sections: [
      { heading: "China-Europe Rail Corridor", body: "Fixed weekly departures from Yiwu, Chengdu, Chongqing, and Xi'an to 40+ European cities via Kazakhstan, Russia, Belarus, and Poland. Full customs coordination at each border crossing." },
      { heading: "Competitive Economics", body: "Rail freight typically costs 60–70% less than air and arrives 2–3x faster than ocean. Ideal for mid-value goods where speed and cost both matter." },
      { heading: "Bonded & Intermodal", body: "We offer bonded transit containers that remain sealed at border crossings. Intermodal connections available for last-mile trucking at destination in Europe and Central Asia." },
    ],
    features: ["Weekly fixed departures", "Border customs coordination", "Temperature-controlled options", "Bonded transit", "Intermodal last-mile", "Real-time train tracking"],
    transit: "14–18 days",
    idealFor: ["E-commerce to Europe", "Automotive parts", "Textiles & fashion", "Electronics", "Central Asia importers"],
  },
  "road-freight": {
    icon: Truck,
    title: "Road Freight",
    tagline: "Cross-Border Trucking",
    heroDesc: "Door-to-door trucking across Southeast Asia, Central Asia, and the Middle East from Chinese manufacturing centers.",
    sections: [
      { heading: "Southeast Asia Routes", body: "Daily FTL and LTL departures to Vietnam, Thailand, Malaysia, Indonesia, and Myanmar via the Nanning–Hanoi, Kunming–Laos, and GMS corridors." },
      { heading: "Central Asia & Middle East", body: "Overland trucking to Kazakhstan, Kyrgyzstan, Uzbekistan, Tajikistan, and onward to Iran and the Gulf via the China-Central Asia highway." },
      { heading: "Border Crossing Expertise", body: "Our team has deep expertise managing border crossing documentation, ATA Carnets, TIR Carnets, and customs facilitation at every major land checkpoint." },
    ],
    features: ["FTL & LTL options", "GPS fleet tracking", "Cross-border compliance", "ATA & TIR Carnets", "Refrigerated trucks", "Dedicated account managers"],
    transit: "5–21 days",
    idealFor: ["Southeast Asia trade", "Central Asia imports", "Oversized cargo", "Construction materials", "Perishable goods"],
  },
  "customs-clearance": {
    icon: ShieldCheck,
    title: "Customs Clearance",
    tagline: "End-to-End Brokerage",
    heroDesc: "Licensed customs brokerage with in-house experts handling China export and import clearance across 40+ destination countries.",
    sections: [
      { heading: "HS Code & Duty Optimization", body: "Our licensed classifiers ensure correct HS code assignment to minimize duty exposure. We identify applicable FTA preferences, duty drawback opportunities, and bonded zone benefits." },
      { heading: "Multi-Country Import Filing", body: "Direct filing capabilities in China, EU member states, UAE, UK, USA, Australia, and Southeast Asia. Preferred broker relationships with fast clearance at major entry ports." },
      { heading: "Compliance & Risk Management", body: "CITES permits, quarantine inspection coordination, phytosanitary certificates, and banned goods advisory. We keep your supply chain compliant and avoid costly delays." },
    ],
    features: ["HS code classification", "Duty & tax optimization", "Import & export licenses", "AEO status management", "CITES & quarantine", "Post-entry audit support"],
    transit: "Same day – 5 days",
    idealFor: ["All freight modes", "Complex regulated goods", "First-time importers", "High-volume traders", "Government & institutional"],
  },
  "warehousing": {
    icon: Package,
    title: "Warehousing & FBA Prep",
    tagline: "Strategic China Hubs",
    heroDesc: "Bonded and non-bonded warehousing in Shenzhen, Yiwu, Ningbo, and Shanghai. Full-service Amazon FBA prep for e-commerce sellers.",
    sections: [
      { heading: "FBA Prep & E-Commerce Services", body: "We handle labeling (FNSKU, UPC), poly-bagging, bundling, case-pack preparation, and direct shipping to Amazon FCs in Europe and North America. Compliant with latest Amazon packaging requirements." },
      { heading: "Quality Inspection", body: "Pre-shipment inspection by our trained QC team before goods leave the factory. We check quantity, quality, labeling, and packaging against your specifications." },
      { heading: "Bonded Warehouse Storage", body: "Import goods into China duty-deferred using our bonded warehouse facilities. Ideal for re-export operations, cross-docking, and tax-efficient supply chain optimization." },
    ],
    features: ["Amazon FBA prep & labeling", "Quality inspection (AQL)", "Bonded storage", "Pick, pack & kitting", "Cross-docking", "Inventory management portal"],
    transit: "On-demand",
    idealFor: ["Amazon & Shopify sellers", "E-commerce brands", "Consolidation shippers", "Re-export operations", "Product quality control"],
  },
};

export default function ServiceDetail() {
  const [, params] = useRoute("/services/:slug");
  const slug = params?.slug ?? "";
  const svc = SERVICE_DATA[slug];

  if (!svc) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-primary mb-4">Service Not Found</h1>
        <Link href="/services"><Button variant="outline"><ChevronLeft className="w-4 h-4 mr-2" /> All Services</Button></Link>
      </div>
    );
  }

  const Icon = svc.icon;

  return (
    <div>
      <Helmet>
        <title>{svc.title} from China | Sinovera Transit Global</title>
        <meta name="description" content={`${svc.heroDesc} Transit time: ${svc.transit}.`} />
        <meta property="og:title" content={`${svc.title} — Sinovera Transit Global`} />
        <meta property="og:description" content={svc.heroDesc} />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Hero */}
      <div className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/services" className="inline-flex items-center text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> All Services
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Icon className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <Badge className="bg-secondary/20 text-secondary border-secondary/40 mb-3">{svc.tagline}</Badge>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{svc.title}</h1>
              <p className="text-white/70 text-lg max-w-2xl">{svc.heroDesc}</p>
              <div className="mt-6 flex items-center gap-6">
                <div className="text-sm text-white/60">
                  <span className="font-bold text-white text-lg">{svc.transit}</span>
                  <span className="ml-2">typical transit</span>
                </div>
                <Link href="/quote">
                  <Button className="bg-secondary text-primary font-bold hover:bg-secondary/90">
                    Get a Quote <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-8">
              {svc.sections.map((section) => (
                <motion.div
                  key={section.heading}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-xl font-bold text-primary mb-3">{section.heading}</h3>
                  <p className="text-muted-foreground leading-relaxed">{section.body}</p>
                </motion.div>
              ))}
            </div>

            <div className="space-y-6">
              <Card className="p-5">
                <h4 className="font-bold text-primary mb-4">Key Features</h4>
                <ul className="space-y-2.5">
                  {svc.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-5">
                <h4 className="font-bold text-primary mb-4">Ideal For</h4>
                <div className="flex flex-wrap gap-2">
                  {svc.idealFor.map(item => (
                    <Badge key={item} variant="outline" className="text-xs">{item}</Badge>
                  ))}
                </div>
              </Card>

              <Card className="p-5 bg-primary text-white border-primary">
                <h4 className="font-bold mb-2">Ready to Ship?</h4>
                <p className="text-white/70 text-sm mb-4">Get a competitive quote for your {svc.title.toLowerCase()} shipment within 2 hours.</p>
                <Link href="/quote" className="block">
                  <Button className="w-full bg-secondary text-primary font-bold hover:bg-secondary/90" data-testid="link-service-quote">
                    Request a Quote
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
