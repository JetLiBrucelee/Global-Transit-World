import { useState } from 'react';
import { useListUsers, useCreateUser, getListUsersQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ role: 'staff' });

  const { data, isLoading } = useListUsers();
  const createUser = useCreateUser();

  const users = Array.isArray(data) ? data : (data as any)?.users ?? [];

  function handleCreate() {
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

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Staff Users</h1>
          <p className="text-muted-foreground text-sm">{users.length} users</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={14} className="mr-1" /> New User</Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Name', 'Email', 'Role', 'Created'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 4 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
              </tr>
            )) : users.map((u: any) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium text-foreground text-sm">{u.first_name} {u.last_name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100'}`}>
                    {u.role?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && users.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Staff User</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {[['first_name', 'First Name'], ['last_name', 'Last Name'], ['email', 'Email']].map(([key, label]) => (
              <div key={key} className={key === 'email' ? 'col-span-2' : ''}>
                <Label className="text-xs">{label}</Label>
                <Input className="h-8 text-sm mt-1" value={form[key] ?? ''} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="col-span-2">
              <Label className="text-xs">Role</Label>
              <Select value={form.role} onValueChange={v => setForm((f: any) => ({ ...f, role: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={createUser.isPending}>
              {createUser.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
