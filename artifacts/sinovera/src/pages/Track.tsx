import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/seo";
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


export default function Track() {
  const [value, setValue] = useState("");
  const [, navigate] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim().toUpperCase();
    if (trimmed) navigate(`/track/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Helmet>
        <title>Track Your Shipment | Sinovera Transit Global</title>
        <meta name="description" content="Track your STG shipment in real time. Enter your tracking number (STG-CN-YYYY-XXXXXX) for live status, current location, and estimated delivery date." />
        <meta property="og:title" content="Shipment Tracking — Sinovera Transit Global" />
        <meta property="og:description" content="Real-time tracking for all STG shipments from China to 180+ countries." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/track`} />
        <link rel="canonical" href={`${SITE_URL}/track`} />
      </Helmet>
      {/* Header */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="bg-secondary/20 text-secondary border-secondary/40 mb-4">Shipment Tracking</Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Track Your Shipment</h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
              Enter your STG tracking number for real-time status, location updates, and estimated delivery.
            </p>
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  placeholder="STG-CN-YYYY-XXXXXX"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-secondary uppercase"
                  data-testid="input-tracking-number"
                />
              </div>
              <Button type="submit" className="bg-secondary text-primary font-bold px-6 hover:bg-secondary/90 shrink-0" data-testid="button-track-submit">
                Track
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Card className="p-6">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-secondary" /> Tracking Number Format
            </h3>
            <div className="font-mono text-sm bg-slate-50 border rounded-lg p-3 text-center font-bold tracking-widest text-primary mb-3">
              STG-CN-2026-XXXXXX
            </div>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />Prefix: STG (Sinovera Transit Global)</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />Origin: CN (China)</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />Year: 4-digit year</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />Code: 6 alphanumeric characters</li>
            </ul>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-primary mb-4">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Can't find your tracking number? Contact our support team and we'll look it up for you.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="/contact">Contact Support</a>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
