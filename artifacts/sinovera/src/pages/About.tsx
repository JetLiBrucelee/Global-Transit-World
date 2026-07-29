import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Globe, Award, Users, Target, ArrowRight } from "lucide-react";

const MILESTONES = [
  { year: "2009", title: "Founded in Shenzhen", desc: "Sinovera Transit Global established as a licensed freight forwarder at Shenzhen's Qianhai Free Trade Zone." },
  { year: "2012", title: "Ocean Freight Expansion", desc: "Launched FCL & LCL ocean services covering Asia-Europe, Asia-Americas, and Transpacific lanes." },
  { year: "2015", title: "Rail Freight Pioneer", desc: "Among the first Chinese forwarders to offer China-Europe rail freight services on the Yiwu–Madrid corridor." },
  { year: "2018", title: "AEO Certification", desc: "Achieved Authorized Economic Operator (AEO) status — the highest tier of Chinese customs compliance." },
  { year: "2020", title: "Digital Tracking Platform", desc: "Launched the STG real-time tracking portal, processing 500,000+ tracking queries per month." },
  { year: "2024", title: "180+ Countries", desc: "Expanded network to 180+ countries through partnerships with 200+ certified agents worldwide." },
];

const TEAM = [
  { name: "Zhang Wei", role: "CEO & Co-Founder", bio: "20 years in international logistics. Former SVP at Sinotrans. MSc in Supply Chain, Tongji University." },
  { name: "Lisa Chen", role: "Chief Operations Officer", bio: "Leads a 300-person global ops team. Specialist in China customs and cross-border compliance." },
  { name: "David Huang", role: "Head of Air Freight", bio: "IATA Dangerous Goods specialist. 15 years managing air cargo operations at major Chinese airports." },
  { name: "Priya Patel", role: "Director, Global Sales", bio: "Manages key accounts across Europe, Middle East, and South Asia. Previously at DHL and Kuehne+Nagel." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

export default function About() {
  return (
    <div>
      <Helmet>
        <title>About Sinovera Transit Global — China's Premier Freight Forwarder Since 2009</title>
        <meta name="description" content="Founded in 2009 in Shenzhen, Sinovera Transit Global is an AEO-certified, FIATA-member freight forwarder serving 180+ countries with air, ocean, rail and road freight solutions." />
        <meta property="og:title" content="About Sinovera Transit Global" />
        <meta property="og:description" content="AEO-certified, FIATA-member freight forwarder from Shenzhen. 15+ years connecting China to the world." />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Hero */}
      <div className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
            <motion.div variants={fadeUp}>
              <Badge className="bg-secondary/20 text-secondary border-secondary/40 mb-4">About Us</Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold mb-4">
              Connecting China to the World Since 2009
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/70 text-lg max-w-2xl mx-auto">
              Sinovera Transit Global is one of China's leading international freight forwarders, trusted by importers, exporters, and e-commerce brands across 180+ countries.
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-extrabold text-primary mb-6">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                To make global trade frictionless for businesses of every size. We believe that access to reliable, affordable, and transparent freight services should not be limited to large corporations.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                From a single pallet of electronics to a full container of industrial machinery, every shipment receives the same level of care, attention, and professional expertise.
              </p>
              <div className="space-y-3">
                {[
                  "FIATA-member freight forwarder",
                  "ISO 9001:2015 certified operations",
                  "AEO (Authorized Economic Operator) certified",
                  "IATA Dangerous Goods accreditation",
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-secondary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Globe, label: "Countries", value: "180+" },
                  { icon: Users, label: "Staff Worldwide", value: "300+" },
                  { icon: Award, label: "Years Operating", value: "15+" },
                  { icon: Target, label: "On-Time Rate", value: "99.1%" },
                ].map(({ icon: Icon, label, value }) => (
                  <Card key={label} className="p-5 text-center">
                    <Icon className="w-8 h-8 text-secondary mx-auto mb-3" />
                    <div className="text-3xl font-extrabold text-primary">{value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{label}</div>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gradient-to-b from-[#f1f5f9] to-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-14">
            <Badge className="mb-4">Our History</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary">15 Years of Growth & Innovation</h2>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`md:flex gap-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className="md:w-1/2 flex md:justify-end">
                    <Card className={`p-5 max-w-sm w-full ${i % 2 !== 0 ? "md:ml-auto" : ""}`}>
                      <Badge className="bg-secondary text-primary mb-2">{m.year}</Badge>
                      <h3 className="font-bold text-primary mb-1">{m.title}</h3>
                      <p className="text-muted-foreground text-sm">{m.desc}</p>
                    </Card>
                  </div>
                  <div className="hidden md:flex items-start justify-center w-8 shrink-0 mt-5">
                    <div className="w-4 h-4 rounded-full bg-secondary border-4 border-white shadow" />
                  </div>
                  <div className="md:w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-14">
            <Badge className="mb-4">Leadership</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary">The Team Behind STG</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0 text-white font-bold text-xl">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-primary">{member.name}</div>
                    <div className="text-secondary text-xs font-semibold mb-2">{member.role}</div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{member.bio}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-4">Partner with Sinovera Transit Global</h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Join thousands of importers and exporters who trust STG to move their goods safely and on time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote"><Button className="bg-secondary text-primary font-bold hover:bg-secondary/90 px-8">Get a Quote</Button></Link>
            <Link href="/contact"><Button variant="outline" className="border-white text-white hover:bg-white/10 px-8">Contact Us <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
