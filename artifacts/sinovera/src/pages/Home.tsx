import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/seo";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetCmsSection, useListNews } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowRight, CheckCircle, Star, ChevronRight, MapPin, Clock, BarChart3, Globe, ShieldCheck, Package
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useLocation } from "wouter";

const SERVICES = [
  { slug: "air-freight", icon: "/icons/3d-air-freight.png", title: "Air Freight", desc: "Express delivery to 180+ countries. Fastest transit times with real-time tracking." },
  { slug: "ocean-freight", icon: "/icons/3d-ocean-freight.png", title: "Ocean Freight", desc: "Cost-effective FCL & LCL solutions. Major ports across Asia, Europe & Americas." },
  { slug: "rail-freight", icon: "/icons/3d-rail-freight.png", title: "Rail Freight", desc: "China-Europe rail corridor. 14–18 days across the Eurasian land bridge." },
  { slug: "road-freight", icon: "/icons/3d-road-freight.png", title: "Road Freight", desc: "Cross-border trucking for Southeast Asia and Central Asia routes." },
  { slug: "customs-clearance", icon: "/icons/3d-customs-clearance.png", title: "Customs Clearance", desc: "End-to-end customs brokerage. Compliant documentation for every destination." },
  { slug: "warehousing", icon: "/icons/3d-warehousing.png", title: "Warehousing & FBA", desc: "Strategic bonded warehouses in Shenzhen, Yiwu, Ningbo & Shanghai." },
];

