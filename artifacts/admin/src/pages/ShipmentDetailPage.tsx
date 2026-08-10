import { useState } from 'react';
import {
  useGetShipment, useUpdateShipment, useDeleteShipment,
  useListTrackingEvents, useAddTrackingEvent, useUpdateTrackingEvent, useDeleteTrackingEvent,
  useListHolds, useCreateHold, useReleaseHold,
  useListWarehouses, useListCarriers,
  getGetShipmentQueryKey, getListTrackingEventsQueryKey, getListHoldsQueryKey, getListShipmentsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Plus, Trash2, Edit2, Lock, Unlock, AlertTriangle, QrCode, Printer, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const ALL_STATUSES = [
  'shipment_created','collected','at_warehouse','departed_warehouse','at_airport','departed_airport','at_deport','departed_deport',
  'in_transit','arrived_at_transit_hub','processing','out_for_delivery','delivered','delivery_failed',
  'returned','shipment_exception','delayed','cancelled','lost','damaged','awaiting_pickup',
  'customs_review','customs_hold','released','package_hold','security_inspection','operational_delay',
  'address_verification','receiver_unavailable','payment_pending','weather_delay','border_delay',
  'port_congestion','flight_delay','road_delay','warehouse_delay','custom',
];

const SHIPPING_METHODS = ['air_freight','ocean_freight','road_freight','rail_freight','express_air','standard_air','economy'];

const HOLD_REASONS = [
  'customs_clearance','payment_pending','documentation_required','address_verification',
  'security_review','recipient_unavailable','damaged_goods','regulatory_hold','other',
];

const STATUS_COLORS: Record<string, string> = {
  shipment_created: 'bg-slate-100 text-slate-700',
  in_transit: 'bg-amber-100 text-amber-700',
  delivered: 'bg-green-100 text-green-700',
  package_hold: 'bg-red-100 text-red-700',
  customs_review: 'bg-purple-100 text-purple-700',
  customs_hold: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-gray-100 text-gray-500',
  delayed: 'bg-orange-100 text-orange-700',
  processing: 'bg-blue-100 text-blue-700',
};

function statusColor(s: string) { return STATUS_COLORS[s] ?? 'bg-slate-100 text-slate-600'; }
function fmt(s?: string | null) { return s?.replace(/_/g, ' ') ?? '—'; }

export default function ShipmentDetailPage({ id }: { id: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: shipment, isLoading } = useGetShipment(id, { query: { enabled: !!id } as any });
  const { data: events } = useListTrackingEvents(id, { query: { enabled: !!id } as any });
  const { data: holds } = useListHolds(id, { query: { enabled: !!id } as any });
  const { data: warehousesData } = useListWarehouses();
  const { data: carriersData } = useListCarriers();

  const updateShipment = useUpdateShipment();
  const deleteShipment = useDeleteShipment();
  const addEvent = useAddTrackingEvent();
  const updateEvent = useUpdateTrackingEvent();
  const deleteEvent = useDeleteTrackingEvent();
  const createHold = useCreateHold();
  const releaseHold = useReleaseHold();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [eventOpen, setEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState<any>({ isPublic: true });
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [editEventForm, setEditEventForm] = useState<any>({});
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdForm, setHoldForm] = useState<any>({ notifyCustomer: true });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const warehouses = Array.isArray(warehousesData) ? warehousesData : [];
  const carriers = Array.isArray(carriersData) ? carriersData : [];
  const eventsArr: any[] = Array.isArray(events) ? events : [];
  const holdsArr: any[] = Array.isArray(holds) ? holds : [];
  const activeHolds = holdsArr.filter(h => h.isActive);

  const s = shipment as any;

  function openEdit() { setEditForm({ ...s }); setEditOpen(true); }

  function handleUpdate() {
    const { id: _id, createdAt: _ca, updatedAt: _ua, trackingNumber: _tn, isArchived: _ia, isHeld: _ih, ...rest } = editForm;
    // clean empty strings to undefined
    const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== '' && v !== null));
    updateShipment.mutate({ id, data: clean }, {
      onSuccess: () => { toast({ title: 'Shipment updated' }); qc.invalidateQueries({ queryKey: getGetShipmentQueryKey(id) }); setEditOpen(false); },
      onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
    });
  }

  function handleDelete() {
    deleteShipment.mutate({ id }, {
      onSuccess: () => { toast({ title: 'Shipment deleted' }); qc.invalidateQueries({ queryKey: getListShipmentsQueryKey() }); setLocation('/shipments'); },
      onError: () => toast({ title: 'Delete failed', variant: 'destructive' }),
    });
  }

  function localDateTimeNow() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  function toDateTimeInput(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openEditEvent(ev: any) {
    setEditingEventId(ev.id);
    setEditEventForm({
      status: ev.status ?? '',
      customStatus: ev.customStatus ?? '',
      description: ev.description ?? '',
      location: ev.location ?? '',
      facility: ev.facility ?? '',
      city: ev.city ?? '',
      country: ev.country ?? '',
      eventTime: ev.eventTime ? toDateTimeInput(ev.eventTime) : localDateTimeNow(),
      isPublic: ev.isPublic ?? true,
    });
    setEditEventOpen(true);
  }

  function handleUpdateEvent() {
    if (!editingEventId) return;
    if (!editEventForm.status) { toast({ title: 'Status is required', variant: 'destructive' }); return; }
    if (!editEventForm.description) { toast({ title: 'Description is required', variant: 'destructive' }); return; }
    if (!editEventForm.eventTime) { toast({ title: 'Date & time is required', variant: 'destructive' }); return; }
    updateEvent.mutate({ id, eventId: editingEventId, data: editEventForm }, {
      onSuccess: () => {
        toast({ title: 'Event updated' });
        qc.invalidateQueries({ queryKey: getListTrackingEventsQueryKey(id) });
        setEditEventOpen(false);
        setEditingEventId(null);
      },
      onError: () => toast({ title: 'Failed to update event', variant: 'destructive' }),
    });
  }

  function handleAddEvent() {
    const data = { ...eventForm };
    if (!data.status) { toast({ title: 'Status is required', variant: 'destructive' }); return; }
    if (!data.description) { toast({ title: 'Description is required', variant: 'destructive' }); return; }
    if (!data.eventTime) { toast({ title: 'Date & time is required', variant: 'destructive' }); return; }
    addEvent.mutate({ id, data }, {
      onSuccess: () => { toast({ title: 'Event added' }); qc.invalidateQueries({ queryKey: getListTrackingEventsQueryKey(id) }); setEventOpen(false); setEventForm({ isPublic: true }); },
      onError: () => toast({ title: 'Failed to add event', variant: 'destructive' }),
    });
  }

  function handleDeleteEvent(eventId: string) {
    deleteEvent.mutate({ id, eventId }, {
      onSuccess: () => { toast({ title: 'Event deleted' }); qc.invalidateQueries({ queryKey: getListTrackingEventsQueryKey(id) }); },
    });
  }

  function handleCreateHold() {
    if (!holdForm.reason) { toast({ title: 'Reason is required', variant: 'destructive' }); return; }
    if (!holdForm.publicMessage) { toast({ title: 'Public message is required', variant: 'destructive' }); return; }
    createHold.mutate({ id, data: holdForm }, {
      onSuccess: () => { toast({ title: 'Hold created' }); qc.invalidateQueries({ queryKey: getListHoldsQueryKey(id) }); qc.invalidateQueries({ queryKey: getGetShipmentQueryKey(id) }); setHoldOpen(false); setHoldForm({ notifyCustomer: true }); },
      onError: () => toast({ title: 'Failed to create hold', variant: 'destructive' }),
    });
  }

  function handleReleaseHold(holdId: string) {
    releaseHold.mutate({ id, holdId }, {
      onSuccess: () => { toast({ title: 'Hold released' }); qc.invalidateQueries({ queryKey: getListHoldsQueryKey(id) }); qc.invalidateQueries({ queryKey: getGetShipmentQueryKey(id) }); },
    });
  }

  function handlePrint() { window.print(); }

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-2 gap-4">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-16 rounded-xl" />)}</div>
    </div>
  );

  if (!s) return <div className="p-6 text-muted-foreground">Shipment not found</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/shipments"><a className="p-1.5 hover:bg-muted rounded-lg transition-colors"><ArrowLeft size={16} /></a></Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold font-mono">{s.trackingNumber}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(s.status)}`}>{fmt(s.status)}</span>
              {activeHolds.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <AlertTriangle size={10} /> {activeHolds.length} active hold{activeHolds.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{s.originCity}, {s.originCountry} → {s.destinationCity}, {s.destinationCountry}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer size={13} className="mr-1" />Print</Button>
          <Button size="sm" variant="outline" onClick={() => setQrOpen(true)}><QrCode size={13} className="mr-1" />QR</Button>
          <Button size="sm" variant="outline" onClick={openEdit}><Edit2 size={13} className="mr-1" />Edit</Button>
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setDeleteOpen(true)}><Trash2 size={13} className="mr-1" />Delete</Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Method', fmt(s.shippingMethod)],
          ['Weight', s.weightKg ? `${s.weightKg} kg` : '—'],
          ['Packages', s.numberOfPackages?.toString()],
          ['Service Type', fmt(s.serviceType)],
          ['Est. Delivery', s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString() : '—'],
          ['Actual Delivery', s.actualDelivery ? new Date(s.actualDelivery).toLocaleDateString() : '—'],
          ['Carrier', carriers.find((c: any) => c.id === s.carrierId)?.name ?? '—'],
          ['Warehouse', warehouses.find((w: any) => w.id === s.warehouseId)?.name ?? '—'],
        ].map(([label, val]) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground mt-1">{val || '—'}</p>
          </div>
        ))}
      </div>

      {/* Sender / Receiver */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sender</p>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{s.senderName}</p>
            {s.senderPhone && <p className="text-xs text-muted-foreground">{s.senderPhone}</p>}
            {s.senderEmail && <p className="text-xs text-muted-foreground">{s.senderEmail}</p>}
            {s.senderAddress && <p className="text-xs text-muted-foreground">{s.senderAddress}</p>}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Receiver</p>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{s.receiverName}</p>
            {s.receiverPhone && <p className="text-xs text-muted-foreground">{s.receiverPhone}</p>}
            {s.receiverEmail && <p className="text-xs text-muted-foreground">{s.receiverEmail}</p>}
            {s.receiverAddress && <p className="text-xs text-muted-foreground">{s.receiverAddress}</p>}
          </div>
        </div>
      </div>

      {/* Current Location */}
      {(s.currentLocation || s.currentCity) && (
        <div className="bg-muted/40 rounded-xl p-4 text-sm flex items-center gap-2">
          <Package size={14} className="text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">Current location:</span>
          <span className="font-medium">{[s.currentFacility, s.currentLocation, s.currentCity, s.currentCountry].filter(Boolean).join(', ')}</span>
        </div>
      )}

      {s.internalNotes && (
        <div className="bg-muted/40 rounded-xl p-4 text-sm"><span className="font-medium text-muted-foreground">Internal notes: </span>{s.internalNotes}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tracking Events */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Tracking Events ({eventsArr.length})</h2>
            <Button size="sm" variant="outline" onClick={() => { setEventForm({ isPublic: true, eventTime: localDateTimeNow() }); setEventOpen(true); }}><Plus size={12} className="mr-1" />Add</Button>
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {eventsArr.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No events yet</p>
            ) : [...eventsArr].sort((a, b) => new Date(b.eventTime ?? b.createdAt).getTime() - new Date(a.eventTime ?? a.createdAt).getTime()).map((ev: any) => (
              <div key={ev.id} className="px-5 py-3 flex items-start justify-between group">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor(ev.status).includes('amber') ? 'bg-amber-400' : statusColor(ev.status).includes('green') ? 'bg-green-400' : 'bg-slate-400'}`} />
                    <span className="text-xs font-medium text-foreground">{ev.customStatus || fmt(ev.status)}</span>
                    {!ev.isPublic && <span className="text-xs bg-muted px-1 rounded">internal</span>}
                  </div>
                  {ev.description && <p className="text-xs text-muted-foreground mt-0.5 ml-4">{ev.description}</p>}
                  {(ev.location || ev.city) && <p className="text-xs text-muted-foreground ml-4">{[ev.facility, ev.location, ev.city, ev.country].filter(Boolean).join(', ')}</p>}
                  <p className="text-xs text-muted-foreground ml-4">{new Date(ev.eventTime ?? ev.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                  <button onClick={() => openEditEvent(ev)} className="p-1 hover:bg-blue-50 hover:text-blue-600 rounded transition-all" title="Edit event">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDeleteEvent(ev.id)} className="p-1 hover:bg-red-50 hover:text-red-600 rounded transition-all" title="Delete event">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Holds */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Package Holds ({holdsArr.length})</h2>
            <Button size="sm" variant="outline" onClick={() => setHoldOpen(true)}><Lock size={12} className="mr-1" />Place Hold</Button>
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {holdsArr.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No holds</p>
            ) : holdsArr.map((hold: any) => (
              <div key={hold.id} className="px-5 py-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${hold.isActive ? 'bg-red-500' : 'bg-green-500'}`} />
                    <span className="text-xs font-medium">{fmt(hold.reason)}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${hold.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{hold.isActive ? 'Active' : 'Released'}</span>
                    {hold.notifyCustomer && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">notified</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-4">{hold.publicMessage}</p>
                  {hold.internalNote && <p className="text-xs text-muted-foreground ml-4 italic">Note: {hold.internalNote}</p>}
                  {hold.expectedResolutionDate && <p className="text-xs text-muted-foreground ml-4">Expected: {new Date(hold.expectedResolutionDate).toLocaleDateString()}</p>}
                  {(hold.location || hold.city) && <p className="text-xs text-muted-foreground ml-4">{[hold.facility, hold.location, hold.city, hold.country].filter(Boolean).join(', ')}</p>}
                  <p className="text-xs text-muted-foreground ml-4">{new Date(hold.createdAt).toLocaleString()}</p>
                </div>
                {hold.isActive && (
                  <button onClick={() => handleReleaseHold(hold.id)} className="p-1 hover:bg-green-50 hover:text-green-600 rounded transition-all ml-2" title="Release hold"><Unlock size={12} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Shipment</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={editForm.status ?? ''} onValueChange={v => setEditForm((f: any) => ({...f, status: v}))}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{fmt(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Custom Status (if status=custom)</Label>
                <Input className="h-8 text-sm mt-1" value={editForm.customStatus ?? ''} onChange={e => setEditForm((f: any) => ({...f, customStatus: e.target.value}))} />
              </div>
              <div>
                <Label className="text-xs">Shipping Method</Label>
                <Select value={editForm.shippingMethod ?? ''} onValueChange={v => setEditForm((f: any) => ({...f, shippingMethod: v}))}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIPPING_METHODS.map(s => <SelectItem key={s} value={s}>{fmt(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Service Type</Label>
                <Input className="h-8 text-sm mt-1" value={editForm.serviceType ?? ''} onChange={e => setEditForm((f: any) => ({...f, serviceType: e.target.value}))} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sender</p>
              <div className="grid grid-cols-2 gap-3">
                {[['senderName','Name'],['senderPhone','Phone'],['senderEmail','Email'],['senderAddress','Address']].map(([k,l]) => (
                  <div key={k}><Label className="text-xs">{l}</Label><Input className="h-8 text-sm mt-1" value={editForm[k] ?? ''} onChange={e => setEditForm((f: any) => ({...f, [k]: e.target.value}))} /></div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Receiver</p>
              <div className="grid grid-cols-2 gap-3">
                {[['receiverName','Name'],['receiverPhone','Phone'],['receiverEmail','Email'],['receiverAddress','Address']].map(([k,l]) => (
                  <div key={k}><Label className="text-xs">{l}</Label><Input className="h-8 text-sm mt-1" value={editForm[k] ?? ''} onChange={e => setEditForm((f: any) => ({...f, [k]: e.target.value}))} /></div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Route</p>
              <div className="grid grid-cols-2 gap-3">
                {[['originCity','Origin City'],['originCountry','Origin Country'],['destinationCity','Dest City'],['destinationCountry','Dest Country']].map(([k,l]) => (
                  <div key={k}><Label className="text-xs">{l}</Label><Input className="h-8 text-sm mt-1" value={editForm[k] ?? ''} onChange={e => setEditForm((f: any) => ({...f, [k]: e.target.value}))} /></div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Current Location</p>
              <div className="grid grid-cols-2 gap-3">
                {[['currentLocation','Location'],['currentFacility','Facility'],['currentCity','City'],['currentCountry','Country']].map(([k,l]) => (
                  <div key={k}><Label className="text-xs">{l}</Label><Input className="h-8 text-sm mt-1" value={editForm[k] ?? ''} onChange={e => setEditForm((f: any) => ({...f, [k]: e.target.value}))} /></div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Package</p>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Weight (kg)</Label><Input type="number" className="h-8 text-sm mt-1" value={editForm.weightKg ?? ''} onChange={e => setEditForm((f: any) => ({...f, weightKg: e.target.value}))} /></div>
                <div><Label className="text-xs">Packages</Label><Input type="number" className="h-8 text-sm mt-1" value={editForm.numberOfPackages ?? ''} onChange={e => setEditForm((f: any) => ({...f, numberOfPackages: Number(e.target.value)}))} /></div>
                <div><Label className="text-xs">Dimensions</Label><Input className="h-8 text-sm mt-1" value={editForm.dimensions ?? ''} onChange={e => setEditForm((f: any) => ({...f, dimensions: e.target.value}))} /></div>
                <div><Label className="text-xs">Declared Value</Label><Input className="h-8 text-sm mt-1" value={editForm.declaredValue ?? ''} onChange={e => setEditForm((f: any) => ({...f, declaredValue: e.target.value}))} /></div>
                <div><Label className="text-xs">Currency</Label><Input className="h-8 text-sm mt-1" value={editForm.currency ?? ''} onChange={e => setEditForm((f: any) => ({...f, currency: e.target.value}))} /></div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Assignment</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Warehouse</Label>
                  <Select value={editForm.warehouseId ?? ''} onValueChange={v => setEditForm((f: any) => ({...f, warehouseId: v === 'none' ? null : v}))}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent><SelectItem value="none">None</SelectItem>{warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Carrier</Label>
                  <Select value={editForm.carrierId ?? ''} onValueChange={v => setEditForm((f: any) => ({...f, carrierId: v === 'none' ? null : v}))}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent><SelectItem value="none">None</SelectItem>{carriers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Driver Name</Label><Input className="h-8 text-sm mt-1" value={editForm.driverName ?? ''} onChange={e => setEditForm((f: any) => ({...f, driverName: e.target.value}))} /></div>
                <div><Label className="text-xs">Driver Phone</Label><Input className="h-8 text-sm mt-1" value={editForm.driverPhone ?? ''} onChange={e => setEditForm((f: any) => ({...f, driverPhone: e.target.value}))} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Est. Delivery</Label><Input type="datetime-local" className="h-8 text-sm mt-1" value={editForm.estimatedDelivery ? editForm.estimatedDelivery.slice(0,16) : ''} onChange={e => setEditForm((f: any) => ({...f, estimatedDelivery: e.target.value}))} /></div>
              <div><Label className="text-xs">Actual Delivery</Label><Input type="datetime-local" className="h-8 text-sm mt-1" value={editForm.actualDelivery ? editForm.actualDelivery.slice(0,16) : ''} onChange={e => setEditForm((f: any) => ({...f, actualDelivery: e.target.value}))} /></div>
            </div>
            <div><Label className="text-xs">Internal Notes</Label><Textarea className="text-sm mt-1" rows={3} value={editForm.internalNotes ?? ''} onChange={e => setEditForm((f: any) => ({...f, internalNotes: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleUpdate} disabled={updateShipment.isPending}>{updateShipment.isPending ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Event Dialog ── */}
      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Tracking Event</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Status *</Label>
              <Select value={eventForm.status ?? ''} onValueChange={v => setEventForm((f: any) => ({...f, status: v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select status..." /></SelectTrigger>
                <SelectContent>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{fmt(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {eventForm.status === 'custom' && (
              <div><Label className="text-xs">Custom Status Label</Label><Input className="h-8 text-sm mt-1" value={eventForm.customStatus ?? ''} onChange={e => setEventForm((f: any) => ({...f, customStatus: e.target.value}))} /></div>
            )}
            <div><Label className="text-xs">Description *</Label><Textarea className="text-sm mt-1" rows={2} value={eventForm.description ?? ''} onChange={e => setEventForm((f: any) => ({...f, description: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Location</Label><Input className="h-8 text-sm mt-1" value={eventForm.location ?? ''} onChange={e => setEventForm((f: any) => ({...f, location: e.target.value}))} /></div>
              <div><Label className="text-xs">Facility</Label><Input className="h-8 text-sm mt-1" value={eventForm.facility ?? ''} onChange={e => setEventForm((f: any) => ({...f, facility: e.target.value}))} /></div>
              <div><Label className="text-xs">City</Label><Input className="h-8 text-sm mt-1" value={eventForm.city ?? ''} onChange={e => setEventForm((f: any) => ({...f, city: e.target.value}))} /></div>
              <div><Label className="text-xs">Country</Label><Input className="h-8 text-sm mt-1" value={eventForm.country ?? ''} onChange={e => setEventForm((f: any) => ({...f, country: e.target.value}))} /></div>
            </div>
            <div><Label className="text-xs">Event Date &amp; Time</Label><Input type="datetime-local" className="h-8 text-sm mt-1" value={eventForm.eventTime ?? ''} onChange={e => setEventForm((f: any) => ({...f, eventTime: e.target.value}))} /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={eventForm.isPublic ?? true} onChange={e => setEventForm((f: any) => ({...f, isPublic: e.target.checked}))} className="rounded" />
              Visible to customer
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEventOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddEvent} disabled={addEvent.isPending}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Event Dialog ── */}
      <Dialog open={editEventOpen} onOpenChange={setEditEventOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Tracking Event</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Status *</Label>
              <Select value={editEventForm.status ?? ''} onValueChange={v => setEditEventForm((f: any) => ({...f, status: v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select status..." /></SelectTrigger>
                <SelectContent>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{fmt(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {editEventForm.status === 'custom' && (
              <div><Label className="text-xs">Custom Status Label</Label><Input className="h-8 text-sm mt-1" value={editEventForm.customStatus ?? ''} onChange={e => setEditEventForm((f: any) => ({...f, customStatus: e.target.value}))} /></div>
            )}
            <div><Label className="text-xs">Description *</Label><Textarea className="text-sm mt-1" rows={2} value={editEventForm.description ?? ''} onChange={e => setEditEventForm((f: any) => ({...f, description: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Location</Label><Input className="h-8 text-sm mt-1" value={editEventForm.location ?? ''} onChange={e => setEditEventForm((f: any) => ({...f, location: e.target.value}))} /></div>
              <div><Label className="text-xs">Facility</Label><Input className="h-8 text-sm mt-1" value={editEventForm.facility ?? ''} onChange={e => setEditEventForm((f: any) => ({...f, facility: e.target.value}))} /></div>
              <div><Label className="text-xs">City</Label><Input className="h-8 text-sm mt-1" value={editEventForm.city ?? ''} onChange={e => setEditEventForm((f: any) => ({...f, city: e.target.value}))} /></div>
              <div><Label className="text-xs">Country</Label><Input className="h-8 text-sm mt-1" value={editEventForm.country ?? ''} onChange={e => setEditEventForm((f: any) => ({...f, country: e.target.value}))} /></div>
            </div>
            <div>
              <Label className="text-xs">Event Date &amp; Time *</Label>
              <Input type="datetime-local" className="h-8 text-sm mt-1" required value={editEventForm.eventTime ?? ''} onChange={e => setEditEventForm((f: any) => ({...f, eventTime: e.target.value}))} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={editEventForm.isPublic ?? true} onChange={e => setEditEventForm((f: any) => ({...f, isPublic: e.target.checked}))} className="rounded" />
              Visible to customer
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditEventOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleUpdateEvent} disabled={updateEvent.isPending}>{updateEvent.isPending ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Hold Dialog ── */}
      <Dialog open={holdOpen} onOpenChange={setHoldOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Place Hold</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Reason *</Label>
              <Select value={holdForm.reason ?? ''} onValueChange={v => setHoldForm((f: any) => ({...f, reason: v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                <SelectContent>{HOLD_REASONS.map(r => <SelectItem key={r} value={r}>{fmt(r)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Public Message * (shown to customer)</Label><Textarea className="text-sm mt-1" rows={2} value={holdForm.publicMessage ?? ''} onChange={e => setHoldForm((f: any) => ({...f, publicMessage: e.target.value}))} /></div>
            <div><Label className="text-xs">Internal Note (staff only)</Label><Textarea className="text-sm mt-1" rows={2} value={holdForm.internalNote ?? ''} onChange={e => setHoldForm((f: any) => ({...f, internalNote: e.target.value}))} /></div>
            <div><Label className="text-xs">Expected Resolution Date</Label><Input type="date" className="h-8 text-sm mt-1" value={holdForm.expectedResolutionDate ?? ''} onChange={e => setHoldForm((f: any) => ({...f, expectedResolutionDate: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Location</Label><Input className="h-8 text-sm mt-1" value={holdForm.location ?? ''} onChange={e => setHoldForm((f: any) => ({...f, location: e.target.value}))} /></div>
              <div><Label className="text-xs">Facility</Label><Input className="h-8 text-sm mt-1" value={holdForm.facility ?? ''} onChange={e => setHoldForm((f: any) => ({...f, facility: e.target.value}))} /></div>
              <div><Label className="text-xs">City</Label><Input className="h-8 text-sm mt-1" value={holdForm.city ?? ''} onChange={e => setHoldForm((f: any) => ({...f, city: e.target.value}))} /></div>
              <div><Label className="text-xs">Country</Label><Input className="h-8 text-sm mt-1" value={holdForm.country ?? ''} onChange={e => setHoldForm((f: any) => ({...f, country: e.target.value}))} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={holdForm.notifyCustomer ?? true} onChange={e => setHoldForm((f: any) => ({...f, notifyCustomer: e.target.checked}))} className="rounded" />
              Notify customer
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setHoldOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateHold} disabled={createHold.isPending}>Place Hold</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── QR Code Dialog ── */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader><DialogTitle>QR Code</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(s.trackingNumber)}`}
              alt="QR Code"
              className="w-48 h-48 border border-border rounded-lg"
            />
            <p className="font-mono text-sm font-bold">{s.trackingNumber}</p>
            <Button size="sm" variant="outline" onClick={() => {
              const a = document.createElement('a');
              a.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(s.trackingNumber)}`;
              a.download = `qr-${s.trackingNumber}.png`; a.click();
            }}>Download QR</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shipment?</AlertDialogTitle>
            <AlertDialogDescription>This permanently deletes {s.trackingNumber} and all its tracking events and holds. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
