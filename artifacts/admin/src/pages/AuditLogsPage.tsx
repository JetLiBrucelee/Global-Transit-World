import { useState } from 'react';
import { useListAuditLogs } from '@workspace/api-client-react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const ACTIONS = ['create', 'update', 'delete', 'archive', 'unarchive', 'duplicate', 'release_hold', 'create_hold', 'login'];
const ENTITY_TYPES = ['shipment', 'customer', 'user', 'quote', 'news_article', 'warehouse', 'carrier', 'hold', 'tracking_event'];

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  archive: 'bg-gray-100 text-gray-600',
  unarchive: 'bg-gray-100 text-gray-600',
  duplicate: 'bg-slate-100 text-slate-600',
  release_hold: 'bg-purple-100 text-purple-700',
  create_hold: 'bg-amber-100 text-amber-700',
  login: 'bg-slate-100 text-slate-600',
};

export default function AuditLogsPage() {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useListAuditLogs({
    action: action || undefined,
    entityType: entityType || undefined,
    actorId: actorId || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 50,
  });

  const logs = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground text-sm">Immutable. {total.toLocaleString()} total entries.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <Select value={action} onValueChange={v => { setAction(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="All actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={entityType} onValueChange={v => { setEntityType(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="All entities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {ENTITY_TYPES.map(e => <SelectItem key={e} value={e}>{e.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <div>
          <Input placeholder="Actor ID..." className="h-8 text-sm w-40" value={actorId} onChange={e => { setActorId(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs mb-1 block">From</Label>
            <Input type="date" className="h-8 text-sm w-36" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">To</Label>
            <Input type="date" className="h-8 text-sm w-36" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Timestamp', 'Action', 'Entity', 'Entity ID', 'Actor', 'Description', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
              </tr>
            )) : logs.map((log: any) => (
              <>
                <tr key={log.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.entityType?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{log.entityId ? `${log.entityId.slice(0, 8)}…` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.actorEmail ?? (log.actorId ? `${log.actorId.slice(0, 8)}…` : '—')}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{log.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    {(log.oldValue || log.newValue) && (
                      <button onClick={() => setExpandedId(expandedId === log.id ? null : log.id)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                        {expandedId === log.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === log.id && (
                  <tr key={`${log.id}-exp`} className="border-b border-border bg-muted/10">
                    <td colSpan={7} className="px-6 py-3">
                      <div className="grid grid-cols-2 gap-4">
                        {log.oldValue && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Before</p>
                            <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">
                              {JSON.stringify(log.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValue && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">After</p>
                            <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">
                              {JSON.stringify(log.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {!isLoading && logs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No audit logs found</div>
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
    </div>
  );
}
