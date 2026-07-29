import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Package, Trash2, ExternalLink, Search, ChevronLeft, ChevronRight as ChevronRightIcon,
  Pencil, CheckCircle2, AlertTriangle, Truck, Clock, BookmarkX
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "./PortalLayout";
import {
  useGetMySavedShipments,
  useUnsaveShipment
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-green-100 text-green-800 border-green-200",
  in_transit: "bg-blue-100 text-blue-800 border-blue-200",
  out_for_delivery: "bg-purple-100 text-purple-800 border-purple-200",
  customs_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  held: "bg-red-100 text-red-800 border-red-200",
  pending: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function statusColor(s: string) {
  return STATUS_COLORS[s] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

function statusIcon(status: string) {
  if (status === "delivered") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (status === "held") return <AlertTriangle className="w-5 h-5 text-red-500" />;
  if (status === "in_transit" || status === "out_for_delivery") return <Truck className="w-5 h-5 text-blue-500" />;
  return <Clock className="w-5 h-5 text-slate-400" />;
}

const PAGE_SIZE = 10;

export default function ShipmentHistory() {
  const { data: savedShipments, isLoading } = useGetMySavedShipments();
  const qc = useQueryClient();
  const { mutateAsync: unsave } = useUnsaveShipment();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const filtered = (savedShipments ?? []).filter(s => {
    const matchSearch =
      !search ||
      s.shipment?.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.nickname?.toLowerCase().includes(search.toLowerCase()) ||
      s.shipment?.originCity?.toLowerCase().includes(search.toLowerCase()) ||
      s.shipment?.destinationCity?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || s.shipment?.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleRemove(savedId: string) {
    setRemovingId(savedId);
    try {
      await unsave({ savedId });
      qc.invalidateQueries({ queryKey: ["/api/customers/me/saved-shipments"] });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <PortalLayout title="My Shipments">
      {/* Filters */}
      <Card className="p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by tracking number, nickname, or city…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
              <SelectItem value="customs_review">Customs Review</SelectItem>
              <SelectItem value="held">On Hold</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : paginated.length === 0 ? (
        <Card className="p-12 text-center">
          <BookmarkX className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-primary mb-2">
            {(savedShipments ?? []).length === 0 ? "No saved shipments" : "No matching shipments"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {(savedShipments ?? []).length === 0
              ? 'Track a shipment and click "Save to my account" to add it here.'
              : "Try adjusting your search or filter."}
          </p>
          {(savedShipments ?? []).length === 0 && (
            <Link href="/track">
              <Button className="bg-secondary text-primary font-bold hover:bg-secondary/90">
                Track a Shipment
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map(s => (
              <Card key={s.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-0.5">
                    {statusIcon(s.shipment?.status ?? "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono font-semibold text-sm text-primary">
                        {s.shipment?.trackingNumber ?? "—"}
                      </span>
                      {s.nickname && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Pencil className="w-3 h-3" />{s.nickname}
                        </span>
                      )}
                      <Badge className={`text-xs border ${statusColor(s.shipment?.status ?? "")}`}>
                        {formatStatus(s.shipment?.customStatus ?? s.shipment?.status ?? "unknown")}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground/70">Route: </span>
                        {s.shipment?.originCity}, {s.shipment?.originCountry} → {s.shipment?.destinationCity}, {s.shipment?.destinationCountry}
                      </span>
                      <span>
                        <span className="font-medium text-foreground/70">Method: </span>
                        {formatStatus(s.shipment?.shippingMethod ?? "—")}
                      </span>
                      {s.shipment?.estimatedDelivery && (
                        <span>
                          <span className="font-medium text-foreground/70">Est. delivery: </span>
                          {format(new Date(s.shipment.estimatedDelivery), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      Saved {format(new Date(s.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    {s.shipment?.trackingNumber && (
                      <Link href={`/track/${s.shipment.trackingNumber}`}>
                        <Button size="sm" variant="outline" className="gap-1 text-xs">
                          <ExternalLink className="w-3 h-3" /> Track
                        </Button>
                      </Link>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-50 p-2"
                      onClick={() => handleRemove(s.id)}
                      disabled={removingId === s.id}
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-5 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </PortalLayout>
  );
}
