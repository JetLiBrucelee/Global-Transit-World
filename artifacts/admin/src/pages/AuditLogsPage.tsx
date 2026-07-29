import { useState } from 'react';
import { useListAuditLogs } from '@workspace/api-client-react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ACTIONS = ['create', 'update', 'delete', 'archive', 'release_hold', 'create_hold', 'login'];
const ENTITY_TYPES = ['shipment', 'customer', 'user', 'quote', 'news_article', 'warehouse', 'carrier', 'hold', 'tracking_event'];

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  archive: 'bg-gray-100 text-gray-600',
  release_hold: 'bg-purple-100 text-purple-700',
  create_hold: 'bg-amber-100 text-amber-700',
  login: 'bg-slate-100 text-slate-600',
};

export default function AuditLogsPage() {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useListAuditLogs({
    params: {
      action: action || undefined,
      entity_type: entityType || undefined,
      page,
      limit: 50,
    },
  });

  const logs = Array.isArray(data) ? data : (data as any)?.logs ?? [];
  const total = (data as any)?.total ?? logs.length;
  const pages = Math.ceil(total / 50);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground text-sm">Read-only. {total.toLocaleString()} total entries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={action} onValueChange={v => { setAction(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={entityType} onValueChange={v => { setEntityType(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {ENTITY_TYPES.map(e => <SelectItem key={e} value={e}>{e.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Timestamp', 'Action', 'Entity', 'Entity ID', 'User', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
              </tr>
            )) : logs.map((log: any) => (
              <>
                <tr key={log.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.entity_type?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{log.entity_id?.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.user_id?.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    {log.details && (
                      <button
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground"
                      >
                        {expandedId === log.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === log.id && log.details && (
                  <tr className="border-b border-border bg-muted/10">
                    <td colSpan={6} className="px-6 py-3">
                      <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
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
