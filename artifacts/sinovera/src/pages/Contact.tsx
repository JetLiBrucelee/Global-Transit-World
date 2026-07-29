import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/seo";
import { useState } from "react";
import { motion } from "framer-motion";
import { useGetCmsSection } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock, CheckCircle } from "lucide-react";

const OFFICES = [
  { city: "Shenzhen (HQ)", address: "128 Logistics Blvd, Qianhai Free Trade Zone, Shenzhen 518055", phone: "+86 755 1234 5678", email: "hq@sinoveratransit.com" },
];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const { data: companyCms } = useGetCmsSection("company", { query: { queryKey: ["cms", "company"] } });
  const cmsVal = (key: string, fallback: string) =>
    (companyCms ?? []).find(i => i.key === key)?.value ?? fallback;

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, subject: form.subject, message: form.message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send");
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Contact Us | Sinovera Transit Global</title>
        <meta name="description" content="Get in touch with Sinovera Transit Global's logistics experts. Available 24/7 for freight quotes, shipment enquiries, and customs support. Headquartered in Shenzhen, China." />
        <meta property="og:title" content="Contact Sinovera Transit Global" />
        <meta property="og:description" content="24/7 logistics support. Offices in Shenzhen, Shanghai and Yiwu. Call +86 400 123 4567 or email us." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/contact`} />
        <link rel="canonical" href={`${SITE_URL}/contact`} />
      </Helmet>
      {/* Hero */}
      <div className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-secondary/20 text-secondary border-secondary/40 mb-4">Contact Us</Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Get in Touch</h1>
            <p className="text-white/70 text-lg">
              Our logistics experts are available 24/7 to assist with quotes, tracking, and any freight enquiries.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="py-16 bg-[#f8fafc]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-5 gap-10">
            {/* Form */}
            <div className="md:col-span-3">
              <Card className="p-8">
                <h2 className="text-xl font-bold text-primary mb-6">Send Us a Message</h2>
                {sent ? (
                  <div className="text-center py-10">
                    <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-primary mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground">We'll get back to you within 2 business hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-contact">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input id="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Smith" className="mt-1" data-testid="input-name" />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" className="mt-1" data-testid="input-email" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Air freight quote from Shenzhen to Frankfurt" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        required
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        placeholder="Tell us about your shipment requirements, dimensions, weight, timeline..."
                        className="mt-1 min-h-[140px]"
                        data-testid="input-message"
                      />
                    </div>
                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
                    )}
                    <Button type="submit" disabled={submitting} className="w-full bg-secondary text-primary font-bold hover:bg-secondary/90" data-testid="button-send-message">
                      {submitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </Card>
            </div>

            {/* Contact Info */}
            <div className="md:col-span-2 space-y-5">
              <Card className="p-5">
                <h3 className="font-bold text-primary mb-4">Contact Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{cmsVal("phone_intl", "+86 400 123 4567")}</div>
                      <div className="text-muted-foreground text-xs">International hotline</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{cmsVal("email_support", "support@sinoveratransit.com")}</div>
                      <div className="text-muted-foreground text-xs">General enquiries</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">24/7 Operations Support</div>
                      <div className="text-muted-foreground text-xs">Dedicated ops team always on</div>
                    </div>
                  </div>
                </div>
              </Card>

              {OFFICES.map(office => (
                <Card key={office.city} className="p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-bold text-primary mb-1">{office.city}</div>
                      <div className="text-muted-foreground text-xs mb-1">{office.address}</div>
                      <div className="text-xs">{office.phone}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
