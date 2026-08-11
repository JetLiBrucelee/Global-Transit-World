import { useState } from 'react';
import {
  useListShipments, useCreateShipment, useDeleteShipment, useArchiveShipment, useDuplicateShipment,
  useGenerateTrackingNumber, useImportShipments, useListWarehouses, useListCarriers, useListCustomers,
  getListShipmentsQueryKey,
} from '@workspace/api-client-react';
import type { ShipmentInput } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Plus, Search, Archive, Copy, Eye, ChevronLeft, ChevronRight, Trash2, Download, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const ALL_STATUSES = [
  'shipment_created','collected','at_warehouse','departed_warehouse','at_deport','departed_deport',
  'in_transit','arrived_at_transit_hub','processing','out_for_delivery','delivered','delivery_failed',
  'returned','shipment_exception','delayed','cancelled','lost','damaged','awaiting_pickup',
  'customs_review','customs_hold','released','package_hold','security_inspection','operational_delay',
  'address_verification','receiver_unavailable','payment_pending','weather_delay','border_delay',
  'port_congestion','flight_delay','road_delay','warehouse_delay','custom',
];

const SHIPPING_METHODS = ['air_freight','ocean_freight','road_freight','rail_freight','express_air','standard_air','economy'];

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
function fmtStatus(s: string) { return s.replace(/_/g, ' '); }

