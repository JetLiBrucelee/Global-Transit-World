import { useState } from 'react';
import {
  useListCustomers, useCreateCustomer, getListCustomersQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Plus, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ notifyEmail: true, notifySms: false });

  const { data, isLoading } = useListCustomers({ search: search || undefined, page, limit: 20 });
  const createCustomer = useCreateCustomer();

  const customers = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));

  function handleCreate() {
    if (!form.email || !form.firstName || !form.lastName) {
      toast({ title: 'Email, first name and last name are required', variant: 'destructive' });
      return;
    }
    createCustomer.mutate({ data: form }, {
      onSuccess: () => {
        toast({ title: 'Customer created' });
        qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        setOpen(false);
        setForm({ notifyEmail: true, notifySms: false });
      },
      onError: () => toast({ title: 'Failed to create customer', variant: 'destructive' }),
    });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground text-sm">{total.toLocaleString()} total customers</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={14} className="mr-1" />New Customer</Button>
      </div>

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search name, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-8 h-8 text-sm" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Name', 'Email', 'Phone', 'Country', 'Status', 'Created', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
              </tr>
            )) : customers.map((c: any) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground text-sm">{c.firstName} {c.lastName}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.email}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.country || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/customers/${c.id}`}>
                    <a className="p-1 hover:bg-muted rounded" title="View"><Eye size={13} /></a>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && customers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No customers found</div>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['firstName', 'First Name'], ['lastName', 'Last Name'],
              ['email', 'Email'], ['phone', 'Phone'],
              ['country', 'Country'],
            ].map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input className="h-8 text-sm mt-1" value={form[key] ?? ''} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="col-span-2 flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.notifyEmail ?? true} onChange={e => setForm((f: any) => ({ ...f, notifyEmail: e.target.checked }))} className="rounded" />
                Email notifications
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.notifySms ?? false} onChange={e => setForm((f: any) => ({ ...f, notifySms: e.target.checked }))} className="rounded" />
                SMS notifications
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={createCustomer.isPending}>
              {createCustomer.isPending ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
