import { useState } from 'react';
import {
  useGetShipment, useUpdateShipment,
  useListTrackingEvents, useAddTrackingEvent, useUpdateTrackingEvent, useDeleteTrackingEvent,
  useListHolds, useCreateHold, useReleaseHold,
  getGetShipmentQueryKey, getListTrackingEventsQueryKey, getListHoldsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowLeft, Plus, Trash2, Edit2, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const STATUSES = ['pending', 'processing', 'in_transit', 'customs_review', 'delivered', 'held', 'archived'];
const HOLD_REASONS = ['customs_clearance', 'payment_pending', 'documentation_required', 'address_verification', 'security_review', 'recipient_unavailable', 'other'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700', processing: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-amber-100 text-amber-700', customs_review: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700', held: 'bg-red-100 text-red-700', archived: 'bg-gray-100 text-gray-500',
};

export default function ShipmentDetailPage({ id }: { id: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: shipment, isLoading } = useGetShipment(id, { query: { enabled: !!id } });
  const { data: events } = useListTrackingEvents(id, { query: { enabled: !!id } });
  const { data: holds } = useListHolds(id, { query: { enabled: !!id } });

  const updateShipment = useUpdateShipment();
  const addEvent = useAddTrackingEvent();
  const updateEvent = useUpdateTrackingEvent();
  const deleteEvent = useDeleteTrackingEvent();
  const createHold = useCreateHold();
  const releaseHold = useReleaseHold();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [eventOpen, setEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState<any>({});
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [editEventForm, setEditEventForm] = useState<any>({});
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdForm, setHoldForm] = useState<any>({});

  function openEdit() {
    setEditForm({ ...shipment });
    setEditOpen(true);
  }

  function handleUpdate() {
    updateShipment.mutate({ id, data: editForm }, {
      onSuccess: () => {
        toast({ title: 'Shipment updated' });
        qc.invalidateQueries({ queryKey: getGetShipmentQueryKey(id) });
        setEditOpen(false);
      },
      onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
    });
  }

  function handleAddEvent() {
    addEvent.mutate({ id, data: { ...eventForm, shipment_id: id } }, {
      onSuccess: () => {
        toast({ title: 'Event added' });
        qc.invalidateQueries({ queryKey: getListTrackingEventsQueryKey(id) });
        setEventOpen(false);
        setEventForm({});
      },
      onError: () => toast({ title: 'Failed to add event', variant: 'destructive' }),
    });
  }

  function handleDeleteEvent(eventId: string) {
    deleteEvent.mutate({ id: eventId }, {
      onSuccess: () => {
        toast({ title: 'Event deleted' });
        qc.invalidateQueries({ queryKey: getListTrackingEventsQueryKey(id) });
      },
    });
  }

  function handleCreateHold() {
    createHold.mutate({ id, data: { ...holdForm, shipment_id: id } }, {
      onSuccess: () => {
        toast({ title: 'Hold created' });
        qc.invalidateQueries({ queryKey: getListHoldsQueryKey(id) });
        setHoldOpen(false);
        setHoldForm({});
      },
      onError: () => toast({ title: 'Failed to create hold', variant: 'destructive' }),
    });
  }

  function handleReleaseHold(holdId: string) {
    releaseHold.mutate({ id: holdId }, {
      onSuccess: () => {
        toast({ title: 'Hold released' });
        qc.invalidateQueries({ queryKey: getListHoldsQueryKey(id) });
      },
    });
  }

  const eventsArr = Array.isArray(events) ? events : [];
  const holdsArr = Array.isArray(holds) ? holds : [];
  const activeHolds = holdsArr.filter((h: any) => h.is_active);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!shipment) {
    return <div className="p-6 text-muted-foreground">Shipment not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/shipments">
            <a className="p-1.5 hover:bg-muted rounded-lg transition-colors"><ArrowLeft size={16} /></a>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono">{(shipment as any).tracking_number}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[(shipment as any).status] ?? ''}`}>
                {(shipment as any).status?.replace('_', ' ')}
              </span>
              {activeHolds.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <AlertTriangle size={10} /> {activeHolds.length} hold{activeHolds.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {(shipment as any).origin_city}, {(shipment as any).origin_country} → {(shipment as any).destination_city}, {(shipment as any).destination_country}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={openEdit}><Edit2 size={13} className="mr-1" /> Edit</Button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Service', (shipment as any).service_type?.replace('_', ' ')],
          ['Weight', (shipment as any).weight_kg ? `${(shipment as any).weight_kg} kg` : '—'],
          ['Est. Delivery', (shipment as any).estimated_delivery ? new Date((shipment as any).estimated_delivery).toLocaleDateString() : '—'],
          ['Actual Delivery', (shipment as any).actual_delivery ? new Date((shipment as any).actual_delivery).toLocaleDateString() : '—'],
        ].map(([label, val]) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground mt-1">{val || '—'}</p>
          </div>
        ))}
      </div>

      {(shipment as any).notes && (
        <div className="bg-muted/40 rounded-xl p-4 text-sm text-foreground">
          <span className="font-medium">Notes: </span>{(shipment as any).notes}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tracking Events */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Tracking Events</h2>
            <Button size="sm" variant="outline" onClick={() => setEventOpen(true)}>
              <Plus size={12} className="mr-1" /> Add
            </Button>
          </div>
          <div className="divide-y divide-border">
            {eventsArr.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No events yet</p>
            ) : eventsArr.map((ev: any) => (
              <div key={ev.id} className="px-5 py-3 flex items-start justify-between group">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[ev.status] ? 'bg-amber-400' : 'bg-slate-400'}`} />
                    <span className="text-xs font-medium text-foreground">{ev.status?.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-4">{ev.location}</p>
                  {ev.description && <p className="text-xs text-muted-foreground ml-4">{ev.description}</p>}
                  <p className="text-xs text-muted-foreground ml-4">{new Date(ev.event_date || ev.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Holds */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Package Holds</h2>
            <Button size="sm" variant="outline" onClick={() => setHoldOpen(true)}>
              <Lock size={12} className="mr-1" /> Add Hold
            </Button>
          </div>
          <div className="divide-y divide-border">
            {holdsArr.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No holds</p>
            ) : holdsArr.map((hold: any) => (
              <div key={hold.id} className="px-5 py-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${hold.is_active ? 'bg-red-500' : 'bg-green-500'}`} />
                    <span className="text-xs font-medium text-foreground">{hold.reason?.replace('_', ' ')}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${hold.is_active ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {hold.is_active ? 'Active' : 'Released'}
                    </span>
                  </div>
                  {hold.notes && <p className="text-xs text-muted-foreground mt-0.5 ml-4">{hold.notes}</p>}
                  <p className="text-xs text-muted-foreground ml-4">{new Date(hold.created_at).toLocaleString()}</p>
                </div>
                {hold.is_active && (
                  <button
                    onClick={() => handleReleaseHold(hold.id)}
                    className="p-1 hover:bg-green-50 hover:text-green-600 rounded transition-all"
                    title="Release hold"
                  >
                    <Unlock size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Shipment</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['origin_city', 'Origin City'], ['origin_country', 'Origin Country'],
              ['destination_city', 'Destination City'], ['destination_country', 'Destination Country'],
            ].map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input className="h-8 text-sm mt-1" value={editForm[key] ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={editForm.status ?? ''} onValueChange={v => setEditForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Weight (kg)</Label>
              <Input type="number" className="h-8 text-sm mt-1" value={editForm.weight_kg ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, weight_kg: parseFloat(e.target.value) }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea className="text-sm mt-1" rows={3} value={editForm.notes ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleUpdate} disabled={updateShipment.isPending}>
              {updateShipment.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Tracking Event</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={eventForm.status ?? ''} onValueChange={v => setEventForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select status..." /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Input className="h-8 text-sm mt-1" value={eventForm.location ?? ''} onChange={e => setEventForm((f: any) => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea className="text-sm mt-1" rows={2} value={eventForm.description ?? ''} onChange={e => setEventForm((f: any) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Event Date</Label>
              <Input type="datetime-local" className="h-8 text-sm mt-1" value={eventForm.event_date ?? ''} onChange={e => setEventForm((f: any) => ({ ...f, event_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEventOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddEvent} disabled={addEvent.isPending}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Hold Dialog */}
      <Dialog open={holdOpen} onOpenChange={setHoldOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Hold</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Reason</Label>
              <Select value={holdForm.reason ?? ''} onValueChange={v => setHoldForm((f: any) => ({ ...f, reason: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                <SelectContent>{HOLD_REASONS.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea className="text-sm mt-1" rows={3} value={holdForm.notes ?? ''} onChange={e => setHoldForm((f: any) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setHoldOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateHold} disabled={createHold.isPending}>Create Hold</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
