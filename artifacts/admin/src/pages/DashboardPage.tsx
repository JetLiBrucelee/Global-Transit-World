import { useGetDashboardStats, useGetDashboardRecentActivity } from '@workspace/api-client-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Package, Users, FileText, CheckCircle, Truck, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | undefined; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {value === undefined ? <Skeleton className="h-7 w-16" /> : value.toLocaleString()}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#94a3b8',
  processing: '#3b82f6',
  in_transit: '#f5a623',
  customs_review: '#8b5cf6',
  delivered: '#22c55e',
  held: '#ef4444',
  archived: '#64748b',
};

export default function DashboardPage() {
  const { data: stats } = useGetDashboardStats();
  const { data: activity } = useGetDashboardRecentActivity({ params: { limit: 8 } });

  const chartData = stats ? [
    { name: 'Pending', value: stats.total_shipments - stats.active_shipments - stats.delivered_shipments, fill: STATUS_COLORS.pending },
    { name: 'In Transit', value: stats.in_transit_shipments, fill: STATUS_COLORS.in_transit },
    { name: 'Delivered', value: stats.delivered_shipments, fill: STATUS_COLORS.delivered },
    { name: 'Active', value: stats.active_shipments, fill: STATUS_COLORS.processing },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Operations overview</p>
        </div>
        <div className="flex gap-2">
          <Link href="/shipments">
            <a className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
              + New Shipment
            </a>
          </Link>
          <Link href="/quotes">
            <a className="text-xs bg-secondary text-secondary-foreground px-3 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
              View Quotes
            </a>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Shipments" value={stats?.total_shipments} icon={Package} color="bg-blue-50 text-blue-600" />
        <StatCard label="Active" value={stats?.active_shipments} icon={Truck} color="bg-amber-50 text-amber-600" />
        <StatCard label="In Transit" value={stats?.in_transit_shipments} icon={Truck} color="bg-orange-50 text-orange-600" />
        <StatCard label="Delivered" value={stats?.delivered_shipments} icon={CheckCircle} color="bg-green-50 text-green-600" />
        <StatCard label="Customers" value={stats?.total_customers} icon={Users} color="bg-purple-50 text-purple-600" />
        <StatCard label="Pending Quotes" value={stats?.pending_quotes} icon={FileText} color="bg-red-50 text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4 text-sm">Shipment Status Distribution</h2>
          {stats ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-[200px] w-full" />
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4 text-sm">Recent Activity</h2>
          <div className="space-y-3">
            {activity ? (
              Array.isArray(activity) && activity.length > 0 ? activity.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock size={12} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-tight">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )
            ) : (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