const TESTIMONIALS = [
  {
    name: "Michael Hoffmann",
    company: "Hoffmann Industriehandel GmbH",
    country: "Germany",
    text: "Sinovera Transit Global has been our trusted logistics partner for 5 years. Their rail freight service cut our transit time from 30 to 16 days.",
    rating: 5,
  },
  {
    name: "Sarah Al-Rashidi",
    company: "Gulf Trade Solutions LLC",
    country: "UAE",
    text: "Outstanding customs expertise and transparent communication. They handled our complex HS code classification without any delays.",
    rating: 5,
  },
  {
    name: "Tomasz Wiśniewski",
    company: "EcoShop Polska",
    country: "Poland",
    text: "The tracking portal is excellent — we always know exactly where our goods are. Highly recommend their Yiwu consolidation service.",
    rating: 5,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

export default function Home() {
  const [trackInput, setTrackInput] = useState("");
  const [, navigate] = useLocation();

  const { data: heroCms } = useGetCmsSection("hero", { query: { queryKey: ["cms", "hero"] } });
  const { data: statsCms } = useGetCmsSection("stats", { query: { queryKey: ["cms", "stats"] } });
  const { data: newsList } = useListNews({ limit: 3 }, { query: { queryKey: ["news", "home"] } });

  const cmsVal = (section: typeof heroCms, key: string, fallback: string) =>
    (section ?? []).find(i => i.key === key)?.value ?? fallback;

  const heroTitle = cmsVal(heroCms, "title", "Your Global Freight Partner from China");
  const heroSubtitle = cmsVal(heroCms, "subtitle", "Fast, Reliable Shipments to 180+ Countries");
  const heroDesc = cmsVal(heroCms, "description", "Sinovera Transit Global connects Chinese manufacturers to buyers worldwide with intelligent freight forwarding, customs clearance, and end-to-end supply chain solutions.");

  const statsData = [
    { label: "Countries Served", value: cmsVal(statsCms, "countries_served", "180+") },
    { label: "Shipments Completed", value: cmsVal(statsCms, "shipments_completed", "50,000+") },
    { label: "Years of Experience", value: cmsVal(statsCms, "years_experience", "15+") },
    { label: "Client Satisfaction", value: cmsVal(statsCms, "satisfaction_rate", "99.1%") },
  ];

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) navigate(`/track/${trackInput.trim().toUpperCase()}`);
  };

  return (
    <div className="overflow-x-hidden">
      <Helmet>
        <title>Sinovera Transit Global — International Freight Forwarding from China</title>
        <meta name="description" content="Sinovera Transit Global connects Chinese manufacturers to buyers worldwide with air, ocean, rail & road freight, customs clearance, and FBA prep services to 180+ countries." />
        <meta property="og:title" content="Sinovera Transit Global — International Freight Forwarding from China" />
        <meta property="og:description" content="Fast, reliable shipments from China to 180+ countries. Air freight, ocean FCL/LCL, rail, road, and customs clearance." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <link rel="canonical" href={SITE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {/* Hero */}
      <section className="relative bg-primary text-white overflow-hidden min-h-[600px] flex items-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-secondary rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-3xl">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.div variants={fadeUp}>
                <Badge className="bg-secondary/20 text-secondary border-secondary/40 mb-6 text-sm font-semibold px-4 py-1.5">
                  {heroSubtitle}
                </Badge>
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6">
                {heroTitle}
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl leading-relaxed">
                {heroDesc}
              </motion.p>
              <motion.form variants={fadeUp} onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <input
                  type="text"
                  placeholder="Enter tracking number (e.g. STG-CN-2026-84XH92)"
                  value={trackInput}
                  onChange={e => setTrackInput(e.target.value)}
                  className="flex-1 px-5 py-3.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-secondary"
                  data-testid="input-track-hero"
                />
                <Button type="submit" className="bg-secondary text-primary font-bold px-8 py-3.5 hover:bg-secondary/90 shrink-0" data-testid="button-track-hero">
                  Track Now
                </Button>
              </motion.form>
              <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-6 text-sm text-white/60">
                <Link href="/quote" className="flex items-center gap-2 hover:text-white transition-colors" data-testid="link-get-quote-hero">
                  <ArrowRight className="w-4 h-4" /> Get a Free Quote
                </Link>
                <Link href="/services" className="flex items-center gap-2 hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" /> View All Services
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-secondary">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statsData.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-extrabold text-primary">{stat.value}</div>
                <div className="text-sm font-medium text-primary/70 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-secondary font-semibold uppercase tracking-widest text-sm mb-3">Our Services</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-primary">End-to-End Freight Solutions</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
              From factory floor in China to final destination — we handle every mile with precision.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((svc) => {
              return (
                <motion.div key={svc.slug} variants={fadeUp}>
                  <Link href={`/services/${svc.slug}`} data-testid={`link-service-${svc.slug}`}>
                    <Card className="p-6 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border group">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <img src={svc.icon} alt={svc.title} className="w-14 h-14 object-contain drop-shadow-md" />
                      </div>
                      <h3 className="font-bold text-lg text-primary mb-2">{svc.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{svc.desc}</p>
                      <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-secondary">
                        Learn more <ChevronRight className="w-4 h-4" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Why STG */}
      <section className="py-20 bg-gradient-to-b from-[#f1f5f9] to-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
              <motion.p variants={fadeUp} className="text-secondary font-semibold uppercase tracking-widest text-sm mb-3">Why Choose STG</motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-primary mb-6">
                China's Most Trusted International Freight Forwarder
              </motion.h2>
              <motion.div variants={stagger} className="space-y-5">
                {[
                  { icon: Globe, title: "Global Network", desc: "Licensed offices and agent partners in 60+ countries covering every major trade lane." },
                  { icon: ShieldCheck, title: "Customs Expertise", desc: "In-house licensed brokers for China export and import clearance in 40+ destinations." },
                  { icon: BarChart3, title: "Real-Time Visibility", desc: "Live shipment tracking with automated status updates via portal, email, and SMS." },
                  { icon: Clock, title: "On-Time Guarantee", desc: "99.1% on-time delivery rate backed by contingency routing and dedicated ops teams." },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div key={item.title} variants={fadeUp} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary">{item.title}</h4>
                        <p className="text-muted-foreground text-sm mt-1">{item.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
              <motion.div variants={fadeUp} className="mt-8 flex gap-4">
                <Link href="/about"><Button className="bg-primary text-white hover:bg-primary/90">About Us</Button></Link>
                <Link href="/contact"><Button variant="outline">Contact Sales</Button></Link>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="aspect-[4/3] bg-primary rounded-2xl flex items-center justify-center overflow-hidden">
                <div className="text-center text-white p-10">
                  <Globe className="w-24 h-24 mx-auto mb-6 text-secondary opacity-80" />
                  <div className="text-4xl font-extrabold">180+</div>
                  <div className="text-lg text-white/70 mt-2">Countries in Our Network</div>
                  <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                    {["Asia Pacific", "Europe", "Middle East", "Americas", "Africa", "Central Asia"].map(r => (
                      <div key={r} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Track CTA */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-primary mb-4">
              Track Your Shipment Instantly
            </motion.h2>
            <motion.p variants={fadeUp} className="text-primary/70 mb-8 text-lg">
              Enter your STG tracking number to see real-time status, location, and delivery estimates.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/track" data-testid="link-track-cta">
                <Button size="lg" className="bg-primary text-white hover:bg-primary/90 font-bold px-10">
                  <MapPin className="w-5 h-5 mr-2" /> Go to Tracking Portal
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-secondary font-semibold uppercase tracking-widest text-sm mb-3">Testimonials</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-primary">Trusted by Importers & Exporters Worldwide</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} variants={fadeUp}>
                <Card className="p-6 h-full flex flex-col gap-4">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">"{t.text}"</p>
                  <div>
                    <div className="font-bold text-primary text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.company} · {t.country}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* News */}
      {(newsList?.data ?? []).length > 0 && (
        <section className="py-20 bg-gradient-to-b from-[#f1f5f9] to-white">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-secondary font-semibold uppercase tracking-widest text-sm mb-3">Latest News</p>
                <h2 className="text-3xl font-extrabold text-primary">Industry Updates & Announcements</h2>
              </div>
              <Link href="/news" className="hidden md:flex items-center gap-1 text-sm font-semibold text-primary hover:text-secondary transition-colors">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {(newsList?.data ?? []).slice(0, 3).map((article) => (
                <Link key={article.slug} href={`/news/${article.slug}`} data-testid={`link-news-${article.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full flex flex-col">
                    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a6e] h-40 flex items-center justify-center">
                      <Package className="w-16 h-16 text-[#f5a623]/40" />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <Badge variant="outline" className="self-start mb-2 text-xs">{article.category ?? "News"}</Badge>
                      <h3 className="font-bold text-primary mb-2 line-clamp-2">{article.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-3 flex-1">{article.excerpt ?? article.content?.slice(0, 120)}</p>
                      <div className="mt-4 text-xs text-muted-foreground">
                        {article.publishedAt ? format(new Date(article.publishedAt), "MMM d, yyyy") : ""}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold mb-6">Ready to Ship from China?</motion.h2>
            <motion.p variants={fadeUp} className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
              Get a competitive freight quote within 2 hours. Our experts handle everything from pickup to final-mile delivery.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/quote" data-testid="link-get-quote-cta">
                <Button size="lg" className="bg-secondary text-primary font-bold hover:bg-secondary/90 px-10">Get a Free Quote</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-10">Talk to an Expert</Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
