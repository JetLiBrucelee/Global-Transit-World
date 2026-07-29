import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/seo";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SERVICES = [
  {
    slug: "air-freight",
    icon: "/icons/3d-air-freight.png",
    title: "Air Freight",
    tagline: "Fastest Global Delivery",
    desc: "Express air cargo solutions connecting China to 180+ countries. Ideal for time-sensitive, high-value, or perishable goods. We partner with IATA-accredited airlines for daily departures from Shenzhen, Shanghai, Beijing, and Guangzhou.",
    features: ["Express & deferred options", "Dangerous goods handling", "Pharma-grade cold chain", "Door-to-door service"],
    transit: "1–7 days",
  },
  {
    slug: "ocean-freight",
    icon: "/icons/3d-ocean-freight.png",
    title: "Ocean Freight",
    tagline: "Cost-Effective FCL & LCL",
    desc: "Full Container Load (FCL) and Less than Container Load (LCL) services from all major Chinese ports. Competitive rates on high-volume lanes to Europe, Americas, Middle East, and Southeast Asia.",
    features: ["FCL & LCL consolidation", "Reefer containers", "Dangerous goods (IMO)", "Port of origin handling"],
    transit: "14–45 days",
  },
  {
    slug: "rail-freight",
    icon: "/icons/3d-rail-freight.png",
    title: "Rail Freight",
    tagline: "Eurasian Land Bridge",
    desc: "China-Europe rail corridor connecting Yiwu, Chengdu, and Chongqing to 40+ European cities via Kazakhstan, Russia, and Poland. The cost-effective middle ground between air speed and ocean economics.",
    features: ["Fixed weekly departures", "Customs clearance en route", "Temperature-controlled", "Bonded transit"],
    transit: "14–18 days",
  },
  {
    slug: "road-freight",
    icon: "/icons/3d-road-freight.png",
    title: "Road Freight",
    tagline: "Cross-Border Trucking",
    desc: "Door-to-door trucking across Southeast Asia, Central Asia, and the Middle East. We operate a fleet of bonded trucks with GPS tracking and experienced drivers for border-crossing compliance.",
    features: ["FTL & LTL options", "Cross-border compliance", "GPS tracking", "ASEAN & Central Asia routes"],
    transit: "5–21 days",
  },
  {
    slug: "customs-clearance",
    icon: "/icons/3d-customs-clearance.png",
    title: "Customs Clearance",
    tagline: "End-to-End Brokerage",
    desc: "Licensed customs brokers handling China export and import clearance across 40+ destination countries. We manage HS classification, duty optimization, ATA Carnets, and quarantine inspections.",
    features: ["HS code classification", "Duty drawback", "Import & export licenses", "AEO status management"],
    transit: "Same day – 5 days",
  },
  {
    slug: "warehousing",
    icon: "/icons/3d-warehousing.png",
    title: "Warehousing & FBA Prep",
    tagline: "Strategic China Hubs",
    desc: "Bonded and non-bonded warehousing across Shenzhen, Yiwu, Ningbo, and Shanghai. Amazon FBA prep, kitting, relabeling, quality inspection, and consolidation services for e-commerce sellers.",
    features: ["FBA prep & labeling", "Quality inspection", "Bonded storage", "Pick & pack, kitting"],
    transit: "On-demand",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Services() {
  return (
    <div>
      <Helmet>
        <title>Freight Services — Air, Ocean, Rail & Road | Sinovera Transit Global</title>
        <meta name="description" content="Explore STG's full range of freight services: air freight, ocean FCL & LCL, China-Europe rail, road trucking, customs clearance, and warehousing & FBA prep from China to 180+ countries." />
        <meta property="og:title" content="Freight Services — Sinovera Transit Global" />
        <meta property="og:description" content="Air, ocean, rail, road freight, customs clearance and FBA prep from China worldwide." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/services`} />
        <link rel="canonical" href={`${SITE_URL}/services`} />
      </Helmet>
      {/* Hero */}
      <div className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
            <motion.div variants={fadeUp}>
              <Badge className="bg-secondary/20 text-secondary border-secondary/40 mb-4">Our Services</Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold mb-4">
              Freight Solutions for Every Route
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/70 text-lg">
              From air express to ocean bulk, we move your cargo from China to anywhere on the planet — on time, every time.
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="py-20 bg-[#f8fafc]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((svc, i) => {
              return (
                <motion.div
                  key={svc.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="p-6 h-full flex flex-col hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
                        <img src={svc.icon} alt={svc.title} className="w-14 h-14 object-contain drop-shadow-md" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">{svc.tagline}</div>
                        <h2 className="text-xl font-extrabold text-primary">{svc.title}</h2>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">{svc.desc}</p>
                    <ul className="space-y-2 mb-5">
                      {svc.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">Transit:</span> {svc.transit}
                      </div>
                      <Link href={`/services/${svc.slug}`} data-testid={`link-service-detail-${svc.slug}`}>
                        <Button size="sm" className="bg-secondary text-primary hover:bg-secondary/90 font-bold">
                          Learn More <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-4">Not Sure Which Service You Need?</h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Our logistics experts will assess your cargo and recommend the most cost-effective solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote"><Button className="bg-secondary text-primary font-bold hover:bg-secondary/90 px-8">Get a Free Quote</Button></Link>
            <Link href="/contact"><Button variant="outline" className="border-white text-white hover:bg-white/10 px-8">Talk to an Expert</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
