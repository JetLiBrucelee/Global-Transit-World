import { useState } from 'react';
import {
  useListWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse,
  getListWarehousesQueryKey,
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

const FIELDS: [string, string][] = [
  ['name', 'Name'], ['code', 'Code'], ['city', 'City'], ['country', 'Country'],
  ['address', 'Address'], ['contact_email', 'Contact Email'], ['contact_phone', 'Contact Phone'],
];

export default function WarehousesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ is_active: true });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading } = useListWarehouses();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();

  const warehouses = Array.isArray(data) ? data : [];

  function openCreate() { setEditing(null); setForm({ is_active: true }); setOpen(true); }
  function openEdit(w: any) { setEditing(w); setForm({ ...w }); setOpen(true); }

  function handleSave() {
    if (editing) {
      updateWarehouse.mutate({ id: editing.id, data: form }, {
        onSuccess: () => { toast({ title: 'Warehouse updated' }); qc.invalidateQueries({ queryKey: getListWarehousesQueryKey() }); setOpen(false); },
        onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
      });
    } else {
      createWarehouse.mutate({ data: form }, {
        onSuccess: () => { toast({ title: 'Warehouse created' }); qc.invalidateQueries({ queryKey: getListWarehousesQueryKey() }); setOpen(false); setForm({ is_active: true }); },
        onError: () => toast({ title: 'Create failed', variant: 'destructive' }),
      });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteWarehouse.mutate({ id: deleteTarget }, {
      onSuccess: () => { toast({ title: 'Warehouse deleted' }); qc.invalidateQueries({ queryKey: getListWarehousesQueryKey() }); setDeleteTarget(null); },
    });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Warehouses</h1>
        <Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1" /> Add Warehouse</Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Name', 'Code', 'Location', 'Contact', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
              </tr>
            )) : warehouses.map((w: any) => (
              <tr key={w.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium text-foreground text-sm">{w.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{w.code}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{w.city}, {w.country}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{w.contact_email || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${w.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {w.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(w)} className="p-1 hover:bg-muted rounded"><Edit2 size={13} /></button>
                    <button onClick={() => setDeleteTarget(w.id)} className="p-1 hover:bg-red-50 hover:text-red-600 rounded"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && warehouses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No warehouses</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map(([key, label]) => (
              <div key={key} className={['address', 'contact_email', 'contact_phone'].includes(key) ? 'col-span-2' : ''}>
                <Label className="text-xs">{label}</Label>
                <Input className="h-8 text-sm mt-1" value={form[key] ?? ''} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm((f: any) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                Active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>{editing ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse?</AlertDialogTitle>
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
