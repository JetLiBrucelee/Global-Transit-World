import { useState } from 'react';
import {
  useListQuotes, useUpdateQuote, getListQuotesQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  quoted: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUSES = ['pending', 'reviewed', 'quoted', 'accepted', 'rejected'];

export default function QuotesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [respondOpen, setRespondOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const { data, isLoading } = useListQuotes({ status: status || undefined, page, limit: 20 });
  const updateQuote = useUpdateQuote();

  const quotes = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));

  function openRespond(q: any) {
    setSelected(q);
    setForm({ status: q.status, quotedPrice: q.quotedPrice ?? '', adminNotes: q.adminNotes ?? '' });
    setRespondOpen(true);
  }

  function handleRespond() {
    const payload = { status: form.status, adminNotes: form.adminNotes || undefined, quotedPrice: form.quotedPrice || undefined };
    updateQuote.mutate({ id: selected.id, data: payload }, {
      onSuccess: () => {
        toast({ title: 'Quote updated' });
        qc.invalidateQueries({ queryKey: getListQuotesQueryKey() });
        setRespondOpen(false);
      },
      onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
    });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Quote Requests</h1>
          <p className="text-muted-foreground text-sm">{total.toLocaleString()} total quotes</p>
        </div>
        <Select value={status} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Reference', 'Contact', 'Route', 'Service', 'Status', 'Date', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
              </tr>
            )) : quotes.map((q: any) => (
              <>
                <tr key={q.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{q.referenceNumber}</td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-medium text-foreground">{q.contactName}</div>
                    <div className="text-muted-foreground">{q.contactEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{q.originCountry} → {q.destinationCountry}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{q.serviceType?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[q.status] ?? 'bg-gray-100'}`}>{q.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openRespond(q)}>Respond</Button>
                      <button onClick={() => setExpanded(expanded === q.id ? null : q.id)} className="p-1 hover:bg-muted rounded">
                        {expanded === q.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === q.id && (
                  <tr key={`${q.id}-detail`} className="border-b border-border bg-muted/10">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div><span className="text-muted-foreground">Company:</span> <span className="font-medium">{q.companyName || '—'}</span></div>
                        <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{q.contactPhone || '—'}</span></div>
                        <div><span className="text-muted-foreground">Weight:</span> <span className="font-medium">{q.weightKg ? `${q.weightKg} kg` : '—'}</span></div>
                        <div><span className="text-muted-foreground">Dimensions:</span> <span className="font-medium">{q.dimensions || '—'}</span></div>
                        <div><span className="text-muted-foreground">Declared Value:</span> <span className="font-medium">{q.declaredValue ? `${q.currency ?? 'USD'} ${q.declaredValue}` : '—'}</span></div>
                        {q.cargoDescription && <div className="col-span-3"><span className="text-muted-foreground">Cargo:</span> <span className="font-medium">{q.cargoDescription}</span></div>}
                        {q.specialRequirements && <div className="col-span-3"><span className="text-muted-foreground">Special:</span> <span className="font-medium">{q.specialRequirements}</span></div>}
                        {q.quotedPrice && <div><span className="text-muted-foreground">Quoted Price:</span> <span className="font-semibold text-green-600">{q.currency ?? 'USD'} {q.quotedPrice}</span></div>}
                        {q.adminNotes && <div className="col-span-3"><span className="text-muted-foreground">Admin Notes:</span> <span className="font-medium">{q.adminNotes}</span></div>}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {!isLoading && quotes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No quotes found</div>
        )}
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

      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Respond to Quote</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-lg p-3 text-xs">
                <p className="font-semibold text-foreground">{selected.contactName} — {selected.referenceNumber}</p>
                <p className="text-muted-foreground">{selected.originCountry} → {selected.destinationCountry} · {selected.serviceType?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <Label className="text-xs">Update Status</Label>
                <Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Quoted Price</Label>
                <Input className="h-8 text-sm mt-1" placeholder="e.g. 1250.00" value={form.quotedPrice ?? ''} onChange={e => setForm((f: any) => ({ ...f, quotedPrice: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Admin Notes</Label>
                <Textarea className="text-sm mt-1" rows={3} value={form.adminNotes ?? ''} onChange={e => setForm((f: any) => ({ ...f, adminNotes: e.target.value }))} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRespondOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRespond} disabled={updateQuote.isPending}>Save Response</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
