import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Package, Bell, ChevronRight, Truck, AlertTriangle, CheckCircle2,
  Clock, ArrowRight, Settings, HelpCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "./PortalLayout";
import { useGetMySavedShipments, useListNotifications, useGetMyCustomerProfile, getGetMyCustomerProfileQueryKey } from "@workspace/api-client-react";

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-green-100 text-green-800",
  in_transit: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  customs_review: "bg-yellow-100 text-yellow-800",
  held: "bg-red-100 text-red-800",
  pending: "bg-slate-100 text-slate-700",
};

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function statusColor(s: string) {
  return STATUS_COLORS[s] ?? "bg-slate-100 text-slate-700";
}

function statusIcon(status: string) {
  if (status === "delivered") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === "held") return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (status === "in_transit" || status === "out_for_delivery") return <Truck className="w-4 h-4 text-blue-500" />;
  return <Clock className="w-4 h-4 text-slate-400" />;
}

export default function PortalDashboard() {
  const { user } = useUser();
  const { data: savedShipments, isLoading: shipmentsLoading } = useGetMySavedShipments();
  const { data: notifications, isLoading: notifLoading } = useListNotifications(
    { unreadOnly: false },
    { query: { queryKey: ["notifications", "all"], retry: false } }
  );
  const { data: profile } = useGetMyCustomerProfile({ query: { retry: false, queryKey: getGetMyCustomerProfileQueryKey() } });

  const unreadCount = (notifications ?? []).filter(n => !n.isRead).length;
  const displayName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "there";

  const recentShipments = (savedShipments ?? []).slice(0, 3);
  const recentNotifications = (notifications ?? []).slice(0, 3);

  return (
    <PortalLayout>
      {/* Welcome banner */}
      <div className="bg-primary text-white rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm mb-1">Welcome back</p>
            <h2 className="text-xl font-bold">{displayName}</h2>
            <p className="text-white/70 text-sm mt-1">
              {savedShipments ? `${savedShipments.length} saved shipment${savedShipments.length !== 1 ? "s" : ""}` : "Loading…"}
              {unreadCount > 0 && ` · ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="hidden sm:flex gap-2">
            <Link href="/portal/notifications">
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Bell className="w-4 h-4 mr-2" />
                {unreadCount > 0 ? `${unreadCount} New` : "Alerts"}
              </Button>
            </Link>
            <Link href="/track">
              <Button size="sm" className="bg-secondary text-primary font-bold hover:bg-secondary/90">
                Track a Shipment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Saved shipments */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary flex items-center gap-2">
              <Package className="w-4 h-4 text-secondary" /> Saved Shipments
            </h3>
            <Link href="/portal/shipments" className="text-xs text-secondary font-semibold hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {shipmentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : recentShipments.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No saved shipments yet</p>
              <Link href="/track">
                <Button size="sm" variant="outline">Track & Save a Shipment</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentShipments.map(s => (
                <Link
                  key={s.id}
                  href={`/track/${s.shipment?.trackingNumber}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-border/50 transition-all group"
                >
                  {statusIcon(s.shipment?.status ?? "")}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-primary truncate">
                        {s.shipment?.trackingNumber}
                      </span>
                      {s.nickname && (
                        <span className="text-xs text-muted-foreground truncate">— {s.nickname}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge className={`text-xs px-1.5 py-0 ${statusColor(s.shipment?.status ?? "")}`}>
                        {formatStatus(s.shipment?.status ?? "unknown")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {s.shipment?.originCity} → {s.shipment?.destinationCity}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent notifications */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary flex items-center gap-2">
              <Bell className="w-4 h-4 text-secondary" /> Recent Alerts
            </h3>
            <Link href="/portal/notifications" className="text-xs text-secondary font-semibold hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {notifLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentNotifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border transition-colors ${!n.isRead ? "bg-blue-50/50 border-blue-100" : "bg-white border-transparent"}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {format(new Date(n.createdAt), "MMM d · h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { label: "Track New", href: "/track", icon: Package, color: "text-blue-600 bg-blue-50" },
          { label: "Get a Quote", href: "/quote", icon: Truck, color: "text-amber-600 bg-amber-50" },
          { label: "Notifications", href: "/portal/notifications", icon: Bell, color: "text-purple-600 bg-purple-50" },
          { label: "Settings", href: "/portal/settings", icon: Settings, color: "text-slate-600 bg-slate-100" },
          { label: "Support", href: "/portal/support", icon: HelpCircle, color: "text-green-600 bg-green-50" },
        ].slice(0, 4).map(item => (
          <Link key={item.href} href={item.href}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
              <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center mb-2`}>
                <item.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-primary group-hover:text-secondary transition-colors">{item.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </PortalLayout>
  );
}
