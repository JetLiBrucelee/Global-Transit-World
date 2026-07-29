import { format } from "date-fns";
import { Bell, BellOff, CheckCheck, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "./PortalLayout";
import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const TYPE_COLORS: Record<string, string> = {
  status_update: "bg-blue-100 text-blue-800",
  held: "bg-red-100 text-red-800",
  delivered: "bg-green-100 text-green-800",
  customs: "bg-yellow-100 text-yellow-800",
};

export default function Notifications() {
  const qc = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications(
    { unreadOnly: false },
    { query: { queryKey: ["notifications", "all"], retry: false } }
  );
  const { mutateAsync: markRead } = useMarkNotificationRead();
  const { mutateAsync: markAllRead } = useMarkAllNotificationsRead();

  const unreadCount = (notifications ?? []).filter(n => !n.isRead).length;

  async function handleMarkRead(id: string) {
    await markRead({ id });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function handleMarkAllRead() {
    await markAllRead();
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <PortalLayout title="Notifications">
      {/* Header actions */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${(notifications ?? []).length} total`}
          </span>
          {unreadCount > 0 && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (notifications ?? []).length === 0 ? (
        <Card className="p-12 text-center">
          <BellOff className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-primary mb-2">No notifications yet</h3>
          <p className="text-sm text-muted-foreground">
            Save shipments to your account and receive status updates here.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(notifications ?? []).map(n => (
            <Card
              key={n.id}
              className={`p-4 transition-colors ${!n.isRead ? "bg-blue-50/40 border-blue-100" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? "bg-blue-100" : "bg-slate-100"}`}>
                  {n.shipmentId ? (
                    <Package className={`w-4 h-4 ${!n.isRead ? "text-blue-600" : "text-slate-500"}`} />
                  ) : (
                    <Bell className={`w-4 h-4 ${!n.isRead ? "text-blue-600" : "text-slate-500"}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold ${!n.isRead ? "text-primary" : "text-foreground/80"}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                        {n.type && TYPE_COLORS[n.type] && (
                          <Badge className={`text-[10px] px-1.5 py-0 ${TYPE_COLORS[n.type]}`}>
                            {n.type.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {format(new Date(n.createdAt), "MMM d, yyyy · h:mm a")}
                        {n.channel !== "email" && ` · via ${n.channel}`}
                      </p>
                    </div>
                    {!n.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground hover:text-primary shrink-0"
                        onClick={() => handleMarkRead(n.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
