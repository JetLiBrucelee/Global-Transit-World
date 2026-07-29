import { useState } from 'react';
import {
  useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const TYPE_COLORS: Record<string, string> = {
  shipment_update: 'bg-blue-100 text-blue-700',
  hold_placed: 'bg-red-100 text-red-700',
  hold_released: 'bg-green-100 text-green-700',
  delivery: 'bg-green-100 text-green-700',
  delay: 'bg-amber-100 text-amber-700',
  customs: 'bg-purple-100 text-purple-700',
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListNotifications({
    unreadOnly: showUnreadOnly || undefined,
  });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const notifications: any[] = Array.isArray(data) ? data : [];
  const total = notifications.length;
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;
  // Client-side pagination since the API returns a flat array
  const PAGE_SIZE = 30;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pagedNotifications = notifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleMarkRead(id: string) {
    markRead.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  }

  function handleMarkAll() {
    markAll.mutate(undefined, {
      onSuccess: () => {
        toast({ title: 'All notifications marked as read' });
        qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      },
    });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            {total.toLocaleString()} total
            {unreadCount > 0 && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{unreadCount} unread</span>}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Select value={showUnreadOnly ? 'unread' : 'all'} onValueChange={v => { setShowUnreadOnly(v === 'unread'); setPage(1); }}>
            <SelectTrigger className="w-32 h-8 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread only</SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAll}>
              <CheckCheck size={13} className="mr-1" />Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4">
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        )) : notifications.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Bell size={32} className="mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">No notifications</p>
          </div>
        ) : pagedNotifications.map((n: any) => (
          <div
            key={n.id}
            className={`bg-card rounded-xl border border-border p-4 flex items-start justify-between gap-4 transition-colors ${!n.isRead ? 'border-l-4 border-l-primary' : ''}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[n.type] ?? 'bg-slate-100 text-slate-600'}`}>
                  {n.type?.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{n.channel}</span>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
              </div>
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            {!n.isRead && (
              <button
                onClick={() => handleMarkRead(n.id)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                title="Mark as read"
              >
                <Check size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
