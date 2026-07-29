import { useState } from 'react';
import {
  useListCarriers, useCreateCarrier, useUpdateCarrier, useDeleteCarrier,
  getListCarriersQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function CarriersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ isActive: true });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading } = useListCarriers();
  const createCarrier = useCreateCarrier();
  const updateCarrier = useUpdateCarrier();
  const deleteCarrier = useDeleteCarrier();

  const carriers = Array.isArray(data) ? data : [];

  function openCreate() { setEditing(null); setForm({ isActive: true }); setOpen(true); }
  function openEdit(c: any) { setEditing(c); setForm({ ...c }); setOpen(true); }

  function handleSave() {
    if (editing) {
      updateCarrier.mutate({ id: editing.id, data: form }, {
        onSuccess: () => { toast({ title: 'Carrier updated' }); qc.invalidateQueries({ queryKey: getListCarriersQueryKey() }); setOpen(false); },
        onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
      });
    } else {
      createCarrier.mutate({ data: form }, {
        onSuccess: () => { toast({ title: 'Carrier created' }); qc.invalidateQueries({ queryKey: getListCarriersQueryKey() }); setOpen(false); setForm({ isActive: true }); },
        onError: () => toast({ title: 'Create failed', variant: 'destructive' }),
      });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteCarrier.mutate({ id: deleteTarget }, {
      onSuccess: () => { toast({ title: 'Carrier deleted' }); qc.invalidateQueries({ queryKey: getListCarriersQueryKey() }); setDeleteTarget(null); },
    });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Carriers</h1>
        <Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1" /> Add Carrier</Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Name', 'Code', 'Tracking URL Template', 'Contact', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
              </tr>
            )) : carriers.map((c: any) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium text-foreground text-sm">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.code}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{c.trackingUrl || '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.contactEmail || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-1 hover:bg-muted rounded"><Edit2 size={13} /></button>
                    <button onClick={() => setDeleteTarget(c.id)} className="p-1 hover:bg-red-50 hover:text-red-600 rounded"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && carriers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No carriers</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Carrier' : 'Add Carrier'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[['name', 'Name'], ['code', 'Code']].map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs">{label}</Label>
                  <Input className="h-8 text-sm mt-1" value={form[key] ?? ''} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div>
              <Label className="text-xs">Tracking URL Template</Label>
              <Input className="h-8 text-sm mt-1" placeholder="https://example.com/track/{tracking_number}" value={form.trackingUrl ?? ''} onChange={e => setForm((f: any) => ({ ...f, trackingUrl: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Contact Email</Label>
              <Input className="h-8 text-sm mt-1" value={form.contactEmail ?? ''} onChange={e => setForm((f: any) => ({ ...f, contactEmail: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} className="rounded" />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>{editing ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carrier?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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
