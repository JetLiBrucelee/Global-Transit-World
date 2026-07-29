import { useState } from 'react';
import {
  useListShipments, useCreateShipment, useArchiveShipment, useDuplicateShipment,
  useGenerateTrackingNumber, useListWarehouses, useListCarriers, useListCustomers,
  getListShipmentsQueryKey,
} from '@workspace/api-client-react';
import type { ShipmentInput } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Plus, Search, Archive, Copy, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  processing: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-amber-100 text-amber-700',
  customs_review: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  held: 'bg-red-100 text-red-700',
  archived: 'bg-gray-100 text-gray-500',
};

const STATUSES = ['pending', 'processing', 'in_transit', 'customs_review', 'delivered', 'held'];
const SERVICE_TYPES = ['air_freight', 'ocean_freight', 'rail_freight', 'road_freight', 'express_courier', 'warehousing'];

export default function ShipmentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ShipmentInput>>({});

  const { data, isLoading } = useListShipments({ params: { search: search || undefined, status: status || undefined, page, limit: 20 } });
  const { data: warehouses } = useListWarehouses();
  const { data: carriers } = useListCarriers();
  const createShipment = useCreateShipment();
  const archiveShipment = useArchiveShipment();
  const duplicateShipment = useDuplicateShipment();
  const generateTracking = useGenerateTrackingNumber();

  const shipments = Array.isArray(data) ? data : (data as any)?.shipments ?? [];
  const total = (data as any)?.total ?? shipments.length;
  const pages = Math.ceil(total / 20);

  function handleGenerate() {
    generateTracking.mutate({} as any, {
      onSuccess: (res: any) => setForm(f => ({ ...f, tracking_number: res.tracking_number })),
    });
  }

  function handleCreate() {
    createShipment.mutate({ data: form as ShipmentInput }, {
      onSuccess: () => {
        toast({ title: 'Shipment created' });
        qc.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
        setOpen(false);
        setForm({});
      },
      onError: () => toast({ title: 'Failed to create shipment', variant: 'destructive' }),
    });
  }

  function handleArchive(id: string) {
    archiveShipment.mutate({ id, data: { reason: 'Archived by admin' } }, {
      onSuccess: () => {
        toast({ title: 'Shipment archived' });
        qc.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
      },
    });
  }

  function handleDuplicate(id: string) {
    duplicateShipment.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Shipment duplicated' });
        qc.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
      },
    });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Shipments</h1>
          <p className="text-muted-foreground text-sm">{total.toLocaleString()} total shipments</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus size={14} className="mr-1" /> New Shipment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tracking, customer..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={status} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tracking #</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Route</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Weight</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                ))}
              </tr>
            )) : shipments.map((s: any) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-foreground font-semibold">{s.tracking_number}</span>
                </td>
                <td className="px-4 py-3 text-xs text-foreground">
                  {s.origin_city}, {s.origin_country} → {s.destination_city}, {s.destination_country}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {s.service_type?.replace('_', ' ')}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {s.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{s.weight_kg ? `${s.weight_kg} kg` : '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/shipments/${s.id}`}>
                      <a className="p-1 hover:bg-muted rounded" title="View"><Eye size={13} /></a>
                    </Link>
                    <button onClick={() => handleDuplicate(s.id)} className="p-1 hover:bg-muted rounded" title="Duplicate">
                      <Copy size={13} />
                    </button>
                    <button onClick={() => handleArchive(s.id)} className="p-1 hover:bg-muted rounded text-muted-foreground" title="Archive">
                      <Archive size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && shipments.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No shipments found</div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={14} />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Shipment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-xs">Tracking Number</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.tracking_number ?? ''} onChange={e => setForm(f => ({ ...f, tracking_number: e.target.value }))} className="h-8 text-sm font-mono" />
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generateTracking.isPending}>Generate</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Origin City</Label>
              <Input className="h-8 text-sm mt-1" value={form.origin_city ?? ''} onChange={e => setForm(f => ({ ...f, origin_city: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Origin Country</Label>
              <Input className="h-8 text-sm mt-1" value={form.origin_country ?? ''} onChange={e => setForm(f => ({ ...f, origin_country: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Destination City</Label>
              <Input className="h-8 text-sm mt-1" value={form.destination_city ?? ''} onChange={e => setForm(f => ({ ...f, destination_city: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Destination Country</Label>
              <Input className="h-8 text-sm mt-1" value={form.destination_country ?? ''} onChange={e => setForm(f => ({ ...f, destination_country: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Service Type</Label>
              <Select value={form.service_type ?? ''} onValueChange={v => setForm(f => ({ ...f, service_type: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status ?? ''} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Weight (kg)</Label>
              <Input type="number" className="h-8 text-sm mt-1" value={form.weight_kg ?? ''} onChange={e => setForm(f => ({ ...f, weight_kg: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Carrier</Label>
              <Select value={form.carrier_id ?? ''} onValueChange={v => setForm(f => ({ ...f, carrier_id: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {Array.isArray(carriers) && carriers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={createShipment.isPending}>
              {createShipment.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
