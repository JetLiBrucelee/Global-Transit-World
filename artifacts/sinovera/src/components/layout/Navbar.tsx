import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetCmsSection } from "@workspace/api-client-react";
import { Menu, X, ChevronDown, Package, ShieldCheck, Globe, Anchor, Plane, Truck, Train } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { data: companyCms } = useGetCmsSection("company", { query: { queryKey: ["cms", "company"] } });
  
  const shortName = (companyCms ?? []).find(i => i.key === "short_name")?.value ?? "STG";
  const name = (companyCms ?? []).find(i => i.key === "name")?.value ?? "Sinovera Transit Global";

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full transition-shadow duration-300 bg-[#0f172a] ${scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.35)]" : "shadow-none"}`}>
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group" data-testid="link-home">
          <div className="w-10 h-10 bg-[#f5a623] flex items-center justify-center font-black text-[#0f172a] text-lg rounded-md tracking-tight select-none">
            {shortName}
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-extrabold text-white text-base tracking-tight group-hover:text-[#f5a623] transition-colors duration-200">
              {name}
            </span>
            <span className="text-white/40 text-[10px] font-medium tracking-widest uppercase mt-0.5">International Freight</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7">
          {/* Services mega-menu */}
          <div className="group relative">
            <button className="flex items-center gap-1 font-medium text-sm text-white/75 hover:text-white py-2 transition-colors" data-testid="nav-services">
              Services <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-[620px] bg-[#0f172a] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] rounded-xl p-6 grid grid-cols-2 gap-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto transform translate-y-2 group-hover:translate-y-0 mt-1">
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/35 mb-3 px-2">Core Freight</h3>
                <Link href="/services/air-freight" className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 rounded-lg transition-colors group/item">
                  <div className="w-8 h-8 rounded-lg bg-[#f5a623]/15 flex items-center justify-center shrink-0">
                    <Plane className="w-4 h-4 text-[#f5a623]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm group-hover/item:text-[#f5a623] transition-colors">Air Freight</div>
                    <div className="text-xs text-white/45 mt-0.5">Express global delivery</div>
                  </div>
                </Link>
                <Link href="/services/ocean-freight" className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 rounded-lg transition-colors group/item">
                  <div className="w-8 h-8 rounded-lg bg-[#f5a623]/15 flex items-center justify-center shrink-0">
                    <Anchor className="w-4 h-4 text-[#f5a623]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm group-hover/item:text-[#f5a623] transition-colors">Ocean Freight</div>
                    <div className="text-xs text-white/45 mt-0.5">Cost-effective FCL & LCL</div>
                  </div>
                </Link>
                <Link href="/services/rail-freight" className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 rounded-lg transition-colors group/item">
                  <div className="w-8 h-8 rounded-lg bg-[#f5a623]/15 flex items-center justify-center shrink-0">
                    <Train className="w-4 h-4 text-[#f5a623]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm group-hover/item:text-[#f5a623] transition-colors">Rail Freight</div>
                    <div className="text-xs text-white/45 mt-0.5">Eurasian land bridge</div>
                  </div>
                </Link>
                <Link href="/services/road-freight" className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 rounded-lg transition-colors group/item">
                  <div className="w-8 h-8 rounded-lg bg-[#f5a623]/15 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-[#f5a623]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm group-hover/item:text-[#f5a623] transition-colors">Road Freight</div>
                    <div className="text-xs text-white/45 mt-0.5">Cross-border trucking</div>
                  </div>
                </Link>
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/35 mb-3 px-2">Logistics Solutions</h3>
                <Link href="/services/customs-clearance" className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 rounded-lg transition-colors group/item">
                  <div className="w-8 h-8 rounded-lg bg-[#f5a623]/15 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#f5a623]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm group-hover/item:text-[#f5a623] transition-colors">Customs Clearance</div>
                    <div className="text-xs text-white/45 mt-0.5">Hassle-free import/export</div>
                  </div>
                </Link>
                <Link href="/services/warehousing" className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 rounded-lg transition-colors group/item">
                  <div className="w-8 h-8 rounded-lg bg-[#f5a623]/15 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-[#f5a623]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm group-hover/item:text-[#f5a623] transition-colors">Warehousing</div>
                    <div className="text-xs text-white/45 mt-0.5">Secure storage & fulfillment</div>
                  </div>
                </Link>
                <Link href="/services/international-shipping" className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 rounded-lg transition-colors group/item">
                  <div className="w-8 h-8 rounded-lg bg-[#f5a623]/15 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-[#f5a623]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm group-hover/item:text-[#f5a623] transition-colors">Intl. Shipping</div>
                    <div className="text-xs text-white/45 mt-0.5">Door-to-door global network</div>
                  </div>
                </Link>
                <div className="pt-3 mt-2 border-t border-white/10 px-3">
                  <Link href="/services" className="text-sm font-bold text-[#f5a623] hover:text-white transition-colors flex items-center gap-1">
                    View all services &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <Link href="/track" className="font-medium text-sm text-white/75 hover:text-white transition-colors">Track</Link>
          <Link href="/about" className="font-medium text-sm text-white/75 hover:text-white transition-colors">About</Link>
          <Link href="/news" className="font-medium text-sm text-white/75 hover:text-white transition-colors">News</Link>
          <Link href="/contact" className="font-medium text-sm text-white/75 hover:text-white transition-colors">Contact</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/quote" data-testid="link-quote-nav">
            <Button className="bg-[#f5a623] text-[#0f172a] hover:bg-[#f5a623]/90 font-bold px-6 shadow-[0_2px_12px_rgba(245,166,35,0.35)]">
              Get a Quote
            </Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 text-white" 
          onClick={() => setIsOpen(!isOpen)}
          data-testid="button-mobile-menu"
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0f172a] p-4 space-y-4">
          <div className="flex flex-col space-y-1">
            <Link href="/services" className="font-medium text-white/80 hover:text-white py-3 px-3 border-b border-white/10 hover:bg-white/5 rounded-md transition-colors">Services</Link>
            <Link href="/track" className="font-medium text-white/80 hover:text-white py-3 px-3 border-b border-white/10 hover:bg-white/5 rounded-md transition-colors">Track Shipment</Link>
            <Link href="/about" className="font-medium text-white/80 hover:text-white py-3 px-3 border-b border-white/10 hover:bg-white/5 rounded-md transition-colors">About Us</Link>
            <Link href="/news" className="font-medium text-white/80 hover:text-white py-3 px-3 border-b border-white/10 hover:bg-white/5 rounded-md transition-colors">News</Link>
            <Link href="/contact" className="font-medium text-white/80 hover:text-white py-3 px-3 border-b border-white/10 hover:bg-white/5 rounded-md transition-colors">Contact</Link>
            <Link href="/quote" className="py-2 pt-3">
              <Button className="w-full bg-[#f5a623] text-[#0f172a] hover:bg-[#f5a623]/90 font-bold">
                Get a Quote
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
