import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetCmsSection, useListNotifications } from "@workspace/api-client-react";
import { Menu, X, ChevronDown, Bell, LogOut, Settings, LayoutDashboard, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Show, useClerk, useUser } from "@clerk/react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { data: companyCms } = useGetCmsSection("company", { query: { queryKey: ["cms", "company"] } });
  const { signOut } = useClerk();
  const { user } = useUser();

  const shortName = (companyCms ?? []).find(i => i.key === "short_name")?.value ?? "STG";
  const name = (companyCms ?? []).find(i => i.key === "name")?.value ?? "Sinovera Transit Global";

  // Unread notifications count (only for signed-in users)
  const { data: notifications } = useListNotifications(
    { unreadOnly: true },
    { query: { queryKey: ["notifications", "unread"], retry: false } }
  );
  const unreadCount = (notifications ?? []).length;

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" data-testid="link-home">
          <img
            src="/logo-3d.png"
            alt="STG"
            className="h-12 w-auto object-contain drop-shadow-sm"
          />
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-primary group-hover:text-secondary transition-colors">
              {name}
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <div className="group relative">
            <button className="flex items-center gap-1 font-medium text-sm text-foreground/80 hover:text-foreground py-2" data-testid="nav-services">
              Services <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-[600px] bg-white border shadow-xl rounded-lg p-6 grid grid-cols-2 gap-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto transform translate-y-2 group-hover:translate-y-0">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Core Freight</h3>
                <Link href="/services/air-freight" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors group/item">
                  <img src="/icons/3d-air-freight.png" alt="Air Freight" className="w-10 h-10 shrink-0 object-contain drop-shadow-md group-hover/item:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-primary">Air Freight</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Express global delivery</div>
                  </div>
                </Link>
                <Link href="/services/ocean-freight" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors group/item">
                  <img src="/icons/3d-ocean-freight.png" alt="Ocean Freight" className="w-10 h-10 shrink-0 object-contain drop-shadow-md group-hover/item:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-primary">Ocean Freight</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Cost-effective FCL & LCL</div>
                  </div>
                </Link>
                <Link href="/services/rail-freight" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors group/item">
                  <img src="/icons/3d-rail-freight.png" alt="Rail Freight" className="w-10 h-10 shrink-0 object-contain drop-shadow-md group-hover/item:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-primary">Rail Freight</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Eurasian land bridge</div>
                  </div>
                </Link>
                <Link href="/services/road-freight" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors group/item">
                  <img src="/icons/3d-road-freight.png" alt="Road Freight" className="w-10 h-10 shrink-0 object-contain drop-shadow-md group-hover/item:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-primary">Road Freight</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Cross-border trucking</div>
                  </div>
                </Link>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Logistics Solutions</h3>
                <Link href="/services/customs-clearance" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors group/item">
                  <img src="/icons/3d-customs-clearance.png" alt="Customs Clearance" className="w-10 h-10 shrink-0 object-contain drop-shadow-md group-hover/item:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-primary">Customs Clearance</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Hassle-free import/export</div>
                  </div>
                </Link>
                <Link href="/services/warehousing" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors group/item">
                  <img src="/icons/3d-warehousing.png" alt="Warehousing" className="w-10 h-10 shrink-0 object-contain drop-shadow-md group-hover/item:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-primary">Warehousing</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Secure storage & fulfillment</div>
                  </div>
                </Link>
                <Link href="/services/international-shipping" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors group/item">
                  <img src="/icons/3d-intl-shipping.png" alt="Intl. Shipping" className="w-10 h-10 shrink-0 object-contain drop-shadow-md group-hover/item:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-primary">Intl. Shipping</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Door-to-door global network</div>
                  </div>
                </Link>
                <div className="pt-4 mt-4 border-t border-border/50">
                  <Link href="/services" className="text-sm font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1">
                    View all services &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <Link href="/track" className="font-medium text-sm text-foreground/80 hover:text-foreground">Track</Link>
          <Link href="/about" className="font-medium text-sm text-foreground/80 hover:text-foreground">About</Link>
          <Link href="/news" className="font-medium text-sm text-foreground/80 hover:text-foreground">News</Link>
          <Link href="/contact" className="font-medium text-sm text-foreground/80 hover:text-foreground">Contact</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="outline" size="sm" className="font-semibold border-primary/30 hover:border-primary">
                Sign In
              </Button>
            </Link>
            <Link href="/quote" data-testid="link-quote-nav">
              <Button className="bg-secondary text-primary hover:bg-secondary/90 font-bold px-6">
                Get a Quote
              </Button>
            </Link>
          </Show>

          <Show when="signed-in">
            {/* Notification bell */}
            <Link href="/portal/notifications" className="relative p-2 text-foreground/70 hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            <div className="group relative">
              <button className="flex items-center gap-2 rounded-full border border-border/50 px-3 py-1.5 hover:border-primary/40 transition-colors bg-white">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="text-sm font-medium text-foreground/80 max-w-[120px] truncate">
                  {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? 'Account'}
                </span>
                <ChevronDown className="w-3 h-3 text-foreground/50 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full right-0 mt-1 w-52 bg-white border shadow-lg rounded-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto">
                <Link href="/portal" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-sm font-medium text-foreground">
                  <LayoutDashboard className="w-4 h-4 text-secondary" /> My Dashboard
                </Link>
                <Link href="/portal/shipments" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-sm font-medium text-foreground">
                  <Package className="w-4 h-4 text-secondary" /> My Shipments
                </Link>
                <Link href="/portal/settings" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-sm font-medium text-foreground">
                  <Settings className="w-4 h-4 text-secondary" /> Settings
                </Link>
                <div className="border-t border-border/50 mt-1 pt-1">
                  <button
                    onClick={() => signOut({ redirectUrl: window.location.origin + (import.meta.env.BASE_URL || '/') })}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-sm font-medium text-foreground w-full text-left"
                  >
                    <LogOut className="w-4 h-4 text-muted-foreground" /> Sign Out
                  </button>
                </div>
              </div>
            </div>

            <Link href="/quote" data-testid="link-quote-nav">
              <Button className="bg-secondary text-primary hover:bg-secondary/90 font-bold px-5">
                Get a Quote
              </Button>
            </Link>
          </Show>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsOpen(!isOpen)}
          data-testid="button-mobile-menu"
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t bg-white p-4 space-y-4">
          <div className="flex flex-col space-y-3">
            <Link href="/services" className="font-medium text-lg py-2 border-b">Services</Link>
            <Link href="/track" className="font-medium text-lg py-2 border-b">Track Shipment</Link>
            <Link href="/about" className="font-medium text-lg py-2 border-b">About Us</Link>
            <Link href="/news" className="font-medium text-lg py-2 border-b">News</Link>
            <Link href="/contact" className="font-medium text-lg py-2 border-b">Contact</Link>

            <Show when="signed-in">
              <Link href="/portal" className="font-medium text-lg py-2 border-b flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-secondary" /> My Portal
              </Link>
            </Show>

            <Show when="signed-out">
              <Link href="/sign-in" className="py-2">
                <Button variant="outline" className="w-full font-semibold border-primary/30">Sign In</Button>
              </Link>
            </Show>

            <Show when="signed-in">
              <button
                onClick={() => signOut({ redirectUrl: window.location.origin + (import.meta.env.BASE_URL || '/') })}
                className="text-left font-medium text-lg py-2 text-muted-foreground"
              >
                Sign Out
              </button>
            </Show>

            <Link href="/quote" className="py-2">
              <Button className="w-full bg-secondary text-primary hover:bg-secondary/90 font-bold">
                Get a Quote
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