export default function ShipmentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [createdTracking, setCreatedTracking] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState<Partial<ShipmentInput>>({});

  const { data, isLoading } = useListShipments({ search: search || undefined, status: status || undefined, page, limit: 20 });
  const { data: warehousesData } = useListWarehouses();
  const { data: carriersData } = useListCarriers();
  const createShipment = useCreateShipment();
  const deleteShipment = useDeleteShipment();
  const archiveShipment = useArchiveShipment();
  const duplicateShipment = useDuplicateShipment();
  const generateTracking = useGenerateTrackingNumber();
  const importShipments = useImportShipments();

  const shipments = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));
  const warehouses = Array.isArray(warehousesData) ? warehousesData : [];
  const carriers = Array.isArray(carriersData) ? carriersData : [];

  function handleGenerate() {
    generateTracking.mutate(undefined, {
      onSuccess: (res: any) => setForm(f => ({ ...f, trackingNumber: res.trackingNumber })),
    });
  }

  function handleCreate() {
    if (!form.senderName || !form.receiverName || !form.originCity || !form.originCountry || !form.destinationCity || !form.destinationCountry) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    const { trackingNumber: _tn, ...rest } = form as any;
    createShipment.mutate({ data: rest as ShipmentInput }, {
      onSuccess: (res: any) => {
        qc.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
        setCreatedTracking(res?.trackingNumber ?? null);
        setForm({});
      },
      onError: () => toast({ title: 'Failed to create shipment', variant: 'destructive' }),
    });
  }

  function handleArchive(id: string) {
    archiveShipment.mutate({ id, data: { isArchived: true } }, {
      onSuccess: () => { toast({ title: 'Archived' }); qc.invalidateQueries({ queryKey: getListShipmentsQueryKey() }); },
    });
  }

  function handleDuplicate(id: string) {
    duplicateShipment.mutate({ id }, {
      onSuccess: () => { toast({ title: 'Duplicated' }); qc.invalidateQueries({ queryKey: getListShipmentsQueryKey() }); },
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteShipment.mutate({ id: deleteTarget }, {
      onSuccess: () => { toast({ title: 'Deleted' }); qc.invalidateQueries({ queryKey: getListShipmentsQueryKey() }); setDeleteTarget(null); },
      onError: () => toast({ title: 'Delete failed', variant: 'destructive' }),
    });
  }

  function handleExportCSV() {
    const header = ['trackingNumber','status','senderName','receiverName','originCity','originCountry','destinationCity','destinationCountry','shippingMethod','weightKg','createdAt'];
    const rows = shipments.map((s: any) => header.map(k => JSON.stringify(s[k] ?? '')).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'shipments.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const arr = Array.isArray(json) ? json : json.shipments ?? [];
        importShipments.mutate({ data: { shipments: arr } }, {
          onSuccess: (res: any) => {
            toast({ title: `Imported ${res.imported} shipments${res.failed > 0 ? `, ${res.failed} failed` : ''}` });
            qc.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
            setImportOpen(false);
          },
          onError: () => toast({ title: 'Import failed', variant: 'destructive' }),
        });
      } catch { toast({ title: 'Invalid JSON', variant: 'destructive' }); }
    };
    reader.readAsText(file);
  }

  function setField(key: keyof ShipmentInput, val: string) { setForm(f => ({ ...f, [key]: val || undefined })); }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Shipments</h1>
          <p className="text-muted-foreground text-sm">{total.toLocaleString()} total</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV}><Download size={13} className="mr-1" />Export</Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload size={13} className="mr-1" />Import</Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-1" />New Shipment</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tracking, name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-8 h-8 text-sm" />
        </div>
        <Select value={status} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-44 h-8 text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{fmtStatus(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Tracking #','Route','Method','Status','Weight','Created',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
              </tr>
            )) : shipments.map((s: any) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">{s.trackingNumber}</td>
                <td className="px-4 py-3 text-xs">{s.originCity}, {s.originCountry} → {s.destinationCity}, {s.destinationCountry}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmtStatus(s.shippingMethod ?? '')}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(s.status)}`}>{fmtStatus(s.status)}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{s.weightKg ? `${s.weightKg} kg` : '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/shipments/${s.id}`}>
                      <a className="p-1 hover:bg-muted rounded" title="View"><Eye size={13} /></a>
                    </Link>
                    <button onClick={() => handleDuplicate(s.id)} className="p-1 hover:bg-muted rounded" title="Duplicate"><Copy size={13} /></button>
                    <button onClick={() => handleArchive(s.id)} className="p-1 hover:bg-muted rounded text-muted-foreground" title="Archive"><Archive size={13} /></button>
                    <button onClick={() => setDeleteTarget(s.id)} className="p-1 hover:bg-red-50 hover:text-red-600 rounded" title="Delete"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && shipments.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No shipments found</div>}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setCreatedTracking(null); setCopiedTracking(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{createdTracking ? 'Shipment Created' : 'New Shipment'}</DialogTitle></DialogHeader>

          {/* ── Success state: show tracking number ── */}
          {createdTracking ? (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Shipment tracking number</p>
                <div className="font-mono font-bold text-2xl text-primary tracking-widest bg-slate-50 border rounded-xl px-6 py-3">
                  {createdTracking}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Share this number with the customer so they can track their shipment at sinovera.com/track</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdTracking);
                    setCopiedTracking(true);
                    setTimeout(() => setCopiedTracking(false), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  {copiedTracking ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} />}
                  {copiedTracking ? 'Copied!' : 'Copy Number'}
                </button>
                <button
                  onClick={() => { setCreatedTracking(null); setCopiedTracking(false); setCreateOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
          <>
          <div className="space-y-5">
            {/* Tracking + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs">Tracking Number (auto-generated on save if empty)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={(form as any).trackingNumber ?? ''} onChange={e => setForm(f => ({ ...f, trackingNumber: e.target.value }))} className="h-8 text-sm font-mono" placeholder="Auto-generate" />
                  <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generateTracking.isPending}>Generate</Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Shipping Method *</Label>
                <Select value={form.shippingMethod ?? ''} onValueChange={v => setField('shippingMethod', v)}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{SHIPPING_METHODS.map(s => <SelectItem key={s} value={s}>{fmtStatus(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status ?? ''} onValueChange={v => setField('status', v)}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="shipment_created" /></SelectTrigger>
                  <SelectContent>{ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{fmtStatus(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Sender */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sender</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Name *</Label><Input className="h-8 text-sm mt-1" value={form.senderName ?? ''} onChange={e => setField('senderName', e.target.value)} /></div>
                <div><Label className="text-xs">Phone</Label><Input className="h-8 text-sm mt-1" value={form.senderPhone ?? ''} onChange={e => setField('senderPhone', e.target.value)} /></div>
                <div><Label className="text-xs">Email</Label><Input className="h-8 text-sm mt-1" value={form.senderEmail ?? ''} onChange={e => setField('senderEmail', e.target.value)} /></div>
                <div><Label className="text-xs">Address</Label><Input className="h-8 text-sm mt-1" value={form.senderAddress ?? ''} onChange={e => setField('senderAddress', e.target.value)} /></div>
              </div>
            </div>

            {/* Receiver */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Receiver</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Name *</Label><Input className="h-8 text-sm mt-1" value={form.receiverName ?? ''} onChange={e => setField('receiverName', e.target.value)} /></div>
                <div><Label className="text-xs">Phone</Label><Input className="h-8 text-sm mt-1" value={form.receiverPhone ?? ''} onChange={e => setField('receiverPhone', e.target.value)} /></div>
                <div><Label className="text-xs">Email</Label><Input className="h-8 text-sm mt-1" value={form.receiverEmail ?? ''} onChange={e => setField('receiverEmail', e.target.value)} /></div>
                <div><Label className="text-xs">Address</Label><Input className="h-8 text-sm mt-1" value={form.receiverAddress ?? ''} onChange={e => setField('receiverAddress', e.target.value)} /></div>
              </div>
            </div>

            {/* Route */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Route</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Origin City *</Label><Input className="h-8 text-sm mt-1" value={form.originCity ?? ''} onChange={e => setField('originCity', e.target.value)} /></div>
                <div><Label className="text-xs">Origin Country *</Label><Input className="h-8 text-sm mt-1" value={form.originCountry ?? ''} onChange={e => setField('originCountry', e.target.value)} /></div>
                <div><Label className="text-xs">Destination City *</Label><Input className="h-8 text-sm mt-1" value={form.destinationCity ?? ''} onChange={e => setField('destinationCity', e.target.value)} /></div>
                <div><Label className="text-xs">Destination Country *</Label><Input className="h-8 text-sm mt-1" value={form.destinationCountry ?? ''} onChange={e => setField('destinationCountry', e.target.value)} /></div>
              </div>
            </div>

            {/* Package */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Package</p>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Weight (kg)</Label><Input type="number" className="h-8 text-sm mt-1" value={form.weightKg ?? ''} onChange={e => setField('weightKg', e.target.value)} /></div>
                <div><Label className="text-xs">Packages</Label><Input type="number" className="h-8 text-sm mt-1" value={form.numberOfPackages ?? ''} onChange={e => setForm(f => ({ ...f, numberOfPackages: Number(e.target.value) }))} /></div>
                <div><Label className="text-xs">Dimensions</Label><Input className="h-8 text-sm mt-1" placeholder="L×W×H" value={form.dimensions ?? ''} onChange={e => setField('dimensions', e.target.value)} /></div>
                <div><Label className="text-xs">Declared Value</Label><Input className="h-8 text-sm mt-1" value={form.declaredValue ?? ''} onChange={e => setField('declaredValue', e.target.value)} /></div>
                <div><Label className="text-xs">Currency</Label><Input className="h-8 text-sm mt-1" placeholder="USD" value={form.currency ?? ''} onChange={e => setField('currency', e.target.value)} /></div>
              </div>
            </div>

            {/* Assignment */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Assignment</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Warehouse</Label>
                  <Select value={form.warehouseId ?? ''} onValueChange={v => setField('warehouseId', v)}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Carrier</Label>
                  <Select value={form.carrierId ?? ''} onValueChange={v => setField('carrierId', v)}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {carriers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Driver Name</Label><Input className="h-8 text-sm mt-1" value={form.driverName ?? ''} onChange={e => setField('driverName', e.target.value)} /></div>
                <div><Label className="text-xs">Driver Phone</Label><Input className="h-8 text-sm mt-1" value={form.driverPhone ?? ''} onChange={e => setField('driverPhone', e.target.value)} /></div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Est. Delivery Date</Label>
                <Input type="date" className="h-8 text-sm mt-1" value={form.estimatedDelivery ?? ''} onChange={e => setField('estimatedDelivery', e.target.value)} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs">Internal Notes</Label>
              <Textarea className="text-sm mt-1" rows={2} value={form.internalNotes ?? ''} onChange={e => setField('internalNotes', e.target.value)} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={createShipment.isPending}>
              {createShipment.isPending ? 'Creating...' : 'Create Shipment'}
            </Button>
          </DialogFooter>
          </>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Import Shipments</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Upload a JSON file with an array of shipment objects, or a <code className="text-xs bg-muted px-1 py-0.5 rounded">{`{"shipments":[...]}`}</code> wrapper.</p>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <label className="cursor-pointer">
                <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to select JSON file</p>
                <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} disabled={importShipments.isPending} />
              </label>
            </div>
            {importShipments.isPending && <p className="text-sm text-center text-muted-foreground">Importing...</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shipment?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. All tracking events and holds will also be deleted.</AlertDialogDescription>
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
