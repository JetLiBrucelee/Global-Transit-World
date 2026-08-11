import { useState } from 'react';
import { useListShipments } from '@workspace/api-client-react';
import { Download, BarChart2, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { listShipments } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

const ALL_STATUSES = [
  'shipment_created','collected','at_warehouse','departed_warehouse','at_deport','departed_deport',
  'in_transit','arrived_at_transit_hub','processing','out_for_delivery','delivered','delivery_failed',
  'returned','shipment_exception','delayed','cancelled','lost','damaged','awaiting_pickup',
  'customs_review','customs_hold','released','package_hold','security_inspection','operational_delay',
  'address_verification','receiver_unavailable','payment_pending','weather_delay','border_delay',
  'port_congestion','flight_delay','road_delay','warehouse_delay','custom',
];

const REPORT_TYPES = [
  { id: 'shipments', label: 'Shipments Report', description: 'All shipment details including route, status, weight, and parties.' },
  { id: 'status_summary', label: 'Status Summary', description: 'Count of shipments per status.' },
  { id: 'destination', label: 'By Destination', description: 'Shipments grouped by destination country.' },
];

// Fetch ALL shipments by paginating through all pages (API max is 100 per page)
async function fetchAllShipments(params: { status?: string }): Promise<any[]> {
  const PAGE_SIZE = 100;
  let page = 1;
  const all: any[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await listShipments({ ...params, page, limit: PAGE_SIZE }) as any;
    const rows: any[] = Array.isArray(res) ? res : res?.data ?? [];
    all.push(...rows);
    const total: number = res?.total ?? rows.length;
    if (all.length >= total || rows.length < PAGE_SIZE) break;
    page++;
    if (page > 100) break; // safety cap
  }
  return all;
}

function generateShipmentsCSV(shipments: any[]) {
  const headers = [
    'Tracking Number','Status','Sender Name','Sender Email','Receiver Name','Receiver Email',
    'Origin City','Origin Country','Dest City','Dest Country','Shipping Method',
    'Weight (kg)','Packages','Declared Value','Currency','Est. Delivery','Actual Delivery',
    'Warehouse ID','Carrier ID','Driver','Created At',
  ];
  const rows = shipments.map(s => [
    s.trackingNumber, s.status, s.senderName, s.senderEmail ?? '', s.receiverName, s.receiverEmail ?? '',
    s.originCity, s.originCountry, s.destinationCity, s.destinationCountry, s.shippingMethod,
    s.weightKg ?? '', s.numberOfPackages ?? 1, s.declaredValue ?? '', s.currency ?? 'USD',
    s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString() : '',
    s.actualDelivery ? new Date(s.actualDelivery).toLocaleDateString() : '',
    s.warehouseId ?? '', s.carrierId ?? '', s.driverName ?? '',
    new Date(s.createdAt).toLocaleString(),
  ].map(v => JSON.stringify(String(v))).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function generateStatusSummaryCSV(shipments: any[]) {
  const counts: Record<string, number> = {};
  shipments.forEach(s => { counts[s.status] = (counts[s.status] ?? 0) + 1; });
  const total = shipments.length;
  const headers = ['Status', 'Count', 'Percentage'];
  const rows = Object.entries(counts).sort(([, a], [, b]) => b - a).map(([st, n]) =>
    [st, n, `${((n / total) * 100).toFixed(1)}%`].map(v => JSON.stringify(String(v))).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function generateDestinationCSV(shipments: any[]) {
  const counts: Record<string, number> = {};
  shipments.forEach(s => { const k = s.destinationCountry ?? 'Unknown'; counts[k] = (counts[k] ?? 0) + 1; });
  const total = shipments.length;
  const headers = ['Destination Country', 'Shipment Count', 'Percentage'];
  const rows = Object.entries(counts).sort(([, a], [, b]) => b - a).map(([country, n]) =>
    [country, n, `${((n / total) * 100).toFixed(1)}%`].map(v => JSON.stringify(String(v))).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState('shipments');
  const [statusFilter, setStatusFilter] = useState('');
  const [destCountry, setDestCountry] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [generating, setGenerating] = useState(false);

  // Preview: load first page (100 records) for the bar charts
  const { data: previewData } = useListShipments({
    status: statusFilter || undefined,
    limit: 100,
    page: 1,
  });
  const previewShipments: any[] = (previewData as any)?.data ?? [];

  function applyDateAndDestFilter(shipments: any[]) {
    return shipments.filter(s => {
      if (destCountry && s.destinationCountry?.toLowerCase() !== destCountry.toLowerCase()) return false;
      if (from && new Date(s.createdAt) < new Date(from)) return false;
      if (to && new Date(s.createdAt) > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      // Fetch all pages from the API
      const all = await fetchAllShipments({ status: statusFilter || undefined });
      const filtered = applyDateAndDestFilter(all);

      if (filtered.length === 0) {
        toast({ title: 'No data matches the selected filters', variant: 'destructive' });
        return;
      }

      const dateTag = from && to ? `_${from}_to_${to}` : '';
      let csv = '';
      let filename = '';

      if (reportType === 'shipments') {
        csv = generateShipmentsCSV(filtered);
        filename = `shipments_report${dateTag}.csv`;
      } else if (reportType === 'status_summary') {
        csv = generateStatusSummaryCSV(filtered);
        filename = `status_summary_report${dateTag}.csv`;
      } else {
        csv = generateDestinationCSV(filtered);
        filename = `destination_report${dateTag}.csv`;
      }

      downloadCSV(csv, filename);
      toast({ title: `Downloaded ${filename} (${filtered.length} shipments)` });
    } catch {
      toast({ title: 'Report generation failed', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }

  // Charts use preview data filtered client-side
  const chartData = applyDateAndDestFilter(previewShipments);
  const statusCounts: Record<string, number> = {};
  chartData.forEach(s => { statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1; });
  const topStatuses = Object.entries(statusCounts).sort(([, a], [, b]) => b - a).slice(0, 8);

  const destCounts: Record<string, number> = {};
  chartData.forEach(s => { const k = s.destinationCountry ?? 'Unknown'; destCounts[k] = (destCounts[k] ?? 0) + 1; });
  const topDests = Object.entries(destCounts).sort(([, a], [, b]) => b - a).slice(0, 8);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground text-sm">Generate and download CSV reports. All matching records are exported (not just the first page).</p>
      </div>

      {/* Config panel */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="font-semibold text-sm">Generate Report</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{REPORT_TYPES.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Status</Label>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Destination Country</Label>
            <Input className="h-8 text-sm mt-1" placeholder="e.g. US, UK, CN..." value={destCountry} onChange={e => setDestCountry(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Date From</Label>
            <Input type="date" className="h-8 text-sm mt-1" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Date To</Label>
            <Input type="date" className="h-8 text-sm mt-1" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Download size={14} className="mr-2" />}
            {generating ? 'Fetching all records…' : 'Download CSV'}
          </Button>
          <p className="text-xs text-muted-foreground">{REPORT_TYPES.find(r => r.id === reportType)?.description}</p>
        </div>
      </div>

      {/* Preview charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-1">Status Breakdown</h3>
            <p className="text-xs text-muted-foreground mb-4">Preview based on first 100 records</p>
            <div className="space-y-2">
              {topStatuses.map(([st, n]) => (
                <div key={st} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-40 truncate">{st.replace(/_/g, ' ')}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${(n / chartData.length) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-1">Top Destinations</h3>
            <p className="text-xs text-muted-foreground mb-4">Preview based on first 100 records</p>
            <div className="space-y-2">
              {topDests.map(([country, n]) => (
                <div key={country} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16">{country}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-blue-500 rounded-full h-2 transition-all" style={{ width: `${(n / chartData.length) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
