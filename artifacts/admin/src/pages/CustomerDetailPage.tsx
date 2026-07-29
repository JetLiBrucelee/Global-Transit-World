import { useState } from 'react';
import {
  useGetCustomer, useUpdateCustomer, useDeleteCustomer, useListShipments,
  getGetCustomerQueryKey, getListCustomersQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700', processing: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-amber-100 text-amber-700', customs_review: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700', held: 'bg-red-100 text-red-700',
};

export default function CustomerDetailPage({ id }: { id: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const { data: customer, isLoading } = useGetCustomer(id, { query: { enabled: !!id } });
  const { data: shipmentsData } = useListShipments({ params: { limit: 10 } });

  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  const shipments = Array.isArray(shipmentsData) ? shipmentsData : (shipmentsData as any)?.shipments ?? [];

  function openEdit() {
    setEditForm({ ...customer });
    setEditOpen(true);
  }

  function handleUpdate() {
    updateCustomer.mutate({ id, data: editForm }, {
      onSuccess: () => {
        toast({ title: 'Customer updated' });
        qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
        setEditOpen(false);
      },
      onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
    });
  }

  function handleDelete() {
    deleteCustomer.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Customer deleted' });
        qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        setLocation('/customers');
      },
    });
  }

  if (isLoading) {
    return <div className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  }

  if (!customer) return <div className="p-6 text-muted-foreground">Customer not found</div>;

  const c = customer as any;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/customers"><a className="p-1.5 hover:bg-muted rounded-lg"><ArrowLeft size={16} /></a></Link>
          <div>
            <h1 className="text-xl font-bold">{c.first_name} {c.last_name}</h1>
            <p className="text-sm text-muted-foreground">{c.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={openEdit}><Edit2 size={13} className="mr-1" /> Edit</Button>
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={13} className="mr-1" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          ['Email', c.email], ['Phone', c.phone], ['Company', c.company_name],
          ['Country', c.country], ['City', c.city], ['Address', c.address],
        ].map(([label, val]) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground mt-1">{val || '—'}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Recent Shipments</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Tracking #', 'Route', 'Status', 'Created'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shipments.slice(0, 5).map((s: any) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <Link href={`/shipments/${s.id}`}>
                    <a className="font-mono text-xs font-semibold text-primary hover:underline">{s.tracking_number}</a>
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs">{s.origin_country} → {s.destination_country}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] ?? 'bg-gray-100'}`}>{s.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['first_name', 'First Name'], ['last_name', 'Last Name'],
              ['email', 'Email'], ['phone', 'Phone'],
              ['company_name', 'Company'], ['country', 'Country'],
              ['city', 'City'],
            ].map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input className="h-8 text-sm mt-1" value={editForm[key] ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="col-span-2">
              <Label className="text-xs">Address</Label>
              <Input className="h-8 text-sm mt-1" value={editForm.address ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, address: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleUpdate} disabled={updateCustomer.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete {c.first_name} {c.last_name} and cannot be undone.</AlertDialogDescription>
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
