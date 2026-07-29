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

  const quotes = Array.isArray(data) ? data : (data as any)?.quotes ?? [];
  const total = (data as any)?.total ?? quotes.length;
  const pages = Math.ceil(total / 20);

  function openRespond(q: any) {
    setSelected(q);
    setForm({ status: q.status, estimated_price: q.estimated_price ?? '', staff_notes: q.staff_notes ?? '' });
    setRespondOpen(true);
  }

  function handleRespond() {
    updateQuote.mutate({ id: selected.id, data: form }, {
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
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
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
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{q.reference_number}</td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-medium text-foreground">{q.first_name} {q.last_name}</div>
                    <div className="text-muted-foreground">{q.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{q.origin_country} → {q.destination_country}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{q.service_type?.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[q.status] ?? 'bg-gray-100'}`}>{q.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</td>
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
                  <tr className="border-b border-border bg-muted/10">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div><span className="text-muted-foreground">Company:</span> <span className="font-medium">{q.company_name || '—'}</span></div>
                        <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{q.phone || '—'}</span></div>
                        <div><span className="text-muted-foreground">Weight:</span> <span className="font-medium">{q.estimated_weight_kg ? `${q.estimated_weight_kg} kg` : '—'}</span></div>
                        <div className="col-span-3"><span className="text-muted-foreground">Cargo:</span> <span className="font-medium">{q.cargo_description || '—'}</span></div>
                        {q.estimated_price && <div><span className="text-muted-foreground">Quoted Price:</span> <span className="font-semibold text-green-600">${q.estimated_price}</span></div>}
                        {q.staff_notes && <div className="col-span-3"><span className="text-muted-foreground">Staff Notes:</span> <span className="font-medium">{q.staff_notes}</span></div>}
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
                <p className="font-semibold text-foreground">{selected.first_name} {selected.last_name} — {selected.reference_number}</p>
                <p className="text-muted-foreground">{selected.origin_country} → {selected.destination_country} · {selected.service_type?.replace('_', ' ')}</p>
              </div>
              <div>
                <Label className="text-xs">Update Status</Label>
                <Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Estimated Price (USD)</Label>
                <Input type="number" className="h-8 text-sm mt-1" value={form.estimated_price ?? ''} onChange={e => setForm((f: any) => ({ ...f, estimated_price: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs">Staff Notes</Label>
                <Textarea className="text-sm mt-1" rows={3} value={form.staff_notes ?? ''} onChange={e => setForm((f: any) => ({ ...f, staff_notes: e.target.value }))} />
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
