import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Package, Bell, Settings, HelpCircle, ChevronRight
} from "lucide-react";
import { useListNotifications } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

function PortalSidebar() {
  const [location] = useLocation();
  const { data: notifications } = useListNotifications(
    { unreadOnly: true },
    { query: { queryKey: ["notifications", "unread"], retry: false } }
  );
  const unreadCount = (notifications ?? []).length;

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
    { label: "My Shipments", href: "/portal/shipments", icon: Package },
    { label: "Notifications", href: "/portal/notifications", icon: Bell, badge: unreadCount },
    { label: "Settings", href: "/portal/settings", icon: Settings },
    { label: "Support", href: "/portal/support", icon: HelpCircle },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col">
      <nav className="space-y-1">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const isActive = location === href || (href !== "/portal" && location.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-foreground/70 hover:bg-slate-100 hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-secondary" : "")} />
              <span className="flex-1">{label}</span>
              {badge != null && badge > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-red-500 text-white shrink-0">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function PortalMobileNav() {
  const [location] = useLocation();
  const { data: notifications } = useListNotifications(
    { unreadOnly: true },
    { query: { queryKey: ["notifications", "unread"], retry: false } }
  );
  const unreadCount = (notifications ?? []).length;

  const navItems = [
    { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
    { label: "Shipments", href: "/portal/shipments", icon: Package },
    { label: "Alerts", href: "/portal/notifications", icon: Bell, badge: unreadCount },
    { label: "Settings", href: "/portal/settings", icon: Settings },
    { label: "Support", href: "/portal/support", icon: HelpCircle },
  ];

  return (
    <nav className="md:hidden flex overflow-x-auto gap-1 pb-2 border-b border-border/50 mb-6">
      {navItems.map(({ label, href, icon: Icon, badge }) => {
        const isActive = location === href || (href !== "/portal" && location.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium shrink-0 transition-colors relative",
              isActive
                ? "bg-primary text-white"
                : "text-foreground/60 hover:bg-slate-100"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-secondary" : "")} />
            {label}
            {badge != null && badge > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 text-[9px] font-bold rounded-full bg-red-500 text-white flex items-center justify-center">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalLayout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {title && (
          <h1 className="text-2xl font-bold text-primary mb-6">{title}</h1>
        )}
        <PortalMobileNav />
        <div className="flex gap-8">
          <PortalSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
