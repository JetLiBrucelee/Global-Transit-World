import { useState } from 'react';
import {
  useListUsers, useCreateUser, useUpdateUser,
  getListUsersQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const ROLE_COLORS: Record<string, string> = {
  customer: 'bg-slate-100 text-slate-700',
  staff: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
  super_admin: 'bg-amber-100 text-amber-800',
};

const ROLES = ['customer', 'staff', 'admin', 'super_admin'];

export default function UsersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ role: 'staff' });

  const { data, isLoading } = useListUsers({ page, limit: 20, role: roleFilter || undefined });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const users = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));

  function openCreate() { setEditing(null); setForm({ role: 'staff' }); setOpen(true); }
  function openEdit(u: any) { setEditing(u); setForm({ ...u }); setOpen(true); }

  function handleSave() {
    if (editing) {
      const { id: _id, clerkId: _ck, createdAt: _ca, ...rest } = form;
      updateUser.mutate({ id: editing.id, data: rest }, {
        onSuccess: () => {
          toast({ title: 'User updated' });
          qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setOpen(false);
        },
        onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
      });
    } else {
      if (!form.clerkId || !form.email || !form.firstName || !form.lastName) {
        toast({ title: 'Clerk ID, email, and name are required', variant: 'destructive' });
        return;
      }
      createUser.mutate({ data: form }, {
        onSuccess: () => {
          toast({ title: 'User created' });
          qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setOpen(false);
          setForm({ role: 'staff' });
        },
        onError: () => toast({ title: 'Failed to create user', variant: 'destructive' }),
      });
    }
  }

  function handleToggleActive(u: any) {
    updateUser.mutate({ id: u.id, data: { isActive: !u.isActive } }, {
      onSuccess: () => {
        toast({ title: u.isActive ? 'User deactivated' : 'User activated' });
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
    });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Staff Users</h1>
          <p className="text-muted-foreground text-sm">{total.toLocaleString()} users</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1" />New User</Button>
      </div>

      {/* Role filter */}
      <Select value={roleFilter} onValueChange={v => { setRoleFilter(v === 'all' ? '' : v); setPage(1); }}>
        <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="All roles" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          {ROLES.map(r => <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Name', 'Email', 'Role', 'Status', 'Created', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
              </tr>
            )) : users.map((u: any) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium text-foreground text-sm">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100'}`}>
                    {u.role?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(u)} className="p-1 hover:bg-muted rounded" title="Edit"><Edit2 size={13} /></button>
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleToggleActive(u)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && users.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit User' : 'New Staff User'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {!editing && (
              <div className="col-span-2">
                <Label className="text-xs">Clerk ID *</Label>
                <Input className="h-8 text-sm mt-1 font-mono" placeholder="user_..." value={form.clerkId ?? ''} onChange={e => setForm((f: any) => ({ ...f, clerkId: e.target.value }))} />
              </div>
            )}
            <div><Label className="text-xs">First Name{!editing && ' *'}</Label><Input className="h-8 text-sm mt-1" value={form.firstName ?? ''} onChange={e => setForm((f: any) => ({ ...f, firstName: e.target.value }))} /></div>
            <div><Label className="text-xs">Last Name{!editing && ' *'}</Label><Input className="h-8 text-sm mt-1" value={form.lastName ?? ''} onChange={e => setForm((f: any) => ({ ...f, lastName: e.target.value }))} /></div>
            <div className="col-span-2">
              <Label className="text-xs">Email{!editing && ' *'}</Label>
              <Input className="h-8 text-sm mt-1" value={form.email ?? ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input className="h-8 text-sm mt-1" value={form.phone ?? ''} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Role *</Label>
              <Select value={form.role} onValueChange={v => setForm((f: any) => ({ ...f, role: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {editing && (
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                  Active
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={createUser.isPending || updateUser.isPending}>
              {editing ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
