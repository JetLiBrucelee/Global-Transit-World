import { Link } from "wouter";
import { useGetCmsSection } from "@workspace/api-client-react";
import { MapPin, Phone, Mail, Linkedin, Twitter, Facebook } from "lucide-react";
import { SiWechat } from "react-icons/si";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const { data: companyCms } = useGetCmsSection("company", { query: { queryKey: ["cms", "company"] } });
  const { data: socialCms } = useGetCmsSection("social", { query: { queryKey: ["cms", "social"] } });

  const name = (companyCms ?? []).find(i => i.key === "name")?.value ?? "Sinovera Transit Global";
  const tagline = (companyCms ?? []).find(i => i.key === "tagline")?.value ?? "Delivering Beyond Borders.";
  const phoneIntl = (companyCms ?? []).find(i => i.key === "phone_intl")?.value ?? "+86 400 123 4567";
  const email = (companyCms ?? []).find(i => i.key === "email_support")?.value ?? "support@sinoveratransit.com";
  const address = (companyCms ?? []).find(i => i.key === "hq_address")?.value ?? "128 Logistics Blvd, Shenzhen, China";

  const [showCookie, setShowCookie] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      setShowCookie(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "true");
    setShowCookie(false);
  };

  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-block">
              <span className="font-bold text-2xl tracking-tight text-white">
                {name}
              </span>
            </Link>
            <p className="text-primary-foreground/70 max-w-sm">
              {tagline}
            </p>
            <div className="space-y-3 pt-4 text-sm text-primary-foreground/80">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary shrink-0" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-secondary shrink-0" />
                <span>{phoneIntl}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary shrink-0" />
                <span>{email}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Services</h3>
            <ul className="space-y-3 text-primary-foreground/70 text-sm">
              <li><Link href="/services/air-freight" className="hover:text-secondary transition-colors">Air Freight</Link></li>
              <li><Link href="/services/ocean-freight" className="hover:text-secondary transition-colors">Ocean Freight</Link></li>
              <li><Link href="/services/rail-freight" className="hover:text-secondary transition-colors">Rail Freight</Link></li>
              <li><Link href="/services/road-freight" className="hover:text-secondary transition-colors">Road Freight</Link></li>
              <li><Link href="/services/customs-clearance" className="hover:text-secondary transition-colors">Customs Clearance</Link></li>
              <li><Link href="/services/warehousing" className="hover:text-secondary transition-colors">Warehousing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Company</h3>
            <ul className="space-y-3 text-primary-foreground/70 text-sm">
              <li><Link href="/about" className="hover:text-secondary transition-colors">About Us</Link></li>
              <li><Link href="/track" className="hover:text-secondary transition-colors">Track Shipment</Link></li>
              <li><Link href="/quote" className="hover:text-secondary transition-colors">Request a Quote</Link></li>
              <li><Link href="/news" className="hover:text-secondary transition-colors">News & Updates</Link></li>
              <li><Link href="/faq" className="hover:text-secondary transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-secondary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Legal</h3>
            <ul className="space-y-3 text-primary-foreground/70 text-sm">
              <li><Link href="/legal/privacy-policy" className="hover:text-secondary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/terms-conditions" className="hover:text-secondary transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/legal/shipping-policy" className="hover:text-secondary transition-colors">Shipping Policy</Link></li>
              <li><Link href="/legal/restricted-items" className="hover:text-secondary transition-colors">Restricted Items</Link></li>
              <li><Link href="/legal/claims" className="hover:text-secondary transition-colors">Claims Policy</Link></li>
              <li><Link href="/legal/cookie-policy" className="hover:text-secondary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/50">
            &copy; {new Date().getFullYear()} {name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href={(socialCms ?? []).find(i => i.key === "linkedin")?.value ?? "#"} className="text-primary-foreground/50 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer"><Linkedin className="w-5 h-5" /></a>
            <a href={(socialCms ?? []).find(i => i.key === "twitter")?.value ?? "#"} className="text-primary-foreground/50 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer"><Twitter className="w-5 h-5" /></a>
            <a href={(socialCms ?? []).find(i => i.key === "facebook")?.value ?? "#"} className="text-primary-foreground/50 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer"><Facebook className="w-5 h-5" /></a>
            <a href={(socialCms ?? []).find(i => i.key === "wechat")?.value ?? "#"} className="text-primary-foreground/50 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer"><SiWechat className="w-5 h-5" /></a>
          </div>
        </div>
      </div>

      {showCookie && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-50 shadow-2xl text-foreground">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              We use cookies to ensure you get the best experience on our website. By continuing to use our site, you agree to our use of cookies. <Link href="/legal/cookie-policy" className="text-primary underline">Learn more</Link>
            </p>
            <Button onClick={acceptCookies} className="shrink-0" data-testid="button-accept-cookies">Accept Cookies</Button>
          </div>
        </div>
      )}
    </footer>
  );
}
